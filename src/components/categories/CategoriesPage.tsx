import { useMemo, useState } from 'react';
import { useFilteredData } from '../../hooks/useFilteredData';
import { useCurrencyConvert } from '../../hooks/useCurrencyConvert';
import { groupByCategory } from '../../lib/transforms';
import { CategoryPieChart } from './CategoryPieChart';
import { CategoryTable } from './CategoryTable';
import { CurrencyComparisonTable } from './CurrencyComparisonTable';
import { useBudget } from '../../context/BudgetContext';
import type { Currency, Transaction } from '../../types';
import type { CategoryTotal } from '../../lib/transforms';

const CURRENCIES: Currency[] = ['CHF', 'EUR', 'PLN'];

export function CategoriesPage() {
  const { filters } = useBudget();
  const filtered = useFilteredData();
  const transactions = useCurrencyConvert(filtered);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => groupByCategory(transactions), [transactions]);

  // For "All" mode: group by category per currency
  const perCurrency = useMemo(() => {
    if (filters.currencyMode !== 'all') return null;
    const result = new Map<Currency, { transactions: Transaction[]; categories: CategoryTotal[] }>();
    for (const c of CURRENCIES) {
      const txns = filtered.filter((t) => t.currency === c);
      const cats = groupByCategory(txns);
      if (txns.some((t) => t.type === 'Expense')) {
        result.set(c, { transactions: txns, categories: cats });
      }
    }
    return result;
  }, [filtered, filters.currencyMode]);

  if (filters.currencyMode === 'all' && perCurrency) {
    if (perCurrency.size === 0) {
      return (
        <div className="text-center py-20 text-gray-400">
          No expenses for the selected period.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <CurrencyComparisonTable perCurrency={perCurrency} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {CURRENCIES.filter((c) => perCurrency.has(c)).map((c) => (
            <CategoryPieChart
              key={c}
              categories={perCurrency.get(c)!.categories}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
              currencyOverride={c}
              compact
            />
          ))}
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        No expenses in {filters.filterCurrency} for the selected period.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
        <CategoryTable
          categories={categories}
          transactions={transactions}
          expanded={selectedCategory}
          onToggle={(cat) =>
            setSelectedCategory(selectedCategory === cat ? null : cat)
          }
        />
      </div>
    </div>
  );
}
