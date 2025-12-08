import os
from app import create_app

# 自动选择环境；APP_ENV 不存在则默认 dev
env = os.getenv("APP_ENV", "dev")
print(f"🔧 Flask using environment: {env}")

app = create_app(env)


@app.get("/healthz")
def healthz():
    return {"ok": True}, 200


if __name__ == "__main__":
    # 保持本地开发模式
    app.run(host="0.0.0.0", port=5000, debug=(env == "dev"))
