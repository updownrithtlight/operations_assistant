# ===== 1. 构建阶段 =====
FROM node:20-alpine AS build

WORKDIR /app

# 只拷贝依赖相关文件，利用缓存
COPY package*.json ./
RUN npm install

# 拷贝全部源代码并构建
COPY . .
RUN npm run build

# ===== 2. 运行阶段（Nginx）=====
FROM nginx:1.27-alpine

# 拷贝自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 将前端构建产物复制到 nginx 静态目录
COPY --from=build /app/dist /usr/share/nginx/html

# 可选：时区/日志等自己再加
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
