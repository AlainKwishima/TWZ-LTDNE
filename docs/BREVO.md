# Brevo Email Integration

TWZ LTD sends all transactional email through [Brevo](https://www.brevo.com/) (REST API). SMTP / Nodemailer has been removed.

## Services that send email

| Service | Use cases |
|---------|-----------|
| **auth-service** | Signup OTP, optional login OTP, password reset links |
| **notification-service** | Order confirmations, expiry alerts, templated notifications |
| **escalation-service** | Police compliance reports (`POLICE_EMAIL`) when enabled |

All three use the shared client in `@fems/shared` (`BrevoEmailClient`).

## Required environment variables

Set these in the **root** `.env` (Docker Compose) and in each service `.env` for local development:

| Variable | Description |
|----------|-------------|
| `BREVO_API_KEY` | Brevo v3 API key ([Settings → API Keys](https://app.brevo.com/settings/keys/api)) |
| `BREVO_SENDER_EMAIL` | Verified sender address in Brevo |
| `BREVO_SENDER_NAME` | Display name (e.g. `TWZ LTD`) |
| `EMAIL_ENABLED` | `true` (default when API key + sender are set) or `false` to disable sending |

## Optional variables

| Variable | Description |
|----------|-------------|
| `EMAIL_REDIRECT_TO` | **Staging only.** Send all mail to this address instead of the real recipient |
| `BREVO_RETRY_MAX_ATTEMPTS` | Retries on 429/5xx (default `3`) |
| `BREVO_RETRY_BASE_DELAY_MS` | Base delay between retries in ms (default `1000`) |
| `EMAIL_DEV_FALLBACK` | When `NODE_ENV` is not `production` and Brevo is unset, log email to console (default allowed) |
| `BREVO_TEST_RECIPIENT` | Recipient for `npm run test:email` |
| `FRONTEND_URL` | Base URL for password-reset links (auth-service) |

## Brevo dashboard setup

1. Create a Brevo account and generate an **API key** with transactional email permission.
2. Under **Senders & Domains**, verify the address you use for `BREVO_SENDER_EMAIL`.
3. Ensure your plan allows the expected sending volume.
4. (Recommended) Configure SPF/DKIM for your domain to improve deliverability.

## Local development

```powershell
# From repository root
copy .env.example .env
# Edit .env — set BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME, BREVO_TEST_RECIPIENT

npm install
npm run build -w @fems/shared

# Verify Brevo credentials and send a test message
npm run test:email
```

If Brevo is not configured in development, auth and notification services **log email content to the console** instead of failing (unless `EMAIL_DEV_FALLBACK=false` or `NODE_ENV=production`).

## Docker Compose

Root `.env` is loaded by Compose. These keys are passed to `auth-service`, `notification-service`, and `escalation-service`:

```yaml
BREVO_API_KEY: ${BREVO_API_KEY}
BREVO_SENDER_EMAIL: ${BREVO_SENDER_EMAIL}
BREVO_SENDER_NAME: ${BREVO_SENDER_NAME:-TWZ LTD}
EMAIL_ENABLED: ${EMAIL_ENABLED:-true}
```

Rebuild after changing env:

```powershell
docker compose up -d --build auth-service notification-service escalation-service
```

## Production checklist

- [ ] `BREVO_API_KEY` stored in secrets manager / CI variables — **never** committed to git
- [ ] `BREVO_SENDER_EMAIL` verified in Brevo
- [ ] `EMAIL_ENABLED=true`
- [ ] `EMAIL_REDIRECT_TO` **unset** in production
- [ ] `NODE_ENV=production`
- [ ] `FRONTEND_URL` set to the public app URL
- [ ] Run `npm run test:email` from a secure environment before go-live

## Delivery status and errors

- Successful sends return a Brevo `messageId` logged as `[BrevoEmailClient] Sent ...`.
- Notification records store `messageId` and `deliveredTo` in dispatch metadata; failures set status `Failed` with `failureReason`.
- Transient Brevo errors (HTTP 429, 5xx) are retried with exponential backoff.

## Troubleshooting

| Symptom | Action |
|---------|--------|
| `401` from Brevo | Invalid or revoked `BREVO_API_KEY` |
| `400` sender error | Verify `BREVO_SENDER_EMAIL` in Brevo senders list |
| OTP not received | Check spam; run `npm run test:email`; inspect auth-service logs |
| Mail goes to wrong inbox | Check `EMAIL_REDIRECT_TO` is not set in production |

## Removed configuration (do not use)

The following SMTP variables are **no longer read**:

- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_SECURE`, `EMAIL_FROM`
