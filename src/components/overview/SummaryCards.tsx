import { useMemo } from 'react';
import { TrendingUp, TrendingDown, ArrowRightLeft, Scale } from 'lucide-react';
import type { Transaction, Currency } from '../../types';
import { summarizeByCurrency } from '../../lib/transforms';
import { formatAmount } from '../../lib/currency';
import { CurrencyBadge } from '../shared/CurrencyBadge';

interface Props {
  transactions: Transaction[];
}

export function SummaryCards({ transactions }: Props) {
  const summary = useMemo(() => summarizeByCurrency(transactions), [transactions]);

  const currencies = Array.from(summary.keys()).sort();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        title="Income"
        icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
        color="emerald"
      >
        {currencies.map((c) => (
          <CurrencyRow key={c} currency={c} amount={summary.get(c)!.income} positive />
        ))}
      </Card>
      <Card
        title="Expenses"
        icon={<TrendingDown className="w-5 h-5 text-red-500" />}
        color="red"
      >
        {currencies.map((c) => (
          <CurrencyRow key={c} currency={c} amount={summary.get(c)!.expenses} />
        ))}
      </Card>
      <Card
        title="Net"
        icon={<Scale className="w-5 h-5 text-blue-500" />}
        color="blue"
      >
        {currencies.map((c) => {
          const net = summary.get(c)!.net;
          return <CurrencyRow key={c} currency={c} amount={net} positive={net >= 0} />;
        })}
      </Card>
      <Card
        title="Transfers"
        icon={<ArrowRightLeft className="w-5 h-5 text-violet-500" />}
        color="violet"
      >
        {currencies.map((c) => {
          const t = summary.get(c)!.transfers;
          return t > 0 ? <CurrencyRow key={c} currency={c} amount={t} neutral /> : null;
        })}
      </Card>
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function CurrencyRow({
  currency,
  amount,
  positive,
  neutral,
}: {
  currency: Currency;
  amount: number;
  positive?: boolean;
  neutral?: boolean;
}) {
  const color = neutral
    ? 'text-gray-600 dark:text-gray-400'
    : positive
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <div className="flex items-center justify-between">
      <CurrencyBadge currency={currency} />
      <span className={`text-lg font-semibold tabular-nums ${color}`}>
        {formatAmount(Math.abs(amount), currency)}
      </span>
    </div>
  );
}
