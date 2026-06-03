# FEMS ERD Diagrams

This repository uses microservices, so each service owns its own database schema.
The ERDs below are grouped by service to reflect the actual data boundaries.

## Auth Service

```mermaid
erDiagram
  USER {
    string id PK
    string email UK
    string googleId UK
    string passwordHash
    string firstName
    string lastName
    string phoneNumber
    boolean isEmailVerified
    boolean isActive
    string customerId
    datetime lastLoginAt
    datetime createdAt
    datetime updatedAt
  }

  ROLE {
    string id PK
    string name UK
    string description
    datetime createdAt
    datetime updatedAt
  }

  USER_ROLE {
    string userId PK, FK
    string roleId PK, FK
    datetime assignedAt
  }

  OTP {
    string id PK
    string userId FK
    string destination
    string codeHash
    string purpose
    datetime expiresAt
    datetime verifiedAt
    int attempts
    datetime createdAt
  }

  PASSWORD_RESET_TOKEN {
    string id PK
    string userId FK
    string tokenHash UK
    datetime expiresAt
    datetime usedAt
    datetime createdAt
  }

  AUTH_AUDIT_LOG {
    string id PK
    string userId FK
    string action
    string ipAddress
    string userAgent
    json metadata
    datetime createdAt
  }

  USER ||--o{ USER_ROLE : has
  ROLE ||--o{ USER_ROLE : assigns
  USER ||--o{ OTP : receives
  USER ||--o{ PASSWORD_RESET_TOKEN : owns
  USER ||--o{ AUTH_AUDIT_LOG : generates
```

## Asset Service

```mermaid
erDiagram
  FIRE_EXTINGUISHER_ASSET {
    string id PK
    string assetCode UK
    string customerId
    string serialNumber UK
    string location
    string type
    string size
    datetime installationDate
    datetime expirationDate
    datetime serviceDate
    datetime nextServiceDate
    datetime refillBookedAt
    string status
    string notes
    datetime createdAt
    datetime updatedAt
  }

  ASSET_HISTORY {
    string id PK
    string assetId FK
    string eventType
    string description
    string oldStatus
    string newStatus
    json metadata
    string createdBy
    datetime createdAt
  }

  ASSET_SERVICE_RECORD {
    string id PK
    string assetId FK
    string serviceType
    datetime serviceDate
    string technicianId
    string technicianName
    string notes
    datetime nextServiceDate
    datetime createdAt
    datetime updatedAt
  }

  FIRE_EXTINGUISHER_ASSET ||--o{ ASSET_HISTORY : logs
  FIRE_EXTINGUISHER_ASSET ||--o{ ASSET_SERVICE_RECORD : records
```

## Service Request Service

```mermaid
erDiagram
  SERVICE_REQUEST {
    string id PK
    string requestNumber UK
    string customerId
    string assetId
    string requestedByUserId
    string type
    string status
    string description
    datetime scheduledDate
    string priority
    datetime createdAt
    datetime updatedAt
  }

  TECHNICIAN_ASSIGNMENT {
    string id PK
    string serviceRequestId FK, UK
    string technicianId
    string technicianName
    string assignedBy
    datetime assignedAt
    string notes
  }

  SERVICE_NOTE {
    string id PK
    string serviceRequestId FK
    string content
    string createdBy
    string authorRole
    datetime createdAt
  }

  SERVICE_REQUEST_ACTIVITY {
    string id PK
    string serviceRequestId FK
    string eventType
    string description
    string actorId
    string actorRole
    string oldStatus
    string newStatus
    json metadata
    datetime createdAt
  }

  SERVICE_COMPLETION {
    string id PK
    string serviceRequestId FK, UK
    string technicianId
    datetime completedAt
    string summary
    string workPerformed
    string partsUsed
    datetime nextServiceDate
    datetime nextExpirationDate
  }

  SERVICE_REQUEST ||--o| TECHNICIAN_ASSIGNMENT : assignment
  SERVICE_REQUEST ||--o{ SERVICE_NOTE : notes
  SERVICE_REQUEST ||--o{ SERVICE_REQUEST_ACTIVITY : activities
  SERVICE_REQUEST ||--o| SERVICE_COMPLETION : completion
```

## Notification Service

```mermaid
erDiagram
  NOTIFICATION_TEMPLATE {
    string id PK
    string code UK
    string name
    string channel
    string subject
    string body
    string htmlBody
    string eventType
    boolean isActive
    datetime createdAt
    datetime updatedAt
  }

  NOTIFICATION {
    string id PK
    string userId
    string customerId
    string recipientEmail
    string recipientPhone
    string channel
    string category
    string subject
    string body
    string status
    string eventType
    json eventPayload
    string templateId FK
    datetime seenAt
    datetime acknowledgedAt
    datetime sentAt
    datetime failedAt
    string failureReason
    int resendCount
    json metadata
    datetime createdAt
    datetime updatedAt
  }

  NOTIFICATION_LOG {
    string id PK
    string notificationId FK
    string action
    string channel
    string detail
    json metadata
    datetime createdAt
  }

  EXPIRY_ALERT_TRACKER {
    string id PK
    string assetId UK
    string assetCode
    string customerId
    string userId
    datetime expirationDate
    datetime customerSeenAt
    datetime refillBookedAt
    datetime alertsResolvedAt
    datetime lastReminderSentAt
    boolean policeReportSent
    boolean alert30Sent
    boolean alert7Sent
    boolean alertOnExpirySent
    boolean alertOverdueSent
    datetime createdAt
    datetime updatedAt
  }

  NOTIFICATION_TEMPLATE ||--o{ NOTIFICATION : templates
  NOTIFICATION ||--o{ NOTIFICATION_LOG : logs
```

## Reporting Service

```mermaid
erDiagram
  GENERATED_REPORT {
    string id PK
    string reportType
    string title
    string status
    int rowCount
    json summary
    json dataSnapshot
    string generatedBy
    string errorMessage
    datetime createdAt
    datetime updatedAt
  }

  REPORT_FILTER {
    string id PK
    string generatedReportId FK, UK
    datetime dateFrom
    datetime dateTo
    string customerId
    string productType
    string status
    string technicianId
    string paymentStatus
    datetime createdAt
  }

  REPORT_EXPORT {
    string id PK
    string generatedReportId FK
    string format
    string filePath
    string fileName
    int fileSize
    string mimeType
    datetime createdAt
  }

  GENERATED_REPORT ||--o| REPORT_FILTER : filter
  GENERATED_REPORT ||--o{ REPORT_EXPORT : exports
```

## Logical Cross-Service Map

These relationships are application-level references between separate databases, not direct Prisma foreign keys.

```mermaid
flowchart LR
  U[Auth Service<br/>User]
  A[Asset Service<br/>FireExtinguisherAsset]
  H[Asset Service<br/>AssetHistory]
  S[Asset Service<br/>AssetServiceRecord]
  SR[Service Request Service<br/>ServiceRequest]
  SA[Service Request Service<br/>TechnicianAssignment]
  SN[Service Request Service<br/>ServiceNote]
  SC[Service Request Service<br/>ServiceCompletion]
  ACT[Service Request Service<br/>ServiceRequestActivity]
  N[Notification Service<br/>Notification]
  T[Notification Service<br/>NotificationTemplate]
  X[Notification Service<br/>ExpiryAlertTracker]
  G[Reporting Service<br/>GeneratedReport]

  U -->|customerId / userId ownership| A
  U -->|requestedByUserId| SR
  U -->|technicianId| SA
  U -->|userId / customerId| N
  U -->|generatedBy| G

  A -->|assetId| SR
  A -->|assetId| X
  A -->|service completion sync| S
  A -->|lifecycle changes| H

  SR -->|assignment| SA
  SR -->|notes| SN
  SR -->|completion| SC
  SR -->|audit trail| ACT
  SR -->|event-driven notifications| N

  T -->|template-based delivery| N
```
