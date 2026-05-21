import type { Currency, Transaction } from '../../../types';
import type { CategoryTotal } from '../../../lib/transforms';
import { formatAmount } from '../../../lib/currency';
import { CurrencyBadge } from '../shared/CurrencyBadge';

interface Props {
  perCurrency: Map<Currency, { transactions: Transaction[]; categories: CategoryTotal[] }>;
}

export function CurrencyComparisonTable({ perCurrency }: Props) {
  const currencies = Array.from(perCurrency.keys());

  // Collect all categories across currencies
  const allCategories = new Set<string>();
  for (const { categories } of perCurrency.values()) {
    for (const cat of categories) {
      allCategories.add(cat.category);
    }
  }

  // Build lookup: category → currency → total
  const lookup = new Map<string, Map<Currency, number>>();
  for (const [currency, { categories }] of perCurrency) {
    for (const cat of categories) {
      if (!lookup.has(cat.category)) lookup.set(cat.category, new Map());
      lookup.get(cat.category)!.set(currency, cat.total);
    }
  }

  // Sort categories by total across all currencies
  const sortedCategories = Array.from(allCategories).sort((a, b) => {
    const totalA = currencies.reduce((s, c) => s + (lookup.get(a)?.get(c) ?? 0), 0);
    const totalB = currencies.reduce((s, c) => s + (lookup.get(b)?.get(c) ?? 0), 0);
    return totalB - totalA;
  });

  // Totals per currency
  const totals = new Map<Currency, number>();
  for (const [currency, { categories }] of perCurrency) {
    totals.set(currency, categories.reduce((s, c) => s + c.total, 0));
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
        Spending by Currency
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">
                Category
              </th>
              {currencies.map((c) => (
                <th key={c} className="text-right py-2 px-4 font-medium">
                  <CurrencyBadge currency={c} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedCategories.map((cat) => (
              <tr
                key={cat}
                className="border-b border-gray-100 dark:border-gray-800"
              >
                <td className="py-2 pr-4 text-gray-800 dark:text-gray-200 font-medium">
                  {cat}
                </td>
                {currencies.map((c) => {
                  const amount = lookup.get(cat)?.get(c);
                  const total = totals.get(c) ?? 1;
                  const pct = amount ? (amount / total) * 100 : 0;
                  return (
                    <td key={c} className="py-2 px-4 text-right tabular-nums">
                      {amount ? (
                        <span className="text-gray-700 dark:text-gray-300">
                          {formatAmount(amount, c)}
                          <span className="text-xs text-gray-400 ml-1">
                            {pct.toFixed(0)}%
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-700">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-semibold">
              <td className="py-2 pr-4 text-gray-800 dark:text-gray-200">Total</td>
              {currencies.map((c) => (
                <td key={c} className="py-2 px-4 text-right tabular-nums text-red-600 dark:text-red-400">
                  {formatAmount(totals.get(c) ?? 0, c)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
