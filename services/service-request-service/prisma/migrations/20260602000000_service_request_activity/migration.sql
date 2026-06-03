CREATE TABLE "service_request_activities" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT,
    "oldStatus" "ServiceRequestStatus",
    "newStatus" "ServiceRequestStatus",
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_request_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "service_request_activities_serviceRequestId_idx" ON "service_request_activities"("serviceRequestId");
CREATE INDEX "service_request_activities_createdAt_idx" ON "service_request_activities"("createdAt");

ALTER TABLE "service_request_activities" ADD CONSTRAINT "service_request_activities_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
