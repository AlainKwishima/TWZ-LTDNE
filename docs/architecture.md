# FEMS System Architecture (TWZ LTD)

Fire Extinguisher Management System — technical architecture as implemented in this repository.

## High-level architecture

```mermaid
flowchart TB
  subgraph clients["Clients"]
    Browser["Web browser"]
    Swagger["Swagger UI :4000/api-docs"]
  end

  subgraph presentation["Presentation layer"]
    FE["React frontend\n(Vite + nginx)\n:5173"]
  end

  subgraph edge["Edge layer"]
    GW["API Gateway\n:4000\nJWT + RBAC proxy"]
  end

  subgraph services["Microservices (Express + Prisma)"]
    AUTH["Auth service\n:4001"]
    ASSET["Asset service\n:4005"]
    SR["Service request service\n:4006"]
    NOTIF["Notification service\n:4007"]
    RPT["Reporting service\n:4008"]
  end

  subgraph shared["Shared library"]
    PKG["@fems/shared\nJWT, events, Swagger, Brevo client"]
  end

  subgraph data["Data & messaging"]
    PG[("PostgreSQL :5433\n5 databases")]
    RMQ["RabbitMQ :5672\nEvent bus"]
    EXPORTS[("Report files\nvolume")]
  end

  subgraph external["External"]
    BREVO["Brevo API\nEmail / OTP"]
    GOOGLE["Google OAuth"]
  end

  Browser --> FE
  Browser --> Swagger
  FE -->|"HTTPS REST /api/*"| GW
  Swagger --> GW

  GW --> AUTH
  GW --> ASSET
  GW --> SR
  GW --> NOTIF
  GW --> RPT

  AUTH --> PG
  ASSET --> PG
  SR --> PG
  NOTIF --> PG
  RPT --> PG

  AUTH --> RMQ
  ASSET --> RMQ
  SR --> RMQ
  NOTIF --> RMQ
  RPT --> RMQ

  AUTH --> BREVO
  NOTIF --> BREVO
  AUTH --> GOOGLE

  SR -->|"HTTP: asset records"| ASSET
  NOTIF -->|"HTTP: expiry / maintenance"| ASSET
  NOTIF -->|"HTTP: request events"| SR
  RPT -->|"HTTP: aggregate data"| AUTH
  RPT --> ASSET
  RPT --> SR
  RPT --> NOTIF
  RPT --> EXPORTS

  AUTH -.-> PKG
  ASSET -.-> PKG
  SR -.-> PKG
  NOTIF -.-> PKG
  RPT -.-> PKG
  GW -.-> PKG
  FE -.-> PKG
```

## API gateway routing

```mermaid
flowchart LR
  FE["Frontend"] --> GW["API Gateway :4000"]

  GW --> A1["/api/auth/*"]
  GW --> A2["/api/assets/*"]
  GW --> A3["/api/services/*"]
  GW --> A4["/api/notifications/*"]
  GW --> A5["/api/reports/*"]
  GW --> A6["/api/analytics/*"]

  A1 --> AUTH["Auth :4001"]
  A2 --> ASSET["Asset :4005"]
  A3 --> SR["Service request :4006"]
  A4 --> NOTIF["Notification :4007"]
  A5 --> RPT["Reporting :4008"]
  A6 --> RPT
```

## Databases (database-per-service)

```mermaid
flowchart TB
  PG[("PostgreSQL host :5433")]

  PG --> DB1["auth_service_db\nUsers, roles, OTP, audit"]
  PG --> DB2["asset_service_db\nFire extinguishers, history, service records"]
  PG --> DB3["service_request_service_db\nMaintenance requests, activity log"]
  PG --> DB4["notification_service_db\nNotifications, templates, expiry trackers"]
  PG --> DB5["reporting_service_db\nGenerated reports, exports metadata"]

  AUTH["Auth"] --> DB1
  ASSET["Asset"] --> DB2
  SR["Service request"] --> DB3
  NOTIF["Notification"] --> DB4
  RPT["Reporting"] --> DB5
```

## Roles and main flows

```mermaid
flowchart TB
  subgraph roles["RBAC roles"]
    Admin["Admin"]
    Inspector["Inspector"]
    User["User / portal customer"]
  end

  subgraph admin_flow["Admin"]
    A1["Manage users"]
    A2["Register / remove assets"]
    A3["Assign inspectors to requests"]
    A4["Reports & analytics dashboard"]
  end

  subgraph inspector_flow["Inspector"]
    I1["View assets"]
    I2["Assigned maintenance requests"]
    I3["Complete inspections"]
    I4["Field reports"]
  end

  subgraph user_flow["Portal user"]
    U1["My extinguishers"]
    U2["Request maintenance"]
    U3["Book refill / notifications"]
    U4["Personal reports"]
  end

  Admin --> A1 & A2 & A3 & A4
  Inspector --> I1 & I2 & I3 & I4
  User --> U1 & U2 & U3 & U4

  GW["API Gateway"] --> roles
```

## Event-driven integration (RabbitMQ)

```mermaid
sequenceDiagram
  participant ASSET as Asset service
  participant RMQ as RabbitMQ
  participant NOTIF as Notification service
  participant RPT as Reporting service
  participant AUTH as Auth service

  ASSET->>RMQ: AssetCreated / ExpiringSoon / Expired
  RMQ->>NOTIF: Consume asset events
  NOTIF->>NOTIF: Email + in-app alerts

  SR->>RMQ: ServiceRequested / Completed / TechnicianAssigned
  RMQ->>NOTIF: Notify user & inspector
  RMQ->>RPT: Invalidate analytics cache

  AUTH->>RMQ: UserRegistered
  RMQ->>RPT: Refresh dashboard metrics
```

## Component summary

| Layer | Component | Port | Responsibility |
|--------|-----------|------|----------------|
| UI | React frontend | 5173 | Admin, Inspector, User portals |
| Edge | API gateway | 4000 | Single API, JWT, role guards, Swagger |
| Service | Auth | 4001 | Signup/login, OTP, users, JWT |
| Service | Asset | 4005 | Extinguisher CRUD, expiry cron, serial numbers |
| Service | Service request | 4006 | Maintenance workflow, assignment, audit trail |
| Service | Notification | 4007 | Email (Brevo), in-app, expiry/compliance crons |
| Service | Reporting | 4008 | KPIs, report generation, PDF/CSV/XLSX export |
| Data | PostgreSQL | 5433 | 5 isolated service databases |
| Messaging | RabbitMQ | 5672 / 15672 | Async domain events |
| External | Brevo | — | Transactional email |
| Shared | `@fems/shared` | — | Types, middleware, events, OpenAPI helpers |

## Design principles

1. **Database per service** — No cross-DB foreign keys; links use UUIDs (`userId`, `customerId`, `assetId`).
2. **Gateway as single public API** — Frontend only talks to `:4000/api`.
3. **Sync HTTP for reads/writes** — Reporting and notifications call other services with forwarded user headers.
4. **Async events for side effects** — Expiry alerts, cache invalidation, and notifications via RabbitMQ.
5. **Portal scope** — Portal users are scoped by `customerId` (typically their own `userId`).

## Related documentation

- [ENVIRONMENT.md](./ENVIRONMENT.md) — Environment variables and service URLs
- [API_DOCS.md](./API_DOCS.md) — Swagger UI and OpenAPI
- [AUDIT.md](./AUDIT.md) — Implementation audit and gaps
