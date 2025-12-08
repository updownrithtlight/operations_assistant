# backend/app/__init__.py
from flask import Flask, jsonify
from flask_cors import CORS

from .config import config_map
from .extensions import init_extensions
from .api import register_blueprints
from .logging_config import setup_logging
from .utils.datetime_provider import BJJSONProvider
from .exceptions.exceptions import CustomAPIException  # 你的自定义异常:contentReference[oaicite:0]{index=0}
from .utils.config_inspector import dump_config


def handle_custom_api_exception(e: CustomAPIException):
    """
    全局处理 CustomAPIException，统一返回格式
    """
    return jsonify({
        "code": getattr(e, "code", 1),
        "message": getattr(e, "message", str(e)),
        "data": None,
    }), getattr(e, "status_code", 400)


def create_app(config_name: str = "dev") -> Flask:
    setup_logging(level="DEBUG" if config_name == "dev" else "INFO")
    app = Flask(__name__)

    # CORS 设置（保持你原来的配置）
    CORS(
        app,
        supports_credentials=True,
        resources={r"/api/*": {  # 只对 API 开 CORS 即可
            "origins": [
                "http://localhost:5173",  # 本机开发
                "http://192.168.31.145",  # 内网通过 Nginx 访问
                "http://192.168.31.145:80",  # 有些浏览器会带端口
                "https://tools.billlvtech.site",  # 以后正式域名
            ]
        }},
        expose_headers=["Content-Disposition"],
    )

    # 加载配置
    cfg_cls = config_map.get(config_name, config_map["dev"])
    app.config.from_object(cfg_cls)

    # ⭐ 替换默认 JSON Provider —— datetime 自动转北京时间字符串
    app.json = BJJSONProvider(app)

    # 初始化扩展 & 注册蓝图
    init_extensions(app)
    register_blueprints(app)

    # ⭐ 在工厂函数里注册全局异常处理
    app.register_error_handler(CustomAPIException, handle_custom_api_exception)

    @app.errorhandler(Exception)
    def handle_unexpected_error(e):
        # 打印完整堆栈到日志（console + logs/app.log）
        app.logger.exception("Unhandled Exception:")
        return jsonify({
            "code": 1,
            "message": "Internal server error",
            "data": None,
        }), 500

    dump_config(app)
    return app
