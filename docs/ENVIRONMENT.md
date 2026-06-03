# Environment configuration

All secrets and credentials live in the **root** `.env` file (gitignored). Never commit real values. Use `.env.example` as a template.

After editing `.env`, propagate settings to each microservice:

```powershell
node scripts/sync-service-env.mjs
```

Then restart services (`npm run dev` or `docker compose up`).

## PostgreSQL

| Variable | Description |
|----------|-------------|
| `POSTGRES_USER` | Database user (default `postgres`) |
| `POSTGRES_PASSWORD` | Database password |
| `POSTGRES_HOST` | Host (`127.0.0.1` recommended on Windows when using Docker on port 5433) |
| `POSTGRES_PORT` | Host port (`5433` when using repo `docker-compose.yml`) |
| `AUTH_DATABASE_URL` | Full URL for auth-service Prisma |
| `CUSTOMER_DATABASE_URL` | customer-service |
| `INVENTORY_DATABASE_URL` | inventory-service |
| `ORDER_DATABASE_URL` | order-billing-service |
| `ASSET_DATABASE_URL` | asset-service |
| `SERVICE_REQUEST_DATABASE_URL` | service-request-service |
| `NOTIFICATION_DATABASE_URL` | notification-service |
| `REPORTING_DATABASE_URL` | reporting-service |
| `ESCALATION_DATABASE_URL` | escalation-service |

URL format:

```text
postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
```

Create databases once with `docker/postgres/init.sql` or `docker compose up -d postgres`.

**Windows note:** Use `127.0.0.1` in database URLs (not `localhost`) when Docker maps Postgres to port `5433`, so clients do not connect to a different local PostgreSQL on IPv6.

If an existing Docker volume was created with another password, either update `.env` to match that password or reset inside the container:

```powershell
docker exec -e PGPASSWORD=changeme fems-postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'YourNewPassword';"
```

## JWT and authentication

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Signs access tokens (min **32** characters). **Same value** on gateway and all services that verify JWT. |
| `OTP_SECRET` | HMAC secret for OTP and reset tokens (min **32** characters). auth-service only. |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `24h`, `7d`). |
| `LOGIN_REQUIRES_OTP` | `true` to require OTP on every login; `false` for password-only login (recommended for E2E). |
| `FRONTEND_URL` | Base URL for password-reset links (e.g. `http://localhost:5173`). |
| `GOOGLE_CLIENT_ID` | Optional Google sign-in (auth + `VITE_GOOGLE_CLIENT_ID`). |

Generate new secrets (PowerShell / Node):

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Run twice — one for `JWT_SECRET`, one for `OTP_SECRET`.

## Brevo email

| Variable | Description |
|----------|-------------|
| `BREVO_API_KEY` | API key from [Brevo → API Keys](https://app.brevo.com/settings/keys/api) |
| `BREVO_SENDER_EMAIL` | **Verified** sender in Brevo → Senders & Domains |
| `BREVO_SENDER_NAME` | Display name (e.g. `TWZ LTD`) |
| `EMAIL_ENABLED` | `true` to send mail; `false` to disable |
| `EMAIL_DEV_FALLBACK` | `true` logs email to console when Brevo is unset (dev only) |
| `BREVO_TEST_RECIPIENT` | Recipient for `npm run test:email` |
| `BREVO_RETRY_MAX_ATTEMPTS` | Retries on rate limit / 5xx (default `3`) |
| `BREVO_RETRY_BASE_DELAY_MS` | Retry backoff base ms (default `1000`) |

See [BREVO.md](./BREVO.md) for setup and troubleshooting.

## Infrastructure

| Variable | Description |
|----------|-------------|
| `RABBITMQ_URL` | AMQP URL (default `amqp://guest:guest@localhost:5672`) |
| `API_GATEWAY_PORT` | Gateway port (default `4000`) |
| `VITE_API_URL` | Frontend API base (default `http://localhost:4000/api`) |
| `NODE_ENV` | `development` or `production` |

Per-service `*_SERVICE_URL` variables point microservices at each other on localhost (or Docker hostnames in Compose).

## Verification commands

```powershell
# Sync root .env → apps/* and services/*/.env
node scripts/sync-service-env.mjs

# Build shared (required for Brevo test)
npm run build -w @fems/shared

# Check Postgres, Brevo, JWT presence, gateway health
npm run verify:config

# Send test email via Brevo
npm run test:email

# Apply migrations and seeds
npm run generate:all
npm run migrate:all
npm run seed:all
```

## Docker Compose

Compose reads the root `.env` automatically. Postgres password must match `POSTGRES_PASSWORD` and all `*_DATABASE_URL` values (inside the stack, host is `postgres` and port `5432` — Compose sets this in `docker-compose.yml`).

## Security checklist

- [ ] `.env` is gitignored; only `.env.example` is committed (placeholders only).
- [ ] Production uses a secrets manager or CI variables, not files in the image.
- [ ] Rotate `JWT_SECRET`, `OTP_SECRET`, and `BREVO_API_KEY` if they were ever exposed.
- [ ] `BREVO_SENDER_EMAIL` is verified in Brevo before go-live.
