import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import type { Transaction } from '../../../types';
import { groupByCategory } from '../../../lib/transforms';
import { useBudget } from '../../../context/BudgetContext';

const COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#eab308', '#22c55e',
];

interface Props {
  transactions: Transaction[];
}

export function TopCategoriesChart({ transactions }: Props) {
  const { darkMode } = useBudget();

  const data = useMemo(() => {
    const cats = groupByCategory(transactions);
    return cats.slice(0, 8).map((c) => ({
      name: c.category,
      total: Math.round(c.total * 100) / 100,
    }));
  }, [transactions]);

  if (data.length === 0) return null;

  const textColor = darkMode ? '#9ca3af' : '#6b7280';
  const gridColor = darkMode ? '#374151' : '#e5e7eb';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
        Top Expense Categories
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12, fill: textColor }} />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 12, fill: textColor }}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? '#1f2937' : '#fff',
                border: `1px solid ${gridColor}`,
                borderRadius: 8,
                fontSize: 13,
              }}
              formatter={(value: number) => value.toFixed(2)}
            />
            <Bar dataKey="total" name="Total" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
