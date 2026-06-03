# TWZ LTD — Codebase Audit & Completion Report

**Date:** June 2026  
**Scope:** Compare implemented system against the Fire Extinguisher Management audit checklist.  
**Important:** TWZ LTD is an **operational SaaS** (customers, orders, inventory, billing, compliance escalations), not a minimal CRUD app with separate “Fire Extinguisher Service” and “User Management Service.” Requirements below are mapped to **what TWZ LTD actually is**, with explicit gaps and intentional omissions.

---

## Executive Summary

| Area | Status |
|------|--------|
| Microservices architecture | **Implemented** — 9 services + API gateway + shared package |
| Authentication & RBAC | **Implemented** — 4 roles (not 3 from checklist) |
| Fire extinguisher lifecycle | **Implemented** as products (inventory) + assets (owned units) |
| Inspection / maintenance | **Partial** — backend `service-request-service`; UI was missing (added in this pass) |
| Reporting & exports | **Implemented** — 10 report types; PDF/CSV/XLSX |
| Notifications | **Implemented** — email/SMS/in-app; expiry cron |
| Swagger/OpenAPI | **Not implemented** |
| Unit/integration tests | **Not implemented** (Playwright E2E only) |
| Admin “manage users” | **Not implemented** (customer records only) |
| Change password (logged-in) | **Was missing** — added in this pass |

---

## Architecture Review

### Implemented topology

```
React SPA → API Gateway (:4000) → 9 microservices
PostgreSQL (1 DB per service) + RabbitMQ (domain events)
```

| Service | Port | Responsibility |
|---------|------|----------------|
| auth-service | 4001 | Users, JWT, OTP, password reset, Google OAuth |
| customer-service | 4002 | Customer profiles, addresses, notes |
| inventory-service | 4003 | Product catalog, stock, alerts |
| order-billing-service | 4004 | Cart, checkout, orders, invoices, PDF |
| asset-service | 4005 | Fire extinguisher **assets** (post-purchase) |
| service-request-service | 4006 | Refill / **inspection** / replacement / visits |
| notification-service | 4007 | Email (Brevo), SMS stub, in-app, expiry cron |
| reporting-service | 4008 | Reports, analytics, exports |
| escalation-service | 4009 | Compliance escalations, police reports |

**Not present (and not required for current product):** separate User Management Service, standalone Fire Extinguisher Service, service discovery layer.

### Gateway

- JWT verification and role guards on `/api/*` routes.
- User context forwarded via `x-user-id`, `x-user-email`, `x-user-role`, `x-customer-id`.
- Internal routes (`/internal/*`, notification `/templates`) are **not** exposed through the gateway (by design).

### Cleanup performed

- Removed unused frontend: `skeleton.tsx`, `tabs.tsx` (no imports).
- Removed unused `downloadFile` helper from `api.ts`.
- Removed unused exports from `ComplianceBadge.tsx` where applicable.
- E2E tests aligned with actual navigation (no phantom “Service Requests” links before UI existed).

---

## Requirements Mapping

### User roles (checklist vs TWZ LTD)

| Checklist role | TWZ LTD equivalent | Notes |
|----------------|-----------------|-------|
| Admin | **Admin** | Full ops + escalations |
| Inspector | **Technician** | Field work via service requests |
| User | **Customer** | Shop, assets, requests |
| — | **Staff** | Extra role: ops without escalations |

### Admin capabilities

| Requirement | Status |
|-------------|--------|
| Manage users | **Missing** — no list/edit/deactivate users API |
| Manage system settings | **Partial** — env/config only; no settings UI |
| View reports | **Yes** — ReportsPage |
| Access analytics | **Yes** — AdminDashboard |

### Inspector / Technician

| Requirement | Status |
|-------------|--------|
| Perform inspections | **Partial** — `ServiceRequestType.Inspection` + completion API |
| Log maintenance | **Partial** — asset `service-records` API; limited UI |
| Schedule maintenance | **Partial** — `scheduledDate` on service requests |

### Customer / User

| Requirement | Status |
|-------------|--------|
| View extinguisher status | **Yes** — My Extinguishers, dashboard |
| Request / schedule inspections | **Added** — Service Requests page (customer) |
| View history | **Yes** — orders, invoices, assets, requests |

### Authentication

| Feature | Status |
|---------|--------|
| Registration | Yes (+ OTP) |
| Login | Yes |
| Logout | Client-side token clear (no server revoke list) |
| JWT | Yes |
| RBAC | Yes (gateway + services) |
| Password hashing | bcrypt |
| Protected endpoints | Yes |
| Forgot / reset password | Yes |
| Change password (authenticated) | **Added** — `PUT /auth/change-password` |
| Google sign-in | Yes (optional `VITE_GOOGLE_CLIENT_ID`) |

### Fire extinguisher management

Implemented across **inventory** (catalog) and **assets** (deployed units):

| Checklist field | TWZ LTD field |
|-----------------|------------|
| Serial Number | `serialNumber` on asset |
| Location | `installationLocation` |
| Type | `productType` (product) / product name on asset |
| Size | `capacity` on product |
| Installation Date | `purchaseDate` / service dates |
| Expiry Date | `expirationDate` |
| Status | `AssetStatus` enum |

| CRUD | Products | Assets |
|------|----------|--------|
| Create | Yes (UI) | Yes (API + register dialog; also auto on order) |
| Read | Yes | Yes |
| Update | Yes | PATCH API; **no edit UI** |
| Delete | Yes (products) | **No DELETE** endpoint |
| Search / filter / pagination | Yes | Yes |

### Inspection management (checklist)

| Requirement | Status |
|-------------|--------|
| Select extinguisher | Customer service request form (asset picker) |
| Schedule inspection | `scheduledDate` on create |
| Track status | Service request status workflow |

No standalone “Inspection” module — uses **service-request-service**.

### Maintenance management

| Requirement | Status |
|-------------|--------|
| Extinguisher reference | `assetId` |
| Action / notes | Service completion + asset service records |
| Maintenance date | `serviceDate`, `nextServiceDate` |
| History | Asset timeline API; partial UI exposure |

### Reporting

| Category | TWZ LTD `ReportType` |
|----------|-------------------|
| Inventory / totals | `inventory`, `low_stock`, `sales` |
| Time summaries | Via `dateFrom` / `dateTo` on generate (not named daily/monthly/yearly) |
| Inspection-related | `service_requests` (backend); UI label added |
| Compliance | `expired_assets`, `expiring_soon`, `escalations` |
| Maintenance / service | `service_requests` |
| Notifications / invoices | `notifications`, `invoices`, `customers` |

**Exports:** PDF, CSV, XLSX on reports; escalation PDF; invoice PDF via stored URL.

### Notifications

| Trigger | Status |
|---------|--------|
| Expiration alerts | Yes (asset cron + notification cron) |
| Upcoming expiry | Yes |
| Order / invoice | Yes (events) |
| Inspection overdue | **Partial** — via service request status, not dedicated “overdue inspection” job |
| Maintenance reminders | **Partial** — expiry-focused |

### API quality

- Consistent `ApiResponse` wrapper from `@TWZ LTD/shared`.
- Zod validation per service.
- Pagination on list endpoints.
- **Swagger:** not present.

### Frontend

All major flows have pages. Gaps addressed in this pass: **service requests UI**, **change password**, E2E alignment.

### Testing

| Type | Status |
|------|--------|
| Unit tests | None |
| Integration tests | None |
| E2E (Playwright) | `scripts/e2e/TWZ LTD.spec.ts` — run via `npm run test:e2e` |
| `npm run build` | Passes (frontend + services) |

---

## Removed / Not Adding (engineering judgment)

| Item | Reason |
|------|--------|
| Rebuild as monolith | Already valid microservices |
| Separate User Management microservice | Auth-service owns users; admin user CRUD is new scope |
| Swagger on all 10 apps | Large effort; document as recommendation |
| Full inspection module duplicate of service requests | Redundant with existing service |
| DELETE for assets | Not in API; avoid breaking compliance trail |
| `design.md` as runtime dependency | Design reference only |

---

## Changes Made in This Audit Pass

1. **`docs/AUDIT.md`** — this document.
2. **Service Requests UI** — pages for Admin/Staff, Technician, Customer wired to `/api/services/*`.
3. **Change password** — `PUT /auth/change-password` + Profile UI section.
4. **E2E fixes** — navigation expectations match `DashboardLayout`.
5. **Dead code removal** — unused UI components and API helper.
6. **`service_requests` report type** in frontend labels.
7. **`npm run test:e2e`** script in root `package.json`.

---

## Remaining Recommendations (optional)

1. **Admin user management** — CRUD on auth users (deactivate, reset role) if required.
2. **OpenAPI** — generate from Zod schemas or hand-maintain per service.
3. **Asset edit UI** — PATCH exists; add form on AssetsPage.
4. **JWT logout denylist** — optional refresh tokens / revoke.
5. **Unit tests** — auth service, order totals, compliance mappers.
6. **Gateway exposure** — `/api/templates` if template admin UI is needed.
7. **Technician list API** — for assign dropdown instead of UUID input.

---

## Verification Commands

```powershell
npm run build -w @TWZ LTD/shared
npm run build
npm run test:e2e   # requires stack on :5173 and :4000, seeded DB, LOGIN_REQUIRES_OTP=false
```

---

## Current Status Verification

This audit reflects the repository **after** the completion pass described above. The system is a **production-oriented microservice TWZ LTD** with ecommerce and compliance features; it satisfies the **spirit** of the checklist through assets, service requests, reporting, and notifications, while differing in role names and service boundaries from the generic template.
