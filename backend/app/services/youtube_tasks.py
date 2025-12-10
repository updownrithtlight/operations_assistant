# backend/app/services/youtube_tasks.py
import logging
import threading
import uuid
import json
from typing import Dict, Any, Optional

from ..services.youtube_service import download_youtube_video
from .. import extensions  # ✅ 关键：导入模块，而不是导入 redis_client 值

logger = logging.getLogger(__name__)

TASK_KEY_PREFIX = "yt_task:"
TASK_TTL_SECONDS = 24 * 3600  # 任务信息保留 24 小时，可按需调整


def _get_redis():
    rc = extensions.redis_client
    if rc is None:
        raise RuntimeError(
            "redis_client is not initialized. Did you call init_extensions(app)?"
        )
    return rc


def _task_key(task_id: str) -> str:
    return f"{TASK_KEY_PREFIX}{task_id}"


def _load_task(task_id: str) -> Optional[Dict[str, Any]]:
    """从 Redis 读取任务"""
    r = _get_redis()
    raw = r.get(_task_key(task_id))
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception as e:
        logger.error(f"[Task] decode task json failed | task_id={task_id} | error={repr(e)}")
        return None


def _save_task(task_id: str, data: Dict[str, Any]) -> None:
    """把任务写回 Redis，并设置 TTL"""
    r = _get_redis()
    r.set(_task_key(task_id), json.dumps(data), ex=TASK_TTL_SECONDS)


def create_task(url: str, quality: str = "720p") -> str:
    """创建任务，启动后台线程执行下载，返回 task_id"""
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

    task = _load_task(task_id) or {}
    task.update({
        "status": "running",
        "progress": 0,
    })
    _save_task(task_id, task)

    try:
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
    """查询任务信息"""
    return _load_task(task_id)
