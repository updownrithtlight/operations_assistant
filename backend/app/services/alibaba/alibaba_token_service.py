# backend/app/services/alibaba_token_service.py
import json
import logging
from typing import Any, Dict, Optional

from .alibaba_client import refresh_access_token
from ... import extensions

logger = logging.getLogger(__name__)

TOKEN_KEY_PREFIX = "alibaba_token:"
DEFAULT_TOKEN_TTL_SECONDS = 24 * 3600  # 兜底 TTL（秒）


def _get_redis():
    rc = extensions.redis_client
    if rc is None:
        raise RuntimeError(
            "redis_client is not initialized. Did you call init_extensions(app)?"
        )
    return rc


def _token_key(id_: str) -> str:
    return f"{TOKEN_KEY_PREFIX}{id_}"


def save_token(data: Dict[str, Any]) -> None:
    """
    保存授权/刷新后返回的 token 信息到 Redis。
    key 选择：优先 seller_id，没有就用 account(loginId)
    TTL：优先用 expires_in，没有就用 DEFAULT_TOKEN_TTL_SECONDS
    """
    r = _get_redis()

    seller_id = (data.get("seller_id") or "").strip()
    account = (data.get("account") or "").strip()

    if not seller_id and not account:
        logger.warning(f"[AlibabaToken] missing seller_id & account | data={data}")
        return

    key_id = seller_id or account
    key = _token_key(key_id)

    ttl = int(data.get("expires_in") or DEFAULT_TOKEN_TTL_SECONDS)

    r.set(key, json.dumps(data, ensure_ascii=False), ex=ttl)

    logger.info(
        f"[AlibabaToken] SAVE | key={key} | seller_id={seller_id} | "
        f"account={account} | ttl={ttl}"
    )


def load_token_by_seller_id(seller_id: str) -> Optional[Dict[str, Any]]:
    r = _get_redis()
    raw = r.get(_token_key(seller_id))
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception as e:
        logger.error(
            f"[AlibabaToken] LOAD decode failed | seller_id={seller_id} | error={repr(e)}"
        )
        return None


def load_token_by_account(account: str) -> Optional[Dict[str, Any]]:
    r = _get_redis()
    key = _token_key(account)
    raw = r.get(key)
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception as e:
        logger.error(
            f"[AlibabaToken] LOAD decode failed | account={account} | error={repr(e)}"
        )
        return None


def refresh_token_if_possible(seller_id: str) -> Optional[Dict[str, Any]]:
    """
    尝试使用 refresh_token 刷新 access_token：
    - 必须有 refresh_token
    - refresh_expires_in > 0 才允许刷新
    成功则 save_token 并返回新 data，失败返回 None。
    """
    data = load_token_by_seller_id(seller_id)
    if not data:
        return None

    refresh_token_value = data.get("refresh_token")
    refresh_expires_in = int(data.get("refresh_expires_in") or 0)

    if not refresh_token_value or refresh_expires_in <= 0:
        logger.warning(
            f"[AlibabaToken] refresh not allowed | seller_id={seller_id} | "
            f"refresh_expires_in={refresh_expires_in}"
        )
        return None

    try:
        new_data = refresh_access_token(refresh_token_value)
        save_token(new_data)
        logger.info(f"[AlibabaToken] REFRESH OK | seller_id={seller_id}")
        return new_data
    except Exception as e:
        logger.error(
            f"[AlibabaToken] REFRESH FAILED | seller_id={seller_id} | error={repr(e)}"
        )
        return None


def get_valid_access_token(seller_id: str) -> Optional[str]:
    """
    对外暴露的高层接口：
    - 先从 Redis 取 token
    - 尝试刷新（如果允许）
    - 返回一个尽量可用的 access_token
    """
    data = load_token_by_seller_id(seller_id)
    if not data:
        return None

    # 这里可以加“只在快过期时才刷新”的逻辑；
    # 简单起见先直接尝试刷新一次，失败就继续用旧的。
    refreshed = refresh_token_if_possible(seller_id)
    if refreshed:
        data = refreshed

    return data.get("access_token")
