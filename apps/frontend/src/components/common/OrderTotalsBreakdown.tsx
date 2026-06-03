import { calculateOrderTotals, formatCurrency } from '@/lib/utils';

interface OrderTotalsBreakdownProps {
  subtotal: number;
  className?: string;
}

export function OrderTotalsBreakdown({ subtotal, className }: OrderTotalsBreakdownProps) {
  const { taxAmount, taxRate, totalAmount } = calculateOrderTotals(subtotal);

  return (
    <div className={className}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      <div className="mt-2 flex justify-between text-sm">
        <span className="text-muted-foreground">VAT ({taxRate}%)</span>
        <span>{formatCurrency(taxAmount)}</span>
      </div>
      <div className="mt-3 flex justify-between border-t pt-3 text-lg font-bold">
        <span>Total</span>
        <span>{formatCurrency(totalAmount)}</span>
      </div>
    </div>
  );
}
