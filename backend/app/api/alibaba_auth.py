# backend/app/api/alibaba_auth.py
from flask import Blueprint, current_app, jsonify, redirect, request
import urllib.parse as urlparse

from app.services.alibaba.alibaba_client import exchange_code_for_token

from app.services.alibaba.alibaba_client import call_api
from app.services.alibaba.alibaba_token_service import refresh_token_if_possible, get_valid_access_token, \
    save_token

bp = Blueprint("alibaba_auth", __name__)


@bp.route("/auth", methods=["GET"])
def go_auth():
    """
    1）前端访问 /api/alibaba/auth
    2）拼接授权 URL，302 跳转到阿里登录授权页
    """
    cfg = current_app.config
    base = cfg["ALIBABA_OPEN_API_BASE"]
    redirect_uri = cfg["ALIBABA_REDIRECT_URI"]
    app_key = cfg["ALIBABA_APP_KEY"]

    auth_url = (
        f"{base}/oauth/authorize"
        f"?response_type=code"
        f"&force_auth=true"
        f"&redirect_uri={urlparse.quote(redirect_uri, safe='')}"
        f"&client_id={app_key}"
    )
    return redirect(auth_url)


@bp.route("/callback", methods=["GET"])
def callback():
    """
    阿里回调地址：
    配置在 ALIBABA_REDIRECT_URI 中，例如 /api/alibaba/callback?code=xxxx
    """
    code = request.args.get("code")
    if not code:
        return jsonify({"code": 400, "msg": "missing code"}), 400

    data = exchange_code_for_token(code)

    # 保存到 Redis（按 seller_id/account 做 key）
    save_token(data)

    return jsonify({"code": 0, "msg": "authorized", "data": data})


@bp.route("/refresh", methods=["POST"])
def manual_refresh():
    """
    手动触发刷新 access_token：
    入参（JSON 或 form）：{"seller_id": "22108481881480"}
    """
    seller_id = request.json.get("seller_id") if request.is_json else request.form.get("seller_id")
    if not seller_id:
        return jsonify({"code": 400, "msg": "missing seller_id"}), 400

    new_data = refresh_token_if_possible(seller_id)
    if not new_data:
        # 可能是没有 refresh_token，或者 refresh_expires_in = 0
        return jsonify({"code": 1, "msg": "cannot refresh, need re-authorize"}), 200

    return jsonify({"code": 0, "msg": "refresh ok", "data": new_data})


@bp.route("/me", methods=["GET"])
def me():
    """
    Demo：调用一个简单 API 示例（当前账户信息）
    调用前需要先授权一次，让 Redis 里有 token。
    请求示例：GET /api/alibaba/me?seller_id=22108481881480
    """
    seller_id = request.args.get("seller_id")
    if not seller_id:
        return jsonify({"code": 400, "msg": "missing seller_id"}), 400

    # 取得尽量可用的 access_token（必要时尝试刷新）
    access_token = get_valid_access_token(seller_id)
    if not access_token:
        return jsonify({"code": 401, "msg": "no token, please authorize first"}), 401

    # 这里示例用“当前用户信息”接口，你可以换成自己想调用的商品/订单接口
    # 实际 API 路径以阿里文档为准
    api_name = "/param2/1/system/currentUserInfo/"

    try:
        data = call_api(api_name, access_token)
        return jsonify({"code": 0, "msg": "ok", "data": data})
    except Exception as e:
        return jsonify({"code": 500, "msg": f"call api failed: {e}"}), 500
