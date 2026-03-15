import { useFilteredData } from '../../hooks/useFilteredData';
import { useCurrencyConvert } from '../../hooks/useCurrencyConvert';
import { SummaryCards } from './SummaryCards';
import { MonthlyTrendChart } from './MonthlyTrendChart';
import { TopCategoriesChart } from './TopCategoriesChart';

export function OverviewPage() {
  const filtered = useFilteredData();
  const transactions = useCurrencyConvert(filtered);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        No transactions for the selected period.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SummaryCards transactions={transactions} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyTrendChart transactions={transactions} />
        <TopCategoriesChart transactions={transactions} />
      </div>
    </div>
  );
}
