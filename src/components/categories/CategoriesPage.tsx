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

  const perCurrency = useMemo(() => {
    if (filters.currencyMode !== 'all') return null;
    const result = new Map<Currency, { transactions: Transaction[]; categories: CategoryTotal[] }>();
    for (const c of CURRENCIES) {
      const txns = filtered.filter((t) => t.currency === c);
      const cats = groupByCategory(txns);
      if (txns.some((t) => t.type === 'Expense' || t.type === 'ExpenseReturn')) {
        result.set(c, { transactions: txns, categories: cats });
      }
    }
    return result;
  }, [filtered, filters.currencyMode]);

  if (filters.currencyMode === 'all' && perCurrency) {
    if (perCurrency.size === 0) {
      return <EmptyLeaf message="no expenses for the selected period" />;
    }

    return (
      <div>
        <CurrencyComparisonTable perCurrency={perCurrency} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-10 gap-y-10 mt-12">
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
