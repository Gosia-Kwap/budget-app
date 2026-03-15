import { useMemo, useState } from 'react';
import { useFilteredData } from '../../hooks/useFilteredData';
import { useCurrencyConvert } from '../../hooks/useCurrencyConvert';
import { groupByCategory } from '../../lib/transforms';
import { CategoryPieChart } from './CategoryPieChart';
import { CategoryTable } from './CategoryTable';

export function CategoriesPage() {
  const filtered = useFilteredData();
  const transactions = useCurrencyConvert(filtered);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => groupByCategory(transactions), [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        No transactions for the selected period.
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
