FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
COPY packages/shared ./packages/shared
COPY services/notification-service ./services/notification-service

RUN npm install --workspace=@fems/shared --workspace=@fems/notification-service
RUN npm run build -w @fems/shared
RUN npm run prisma:generate -w @fems/notification-service
RUN npm run build -w @fems/notification-service

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/services/notification-service ./services/notification-service

WORKDIR /app/services/notification-service

EXPOSE 4007

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/index.js"]
