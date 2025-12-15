# backend/app/api/alibaba_debug.py
from flask import Blueprint, request, jsonify

from ..services.alibaba.alibaba_client import call_api  # 你已有的函数
from ..services.alibaba.alibaba_token_service import get_valid_access_token  # 前面做过
from ..services.alibaba.product.product_flow import AlibabaProductFlow
from flask import send_file

bp = Blueprint("alibaba_debug", __name__)


@bp.route("/call", methods=["POST"])
def call_any_api():
    """
    通用调试入口：
    Body(JSON):
    {
      "api_name": "alibaba.icbu.photobank.list",
      "http_method": "POST",
      "seller_id": "2210......",  // 可选
      "access_token": "xxx",      // 可选，二选一
      "params": { ... }           // 业务参数
    }
    """
    data = request.get_json(force=True) or {}

    api_name = data.get("api_name")
    http_method = (data.get("http_method") or "POST").upper()
    seller_id = data.get("seller_id")
    access_token = data.get("access_token")
    params = data.get("params") or {}

    if not api_name:
        return jsonify({"code": 400, "msg": "api_name required"}), 400

    # 如果没传 access_token，就根据 seller_id 自动取
    if not access_token:
        if not seller_id:
            return jsonify(
                {"code": 400, "msg": "either access_token or seller_id is required"}
            ), 400

        access_token = get_valid_access_token(seller_id)
        if not access_token:
            return jsonify(
                {"code": 401, "msg": "no token for seller, please authorize first"}
            ), 401

    try:
        result = call_api(
            api_name=api_name,
            access_token=access_token,
            api_params=params,
            http_method=http_method,
        )
        return jsonify({"code": 0, "msg": "ok", "data": result})
    except Exception as e:
        return jsonify({"code": 500, "msg": f"call api failed: {e}"}), 500


@bp.route("/publish/minimal", methods=["POST"])
def publish_minimal():
    seller_id = "hengshijixie"
    # 获取 token
    access_token = get_valid_access_token(seller_id)

    # 初始化发品流程
    flow = AlibabaProductFlow(access_token)

    # 调用发品流程
    res = flow.publish_minimal_product(token=access_token)

    # 返回结果
    return jsonify(res)





@bp.route("/publish/template_generator", methods=["GET"])
def publish_template_generator():
    seller_id = "hengshijixie"
    access_token = get_valid_access_token(seller_id)

    flow = AlibabaProductFlow(access_token)

    # 生成 Excel，返回文件路径
    file_path = flow.excel_template_generator(access_token)

    return send_file(
        file_path,
        as_attachment=True,
        download_name="products_template.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )




