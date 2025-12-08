import os
from app import create_app

env = os.getenv("APP_ENV", "dev")
print(f"🔧 Flask using environment: {env}")
app = create_app(env)


@app.get("/healthz")
def healthz():
    return {"ok": True}, 200


if __name__ == "__main__":
    # 只给本地用，生产环境不会走这里
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=(env == "dev"),
        use_reloader=False,  # 解决 Windows + 空格路径问题
    )
