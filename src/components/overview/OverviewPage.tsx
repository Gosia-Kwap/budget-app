import { useMemo } from 'react';
import { useFilteredData } from '../../hooks/useFilteredData';
import { useCurrencyConvert } from '../../hooks/useCurrencyConvert';
import { useBudget } from '../../context/BudgetContext';
import { resolveExpenseReturns } from '../../lib/transforms';
import { SummaryCards } from './SummaryCards';
import { MonthlyTrendChart } from './MonthlyTrendChart';
import { TopCategoriesChart } from './TopCategoriesChart';
import { MonthlyComparison } from './MonthlyComparison';

export function OverviewPage() {
  const { data } = useBudget();
  const filtered = useFilteredData();
  const transactions = useCurrencyConvert(filtered);
  const resolvedAll = useMemo(
    () => resolveExpenseReturns(data?.transactions ?? []),
    [data]
  );
  const allTransactions = useCurrencyConvert(resolvedAll);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="font-display text-3xl text-faded italic">a blank leaf —</p>
        <p className="font-serif italic text-faded text-sm mt-2">
          no entries for the selected period
        </p>
      </div>
    );
  }

  return (
    <div>
      <SummaryCards transactions={transactions} />
      <MonthlyComparison transactions={allTransactions} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
        <MonthlyTrendChart transactions={allTransactions} />
        <TopCategoriesChart transactions={transactions} />
      </div>
    </div>
  );
}
