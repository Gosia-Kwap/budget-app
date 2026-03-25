import type { Currency } from '../types';

export function formatAmount(amount: number, currency: Currency): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  CHF: 'CHF',
  EUR: '€',
  PLN: 'zł',
};
