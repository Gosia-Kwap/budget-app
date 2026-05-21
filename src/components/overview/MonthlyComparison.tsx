import { Fragment, useEffect, useMemo, useState } from 'react';
import type { Transaction, Currency } from '../../types';
import { useBudget } from '../../context/BudgetContext';
import { CURRENCY_SYMBOLS } from '../../lib/currency';
import { SectionHeading } from './SummaryCards';
import { InkArrow } from '../shared/Ornaments';

interface Props {
  transactions: Transaction[];
}

type CurrencyAmounts = Map<Currency, number>;

interface MonthCategoryData {
  month: string;
  label: string;
  categories: Map<string, CurrencyAmounts>;
  subcategories: Map<string, Map<string, CurrencyAmounts>>;
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
        const label = t.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthMap.set(key, { month: key, label, categories: new Map(), subcategories: new Map(), totalExpenses: new Map(), totalIncome: new Map() });
      }
      const m = monthMap.get(key)!;
      const cat = t.category || 'Other';
      const sub = t.subcategory || 'Other';
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
        const label = t.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthMap.set(key, { month: key, label, categories: new Map(), subcategories: new Map(), totalExpenses: new Map(), totalIncome: new Map() });
      }
      addAmount(monthMap.get(key)!.totalIncome, t.currency, t.amount);
    }

    const allMonths = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));

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
    for (const cat of categorySet) {
      if (!seen.has(cat)) categoryOrder.push(cat);
    }

    return { allMonths, categories: categoryOrder };
  }, [transactions, data?.categories]);

  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(() => {
    const keys = allMonthData.allMonths.map((m) => m.month);
    return new Set(keys.slice(-3));
  });

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

  function renderAmounts(amounts: CurrencyAmounts, className?: string) {
    if (!isAllCurrencies || currencies.length <= 1) {
      const val = sumAmounts(amounts);
      return <span className={className}>{val === 0 ? <span className="text-rule">—</span> : Math.round(val).toLocaleString('en-US')}</span>;
    }
    return (
      <div className="flex flex-col items-end gap-0.5">
        {currencies.map((c) => {
          const val = amounts.get(c) ?? 0;
          if (val === 0) return null;
          return (
            <span key={c} className={className}>
              <span className="text-[10px] text-quill mr-1.5">{CURRENCY_SYMBOLS[c]}</span>
              {Math.round(val).toLocaleString('en-US')}
            </span>
          );
        })}
        {sumAmounts(amounts) === 0 && <span className="text-rule">—</span>}
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
    <section className="mb-12">
      <SectionHeading
        kicker="Comparison of months"
        title="Entries by category"
        right={
          <div className="flex items-center gap-4 font-smallcaps tracking-[0.2em] text-[15px]">
            <span className="text-quill">show</span>
            <QuickButton label="last 3" active={selectedMonths.size === 3 && isLastN(selectedMonths, allMonthData.allMonths, 3)} onClick={() => selectLast(3)} />
            <QuickButton label="last 6" active={selectedMonths.size === 6 && isLastN(selectedMonths, allMonthData.allMonths, 6)} onClick={() => selectLast(6)} />
            <QuickButton label="all" active={selectedMonths.size === allMonthData.allMonths.length} onClick={selectAll} />
            <span className="text-rule">·</span>
            <QuickButton
              label={allExpanded ? 'collapse' : 'expand all'}
              active={allExpanded}
              onClick={() => setExpandedCategories(allExpanded ? new Set() : new Set(categories))}
            />
          </div>
        }
      />

      {/* Month index — bracketed chips */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 mb-5 pb-4 border-b border-rule-soft">
        {allMonthData.allMonths.map((m) => {
          const isSelected = selectedMonths.has(m.month);
          return (
            <button
              key={m.month}
              onClick={() => toggleMonth(m.month)}
              className={`font-smallcaps tracking-[0.2em] text-[15.5px] transition-colors duration-150 ${
                isSelected
                  ? 'text-vermillion'
                  : 'text-quill hover:text-ink'
              }`}
            >
              {isSelected && <span className="text-brass mr-1.5">❧</span>}
              {m.label.toLowerCase()}
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-base">
          <thead>
            <tr>
              <th className="text-left py-2.5 pl-2 pr-4 font-smallcaps tracking-[0.2em] text-[16px] text-quill font-normal border-b border-ink sticky left-0 bg-paper">
                Category
              </th>
              {months.map((m) => (
                <th key={m.month} className="text-right py-2.5 px-3 font-smallcaps tracking-[0.2em] text-[16px] text-quill font-normal border-b border-ink min-w-[110px]">
                  {m.label.toLowerCase()}
                </th>
              ))}
              <th className="text-right py-2.5 px-3 pr-2 font-smallcaps tracking-[0.2em] text-[16px] text-brass font-normal border-b border-ink min-w-[110px] border-l border-rule-soft">
                Average
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Income */}
            <tr className="border-b border-rule-soft">
              <td className="py-2.5 pl-2 pr-4 font-smallcaps tracking-[0.2em] text-[15.5px] text-moss-deep sticky left-0 bg-paper">
                Income
              </td>
              {months.map((m) => (
                <td key={m.month} className="text-right py-2.5 px-3 font-display text-xl text-moss">
                  {renderAmounts(m.totalIncome, 'text-moss')}
                </td>
              ))}
              <td className="text-right py-2.5 px-3 pr-2 font-display text-xl text-moss border-l border-rule-soft">
                {renderAmounts(avgTotalIncome, 'text-moss')}
              </td>
            </tr>

            {/* Category rows */}
            {categories.map((cat) => {
              const avg = avgByCategory.get(cat) ?? 0;
              const isExpanded = expandedCategories.has(cat);
              return (
                <Fragment key={cat}>
                  <tr
                    className="border-b border-rule-soft hover:bg-surface/50 cursor-pointer transition-colors duration-150"
                    onClick={() => toggleCategory(cat)}
                  >
                    <td className="py-2 pl-2 pr-4 text-ink sticky left-0 bg-paper hover:bg-surface/50">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-faded text-xs w-2 inline-block">{isExpanded ? '▾' : '▸'}</span>
                        <span className="italic">{cat}</span>
                      </span>
                    </td>
                    {months.map((m, idx) => {
                      const amounts = m.categories.get(cat) ?? new Map();
                      const val = sumAmounts(amounts);
                      const prevVal = idx > 0 ? sumAmounts(months[idx - 1].categories.get(cat) ?? new Map()) : null;
                      const diff = prevVal !== null ? val - prevVal : null;

                      const isHigh = val > avg * 1.2 && avg > 0;
                      return (
                        <td key={m.month} className="text-right py-2 px-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {renderAmounts(
                              amounts,
                              val === 0
                                ? 'text-rule'
                                : isHigh
                                  ? 'text-vermillion font-medium'
                                  : 'text-ink'
                            )}
                            {diff !== null && diff !== 0 && val > 0 && (
                              <TrendIndicator diff={diff} />
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="text-right py-2 px-3 pr-2 text-faded border-l border-rule-soft">
                      {(() => {
                        const avgAmounts: CurrencyAmounts = new Map();
                        for (const c of currencies) {
                          const total = months.reduce((s, m) => s + (m.categories.get(cat)?.get(c) ?? 0), 0);
                          if (months.length > 0 && total !== 0) avgAmounts.set(c, total / months.length);
                        }
                        return renderAmounts(avgAmounts, 'text-faded italic');
                      })()}
                    </td>
                  </tr>
                  {isExpanded && (subcategoriesFor.get(cat) ?? []).map((sub) => (
                    <tr key={`${cat}-${sub}`} className="border-b border-rule-soft/60 bg-surface/30">
                      <td className="py-2 pl-7 pr-4 text-base text-quill italic sticky left-0 bg-surface/30">
                        {sub}
                      </td>
                      {months.map((m) => {
                        const amounts = m.subcategories.get(cat)?.get(sub) ?? new Map();
                        return (
                          <td key={m.month} className="text-right py-2 px-3 text-base">
                            {renderAmounts(amounts, 'text-quill')}
                          </td>
                        );
                      })}
                      <td className="text-right py-2 px-3 pr-2 text-base border-l border-rule-soft">
                        {(() => {
                          const avgAmounts: CurrencyAmounts = new Map();
                          for (const c of currencies) {
                            const total = months.reduce((s, m) => s + (m.subcategories.get(cat)?.get(sub)?.get(c) ?? 0), 0);
                            if (months.length > 0 && total !== 0) avgAmounts.set(c, total / months.length);
                          }
                          return renderAmounts(avgAmounts, 'text-quill italic');
                        })()}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}

            {/* Mandatory vs Adjustable subtotals */}
            {categories.some((c) => c.toLowerCase() === 'obowiązkowe') && (() => {
              const mandatoryKey = categories.find((c) => c.toLowerCase() === 'obowiązkowe')!;
              return (
                <Fragment>
                  <tr className="border-t border-ink bg-surface/40">
                    <td className="py-2 pl-2 pr-4 font-smallcaps tracking-[0.2em] text-[15.5px] text-faded sticky left-0 bg-surface/40">
                      Compulsory
                    </td>
                    {months.map((m) => {
                      const amounts = m.categories.get(mandatoryKey) ?? new Map();
                      return (
                        <td key={m.month} className="text-right py-2 px-3 text-faded">
                          {renderAmounts(amounts, 'text-faded font-medium')}
                        </td>
                      );
                    })}
                    <td className="text-right py-2 px-3 pr-2 text-faded border-l border-rule-soft">
                      {(() => {
                        const avg: CurrencyAmounts = new Map();
                        for (const c of currencies) {
                          const total = months.reduce((s, m) => s + (m.categories.get(mandatoryKey)?.get(c) ?? 0), 0);
                          if (months.length > 0 && total !== 0) avg.set(c, total / months.length);
                        }
                        return renderAmounts(avg, 'text-faded font-medium');
                      })()}
                    </td>
                  </tr>
                  <tr className="bg-surface/40 border-b border-rule">
                    <td className="py-2 pl-2 pr-4 font-smallcaps tracking-[0.2em] text-[15.5px] text-faded sticky left-0 bg-surface/40">
                      Discretionary
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
                        <td key={m.month} className="text-right py-2 px-3 text-faded">
                          <div className="flex items-center justify-end gap-1.5">
                            {renderAmounts(adjustable, 'text-faded font-medium')}
                            {diff !== null && diff !== 0 && val > 0 && <TrendIndicator diff={diff} />}
                          </div>
                        </td>
                      );
                    })}
                    <td className="text-right py-2 px-3 pr-2 text-faded border-l border-rule-soft">
                      {(() => {
                        const avg: CurrencyAmounts = new Map();
                        for (const c of currencies) {
                          const total = months.reduce((s, m) => s + (m.totalExpenses.get(c) ?? 0) - (m.categories.get(mandatoryKey)?.get(c) ?? 0), 0);
                          if (months.length > 0 && total !== 0) avg.set(c, total / months.length);
                        }
                        return renderAmounts(avg, 'text-faded font-medium');
                      })()}
                    </td>
                  </tr>
                </Fragment>
              );
            })()}

            {/* Total expenses */}
            <tr className="border-t border-ink">
              <td className="py-3 pl-2 pr-4 font-smallcaps tracking-[0.22em] text-[16px] text-vermillion sticky left-0 bg-paper">
                Total expenses
              </td>
              {months.map((m, idx) => {
                const val = sumAmounts(m.totalExpenses);
                const prevTotal = idx > 0 ? sumAmounts(months[idx - 1].totalExpenses) : null;
                const diff = prevTotal !== null ? val - prevTotal : null;
                return (
                  <td key={m.month} className="text-right py-3 px-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {renderAmounts(m.totalExpenses, 'font-display text-xl text-vermillion')}
                      {diff !== null && diff !== 0 && <TrendIndicator diff={diff} />}
                    </div>
                  </td>
                );
              })}
              <td className="text-right py-3 px-3 pr-2 border-l border-rule-soft">
                {renderAmounts(avgTotalExpenses, 'font-display text-xl text-vermillion')}
              </td>
            </tr>

            {/* Net */}
            <tr className="border-t border-rule-soft border-b border-ink">
              <td className="py-3 pl-2 pr-4 font-smallcaps tracking-[0.22em] text-[16px] text-brass sticky left-0 bg-paper">
                Net to keep
              </td>
              {months.map((m) => {
                const netAmounts: CurrencyAmounts = new Map();
                for (const c of currencies) {
                  netAmounts.set(c, (m.totalIncome.get(c) ?? 0) - (m.totalExpenses.get(c) ?? 0));
                }
                if (!isAllCurrencies || currencies.length <= 1) {
                  const net = sumAmounts(netAmounts);
                  return (
                    <td key={m.month} className={`text-right py-3 px-3 font-display text-xl ${net >= 0 ? 'text-moss' : 'text-vermillion'}`}>
                      {net >= 0 ? '+ ' : '− '}{Math.abs(Math.round(net)).toLocaleString('en-US')}
                    </td>
                  );
                }
                return (
                  <td key={m.month} className="text-right py-3 px-3">
                    <div className="flex flex-col items-end gap-0.5">
                      {currencies.map((c) => {
                        const net = netAmounts.get(c) ?? 0;
                        if (net === 0 && !(m.totalIncome.has(c) || m.totalExpenses.has(c))) return null;
                        return (
                          <span key={c} className={`font-display text-xl ${net >= 0 ? 'text-moss' : 'text-vermillion'}`}>
                            <span className="text-[10px] text-quill mr-1.5">{CURRENCY_SYMBOLS[c]}</span>
                            {net >= 0 ? '+ ' : '− '}{Math.abs(Math.round(net)).toLocaleString('en-US')}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                );
              })}
              <td className="text-right py-3 px-3 pr-2 border-l border-rule-soft">
                {(() => {
                  const netAvg: CurrencyAmounts = new Map();
                  for (const c of currencies) {
                    netAvg.set(c, (avgTotalIncome.get(c) ?? 0) - (avgTotalExpenses.get(c) ?? 0));
                  }
                  if (!isAllCurrencies || currencies.length <= 1) {
                    const net = sumAmounts(netAvg);
                    return (
                      <span className={`font-display text-xl ${net >= 0 ? 'text-moss' : 'text-vermillion'}`}>
                        {net >= 0 ? '+ ' : '− '}{Math.abs(Math.round(net)).toLocaleString('en-US')}
                      </span>
                    );
                  }
                  return (
                    <div className="flex flex-col items-end gap-0.5">
                      {currencies.map((c) => {
                        const net = netAvg.get(c) ?? 0;
                        return (
                          <span key={c} className={`font-display text-xl ${net >= 0 ? 'text-moss' : 'text-vermillion'}`}>
                            <span className="text-[10px] text-quill mr-1.5">{CURRENCY_SYMBOLS[c]}</span>
                            {net >= 0 ? '+ ' : '− '}{Math.abs(Math.round(net)).toLocaleString('en-US')}
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
    </section>
  );
}

function QuickButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`pb-[2px] border-b transition-colors duration-150 ${
        active
          ? 'text-vermillion border-vermillion'
          : 'text-faded border-transparent hover:text-ink hover:border-rule'
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
  return (
    <InkArrow
      direction={isUp ? 'up' : 'down'}
      className={`w-2 h-2.5 shrink-0 ${isUp ? 'text-vermillion' : 'text-moss'}`}
    />
  );
}
