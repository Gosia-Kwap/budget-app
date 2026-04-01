import { useMemo, useState } from 'react';
import type { Transaction } from '../../types';
import { ArrowUp, ArrowDown, Check, ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  transactions: Transaction[];
}

interface MonthCategoryData {
  month: string;
  label: string;
  categories: Map<string, number>;
  subcategories: Map<string, Map<string, number>>; // category -> subcategory -> amount
  totalExpenses: number;
  totalIncome: number;
}

export function MonthlyComparison({ transactions }: Props) {
  const allMonthData = useMemo(() => {
    const monthMap = new Map<string, MonthCategoryData>();
    const categorySet = new Set<string>();

    const expenses = transactions.filter((t) => t.type === 'Expense');
    const incomes = transactions.filter((t) => t.type === 'Income');

    for (const t of expenses) {
      const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(key)) {
        const label = t.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthMap.set(key, { month: key, label, categories: new Map(), subcategories: new Map(), totalExpenses: 0, totalIncome: 0 });
      }
      const m = monthMap.get(key)!;
      const cat = t.category || 'Other';
      const sub = t.subcategory || 'Other';
      categorySet.add(cat);
      m.categories.set(cat, (m.categories.get(cat) ?? 0) + Math.abs(t.amount));
      if (!m.subcategories.has(cat)) m.subcategories.set(cat, new Map());
      const subMap = m.subcategories.get(cat)!;
      subMap.set(sub, (subMap.get(sub) ?? 0) + Math.abs(t.amount));
      m.totalExpenses += Math.abs(t.amount);
    }

    for (const t of incomes) {
      const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(key)) {
        const label = t.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthMap.set(key, { month: key, label, categories: new Map(), subcategories: new Map(), totalExpenses: 0, totalIncome: 0 });
      }
      monthMap.get(key)!.totalIncome += t.amount;
    }

    const allMonths = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
    const categories = Array.from(categorySet).sort();

    return { allMonths, categories };
  }, [transactions]);

  // Default: show last 3 months
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(() => {
    const keys = allMonthData.allMonths.map((m) => m.month);
    return new Set(keys.slice(-3));
  });

  const toggleMonth = (key: string) => {
    setSelectedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAll = () => setSelectedMonths(new Set(allMonthData.allMonths.map((m) => m.month)));
  const selectLast = (n: number) => {
    const keys = allMonthData.allMonths.map((m) => m.month);
    setSelectedMonths(new Set(keys.slice(-n)));
  };

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const { months, categories } = useMemo(() => {
    const months = allMonthData.allMonths.filter((m) => selectedMonths.has(m.month));
    return { months, categories: allMonthData.categories };
  }, [allMonthData, selectedMonths]);

  const allExpanded = categories.length > 0 && expandedCategories.size === categories.length;

  // Collect all subcategories for each expanded category across all visible months
  const subcategoriesFor = useMemo(() => {
    const result = new Map<string, string[]>();
    for (const cat of expandedCategories) {
      const subSet = new Set<string>();
      for (const m of months) {
        const subMap = m.subcategories.get(cat);
        if (subMap) for (const sub of subMap.keys()) subSet.add(sub);
      }
      const sorted = Array.from(subSet).sort((a, b) => {
        const totalA = months.reduce((s, m) => s + (m.subcategories.get(cat)?.get(a) ?? 0), 0);
        const totalB = months.reduce((s, m) => s + (m.subcategories.get(cat)?.get(b) ?? 0), 0);
        return totalB - totalA;
      });
      result.set(cat, sorted);
    }
    return result;
  }, [expandedCategories, months]);

  const avgByCategory = useMemo(() => {
    const avg = new Map<string, number>();
    for (const cat of categories) {
      const total = months.reduce((sum, m) => sum + (m.categories.get(cat) ?? 0), 0);
      avg.set(cat, months.length > 0 ? total / months.length : 0);
    }
    return avg;
  }, [months, categories]);

  if (allMonthData.allMonths.length === 0) return null;

  const avgTotalExpenses = months.length > 0 ? months.reduce((s, m) => s + m.totalExpenses, 0) / months.length : 0;
  const avgTotalIncome = months.length > 0 ? months.reduce((s, m) => s + m.totalIncome, 0) / months.length : 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Monthly Comparison
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">Show:</span>
          <QuickButton label="Last 3" active={selectedMonths.size === 3 && isLastN(selectedMonths, allMonthData.allMonths, 3)} onClick={() => selectLast(3)} />
          <QuickButton label="Last 6" active={selectedMonths.size === 6 && isLastN(selectedMonths, allMonthData.allMonths, 6)} onClick={() => selectLast(6)} />
          <QuickButton label="All" active={selectedMonths.size === allMonthData.allMonths.length} onClick={selectAll} />
          <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
          <QuickButton
            label={allExpanded ? 'Collapse all' : 'Expand all'}
            active={allExpanded}
            onClick={() => setExpandedCategories(allExpanded ? new Set() : new Set(categories))}
          />
        </div>
      </div>

      {/* Month chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {allMonthData.allMonths.map((m) => {
          const isSelected = selectedMonths.has(m.month);
          return (
            <button
              key={m.month}
              onClick={() => toggleMonth(m.month)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                isSelected
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {isSelected && <Check className="w-3 h-3" />}
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
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
              const isExpanded = expandedCategories.has(cat);
              return (
                <>
                  <tr
                    key={cat}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer"
                    onClick={() => toggleCategory(cat)}
                  >
                    <td className="py-2 pr-4 font-medium text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-900">
                      <div className="flex items-center gap-1.5">
                        {isExpanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          : <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                        {cat}
                      </div>
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
                  {isExpanded && (subcategoriesFor.get(cat) ?? []).map((sub) => {
                    const subAvg = months.length > 0
                      ? months.reduce((s, m) => s + (m.subcategories.get(cat)?.get(sub) ?? 0), 0) / months.length
                      : 0;
                    return (
                      <tr key={`${cat}-${sub}`} className="border-b border-gray-50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-800/20">
                        <td className="py-1.5 pr-4 pl-7 text-xs text-gray-500 dark:text-gray-400 sticky left-0 bg-gray-50/50 dark:bg-gray-800/20">
                          {sub}
                        </td>
                        {months.map((m) => {
                          const val = m.subcategories.get(cat)?.get(sub) ?? 0;
                          return (
                            <td key={m.month} className="text-right py-1.5 px-3 tabular-nums text-xs text-gray-500 dark:text-gray-400">
                              {val === 0 ? '—' : val.toFixed(0)}
                            </td>
                          );
                        })}
                        <td className="text-right py-1.5 px-3 tabular-nums text-xs text-gray-400 dark:text-gray-500 border-l border-gray-200 dark:border-gray-700">
                          {subAvg.toFixed(0)}
                        </td>
                      </tr>
                    );
                  })}
                </>
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
    </div>
  );
}

function QuickButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
        active
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );
}

function isLastN(selected: Set<string>, allMonths: MonthCategoryData[], n: number): boolean {
  const keys = allMonths.map((m) => m.month);
  const lastN = keys.slice(-n);
  return lastN.length === n && lastN.every((k) => selected.has(k));
}

function TrendIndicator({ diff }: { diff: number }) {
  if (Math.abs(diff) < 1) return null;
  const isUp = diff > 0;
  const Icon = isUp ? ArrowUp : ArrowDown;
  const color = isUp ? 'text-red-400' : 'text-emerald-400';
  return <Icon className={`w-3 h-3 ${color}`} />;
}
