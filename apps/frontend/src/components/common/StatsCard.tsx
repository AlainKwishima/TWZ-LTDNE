import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  badge?: string;
  accent?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
  className?: string;
}

const accentStyles = {
  blue: {
    value: 'text-blue-600',
    icon: 'bg-blue-50 text-blue-600 border-blue-100',
    badge: 'text-blue-600 bg-blue-50 border-blue-100',
  },
  emerald: {
    value: 'text-emerald-700',
    icon: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    badge: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  },
  amber: {
    value: 'text-amber-700',
    icon: 'bg-amber-50 text-amber-600 border-amber-100',
    badge: 'text-amber-700 bg-amber-50 border-amber-100',
  },
  rose: {
    value: 'text-rose-700',
    icon: 'bg-rose-50 text-rose-600 border-rose-100',
    badge: 'text-rose-700 bg-rose-50 border-rose-100',
  },
  slate: {
    value: 'text-slate-900',
    icon: 'bg-slate-100 text-slate-600 border-slate-200',
    badge: 'text-slate-600 bg-slate-100 border-slate-200',
  },
};

export function StatsCard({ label, value, icon: Icon, badge, accent = 'blue', className }: StatsCardProps) {
  const styles = accentStyles[accent];

  return (
    <div
      className={cn(
        'relative flex h-32 flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 ease-in-out hover:border-slate-300 hover:shadow-md',
        className
      )}
    >
      <div className="absolute bottom-0 left-0 top-0 w-1 bg-blue-600 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <h3 className={cn('mt-1 font-display text-2xl font-extrabold', styles.value)}>{value}</h3>
        </div>
        <div className={cn('rounded-lg border p-2', styles.icon)}>
          <Icon className="h-4 w-4" aria-hidden />
        </div>
      </div>
      {badge && (
        <span
          className={cn(
            'self-start rounded-md border px-1.5 py-0.5 text-[9px] font-bold',
            styles.badge
          )}
        >
          {badge}
        </span>
      )}
    </div>
  );
}
