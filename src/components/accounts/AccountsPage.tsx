import { useMemo } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { useFilteredData } from '../../hooks/useFilteredData';
import { AccountCard } from './AccountCard';
import { BalanceTimeline } from './BalanceTimeline';
import { SavingsOverview } from './SavingsOverview';
import { SectionHeading } from '../overview/SummaryCards';

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
      <div className="text-center py-24">
        <p className="font-display text-3xl text-faded italic">no holdings —</p>
        <p className="font-serif italic text-faded text-sm mt-2">
          no account data available
        </p>
      </div>
    );
  }

  return (
    <div>
      <section className="mb-12">
        <SectionHeading kicker="Holdings" title="Accounts in this volume" />
        <div className="border-t border-rule" />
        <div className="border-t border-rule-soft mt-[2px]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8">
          {accounts.map((acc, i) => (
            <AccountCard
              key={acc.account}
              account={acc}
              transactions={transactions}
              index={i + 1}
            />
          ))}
        </div>
      </section>

      <SavingsOverview accounts={data.accounts} transactions={data.transactions} />
      <BalanceTimeline accounts={accounts} transactions={data.transactions} />
    </div>
  );
}
