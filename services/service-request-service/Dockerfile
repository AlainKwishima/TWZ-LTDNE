FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
COPY packages/shared ./packages/shared
COPY services/service-request-service ./services/service-request-service

RUN npm install --workspace=@fems/shared --workspace=@fems/service-request-service
RUN npm run build -w @fems/shared
RUN npm run prisma:generate -w @fems/service-request-service
RUN npm run build -w @fems/service-request-service

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/services/service-request-service ./services/service-request-service

WORKDIR /app/services/service-request-service

EXPOSE 4006

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/index.js"]
