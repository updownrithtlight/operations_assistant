# backend/app/logging_config.py
import logging
import sys
import os
from logging.handlers import RotatingFileHandler

def setup_logging(level="INFO"):
    """
    初始化日志系统（控制台 + 文件轮转）
    """
    # 清空 root handlers，防止重复
    for handler in logging.root.handlers[:]:
        logging.root.removeHandler(handler)

    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] %(name)s:%(lineno)d - %(message)s",
        "%Y-%m-%d %H:%M:%S"
    )

    # 1. 控制台输出（docker logs / 本地调试）
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(level)

    handlers = [console_handler]

    # 2. 文件输出（自动创建 logs 目录）
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
    os.makedirs(log_dir, exist_ok=True)   # ⭐ 没有就创建

    log_path = os.path.join(log_dir, "app.log")
    file_handler = RotatingFileHandler(
        log_path,
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8"
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(level)
    handlers.append(file_handler)

    logging.basicConfig(
        level=level,
        handlers=handlers
    )

    # 降低 werkzeug 噪音
    logging.getLogger("werkzeug").setLevel(logging.WARNING)

    logging.getLogger(__name__).info("Logging initialized. Level=%s, file=%s", level, log_path)
