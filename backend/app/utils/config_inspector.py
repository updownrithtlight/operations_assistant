import logging
import re

logger = logging.getLogger(__name__)

# 需要自动隐藏的字段名称
SENSITIVE_KEYS = (
    "PASSWORD", "SECRET", "TOKEN", "KEY", "ACCESS", "JWT", "CREDENTIAL"
)

def mask_value(key: str, value: str):
    """对敏感字段做自动脱敏处理"""
    if not isinstance(value, str):
        return value

    upper_key = key.upper()
    if any(s in upper_key for s in SENSITIVE_KEYS):
        if len(value) > 6:
            return value[:3] + "****" + value[-3:]
        return "***"
    return value


def dump_config(app):
    """统一打印 Flask 配置"""
    logger.info("========== Flask Configuration ==========")

    cfg = app.config

    for key in sorted(cfg.keys()):
        value = cfg[key]
        value = mask_value(key, value)

        logger.info(f"{key} = {value}")

    logger.info("========== End of Configuration ==========")
