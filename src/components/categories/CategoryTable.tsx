import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Transaction } from '../../types';
import type { CategoryTotal } from '../../lib/transforms';
import { formatAmount, CURRENCY_SYMBOLS } from '../../lib/currency';
import { CurrencyBadge } from '../shared/CurrencyBadge';
import { useBudget } from '../../context/BudgetContext';

interface Props {
  categories: CategoryTotal[];
  transactions: Transaction[];
  expanded: string | null;
  onToggle: (cat: string) => void;
}

export function CategoryTable({ categories, transactions, expanded, onToggle }: Props) {
  const { filters } = useBudget();
  const total = categories.reduce((sum, c) => sum + c.total, 0);
  const currencyLabel =
    filters.currencyMode === 'filtered'
      ? `${CURRENCY_SYMBOLS[filters.filterCurrency]} `
      : ''; // In 'all' mode, CategoryTable is not rendered (CurrencyComparisonTable is used instead)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
        Category Breakdown
      </h3>
      <div className="space-y-1">
        {categories.map((cat) => {
          const pct = total > 0 ? (cat.total / total) * 100 : 0;
          const isOpen = expanded === cat.category;

          return (
            <div key={cat.category}>
              <button
                onClick={() => onToggle(cat.category)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
              >
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                )}
                <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                  {cat.category}
                </span>
                <span className="text-xs text-gray-400 mr-2">{pct.toFixed(1)}%</span>
                <span className="text-sm font-semibold tabular-nums text-gray-700 dark:text-gray-300">
                  {currencyLabel}{cat.total.toFixed(2)}
                </span>
              </button>
              {isOpen && (
                <div className="ml-9 mb-2 space-y-1">
                  {Array.from(cat.subcategories.entries())
                    .sort((a, b) => b[1] - a[1])
                    .map(([sub, amount]) => (
                      <div
                        key={sub}
                        className="flex items-center justify-between px-3 py-1.5 text-sm rounded-lg bg-gray-50 dark:bg-gray-800/30"
                      >
                        <span className="text-gray-600 dark:text-gray-400">{sub}</span>
                        <span className="tabular-nums text-gray-600 dark:text-gray-400">
                          {currencyLabel}{amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  {/* Show individual transactions */}
                  <div className="mt-2 border-t border-gray-100 dark:border-gray-800 pt-2">
                    <p className="text-xs text-gray-400 mb-1 px-3">Recent transactions</p>
                    {transactions
                      .filter((t) => (t.type === 'Expense' || t.type === 'ExpenseReturn') && t.category === cat.category)
                      .sort((a, b) => b.date.getTime() - a.date.getTime())
                      .slice(0, 10)
                      .map((t, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-3 py-1 text-xs text-gray-500 dark:text-gray-500"
                        >
                          <span className="w-20 shrink-0">
                            {t.date.toLocaleDateString('de-CH')}
                          </span>
                          <span className="flex-1 truncate">{t.subcategory}</span>
                          {t.description && (
                            <span className="flex-1 truncate text-gray-400">{t.description}</span>
                          )}
                          <CurrencyBadge currency={t.currency} />
                          <span className="tabular-nums font-medium text-red-500">
                            {formatAmount(Math.abs(t.amount), t.currency)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
