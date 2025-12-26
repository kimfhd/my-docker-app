FROM nginx:alpine

# 1. 删除 Nginx 默认配置
RUN rm /etc/nginx/conf.d/default.conf

# 2. 复制我们优化过的 nginx.conf
# 确保你本地的 nginx.conf 文件和 Dockerfile 在同一个目录下
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 3. 复制网页、高清视频和音乐文件
# 假设这些都在你本地的 html 文件夹里
COPY html/ /usr/share/nginx/html/

# 暴露 80 端口
EXPOSE 80
