# backend/app/services/youtube_tasks.py
import logging
import threading
import uuid
import json
from typing import Dict, Any, Optional

from ..services.youtube_service import download_youtube_video
from ..extensions import redis_client

logger = logging.getLogger(__name__)

# Redis 里的 key 前缀 & 任务保留时间（秒）
TASK_KEY_PREFIX = "yt_task:"
TASK_TTL_SECONDS = 24 * 3600  # 任务信息保留 24 小时，可按需调整


def _assert_redis():
    """确保 redis_client 已初始化，否则抛异常"""
    if redis_client is None:
        raise RuntimeError("redis_client is not initialized. "
                           "Did you call init_extensions(app)?")


def _task_key(task_id: str) -> str:
    return f"{TASK_KEY_PREFIX}{task_id}"


def _load_task(task_id: str) -> Optional[Dict[str, Any]]:
    """从 Redis 读取任务"""
    _assert_redis()
    raw = redis_client.get(_task_key(task_id))
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception as e:
        logger.error(f"[Task] decode task json failed | task_id={task_id} | error={repr(e)}")
        return None


def _save_task(task_id: str, data: Dict[str, Any]) -> None:
    """把任务写回 Redis，并设置 TTL"""
    _assert_redis()
    try:
        redis_client.set(_task_key(task_id), json.dumps(data), ex=TASK_TTL_SECONDS)
    except Exception as e:
        logger.error(f"[Task] save task to redis failed | task_id={task_id} | error={repr(e)}")
        raise


def create_task(url: str, quality: str = "720p") -> str:
    """
    创建任务，启动后台线程执行下载，返回 task_id

    注意：任务状态存 Redis，多进程 / 多实例都能共享。
    """
    _assert_redis()

    task_id = uuid.uuid4().hex
    task_data: Dict[str, Any] = {
        "status": "pending",
        "progress": 0,
        "result": None,
        "error": None,
        "url": url,
        "quality": quality,
    }

    _save_task(task_id, task_data)
    logger.info(f"[Task] CREATE | task_id={task_id} | url={url} | quality={quality}")

    t = threading.Thread(
        target=_run_task,
        args=(task_id, url, quality),
        daemon=True,
    )
    t.start()
    return task_id


def _run_task(task_id: str, url: str, quality: str):
    """真正跑下载的后台线程"""
    logger.info(f"[Task] RUN | task_id={task_id}")

    task = _load_task(task_id) or {
        "status": "pending",
        "progress": 0,
        "result": None,
        "error": None,
        "url": url,
        "quality": quality,
    }
    task["status"] = "running"
    task["progress"] = 0
    _save_task(task_id, task)

    try:
        # 这里可以以后接 yt-dlp 的 hook 更新 progress，现在先写死 0 / 100
        info = download_youtube_video(url, quality)

        logger.info(f"[Task] SUCCESS | task_id={task_id}")
        task = _load_task(task_id) or {}
        task.update({
            "status": "finished",
            "progress": 100,
            "result": info,
            "error": None,
        })
        _save_task(task_id, task)

    except Exception as e:
        logger.error(f"[Task] ERROR | task_id={task_id} | error={repr(e)}")
        task = _load_task(task_id) or {}
        task.update({
            "status": "error",
            "error": str(e),
        })
        _save_task(task_id, task)


def get_task(task_id: str) -> Optional[Dict[str, Any]]:
    """查询任务信息（从 Redis 读）"""
    return _load_task(task_id)
