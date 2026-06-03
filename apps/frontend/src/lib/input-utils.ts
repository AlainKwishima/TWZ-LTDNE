/** Keep only digit characters, optionally capped. */
export function digitsOnly(value: string, maxLength?: number): string {
  let result = value.replace(/\D/g, '');
  if (maxLength !== undefined) {
    result = result.slice(0, maxLength);
  }
  return result;
}

/** Allow digits and a single decimal point (for money inputs). */
export function decimalOnly(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [whole, ...fraction] = cleaned.split('.');
  if (fraction.length === 0) {
    return whole ?? '';
  }
  return `${whole}.${fraction.join('')}`;
}

/** Phone: digits and a leading + only. */
export function phoneOnly(value: string): string {
  const trimmed = value.trimStart();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

export function parseCapacityKg(capacity?: string | null): string {
  if (!capacity) return '';
  const match = capacity.match(/^(\d+(?:\.\d+)?)/);
  return match?.[1] ?? '';
}

export function formatCapacityKg(kg: string): string {
  const normalized = kg.trim();
  if (!normalized) return '';
  return `${normalized}kg`;
}

export const PHONE_PATTERN = /^\+?\d{7,15}$/;

export function isValidPhone(value: string | undefined): boolean {
  if (!value) return true;
  return PHONE_PATTERN.test(value);
}
