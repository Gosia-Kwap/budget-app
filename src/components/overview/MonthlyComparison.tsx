import { useMemo } from 'react';
import type { Transaction } from '../../types';
import { useBudget } from '../../context/BudgetContext';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface Props {
  transactions: Transaction[];
}

interface MonthCategoryData {
  month: string;
  label: string;
  categories: Map<string, number>;
  totalExpenses: number;
  totalIncome: number;
}

export function MonthlyComparison({ transactions }: Props) {
  const { darkMode } = useBudget();

  const { months, categories, avgByCategory } = useMemo(() => {
    const monthMap = new Map<string, MonthCategoryData>();
    const categorySet = new Set<string>();

    // Only expenses (exclude transfers and income for expense tracking)
    const expenses = transactions.filter((t) => t.type === 'Expense');
    const incomes = transactions.filter((t) => t.type === 'Income');

    for (const t of expenses) {
      const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(key)) {
        const label = t.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthMap.set(key, { month: key, label, categories: new Map(), totalExpenses: 0, totalIncome: 0 });
      }
      const m = monthMap.get(key)!;
      const cat = t.category || 'Other';
      categorySet.add(cat);
      m.categories.set(cat, (m.categories.get(cat) ?? 0) + Math.abs(t.amount));
      m.totalExpenses += Math.abs(t.amount);
    }

    for (const t of incomes) {
      const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(key)) {
        const label = t.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthMap.set(key, { month: key, label, categories: new Map(), totalExpenses: 0, totalIncome: 0 });
      }
      monthMap.get(key)!.totalIncome += t.amount;
    }

    const months = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
    const categories = Array.from(categorySet).sort();

    // Calculate averages
    const avgByCategory = new Map<string, number>();
    for (const cat of categories) {
      const total = months.reduce((sum, m) => sum + (m.categories.get(cat) ?? 0), 0);
      avgByCategory.set(cat, total / months.length);
    }

    return { months, categories, avgByCategory };
  }, [transactions]);

  if (months.length === 0) return null;

  const avgTotalExpenses = months.reduce((s, m) => s + m.totalExpenses, 0) / months.length;
  const avgTotalIncome = months.reduce((s, m) => s + m.totalIncome, 0) / months.length;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 overflow-x-auto">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
        Monthly Comparison
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400 sticky left-0 bg-white dark:bg-gray-900">
              Category
            </th>
            {months.map((m) => (
              <th key={m.month} className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400 min-w-[100px]">
                {m.label}
              </th>
            ))}
            <th className="text-right py-2 px-3 font-semibold text-gray-600 dark:text-gray-300 min-w-[100px] border-l border-gray-200 dark:border-gray-700">
              Avg
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Income row */}
          <tr className="border-b border-gray-100 dark:border-gray-800 bg-emerald-50/50 dark:bg-emerald-950/20">
            <td className="py-2.5 pr-4 font-semibold text-emerald-700 dark:text-emerald-400 sticky left-0 bg-emerald-50/50 dark:bg-emerald-950/20">
              Income
            </td>
            {months.map((m) => (
              <td key={m.month} className="text-right py-2.5 px-3 tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                {m.totalIncome.toFixed(0)}
              </td>
            ))}
            <td className="text-right py-2.5 px-3 tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 border-l border-gray-200 dark:border-gray-700">
              {avgTotalIncome.toFixed(0)}
            </td>
          </tr>

          {/* Category rows */}
          {categories.map((cat) => {
            const avg = avgByCategory.get(cat) ?? 0;
            return (
              <tr key={cat} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td className="py-2 pr-4 font-medium text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-900">
                  {cat}
                </td>
                {months.map((m, idx) => {
                  const val = m.categories.get(cat) ?? 0;
                  const prevVal = idx > 0 ? (months[idx - 1].categories.get(cat) ?? 0) : null;
                  const diff = prevVal !== null ? val - prevVal : null;

                  return (
                    <td key={m.month} className="text-right py-2 px-3 tabular-nums">
                      <div className="flex items-center justify-end gap-1">
                        <span className={val > avg * 1.2 ? 'text-red-600 dark:text-red-400 font-semibold' : val === 0 ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}>
                          {val === 0 ? '—' : val.toFixed(0)}
                        </span>
                        {diff !== null && diff !== 0 && val > 0 && (
                          <TrendIndicator diff={diff} />
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className="text-right py-2 px-3 tabular-nums text-gray-500 dark:text-gray-400 font-medium border-l border-gray-200 dark:border-gray-700">
                  {avg.toFixed(0)}
                </td>
              </tr>
            );
          })}

          {/* Total expenses row */}
          <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-red-50/50 dark:bg-red-950/20">
            <td className="py-2.5 pr-4 font-bold text-red-700 dark:text-red-400 sticky left-0 bg-red-50/50 dark:bg-red-950/20">
              Total Expenses
            </td>
            {months.map((m, idx) => {
              const prevTotal = idx > 0 ? months[idx - 1].totalExpenses : null;
              const diff = prevTotal !== null ? m.totalExpenses - prevTotal : null;
              return (
                <td key={m.month} className="text-right py-2.5 px-3 tabular-nums font-bold text-red-600 dark:text-red-400">
                  <div className="flex items-center justify-end gap-1">
                    {m.totalExpenses.toFixed(0)}
                    {diff !== null && diff !== 0 && <TrendIndicator diff={diff} />}
                  </div>
                </td>
              );
            })}
            <td className="text-right py-2.5 px-3 tabular-nums font-bold text-red-600 dark:text-red-400 border-l border-gray-200 dark:border-gray-700">
              {avgTotalExpenses.toFixed(0)}
            </td>
          </tr>

          {/* Net row */}
          <tr className="bg-blue-50/50 dark:bg-blue-950/20">
            <td className="py-2.5 pr-4 font-bold text-blue-700 dark:text-blue-400 sticky left-0 bg-blue-50/50 dark:bg-blue-950/20">
              Net (Income - Expenses)
            </td>
            {months.map((m) => {
              const net = m.totalIncome - m.totalExpenses;
              return (
                <td key={m.month} className={`text-right py-2.5 px-3 tabular-nums font-bold ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {net >= 0 ? '+' : ''}{net.toFixed(0)}
                </td>
              );
            })}
            <td className={`text-right py-2.5 px-3 tabular-nums font-bold border-l border-gray-200 dark:border-gray-700 ${(avgTotalIncome - avgTotalExpenses) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {(avgTotalIncome - avgTotalExpenses) >= 0 ? '+' : ''}{(avgTotalIncome - avgTotalExpenses).toFixed(0)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function TrendIndicator({ diff }: { diff: number }) {
  if (Math.abs(diff) < 1) return null;

  // For expenses: going up is bad (red), going down is good (green)
  const isUp = diff > 0;
  const Icon = isUp ? ArrowUp : ArrowDown;
  const color = isUp ? 'text-red-400' : 'text-emerald-400';

  return <Icon className={`w-3 h-3 ${color}`} />;
}
