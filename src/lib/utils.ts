import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function generateQuoteNumber(lastNumber: string | undefined): string {
  if (!lastNumber) return 'QT-0001';
  const numPart = parseInt(lastNumber.replace('QT-', ''), 10);
  const nextNum = (numPart + 1).toString().padStart(4, '0');
  return `QT-${nextNum}`;
}
