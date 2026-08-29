import { config } from '../config';
import type { Currency, BudgetData } from '../types';

/**
 * Currencies are not hardcoded — whatever ISO codes appear in the Currency
 * column of your workbook are the currencies this app knows about. These
 * helpers derive symbols, labels and colours from the code itself, so adding
 * a fourth or fifth currency needs no code change.
 */

const symbolCache = new Map<string, string>();

/** '€' for EUR, 'zł' for PLN, 'CHF' for CHF. Falls back to the code itself. */
export function currencySymbol(code: Currency): string {
  const cached = symbolCache.get(code);
  if (cached !== undefined) return cached;

  let symbol = code;
  try {
    const parts = new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);
    symbol = parts.find((p) => p.type === 'currency')?.value ?? code;
  } catch {
    // Not a valid ISO 4217 code — show it verbatim.
  }

  symbolCache.set(code, symbol);
  return symbol;
}

export function formatAmount(amount: number, currency: Currency): string {
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Unknown currency code: format the number and append the code.
    const n = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${n} ${currency}`;
  }
}

// Cached per workbook: this is called once per currency badge, and a table
// can render one badge per transaction row.
const currencyListCache = new WeakMap<BudgetData, Currency[]>();

/**
 * Every currency present in the workbook, in the order it first appears —
 * so the toggle follows the order you keep your own accounts in.
 */
export function listCurrencies(data: BudgetData | null): Currency[] {
  if (!data) return [];
  const cached = currencyListCache.get(data);
  if (cached) return cached;

  const seen: Currency[] = [];
  const add = (c: Currency) => {
    if (c && !seen.includes(c)) seen.push(c);
  };
  for (const t of data.transactions) add(t.currency);
  for (const a of data.accounts) add(a.currency);

  currencyListCache.set(data, seen);
  return seen;
}

/**
 * A stable slot (0, 1, 2 …) for a currency, used to pick its accent colour.
 * Position in the workbook decides it, so the same currency keeps the same
 * colour for the life of the file.
 */
export function currencyIndex(code: Currency, all: Currency[]): number {
  const i = all.indexOf(code);
  return i >= 0 ? i : 0;
}
