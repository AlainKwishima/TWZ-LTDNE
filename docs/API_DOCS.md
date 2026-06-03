# FEMS API documentation (Swagger UI)

## Unified API (recommended)

Start the API gateway:

```bash
npm run docs
```

Open **Swagger UI**: [http://localhost:4000/api-docs](http://localhost:4000/api-docs)

OpenAPI JSON: [http://localhost:4000/api-docs.json](http://localhost:4000/api-docs.json)

Use **Authorize** with `Bearer <JWT>` after `POST /api/auth/login` or `POST /api/auth/verify-otp`.

To exercise proxied endpoints from Swagger, run all backends:

```bash
npm run docs:all
```

## Per-service Swagger (development)

| Service | Port | Swagger UI |
|---------|------|------------|
| Auth | 4001 | http://localhost:4001/api-docs |
| Assets | 4005 | http://localhost:4005/api-docs |
| Service requests | 4006 | http://localhost:4006/api-docs |
| Notifications | 4007 | http://localhost:4007/api-docs |
| Reporting | 4008 | http://localhost:4008/api-docs |

Internal (cron / service-to-service) routes are tagged **Internal** in the spec; they are not exposed through the gateway.
