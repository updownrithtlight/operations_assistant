
# backend/app/services/youtube_tasks.py
import threading
import uuid
from typing import Dict, Any
from ..services.youtube_service import download_youtube_video

# 简单内存任务表：线上多进程/多实例的话建议换成 Redis / DB
_TASKS: Dict[str, Dict[str, Any]] = {}
_LOCK = threading.Lock()


def create_task(url: str, quality: str = "720p") -> str:
    """创建任务，启动后台线程执行下载，返回 task_id"""
    task_id = uuid.uuid4().hex

    with _LOCK:
        _TASKS[task_id] = {
            "status": "pending",
            "progress": 0,
            "result": None,
            "error": None,
        }

    t = threading.Thread(
        target=_run_task,
        args=(task_id, url, quality),
        daemon=True,
    )
    t.start()
    return task_id


def _run_task(task_id: str, url: str, quality: str):
    """真正跑下载的后台线程"""
    with _LOCK:
        _TASKS[task_id]["status"] = "running"
        _TASKS[task_id]["progress"] = 0

    try:
        # 这里可以以后接 yt-dlp 的 hook 更新 progress，现在先写死 0 / 100
        info = download_youtube_video(url, quality)

        with _LOCK:
            _TASKS[task_id]["status"] = "finished"
            _TASKS[task_id]["progress"] = 100
            _TASKS[task_id]["result"] = info
    except Exception as e:
        with _LOCK:
            _TASKS[task_id]["status"] = "error"
            _TASKS[task_id]["error"] = str(e)


def get_task(task_id: str) -> Dict[str, Any] | None:
    """查询任务信息"""
    with _LOCK:
        return _TASKS.get(task_id)
