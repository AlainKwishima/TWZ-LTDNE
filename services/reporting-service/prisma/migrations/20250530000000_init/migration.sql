-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('sales', 'customers', 'inventory', 'low_stock', 'expired_assets', 'expiring_soon', 'service_requests', 'notifications', 'invoices', 'escalations');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('pdf', 'csv', 'xlsx');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateTable
CREATE TABLE "generated_reports" (
    "id" TEXT NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "summary" JSONB,
    "dataSnapshot" JSONB,
    "generatedBy" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_filters" (
    "id" TEXT NOT NULL,
    "generatedReportId" TEXT NOT NULL,
    "dateFrom" TIMESTAMP(3),
    "dateTo" TIMESTAMP(3),
    "customerId" TEXT,
    "productType" TEXT,
    "status" TEXT,
    "technicianId" TEXT,
    "paymentStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_filters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_exports" (
    "id" TEXT NOT NULL,
    "generatedReportId" TEXT NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_exports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "generated_reports_reportType_idx" ON "generated_reports"("reportType");

-- CreateIndex
CREATE INDEX "generated_reports_status_idx" ON "generated_reports"("status");

-- CreateIndex
CREATE INDEX "generated_reports_createdAt_idx" ON "generated_reports"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "report_filters_generatedReportId_key" ON "report_filters"("generatedReportId");

-- CreateIndex
CREATE INDEX "report_filters_customerId_idx" ON "report_filters"("customerId");

-- CreateIndex
CREATE INDEX "report_filters_productType_idx" ON "report_filters"("productType");

-- CreateIndex
CREATE INDEX "report_filters_status_idx" ON "report_filters"("status");

-- CreateIndex
CREATE INDEX "report_exports_generatedReportId_idx" ON "report_exports"("generatedReportId");

-- CreateIndex
CREATE INDEX "report_exports_format_idx" ON "report_exports"("format");

-- AddForeignKey
ALTER TABLE "report_filters" ADD CONSTRAINT "report_filters_generatedReportId_fkey" FOREIGN KEY ("generatedReportId") REFERENCES "generated_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_generatedReportId_fkey" FOREIGN KEY ("generatedReportId") REFERENCES "generated_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
