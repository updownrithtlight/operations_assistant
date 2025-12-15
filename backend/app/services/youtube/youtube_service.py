# backend/app/services/youtube_service.py
import logging
import os
import uuid
import json
from urllib.parse import urlparse, parse_qs

from yt_dlp import YoutubeDL
from yt_dlp.utils import DownloadError

from backend.app.config import Config

logger = logging.getLogger(__name__)


def extract_video_id(url: str) -> str:
    """
    从 YouTube URL 中尽量提取 video_id。

    支持：
      - https://www.youtube.com/watch?v=xxxx
      - https://youtu.be/xxxx
    其余情况就生成一个随机 id，防止报错。
    """
    parsed = urlparse(url)
    qs = parse_qs(parsed.query)

    # 标准 watch 链接
    if "v" in qs and qs["v"]:
        return qs["v"][0]

    # youtu.be 短链
    if "youtu.be" in parsed.netloc:
        return parsed.path.lstrip("/")

    # 其他情况兜底
    return uuid.uuid4().hex[:10]


def _build_video_format(quality: str) -> str:
    """
    根据清晰度构造一个“尽量匹配、永远有兜底”的 format 表达式。

    逻辑：
      - 有目标高度：优先选 <= 目标高度 且 mp4 的 best；
      - 再退到 <= 目标高度 的任意容器；
      - 再退到 mp4；
      - 最后退到完全不限制的 best（几乎不可能选不到）。
    """
    height_map = {
        "360p": 360,
        "480p": 480,
        "720p": 720,
        "1080p": 1080,
        "2160p": 2160,  # 4K
    }
    target_h = height_map.get(quality)

    if target_h:
        return (
            f"best[height<={target_h}][ext=mp4]/"  # 优先：<=目标高度的 mp4
            f"best[height<={target_h}]/"          # 其次：<=目标高度的任意容器
            "best[ext=mp4]/"                      # 再次：最佳的 mp4
            "best"                                # 兜底：能下什么下什么
        )
    else:
        # 没传清晰度时的兜底：优先 mp4，其次任意 best
        return "best[ext=mp4]/best"

def _download_once(
    url: str,
    fmt: str,
    outtmpl: str,
    merge_output_format: str | None = None,
):
    proxy = Config.PROXY_URL

    logger.info(f"[yt-dlp] Start download | url={url} | fmt={fmt} | out={outtmpl} | proxy={proxy}")

    ydl_opts: dict = {
        "format": fmt,
        "outtmpl": outtmpl,
        "quiet": True,
        "noprogress": True,
        "noplaylist": True,
        "no_keep_fragments": True,
    }

    if proxy:
        ydl_opts["proxy"] = proxy
        logger.info(f"[yt-dlp] Using proxy: {proxy}")

    if merge_output_format:
        ydl_opts["merge_output_format"] = merge_output_format

    try:
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filepath = ydl.prepare_filename(info)
            logger.info(f"[yt-dlp] Download success | output={filepath}")
    except Exception as e:
        logger.error(f"[yt-dlp] Download failed | url={url} | error={repr(e)}")
        raise

    # 处理 mp4 合并情况
    if merge_output_format:
        base, ext = os.path.splitext(filepath)
        mp4_path = base + ".mp4"
        if ext.lower() != ".mp4" and os.path.exists(mp4_path):
            logger.info(f"[yt-dlp] Auto-merged to MP4: {mp4_path}")
            filepath = mp4_path

    return info, filepath



def download_youtube_video(url: str, quality: str = "720p"):
    """
    下载 YouTube 视频（后端核心逻辑）：

    1. 解析出 video_id，为每个视频分配一个独立目录：
         <YOUTUBE_DOWNLOAD_DIR>/<video_id>/
    2. 按清晰度偏好下载一个“有画面 + 有声音”的 mp4（若是分轨则自动合并）；
    3. 另外再单独下载一份 bestaudio（例如 m4a），不合并，单独保存；
    4. 将元数据写入 meta.json，方便以后重启后按 video_id 重新找到文件；
    5. 返回一个 dict，包含绝对路径、大小等信息，供任务系统 / 接口使用。
    """
    # 根目录：配置中指定，例如 /data/youtube
    root_dir = Config.YOUTUBE_DOWNLOAD_DIR
    os.makedirs(root_dir, exist_ok=True)

    # 为每个视频分配一个子目录
    video_id = extract_video_id(url)
    base_dir = os.path.join(root_dir, video_id)
    os.makedirs(base_dir, exist_ok=True)

    # 固定文件名，方便前端/其他服务访问
    video_outtmpl = os.path.join(base_dir, "video.%(ext)s")
    audio_outtmpl = os.path.join(base_dir, "audio.%(ext)s")

    # ========== 第 1 步：视频（有声，有兜底） ==========
    primary_fmt = _build_video_format(quality)
    fallback_fmt = "best"  # 极简兜底：永远存在

    try:
        vinfo, video_path = _download_once(
            url,
            fmt=primary_fmt,
            outtmpl=video_outtmpl,
            merge_output_format="mp4",  # 如是分轨，会用 ffmpeg 合并成 mp4
        )
    except DownloadError as e:
        logger.error(f"[yt-dlp] primary format failed: {e}. Try fallback 'best' ...")
        vinfo, video_path = _download_once(
            url,
            fmt=fallback_fmt,
            outtmpl=video_outtmpl,
            merge_output_format="mp4",
        )

    # 兜一下最终的视频文件名，理论上就是 video.mp4
    video_abs_path = video_path
    if not os.path.basename(video_abs_path).lower().endswith(".mp4"):
        # 如果扩展名不是 mp4，但目录下出现了 video.mp4，则优先用固定名
        candidate = os.path.join(base_dir, "video.mp4")
        if os.path.exists(candidate):
            video_abs_path = candidate

    video_size = os.path.getsize(video_abs_path) if os.path.exists(video_abs_path) else None

    # ========== 第 2 步：额外下载一份音频（不合并，保留） ==========
    try:
        ainfo, audio_path = _download_once(
            url,
            fmt="bestaudio[ext=m4a]/bestaudio",
            outtmpl=audio_outtmpl,
            merge_output_format=None,  # 音频不用合并
        )
        audio_abs_path = audio_path
        audio_size = os.path.getsize(audio_abs_path) if os.path.exists(audio_abs_path) else None
    except DownloadError as e:
        logger.error(f"[yt-dlp] download audio failed: {e}")
        audio_abs_path = None
        audio_size = None

    # ========== 第 3 步：写 meta.json，方便重启后用 video_id 找回 ==========
    meta = {
        "video_id": video_id,
        "title": vinfo.get("title"),
        "duration": vinfo.get("duration"),
        "thumbnail": vinfo.get("thumbnail"),
        "quality": quality,
        "dir": base_dir,
        # 相对路径（相对 base_dir），用于将来如果要做静态挂载之类
        "video_rel_path": "video.mp4",
        "audio_rel_path": "audio.m4a" if audio_abs_path else None,
        # 绝对路径（当前 send_file 用这个最方便）
        "video_path": video_abs_path,
        "audio_path": audio_abs_path,
        "filesize": video_size,
        "audio_size": audio_size,
    }

    try:
        meta_path = os.path.join(base_dir, "meta.json")
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)
    except Exception as e:
        # 写 meta 失败不影响下载主流程，只打个日志
        logger.error(f"[yt-dlp] write meta.json failed: {e}")

    # ========== 第 4 步：返回信息给调用方（任务系统 / API） ==========
    return meta
