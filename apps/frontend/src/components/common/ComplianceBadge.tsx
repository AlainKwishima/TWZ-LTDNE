import { AlertTriangle, Bell, ShieldCheck, ShieldX, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ComplianceStatus = 'compliant' | 'expiring' | 'expired' | 'notification';

const statusConfig: Record<
  ComplianceStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  compliant: {
    label: 'Compliant',
    icon: ShieldCheck,
    className: 'bg-emerald-50/70 text-emerald-700 border-emerald-200',
  },
  expiring: {
    label: 'Expiring Soon',
    icon: AlertTriangle,
    className: 'bg-amber-50/70 text-amber-700 border-amber-200',
  },
  expired: {
    label: 'Expired',
    icon: ShieldX,
    className: 'bg-rose-50/70 text-rose-700 border-rose-200',
  },
  notification: {
    label: 'Notified',
    icon: Bell,
    className: 'bg-blue-50/70 text-blue-700 border-blue-200',
  },
};

interface ComplianceBadgeProps {
  status: ComplianceStatus;
  label?: string;
  className?: string;
}

export function ComplianceBadge({ status, label, className }: ComplianceBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold',
        config.className,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label ?? config.label}
    </span>
  );
}

export function mapAssetStatusToCompliance(status?: string): ComplianceStatus {
  const normalized = status?.toLowerCase() ?? '';
  if (normalized.includes('expir') && !normalized.includes('soon')) return 'expired';
  if (normalized.includes('soon') || normalized.includes('warning')) return 'expiring';
  if (normalized.includes('notif')) return 'notification';
  if (normalized.includes('active') || normalized.includes('compliant') || normalized.includes('valid')) {
    return 'compliant';
  }
  return 'compliant';
}
