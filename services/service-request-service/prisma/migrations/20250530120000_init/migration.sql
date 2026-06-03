-- CreateEnum
CREATE TYPE "ServiceRequestType" AS ENUM ('Refill', 'Inspection', 'Replacement', 'TechnicianVisit');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('Pending', 'Assigned', 'InProgress', 'Completed', 'Cancelled');

-- CreateTable
CREATE TABLE "service_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "requestedByUserId" TEXT,
    "type" "ServiceRequestType" NOT NULL,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'Pending',
    "description" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technician_assignments" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "technicianName" TEXT,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "technician_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_notes" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" TEXT,
    "authorRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_completions" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT NOT NULL,
    "workPerformed" TEXT,
    "partsUsed" TEXT,
    "nextServiceDate" TIMESTAMP(3),
    "nextExpirationDate" TIMESTAMP(3),

    CONSTRAINT "service_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_requests_requestNumber_key" ON "service_requests"("requestNumber");

-- CreateIndex
CREATE INDEX "service_requests_customerId_idx" ON "service_requests"("customerId");

-- CreateIndex
CREATE INDEX "service_requests_assetId_idx" ON "service_requests"("assetId");

-- CreateIndex
CREATE INDEX "service_requests_status_idx" ON "service_requests"("status");

-- CreateIndex
CREATE INDEX "service_requests_type_idx" ON "service_requests"("type");

-- CreateIndex
CREATE INDEX "service_requests_createdAt_idx" ON "service_requests"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "technician_assignments_serviceRequestId_key" ON "technician_assignments"("serviceRequestId");

-- CreateIndex
CREATE INDEX "technician_assignments_technicianId_idx" ON "technician_assignments"("technicianId");

-- CreateIndex
CREATE INDEX "service_notes_serviceRequestId_idx" ON "service_notes"("serviceRequestId");

-- CreateIndex
CREATE INDEX "service_notes_createdAt_idx" ON "service_notes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "service_completions_serviceRequestId_key" ON "service_completions"("serviceRequestId");

-- CreateIndex
CREATE INDEX "service_completions_technicianId_idx" ON "service_completions"("technicianId");

-- CreateIndex
CREATE INDEX "service_completions_completedAt_idx" ON "service_completions"("completedAt");

-- AddForeignKey
ALTER TABLE "technician_assignments" ADD CONSTRAINT "technician_assignments_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_notes" ADD CONSTRAINT "service_notes_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_completions" ADD CONSTRAINT "service_completions_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
