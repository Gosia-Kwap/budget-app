import { useMemo } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { useFilteredData } from '../../hooks/useFilteredData';
import { AccountCard } from './AccountCard';
import { BalanceTimeline } from './BalanceTimeline';
import { SavingsOverview } from './SavingsOverview';

export function AccountsPage() {
  const { data, filters } = useBudget();
  const transactions = useFilteredData();

  const accounts = useMemo(() => {
    if (!data) return [];
    if (filters.currencyMode === 'all') return data.accounts;
    return data.accounts.filter((a) => a.currency === filters.filterCurrency);
  }, [data, filters.currencyMode, filters.filterCurrency]);

  if (!data || accounts.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        No account data available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {accounts.map((acc) => (
          <AccountCard
            key={acc.account}
            account={acc}
            transactions={transactions}
          />
        ))}
      </div>
      <SavingsOverview accounts={data.accounts} transactions={data.transactions} />
      <BalanceTimeline accounts={accounts} transactions={data.transactions} />
    </div>
  );
}
