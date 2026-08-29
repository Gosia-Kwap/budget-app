import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { Transaction } from '../../../types';
import { groupByMonth } from '../../../lib/transforms';
import { useBudget } from '../../../context/BudgetContext';

interface Props {
  transactions: Transaction[];
}

export function MonthlyTrendChart({ transactions }: Props) {
  const { darkMode } = useBudget();
  const data = useMemo(() => groupByMonth(transactions), [transactions]);

  if (data.length === 0) return null;

  const textColor = darkMode ? '#9ca3af' : '#6b7280';
  const gridColor = darkMode ? '#374151' : '#e5e7eb';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
        Income vs Expenses
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: textColor }} />
            <YAxis tick={{ fontSize: 12, fill: textColor }} width={60} />
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? '#1f2937' : '#fff',
                border: `1px solid ${gridColor}`,
                borderRadius: 8,
                fontSize: 13,
              }}
              labelStyle={{ color: darkMode ? '#e5e7eb' : '#111827' }}
              formatter={(value) => Number(value).toFixed(2)}
            />
            <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
