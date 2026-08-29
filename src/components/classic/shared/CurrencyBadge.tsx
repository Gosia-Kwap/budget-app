import { useMemo } from 'react';
import type { Currency } from '../../../types';
import { listCurrencies, currencyIndex } from '../../../lib/currency';
import { useBudget } from '../../../context/BudgetContext';

// Assigned by the currency's position in the workbook rather than by name,
// so any set of currencies gets distinct colours.
const COLORS = [
  'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
];

export function CurrencyBadge({ currency }: { currency: Currency }) {
  const { data } = useBudget();
  const all = useMemo(() => listCurrencies(data), [data]);
  const color = COLORS[currencyIndex(currency, all) % COLORS.length];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {currency}
    </span>
  );
}
