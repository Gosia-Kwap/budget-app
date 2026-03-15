import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { AccountBalance, Transaction } from '../../types';
import { calculateRunningBalances } from '../../lib/transforms';
import { useBudget } from '../../context/BudgetContext';

const LINE_COLORS = [
  '#6366f1', '#22c55e', '#ef4444', '#f97316',
  '#8b5cf6', '#06b6d4', '#ec4899',
];

interface Props {
  accounts: AccountBalance[];
  transactions: Transaction[];
}

export function BalanceTimeline({ accounts, transactions }: Props) {
  const { darkMode } = useBudget();

  const data = useMemo(() => {
    // Calculate running balances for each account
    const balancesByAccount = accounts.map((acc) => ({
      account: acc.account,
      points: calculateRunningBalances(acc.account, acc.startingBalance, transactions),
    }));

    // Merge all dates into a unified timeline
    const allDates = new Map<string, Record<string, number>>();

    for (const { account, points } of balancesByAccount) {
      for (const p of points) {
        const key = p.date.toISOString().split('T')[0];
        if (!allDates.has(key)) allDates.set(key, {});
        allDates.get(key)![account] = p.balance;
      }
    }

    // Sort by date and forward-fill missing values
    const sorted = Array.from(allDates.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const lastKnown: Record<string, number> = {};

    return sorted.map(([date, values]) => {
      for (const acc of accounts) {
        if (values[acc.account] != null) {
          lastKnown[acc.account] = values[acc.account];
        } else {
          values[acc.account] = lastKnown[acc.account] ?? acc.startingBalance;
        }
      }
      return {
        date,
        label: new Date(date).toLocaleDateString('de-CH', { day: '2-digit', month: 'short' }),
        ...values,
      };
    });
  }, [accounts, transactions]);

  if (data.length === 0) return null;

  const textColor = darkMode ? '#9ca3af' : '#6b7280';
  const gridColor = darkMode ? '#374151' : '#e5e7eb';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
        Balance Over Time
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: textColor }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 11, fill: textColor }} width={70} />
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? '#1f2937' : '#fff',
                border: `1px solid ${gridColor}`,
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: darkMode ? '#e5e7eb' : '#111827' }}
              formatter={(value: number) => value.toFixed(2)}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: textColor }}
            />
            {accounts.map((acc, i) => (
              <Line
                key={acc.account}
                type="monotone"
                dataKey={acc.account}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
