# backend/app/api/youtube.py
import json
import os
from flask import Blueprint, request, jsonify, send_file

from ..config import Config
from ..services.youtube_tasks import create_task, get_task

bp = Blueprint("youtube", __name__)


@bp.post("/tasks")
def create_download_task():
    data = request.get_json() or {}
    url = data.get("url")
    quality = data.get("quality", "720p")

    if not url:
        return jsonify({"success": False, "error": "url is required"}), 400

    task_id = create_task(url, quality)
    return jsonify({"success": True, "task_id": task_id})


@bp.get("/tasks/<task_id>")
def get_download_task(task_id):
    task = get_task(task_id)
    if not task:
        return jsonify({"success": False, "error": "task not found"}), 404

    if task["status"] in ("pending", "running"):
        return jsonify({
            "success": True,
            "status": task["status"],
            "progress": task.get("progress", 0),
        })

    if task["status"] == "error":
        return jsonify({
            "success": False,
            "status": "error",
            "error": task.get("error"),
        }), 500

    result = task.get("result") or {}
    return jsonify({
        "success": True,
        "status": "finished",
        "progress": 100,
        "video_id":result.get("video_id"),
        "title": result.get("title"),
        "video_path": result.get("video_path"),
        "filesize": result.get("filesize"),
        "duration": result.get("duration"),
        "thumbnail": result.get("thumbnail"),
        "audio_path": result.get("audio_path"),
        "audio_size": result.get("audio_size"),
    })

@bp.get("/download")
def download_file():
    """
    通过 video_id + type 下载：
      GET /youtube/download?id=<video_id>&type=video|audio

    约定：
    - 每个 video_id 对应一个目录：
        Config.YOUTUBE_DOWNLOAD_DIR / <video_id> /
    - 目录下有 meta.json，里边有：
        {
          "video_id": "q1qCzx3sakA",
          "video_path": "video.mp4",
          "audio_path": "audio.m4a",
          ... 其他信息
        }
    """
    video_id = request.args.get("id")
    file_type = request.args.get("type", "video")

    if not video_id:
        return jsonify({"success": False, "error": "id is required"}), 400

    if file_type not in ("video", "audio"):
        return jsonify({"success": False, "error": "invalid type"}), 400

    meta_file = os.path.join(Config.YOUTUBE_DOWNLOAD_DIR, video_id, "meta.json")
    if not os.path.exists(meta_file):
        return jsonify({"success": False, "error": "not found"}), 404

    # ⭐ 指定 encoding='utf-8'，避免 Windows 默认 gbk 导致 UnicodeDecodeError
    with open(meta_file, "r", encoding="utf-8") as f:
        meta = json.load(f)

    key = f"{file_type}_path"     # video_path / audio_path
    path = meta.get(key)
    if not path:
        return jsonify({"success": False, "error": f"{key} not in meta"}), 404

    # 防御性处理：统一斜杠 & 相对路径
    path = path.replace("\\", os.sep)
    if not os.path.isabs(path):
        # 放在该 video_id 的目录下
        path = os.path.join(Config.YOUTUBE_DOWNLOAD_DIR, video_id, path.lstrip("\\/"))

    if not os.path.exists(path):
        return jsonify({"success": False, "error": "file not exists"}), 404

    return send_file(path, as_attachment=True)