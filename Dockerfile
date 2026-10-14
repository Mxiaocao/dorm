# Zeabur 部署用
# 零依赖，直接跑 Node 自带的 http 服务
FROM node:22-alpine

WORKDIR /app

# 没有第三方依赖，但先留好位置；以后加依赖时改这里
COPY package.json ./
RUN npm install --omit=dev 2>/dev/null || true

COPY index.html server.js ./

ENV PORT=8080
ENV NODE_ENV=production
# data.json 所在目录，部署时挂 Volume 到这里
ENV DATA_DIR=/data

EXPOSE 8080

CMD ["node", "server.js"]