import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function LoadingState({ message = 'Loading...', className }: { message?: string; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 text-slate-500 shadow-sm',
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function EmptyState({
  title = 'No data found',
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
      <p className="font-display text-lg font-bold text-slate-900">{title}</p>
      {description && <p className="max-w-sm text-sm font-medium text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/30 py-16 text-center">
      <p className="font-display text-lg font-bold text-rose-700">Something went wrong</p>
      <p className="max-w-md text-sm font-medium text-slate-600">{message}</p>
      {onRetry && (
        <Button variant="azure" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
