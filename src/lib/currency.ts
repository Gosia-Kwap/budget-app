import type { Currency, ExchangeRates } from '../types';

export const DEFAULT_RATES: ExchangeRates = {
  CHF: 1,
  EUR: 1.05,
  PLN: 0.23,
};

export function convertAmount(
  amount: number,
  from: Currency,
  to: Currency,
  rates: ExchangeRates
): number {
  if (from === to) return amount;
  const inChf = amount / rates[from];
  return inChf * rates[to];
}

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
