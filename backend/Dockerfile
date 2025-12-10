# -----------------------------
#  Backend Production Dockerfile
# -----------------------------
FROM python:3.11-slim

# 基本环境变量：不生成 .pyc、日志直接输出
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# 1. 安装系统依赖
#    - build-essential：编译一些依赖用
#    - ffmpeg：yt-dlp 合并音视频用
#    - curl + ca-certificates：安装 Node.js 用
#    - tzdata：设置时区（可选）
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ffmpeg \
    curl \
    ca-certificates \
    tzdata \
  && rm -rf /var/lib/apt/lists/*

# 2. 安装 Node.js（用于 yt-dlp 的 JS runtime，解决 EJS / SABR 等 warning）
#    使用 NodeSource 官方源安装 Node 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get update && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*

# 3. 创建运行时目录（下载目录 & 日志目录），方便后续挂载
RUN mkdir -p /data/youtube /data/logs

# 4. 安装 Python 依赖
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 5. 拷贝代码
COPY . .

# 6. 对外暴露端口（给 gunicorn 用）
EXPOSE 8000

# 7. 以 gunicorn 启动 Flask（wsgi.py 里的 app）
#    -w 4：4 个 worker（可以根据 CPU 调整）
#    0.0.0.0:8000：容器内监听
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "wsgi:app"]
