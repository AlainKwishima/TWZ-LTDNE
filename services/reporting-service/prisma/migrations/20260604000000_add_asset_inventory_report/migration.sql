-- Add asset inventory report type for extinguisher totals and exports
ALTER TYPE "ReportType" ADD VALUE IF NOT EXISTS 'asset_inventory';
