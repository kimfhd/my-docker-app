# 使用官方 Nginx 镜像作为基础
FROM nginx:alpine

# 复制 index.html 到 Nginx 的默认网站目录
COPY index.html /usr/share/nginx/html/index.html

# 可选：如果你有 style.css 等其他文件，也复制进来
# COPY style.css /usr/share/nginx/html/style.css

# 暴露端口 2026（Nginx 默认是 80，我们后面改配置）
EXPOSE 2026

# 修改 Nginx 配置，将监听端口改为 2026
RUN sed -i 's/listen       80;/listen       2026;/g' /etc/nginx/conf.d/default.conf
