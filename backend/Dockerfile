FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# 安装系统依赖：ffmpeg 是 yt-dlp 合并音视频必备
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ffmpeg \
    ca-certificates \
    curl \
 && rm -rf /var/lib/apt/lists/*

# 如果以后你想解决 JS runtime 的 warning，可以在这里顺便装 node：
# RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
#  && apt-get install -y nodejs \
#  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "wsgi:app"]
