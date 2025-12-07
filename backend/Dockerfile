FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 拷贝代码
COPY . .

# 对外暴露 gunicorn 端口
EXPOSE 8000

# 使用 gunicorn 运行 backend.wsgi:app
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "wsgi:app"]
