import { useMemo } from 'react';
import type { Transaction, AccountBalance } from '../../types';
import { formatAmount } from '../../lib/currency';
import { CurrencyBadge } from '../shared/CurrencyBadge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  account: AccountBalance;
  transactions: Transaction[];
}

export function AccountCard({ account, transactions }: Props) {
  const stats = useMemo(() => {
    const acctTxns = transactions.filter((t) => t.account === account.account);
    const income = acctTxns.filter((t) => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
    const expenses = acctTxns.filter((t) => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
    const transfersIn = acctTxns.filter((t) => t.type === 'Transfer' && t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const transfersOut = acctTxns.filter((t) => t.type === 'Transfer' && t.amount < 0).reduce((s, t) => s + t.amount, 0);
    const net = income + expenses;
    return { income, expenses: Math.abs(expenses), transfersIn, transfersOut: Math.abs(transfersOut), net };
  }, [account.account, transactions]);

  const TrendIcon = stats.net > 0 ? TrendingUp : stats.net < 0 ? TrendingDown : Minus;
  const trendColor = stats.net > 0
    ? 'text-emerald-500'
    : stats.net < 0
    ? 'text-red-500'
    : 'text-gray-400';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{account.account}</h3>
        <CurrencyBadge currency={account.currency} />
      </div>
      <div className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100 mb-3">
        {formatAmount(account.currentBalance, account.currency)}
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between text-gray-500 dark:text-gray-400">
          <span>Income</span>
          <span className="text-emerald-500 tabular-nums">
            +{formatAmount(stats.income, account.currency)}
          </span>
        </div>
        <div className="flex justify-between text-gray-500 dark:text-gray-400">
          <span>Expenses</span>
          <span className="text-red-500 tabular-nums">
            -{formatAmount(stats.expenses, account.currency)}
          </span>
        </div>
        {(stats.transfersIn > 0 || stats.transfersOut > 0) && (
          <div className="flex justify-between text-gray-500 dark:text-gray-400">
            <span>Transfers</span>
            <span className="text-violet-500 tabular-nums">
              +{formatAmount(stats.transfersIn, account.currency)} / -{formatAmount(stats.transfersOut, account.currency)}
            </span>
          </div>
        )}
      </div>
      <div className={`flex items-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 ${trendColor}`}>
        <TrendIcon className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">
          Net: {formatAmount(stats.net, account.currency)}
        </span>
      </div>
    </div>
  );
}
