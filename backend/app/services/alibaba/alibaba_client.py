# backend/app/services/alibaba_client.py
from typing import Dict, Any, Optional

from flask import current_app
from iop import IopClient, IopRequest
from typing import Dict, Any, Optional

from app.services.alibaba.utils.utils import stable_json


def _get_client() -> IopClient:
    cfg = current_app.config
    return IopClient(
        cfg["ALIBABA_OPEN_API_TOKEN_SERVER_URL"],
        cfg["ALIBABA_APP_KEY"],
        cfg["ALIBABA_APP_SECRET"],
    )

def get_client() -> IopClient:
    cfg = current_app.config
    return IopClient(
        cfg["ALIBABA_OPEN_API_SERVER_URL"],
        cfg["ALIBABA_APP_KEY"],
        cfg["ALIBABA_APP_SECRET"],
    )

def exchange_code_for_token(code: str) -> Dict[str, Any]:
    """
    用 /auth/token/create 通过 code 换 access_token
    """
    client = _get_client()
    req = IopRequest("/auth/token/create", http_method="POST")
    req.add_api_param("code", code)
    resp = client.execute(req)
    return resp.body


def refresh_access_token(refresh_token: str) -> Dict[str, Any]:
    """
    用 /auth/token/refresh 刷新 access_token
    """
    client = _get_client()
    req = IopRequest("/auth/token/refresh", http_method="POST")
    req.add_api_param("refresh_token", refresh_token)
    resp = client.execute(req)
    return resp.body




def call_api(
    api_name: str,
    access_token: str,
    api_params: Optional[Dict[str, Any]] = None,
    http_method: str = "POST",
):
    client = get_client()
    request = IopRequest(api_name, http_method=http_method)

    if api_params:
        for k, v in api_params.items():
            if v is None:
                continue

            # 🔴 ICBU 特殊坑：必须 JSON 字符串
            if k == "param_product_top_publish_request" and isinstance(v, dict):
                request.add_api_param(k, stable_json(v))
            else:
                request.add_api_param(k, v)

    response = client.execute(request, access_token)
    return response.body


