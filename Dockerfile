FROM node:22-bookworm-slim AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:22-bookworm-slim AS server-build
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/prisma ./prisma
RUN npx prisma generate

FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates curl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production PORT=6005 UPLOAD_DIR=/app/uploads/products
WORKDIR /app
COPY --from=server-build /app/server /app/server
COPY server/server.js /app/server/server.js
COPY server/src /app/server/src
COPY --from=client-build /app/client/dist /app/client/dist
COPY client/public /app/client/public
RUN mkdir -p /app/uploads/products && chown -R node:node /app/uploads
USER node
EXPOSE 6005
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD node -e "fetch('http://127.0.0.1:6005/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "cd /app/server && ./node_modules/.bin/prisma migrate deploy && node prisma/seed.js && node server.js"]
