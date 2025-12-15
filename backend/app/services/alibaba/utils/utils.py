
import json

def stable_json(obj: dict) -> str:
    """
    ICBU Python SDK 专用：
    保证签名稳定的 JSON 序列化
    """
    return json.dumps(
        obj,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )
