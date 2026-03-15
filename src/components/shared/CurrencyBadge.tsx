import type { Currency } from '../../types';

const colorMap: Record<Currency, string> = {
  CHF: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  EUR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PLN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export function CurrencyBadge({ currency }: { currency: Currency }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorMap[currency]}`}>
      {currency}
    </span>
  );
}
