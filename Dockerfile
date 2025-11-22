# ✅ 使用 Alpine Linux 版本（只有 ~40MB）
FROM node:18-alpine

WORKDIR /app

# 只复制 package.json 先安装依赖（利用 Docker 缓存）
COPY package.json .
RUN npm install --production

# 再复制代码
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
