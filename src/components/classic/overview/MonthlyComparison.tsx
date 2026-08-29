import { useEffect, useMemo, useState } from 'react';
import type { Transaction, Currency } from '../../../types';
import { ArrowUp, ArrowDown, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { useBudget } from '../../../context/BudgetContext';
import { currencySymbol } from '../../../lib/currency';
import { formatMonthLabel } from '../../../lib/format';
import { config } from '../../../config';

interface Props {
  transactions: Transaction[];
}

// Per-currency amounts for "all" mode, single number for filtered mode
type CurrencyAmounts = Map<Currency, number>;

interface MonthCategoryData {
  month: string;
  label: string;
  categories: Map<string, CurrencyAmounts>;
  subcategories: Map<string, Map<string, CurrencyAmounts>>; // category -> subcategory -> amounts
  totalExpenses: CurrencyAmounts;
  totalIncome: CurrencyAmounts;
}

function addAmount(map: CurrencyAmounts, currency: Currency, amount: number) {
  map.set(currency, (map.get(currency) ?? 0) + amount);
}

function sumAmounts(map: CurrencyAmounts): number {
  let s = 0;
  for (const v of map.values()) s += v;
  return s;
}

export function MonthlyComparison({ transactions }: Props) {
  const { filters, data } = useBudget();
  const isAllCurrencies = filters.currencyMode === 'all';

  const currencies = useMemo(() => {
    const set = new Set<Currency>();
    for (const t of transactions) set.add(t.currency);
    return Array.from(set).sort() as Currency[];
  }, [transactions]);

  const allMonthData = useMemo(() => {
    const monthMap = new Map<string, MonthCategoryData>();
    const categorySet = new Set<string>();

    const expenses = transactions.filter((t) => t.type === 'Expense' || t.type === 'ExpenseReturn');
    const incomes = transactions.filter((t) => t.type === 'Income');

    for (const t of expenses) {
      const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(key)) {
        const label = formatMonthLabel(t.date);
        monthMap.set(key, { month: key, label, categories: new Map(), subcategories: new Map(), totalExpenses: new Map(), totalIncome: new Map() });
      }
      const m = monthMap.get(key)!;
      const cat = t.category || config.fallbackLabels.category;
      const sub = t.subcategory || config.fallbackLabels.subcategory;
      categorySet.add(cat);
      const sign = t.type === 'ExpenseReturn' ? -1 : 1;
      const amount = sign * Math.abs(t.amount);

      if (!m.categories.has(cat)) m.categories.set(cat, new Map());
      addAmount(m.categories.get(cat)!, t.currency, amount);

      if (!m.subcategories.has(cat)) m.subcategories.set(cat, new Map());
      const subMap = m.subcategories.get(cat)!;
      if (!subMap.has(sub)) subMap.set(sub, new Map());
      addAmount(subMap.get(sub)!, t.currency, amount);

      addAmount(m.totalExpenses, t.currency, amount);
    }

    for (const t of incomes) {
      const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(key)) {
        const label = formatMonthLabel(t.date);
        monthMap.set(key, { month: key, label, categories: new Map(), subcategories: new Map(), totalExpenses: new Map(), totalIncome: new Map() });
      }
      addAmount(monthMap.get(key)!.totalIncome, t.currency, t.amount);
    }

    const allMonths = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));

    // Preserve category order from the Excel Categories sheet
    const categoryOrder: string[] = [];
    const seen = new Set<string>();
    if (data?.categories) {
      for (const cm of data.categories) {
        if (!seen.has(cm.category) && categorySet.has(cm.category)) {
          seen.add(cm.category);
          categoryOrder.push(cm.category);
        }
      }
    }
    // Append any categories found in transactions but not in the Categories sheet
    for (const cat of categorySet) {
      if (!seen.has(cat)) categoryOrder.push(cat);
    }

    return { allMonths, categories: categoryOrder };
  }, [transactions, data?.categories]);

  // Default: show last 3 months
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(() => {
    const keys = allMonthData.allMonths.map((m) => m.month);
    return new Set(keys.slice(-3));
  });

  // When a month is picked in the global MonthPicker, ensure it's selected here too
  const pickerMonth = filters.startDate
    ? `${filters.startDate.getFullYear()}-${String(filters.startDate.getMonth() + 1).padStart(2, '0')}`
    : null;

  useEffect(() => {
    if (pickerMonth && !selectedMonths.has(pickerMonth)) {
      setSelectedMonths((prev) => new Set([...prev, pickerMonth]));
    }
  }, [pickerMonth]);

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
        const totalA = months.reduce((s, m) => s + sumAmounts(m.subcategories.get(cat)?.get(a) ?? new Map()), 0);
        const totalB = months.reduce((s, m) => s + sumAmounts(m.subcategories.get(cat)?.get(b) ?? new Map()), 0);
        return totalB - totalA;
      });
      result.set(cat, sorted);
    }
    return result;
  }, [expandedCategories, months]);

  const avgByCategory = useMemo(() => {
    const avg = new Map<string, number>();
    for (const cat of categories) {
      const total = months.reduce((sum, m) => sum + sumAmounts(m.categories.get(cat) ?? new Map()), 0);
      avg.set(cat, months.length > 0 ? total / months.length : 0);
    }
    return avg;
  }, [months, categories]);

  if (allMonthData.allMonths.length === 0) return null;

  // Helper to render a currency-aware value cell
  function renderAmounts(amounts: CurrencyAmounts, className?: string) {
    if (!isAllCurrencies || currencies.length <= 1) {
      const val = sumAmounts(amounts);
      return <span className={className}>{val === 0 ? '—' : val.toFixed(0)}</span>;
    }
    return (
      <div className="flex flex-col items-end gap-0.5">
        {currencies.map((c) => {
          const val = amounts.get(c) ?? 0;
          if (val === 0) return null;
          return (
            <span key={c} className={className}>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 mr-1">{currencySymbol(c)}</span>
              {val.toFixed(0)}
            </span>
          );
        })}
        {sumAmounts(amounts) === 0 && <span className={className}>—</span>}
      </div>
    );
  }

  const avgTotalExpenses = (() => {
    const avg: CurrencyAmounts = new Map();
    for (const c of currencies) {
      const total = months.reduce((s, m) => s + (m.totalExpenses.get(c) ?? 0), 0);
      if (months.length > 0) avg.set(c, total / months.length);
    }
    return avg;
  })();

  const avgTotalIncome = (() => {
    const avg: CurrencyAmounts = new Map();
    for (const c of currencies) {
      const total = months.reduce((s, m) => s + (m.totalIncome.get(c) ?? 0), 0);
      if (months.length > 0) avg.set(c, total / months.length);
    }
    return avg;
  })();

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
                  {renderAmounts(m.totalIncome, 'text-emerald-600 dark:text-emerald-400')}
                </td>
              ))}
              <td className="text-right py-2.5 px-3 tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 border-l border-gray-200 dark:border-gray-700">
                {renderAmounts(avgTotalIncome, 'text-emerald-600 dark:text-emerald-400')}
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
                      const amounts = m.categories.get(cat) ?? new Map();
                      const val = sumAmounts(amounts);
                      const prevVal = idx > 0 ? sumAmounts(months[idx - 1].categories.get(cat) ?? new Map()) : null;
                      const diff = prevVal !== null ? val - prevVal : null;

                      return (
                        <td key={m.month} className="text-right py-2 px-3 tabular-nums">
                          <div className="flex items-center justify-end gap-1">
                            {renderAmounts(
                              amounts,
                              val > avg * 1.2 ? 'text-red-600 dark:text-red-400 font-semibold' : val === 0 ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'
                            )}
                            {diff !== null && diff !== 0 && val > 0 && (
                              <TrendIndicator diff={diff} />
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="text-right py-2 px-3 tabular-nums text-gray-500 dark:text-gray-400 font-medium border-l border-gray-200 dark:border-gray-700">
                      {(() => {
                        const avgAmounts: CurrencyAmounts = new Map();
                        for (const c of currencies) {
                          const total = months.reduce((s, m) => s + (m.categories.get(cat)?.get(c) ?? 0), 0);
                          if (months.length > 0 && total !== 0) avgAmounts.set(c, total / months.length);
                        }
                        return renderAmounts(avgAmounts, 'text-gray-500 dark:text-gray-400 font-medium');
                      })()}
                    </td>
                  </tr>
                  {isExpanded && (subcategoriesFor.get(cat) ?? []).map((sub) => (
                    <tr key={`${cat}-${sub}`} className="border-b border-gray-50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-800/20">
                      <td className="py-1.5 pr-4 pl-7 text-xs text-gray-500 dark:text-gray-400 sticky left-0 bg-gray-50/50 dark:bg-gray-800/20">
                        {sub}
                      </td>
                      {months.map((m) => {
                        const amounts = m.subcategories.get(cat)?.get(sub) ?? new Map();
                        return (
                          <td key={m.month} className="text-right py-1.5 px-3 tabular-nums text-xs">
                            {renderAmounts(amounts, 'text-gray-500 dark:text-gray-400')}
                          </td>
                        );
                      })}
                      <td className="text-right py-1.5 px-3 tabular-nums text-xs border-l border-gray-200 dark:border-gray-700">
                        {(() => {
                          const avgAmounts: CurrencyAmounts = new Map();
                          for (const c of currencies) {
                            const total = months.reduce((s, m) => s + (m.subcategories.get(cat)?.get(sub)?.get(c) ?? 0), 0);
                            if (months.length > 0 && total !== 0) avgAmounts.set(c, total / months.length);
                          }
                          return renderAmounts(avgAmounts, 'text-gray-400 dark:text-gray-500');
                        })()}
                      </td>
                    </tr>
                  ))}
                </>
              );
            })}

            {/* Mandatory vs Adjustable subtotals */}
            {categories.some((c) => c.toLowerCase() === 'obowiązkowe') && (() => {
              const mandatoryKey = categories.find((c) => c.toLowerCase() === 'obowiązkowe')!;
              return (
                <>
                  <tr className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                    <td className="py-2 pr-4 font-semibold text-gray-600 dark:text-gray-300 sticky left-0 bg-gray-50/50 dark:bg-gray-800/30">
                      Mandatory
                    </td>
                    {months.map((m) => {
                      const amounts = m.categories.get(mandatoryKey) ?? new Map();
                      return (
                        <td key={m.month} className="text-right py-2 px-3 tabular-nums font-semibold text-gray-600 dark:text-gray-300">
                          {renderAmounts(amounts, 'font-semibold text-gray-600 dark:text-gray-300')}
                        </td>
                      );
                    })}
                    <td className="text-right py-2 px-3 tabular-nums font-semibold text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700">
                      {(() => {
                        const avg: CurrencyAmounts = new Map();
                        for (const c of currencies) {
                          const total = months.reduce((s, m) => s + (m.categories.get(mandatoryKey)?.get(c) ?? 0), 0);
                          if (months.length > 0 && total !== 0) avg.set(c, total / months.length);
                        }
                        return renderAmounts(avg, 'font-semibold text-gray-500 dark:text-gray-400');
                      })()}
                    </td>
                  </tr>
                  <tr className="bg-gray-50/50 dark:bg-gray-800/30">
                    <td className="py-2 pr-4 font-semibold text-gray-600 dark:text-gray-300 sticky left-0 bg-gray-50/50 dark:bg-gray-800/30">
                      Adjustable
                    </td>
                    {months.map((m, idx) => {
                      const adjustable: CurrencyAmounts = new Map();
                      for (const c of currencies) {
                        adjustable.set(c, (m.totalExpenses.get(c) ?? 0) - (m.categories.get(mandatoryKey)?.get(c) ?? 0));
                      }
                      const val = sumAmounts(adjustable);
                      const prevAdjustable = idx > 0 ? (() => {
                        const prev = months[idx - 1];
                        let s = 0;
                        for (const c of currencies) s += (prev.totalExpenses.get(c) ?? 0) - (prev.categories.get(mandatoryKey)?.get(c) ?? 0);
                        return s;
                      })() : null;
                      const diff = prevAdjustable !== null ? val - prevAdjustable : null;
                      return (
                        <td key={m.month} className="text-right py-2 px-3 tabular-nums font-semibold text-gray-600 dark:text-gray-300">
                          <div className="flex items-center justify-end gap-1">
                            {renderAmounts(adjustable, 'font-semibold text-gray-600 dark:text-gray-300')}
                            {diff !== null && diff !== 0 && val > 0 && <TrendIndicator diff={diff} />}
                          </div>
                        </td>
                      );
                    })}
                    <td className="text-right py-2 px-3 tabular-nums font-semibold text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700">
                      {(() => {
                        const avg: CurrencyAmounts = new Map();
                        for (const c of currencies) {
                          const total = months.reduce((s, m) => s + (m.totalExpenses.get(c) ?? 0) - (m.categories.get(mandatoryKey)?.get(c) ?? 0), 0);
                          if (months.length > 0 && total !== 0) avg.set(c, total / months.length);
                        }
                        return renderAmounts(avg, 'font-semibold text-gray-500 dark:text-gray-400');
                      })()}
                    </td>
                  </tr>
                </>
              );
            })()}

            {/* Total expenses row */}
            <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-red-50/50 dark:bg-red-950/20">
              <td className="py-2.5 pr-4 font-bold text-red-700 dark:text-red-400 sticky left-0 bg-red-50/50 dark:bg-red-950/20">
                Total Expenses
              </td>
              {months.map((m, idx) => {
                const val = sumAmounts(m.totalExpenses);
                const prevTotal = idx > 0 ? sumAmounts(months[idx - 1].totalExpenses) : null;
                const diff = prevTotal !== null ? val - prevTotal : null;
                return (
                  <td key={m.month} className="text-right py-2.5 px-3 tabular-nums font-bold text-red-600 dark:text-red-400">
                    <div className="flex items-center justify-end gap-1">
                      {renderAmounts(m.totalExpenses, 'font-bold text-red-600 dark:text-red-400')}
                      {diff !== null && diff !== 0 && <TrendIndicator diff={diff} />}
                    </div>
                  </td>
                );
              })}
              <td className="text-right py-2.5 px-3 tabular-nums font-bold text-red-600 dark:text-red-400 border-l border-gray-200 dark:border-gray-700">
                {renderAmounts(avgTotalExpenses, 'font-bold text-red-600 dark:text-red-400')}
              </td>
            </tr>

            {/* Net row */}
            <tr className="bg-blue-50/50 dark:bg-blue-950/20">
              <td className="py-2.5 pr-4 font-bold text-blue-700 dark:text-blue-400 sticky left-0 bg-blue-50/50 dark:bg-blue-950/20">
                Net (Income - Expenses)
              </td>
              {months.map((m) => {
                const netAmounts: CurrencyAmounts = new Map();
                for (const c of currencies) {
                  netAmounts.set(c, (m.totalIncome.get(c) ?? 0) - (m.totalExpenses.get(c) ?? 0));
                }
                if (!isAllCurrencies || currencies.length <= 1) {
                  const net = sumAmounts(netAmounts);
                  return (
                    <td key={m.month} className={`text-right py-2.5 px-3 tabular-nums font-bold ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {net >= 0 ? '+' : ''}{net.toFixed(0)}
                    </td>
                  );
                }
                return (
                  <td key={m.month} className="text-right py-2.5 px-3 tabular-nums font-bold">
                    <div className="flex flex-col items-end gap-0.5">
                      {currencies.map((c) => {
                        const net = netAmounts.get(c) ?? 0;
                        if (net === 0 && !(m.totalIncome.has(c) || m.totalExpenses.has(c))) return null;
                        return (
                          <span key={c} className={net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 mr-1">{currencySymbol(c)}</span>
                            {net >= 0 ? '+' : ''}{net.toFixed(0)}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                );
              })}
              <td className="text-right py-2.5 px-3 tabular-nums font-bold border-l border-gray-200 dark:border-gray-700">
                {(() => {
                  const netAvg: CurrencyAmounts = new Map();
                  for (const c of currencies) {
                    netAvg.set(c, (avgTotalIncome.get(c) ?? 0) - (avgTotalExpenses.get(c) ?? 0));
                  }
                  if (!isAllCurrencies || currencies.length <= 1) {
                    const net = sumAmounts(netAvg);
                    return (
                      <span className={net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                        {net >= 0 ? '+' : ''}{net.toFixed(0)}
                      </span>
                    );
                  }
                  return (
                    <div className="flex flex-col items-end gap-0.5">
                      {currencies.map((c) => {
                        const net = netAvg.get(c) ?? 0;
                        return (
                          <span key={c} className={net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 mr-1">{currencySymbol(c)}</span>
                            {net >= 0 ? '+' : ''}{net.toFixed(0)}
                          </span>
                        );
                      })}
                    </div>
                  );
                })()}
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
