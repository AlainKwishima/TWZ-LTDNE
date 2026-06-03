import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Default tax rate display helper (percent). */
export const TAX_RATE = Number(import.meta.env.VITE_TAX_RATE ?? 16);

export function formatCurrency(amount: number): string {
  const value = new Intl.NumberFormat('en-RW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
  return `RWF ${value}`;
}

/** Same calculation as checkout.service.ts so cart/checkout match order totals. */
export function calculateOrderTotals(subtotal: number) {
  const taxAmount = Math.round(subtotal * (TAX_RATE / 100) * 100) / 100;
  const totalAmount = subtotal + taxAmount;
  return { subtotal, taxAmount, taxRate: TAX_RATE, totalAmount };
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message ?? 'Something went wrong';
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
