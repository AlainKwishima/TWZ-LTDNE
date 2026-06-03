# Fire Extinguisher Management System (TWZ LTD)

A production-ready full-stack microservice web application for fire safety companies to manage customers, inventory, orders, billing, asset tracking, service requests, notifications, reporting, and compliance escalation.

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────────────────────────┐
│   React     │────▶│  API Gateway │────▶│  Microservices (Express + Prisma)     │
│  Frontend   │     │   :4000      │     │  auth, customer, inventory, order,      │
│   :5173     │     └──────────────┘     │  asset, service-request, notification,│
└─────────────┘                          │  reporting, escalation                │
                                         └──────────────┬──────────────────────────┘
                                                        │
                    ┌───────────────────────────────────┼───────────────────────┐
                    │                                   │                       │
              ┌─────▼─────┐                    ┌──────▼──────┐         ┌──────▼──────┐
              │ PostgreSQL │                    │  RabbitMQ   │         │    Brevo     │
              │ 9 databases│                    │  Event Bus  │         │   (Email)    │
              └───────────┘                    └─────────────┘         └─────────────┘
```

Each microservice owns its PostgreSQL database. Cross-service references use external IDs (`userId`, `customerId`, `orderId`, etc.) — no cross-database foreign keys. Services communicate asynchronously via RabbitMQ events.

## Services

| Service | Port | Database | Responsibility |
|---------|------|----------|----------------|
| API Gateway | 4000 | — | Single entry point, JWT verification, role-based routing |
| Auth Service | 4001 | auth_service_db | Signup, login, OTP, JWT, roles, audit logs |
| Customer Service | 4002 | customer_service_db | Customer profiles, addresses, notes |
| Inventory Service | 4003 | inventory_service_db | Products, stock, low-stock alerts |
| Order/Billing Service | 4004 | order_service_db | Cart, checkout, orders, invoices, PDF |
| Asset Service | 4005 | asset_service_db | Fire extinguisher asset tracking, expiry |
| Service Request Service | 4006 | service_request_service_db | Refill/inspection/replacement requests |
| Notification Service | 4007 | notification_service_db | Email, SMS-ready, in-app notifications |
| Reporting Service | 4008 | reporting_service_db | Reports, PDF/CSV/Excel exports, analytics |
| Escalation Service | 4009 | escalation_service_db | Compliance review, high-risk queue |

## Prerequisites

- **Node.js** 20+
- **npm** 10+
- **Docker** & **Docker Compose** (recommended)
- **PostgreSQL** 16 (if running locally without Docker)
- **RabbitMQ** (if running locally without Docker)

## Quick Start with Docker

```powershell
# Clone and enter project
cd TWZ-LTD

# Copy environment file and set secrets
copy .env.example .env
# Edit .env — set JWT_SECRET and OTP_SECRET to long random strings

# Start everything
docker compose up -d --build

# Frontend: http://localhost:5173
# API Gateway: http://localhost:4000
# RabbitMQ Management: http://localhost:15672 (guest/guest)
```

Docker Compose automatically:
- Creates all 9 PostgreSQL databases via `docker/postgres/init.sql`
- Runs Prisma migrations and seeds for each service
- Starts RabbitMQ, all microservices, API Gateway, and frontend

## Local Development (Without Docker)

### 1. Install dependencies

```powershell
cd c:\Users\rca\Desktop\TWZ-LTD
npm install
npm run build -w @fems/shared
```

### 2. Start PostgreSQL and create databases

Ensure PostgreSQL is running, then:

```powershell
psql -U postgres -f docker/postgres/init.sql
```

Or run each `CREATE DATABASE` statement manually in psql.

### 3. Configure environment

```powershell
copy .env.example .env
```

Copy service-specific `.env.example` files:

```powershell
Get-ChildItem -Recurse -Filter ".env.example" | ForEach-Object {
  $envFile = Join-Path $_.DirectoryName ".env"
  if (-not (Test-Path $envFile)) { Copy-Item $_.FullName $envFile }
}
```

### 4. Run migrations and seed all services

```powershell
npm run generate:all
npm run migrate:all
npm run seed:all
```

Or per service:

```powershell
npm run prisma:migrate:deploy -w @fems/auth-service
npm run prisma:seed -w @fems/auth-service
# Repeat for each service...
```

### 5. Start RabbitMQ

```powershell
docker run -d --name fems-rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management-alpine
```

### 6. Start all services

```powershell
# All backend services + frontend
npm run dev

# Backend only
npm run dev:services

# Individual service
npm run dev -w @fems/auth-service
npm run dev -w @fems/frontend
```

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fems.local | Password123! |
| Staff | staff@fems.local | Password123! |
| Technician | tech@fems.local | Password123! |
| Customer | customer@fems.local | Password123! |

In development mode, OTP codes are logged to the auth/order service console when email is not configured.

## API Gateway Routes

| Prefix | Target Service |
|--------|----------------|
| `/api/auth/*` | Auth Service |
| `/api/customers/*` | Customer Service |
| `/api/products/*` | Inventory Service |
| `/api/cart/*`, `/api/checkout/*`, `/api/orders/*`, `/api/invoices/*` | Order/Billing Service |
| `/api/assets/*` | Asset Service |
| `/api/services/*` | Service Request Service |
| `/api/notifications/*` | Notification Service |
| `/api/reports/*`, `/api/analytics/*` | Reporting Service |
| `/api/escalations/*` | Escalation Service |

Health check: `GET http://localhost:4000/health`

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `OTP_SECRET` | OTP HMAC secret |
| `POSTGRES_PASSWORD` | PostgreSQL password (set in `.env`) |
| `RABBITMQ_URL` | RabbitMQ connection string |
| `BREVO_API_KEY` / `BREVO_SENDER_EMAIL` | Brevo transactional email ([setup guide](docs/BREVO.md)) |
| `VITE_API_URL` | Frontend API base URL |

**Never commit `.env` files or hardcode secrets in code.**

## Event Flow Example (Purchase)

1. Customer completes checkout → Order Service saves order
2. Customer confirms with OTP → Order verified
3. Order Service generates invoice PDF → publishes `InvoiceGenerated`
4. Order Service publishes `OrderCompleted`
5. Inventory Service reduces stock
6. Asset Service creates extinguisher asset records
7. Notification Service sends confirmation email/in-app notification
8. Reporting Service updates analytics cache

## Project Structure

```
fire-extinguisher-system/
├── apps/
│   ├── frontend/          # React + TypeScript + Tailwind
│   └── api-gateway/       # Express proxy gateway
├── services/
│   ├── auth-service/
│   ├── customer-service/
│   ├── inventory-service/
│   ├── order-billing-service/
│   ├── asset-service/
│   ├── service-request-service/
│   ├── notification-service/
│   ├── reporting-service/
│   └── escalation-service/
├── packages/
│   └── shared/            # Types, utils, middleware, event-bus
├── docker/
│   └── postgres/init.sql
├── docker-compose.yml
├── package.json
└── README.md
```

## Troubleshooting

### Database connection refused
- Ensure PostgreSQL is running: `docker compose ps` or check local postgres service
- Verify `DATABASE_URL` in service `.env` matches your setup (localhost vs `postgres` hostname)

### RabbitMQ connection failed
- Services continue in degraded mode — events are logged to console
- Start RabbitMQ: `docker compose up rabbitmq -d`

### Prisma migration errors
```powershell
npm run prisma:generate -w @fems/<service-name>
npm run prisma:migrate:deploy -w @fems/<service-name>
```

### OTP not received
- In development without Brevo, check auth-service console logs for OTP codes
- Configure Brevo per [docs/BREVO.md](docs/BREVO.md) and run `npm run test:email`

### Frontend cannot reach API
- Verify API Gateway is running on port 4000
- Check `VITE_API_URL` in frontend `.env` or docker build args

### Port already in use
- Change ports in `.env` and `docker-compose.yml`, or stop conflicting processes

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start all services + frontend |
| `npm run dev:services` | Start backend services only |
| `npm run build` | Build all workspaces |
| `npm run generate:all` | Prisma generate for all services |
| `npm run migrate:all` | Run migrations for all services |
| `npm run seed:all` | Seed all databases |
| `npm run docker:up` | Docker Compose up |
| `npm run docker:down` | Docker Compose down |
| `npm run test:email` | Verify Brevo config and send a test email |

## License

MIT
