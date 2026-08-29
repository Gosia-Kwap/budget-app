import { config } from '../config';

const ROMAN: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

export function toRoman(n: number): string {
  if (n <= 0) return '—';
  let out = '';
  for (const [v, s] of ROMAN) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out;
}

/** A date, formatted in the configured locale. */
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString(config.locale, options);
}

/** "Nov 2025" — used as the key and label for monthly buckets. */
export function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString(config.locale, { month: 'short', year: 'numeric' });
}

/** "12 nov" — the short day/month form used in tables and axes. */
export function formatDayMonth(date: Date): string {
  return date.toLocaleDateString(config.locale, { day: '2-digit', month: 'short' });
}

/** A bare number, no currency, in the configured locale. */
export function formatNumber(n: number, options?: Intl.NumberFormatOptions): string {
  return n.toLocaleString(config.locale, options);
}
