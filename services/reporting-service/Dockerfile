FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
COPY packages/shared ./packages/shared
COPY services/reporting-service ./services/reporting-service

RUN npm install --workspace=@fems/shared --workspace=@fems/reporting-service
RUN npm run build -w @fems/shared
RUN npm run prisma:generate -w @fems/reporting-service
RUN npm run build -w @fems/reporting-service

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV EXPORT_DIR=/app/exports

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/services/reporting-service ./services/reporting-service

WORKDIR /app/services/reporting-service
RUN mkdir -p /app/exports

EXPOSE 4008

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/index.js"]
