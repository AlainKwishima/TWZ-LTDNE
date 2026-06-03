# Database exports

Run `npm run export:db` from the repo root to dump all service databases (via Docker `fems-postgres` when available).

Each run creates a timestamped folder with:

- `auth_service_db.sql`
- `asset_service_db.sql`
- `service_request_service_db.sql`
- `notification_service_db.sql`
- `reporting_service_db.sql`
- `manifest.json`

Restore example (inside the postgres container):

```bash
psql -U postgres -d auth_service_db -f auth_service_db.sql
```
