import { useBudget } from '../../context/BudgetContext';
import { useFilteredData } from '../../hooks/useFilteredData';
import { AccountCard } from './AccountCard';
import { BalanceTimeline } from './BalanceTimeline';

export function AccountsPage() {
  const { data } = useBudget();
  const transactions = useFilteredData();

  if (!data || data.accounts.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        No account data available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.accounts.map((acc) => (
          <AccountCard
            key={acc.account}
            account={acc}
            transactions={transactions}
          />
        ))}
      </div>
      <BalanceTimeline accounts={data.accounts} transactions={data.transactions} />
    </div>
  );
}
