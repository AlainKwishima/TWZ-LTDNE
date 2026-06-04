-- Audit action when an administrator assigns the Inspector role
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'INSPECTOR_ROLE_ASSIGNED';
