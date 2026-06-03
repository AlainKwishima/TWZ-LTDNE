FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY services/asset-service ./services/asset-service

RUN npm install
RUN npm run build -w @fems/shared
RUN npm run prisma:generate -w @fems/asset-service
RUN npm run build -w @fems/asset-service

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/services/asset-service ./services/asset-service

WORKDIR /app/services/asset-service

EXPOSE 4005

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
