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
  // Monthly comparison always uses all transactions (not date-filtered)
  // Resolve expense returns here too so cross-month groups are netted
  const resolvedAll = useMemo(
    () => resolveExpenseReturns(data?.transactions ?? []),
    [data]
  );
  const allTransactions = useCurrencyConvert(resolvedAll);

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
      <MonthlyComparison transactions={allTransactions} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyTrendChart transactions={allTransactions} />
        <TopCategoriesChart transactions={transactions} />
      </div>
    </div>
  );
}
