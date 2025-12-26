# 使用 Node.js 官方镜像
FROM node:alpine

# 设置环境变量
ENV MONGO_DB_USERNAME=admin \
    MONGO_DB_PWD=112358

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY backend/package*.json ./

# 安装依赖
RUN npm install

# 复制 backend 目录中的源代码
COPY backend/ ./

COPY frontend/ ./frontend/

# 启动命令
CMD ["node", "server.js"]
