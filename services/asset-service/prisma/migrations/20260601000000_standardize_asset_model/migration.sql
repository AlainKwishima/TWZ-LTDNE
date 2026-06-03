-- Standardize fire extinguisher asset fields
ALTER TABLE "fire_extinguisher_assets" ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE "fire_extinguisher_assets" ADD COLUMN IF NOT EXISTS "size" TEXT;
ALTER TABLE "fire_extinguisher_assets" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "fire_extinguisher_assets" ADD COLUMN IF NOT EXISTS "installationDate" TIMESTAMP(3);

UPDATE "fire_extinguisher_assets"
SET
  "type" = COALESCE("type", "productName", 'Dry Powder ABC'),
  "size" = COALESCE("size", "productId", 'Standard'),
  "location" = COALESCE("location", "installationLocation"),
  "installationDate" = COALESCE("installationDate", "purchaseDate", "createdAt"),
  "serialNumber" = COALESCE("serialNumber", "assetCode")
WHERE "type" IS NULL OR "size" IS NULL OR "installationDate" IS NULL OR "serialNumber" IS NULL;

ALTER TABLE "fire_extinguisher_assets" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE "fire_extinguisher_assets" ALTER COLUMN "size" SET NOT NULL;
ALTER TABLE "fire_extinguisher_assets" ALTER COLUMN "installationDate" SET NOT NULL;
ALTER TABLE "fire_extinguisher_assets" ALTER COLUMN "serialNumber" SET NOT NULL;

ALTER TABLE "fire_extinguisher_assets" DROP COLUMN IF EXISTS "productId";
ALTER TABLE "fire_extinguisher_assets" DROP COLUMN IF EXISTS "productName";
ALTER TABLE "fire_extinguisher_assets" DROP COLUMN IF EXISTS "installationLocation";
ALTER TABLE "fire_extinguisher_assets" DROP COLUMN IF EXISTS "purchaseDate";
ALTER TABLE "fire_extinguisher_assets" DROP COLUMN IF EXISTS "orderId";
ALTER TABLE "fire_extinguisher_assets" DROP COLUMN IF EXISTS "invoiceId";

DROP INDEX IF EXISTS "fire_extinguisher_assets_productId_idx";

CREATE INDEX IF NOT EXISTS "fire_extinguisher_assets_type_idx" ON "fire_extinguisher_assets"("type");
