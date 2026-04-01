import type { Currency } from '../../types';

const colorMap: Record<Currency, string> = {
  CHF: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  EUR: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  PLN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export function CurrencyBadge({ currency }: { currency: Currency }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorMap[currency]}`}>
      {currency}
    </span>
  );
}
