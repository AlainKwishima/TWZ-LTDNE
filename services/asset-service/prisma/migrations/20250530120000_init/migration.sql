-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('Active', 'ExpiringSoon', 'Expired', 'Serviced', 'NeedsReplacement', 'HighRisk');

-- CreateTable
CREATE TABLE "fire_extinguisher_assets" (
    "id" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT,
    "orderId" TEXT,
    "invoiceId" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "installationLocation" TEXT,
    "serviceDate" TIMESTAMP(3),
    "nextServiceDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'Active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fire_extinguisher_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_histories" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "oldStatus" "AssetStatus",
    "newStatus" "AssetStatus",
    "metadata" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_service_records" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "technicianId" TEXT,
    "technicianName" TEXT,
    "notes" TEXT,
    "nextServiceDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_service_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fire_extinguisher_assets_assetCode_key" ON "fire_extinguisher_assets"("assetCode");

-- CreateIndex
CREATE UNIQUE INDEX "fire_extinguisher_assets_serialNumber_key" ON "fire_extinguisher_assets"("serialNumber");

-- CreateIndex
CREATE INDEX "fire_extinguisher_assets_customerId_idx" ON "fire_extinguisher_assets"("customerId");

-- CreateIndex
CREATE INDEX "fire_extinguisher_assets_productId_idx" ON "fire_extinguisher_assets"("productId");

-- CreateIndex
CREATE INDEX "fire_extinguisher_assets_orderId_idx" ON "fire_extinguisher_assets"("orderId");

-- CreateIndex
CREATE INDEX "fire_extinguisher_assets_status_idx" ON "fire_extinguisher_assets"("status");

-- CreateIndex
CREATE INDEX "fire_extinguisher_assets_expirationDate_idx" ON "fire_extinguisher_assets"("expirationDate");

-- CreateIndex
CREATE INDEX "fire_extinguisher_assets_serialNumber_idx" ON "fire_extinguisher_assets"("serialNumber");

-- CreateIndex
CREATE INDEX "asset_histories_assetId_idx" ON "asset_histories"("assetId");

-- CreateIndex
CREATE INDEX "asset_histories_createdAt_idx" ON "asset_histories"("createdAt");

-- CreateIndex
CREATE INDEX "asset_service_records_assetId_idx" ON "asset_service_records"("assetId");

-- CreateIndex
CREATE INDEX "asset_service_records_serviceDate_idx" ON "asset_service_records"("serviceDate");

-- AddForeignKey
ALTER TABLE "asset_histories" ADD CONSTRAINT "asset_histories_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fire_extinguisher_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_service_records" ADD CONSTRAINT "asset_service_records_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fire_extinguisher_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
