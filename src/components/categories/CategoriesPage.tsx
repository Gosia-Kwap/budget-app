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
import { listCurrencies } from '../../lib/currency';

export function CategoriesPage() {
  const { filters, data } = useBudget();
  // Currencies come from the workbook, not from a fixed list.
  const allCurrencies = useMemo(() => listCurrencies(data), [data]);
  const filtered = useFilteredData();
  const transactions = useCurrencyConvert(filtered);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => groupByCategory(transactions), [transactions]);

  const perCurrency = useMemo(() => {
    if (filters.currencyMode !== 'all') return null;
    const result = new Map<Currency, { transactions: Transaction[]; categories: CategoryTotal[] }>();
    for (const c of allCurrencies) {
      const txns = filtered.filter((t) => t.currency === c);
      const cats = groupByCategory(txns);
      if (txns.some((t) => t.type === 'Expense' || t.type === 'ExpenseReturn')) {
        result.set(c, { transactions: txns, categories: cats });
      }
    }
    return result;
  }, [filtered, filters.currencyMode, allCurrencies]);

  if (filters.currencyMode === 'all' && perCurrency) {
    if (perCurrency.size === 0) {
      return <EmptyLeaf message="no expenses for the selected period" />;
    }

    const shownCurrencies = allCurrencies.filter((c) => perCurrency.has(c));

    return (
      <div>
        <CurrencyComparisonTable perCurrency={perCurrency} />
        <div className={`grid grid-cols-1 ${currencyGridCols(shownCurrencies.length)} gap-x-10 gap-y-10 mt-12`}>
          {shownCurrencies.map((c) => (
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
    return <EmptyLeaf message={`no expenses in ${filters.filterCurrency} for the selected period`} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
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
  );
}

function EmptyLeaf({ message }: { message: string }) {
  return (
    <div className="text-center py-24">
      <p className="font-display text-3xl text-faded italic">a blank leaf —</p>
      <p className="font-serif italic text-faded text-sm mt-2">{message}</p>
    </div>
  );
}

/**
 * Column count follows the number of currencies on screen — the grid was
 * fixed at three back when there were exactly three.
 */
function currencyGridCols(n: number): string {
  if (n >= 4) return 'lg:grid-cols-4';
  if (n === 3) return 'lg:grid-cols-3';
  if (n === 2) return 'lg:grid-cols-2';
  return 'lg:grid-cols-1';
}
