import type { Transaction } from '../../types';
import type { CategoryTotal } from '../../lib/transforms';
import { formatAmount, CURRENCY_SYMBOLS } from '../../lib/currency';
import { CurrencyBadge } from '../shared/CurrencyBadge';
import { useBudget } from '../../context/BudgetContext';
import { SectionHeading } from '../overview/SummaryCards';

interface Props {
  categories: CategoryTotal[];
  transactions: Transaction[];
  expanded: string | null;
  onToggle: (cat: string) => void;
}

export function CategoryTable({ categories, transactions, expanded, onToggle }: Props) {
  const { filters } = useBudget();
  const total = categories.reduce((sum, c) => sum + c.total, 0);
  const currencyLabel =
    filters.currencyMode === 'filtered'
      ? `${CURRENCY_SYMBOLS[filters.filterCurrency]} `
      : '';

  return (
    <section>
      <SectionHeading kicker="Index" title="Category breakdown" />
      <div className="border-t border-rule" />
      <div className="border-t border-rule-soft mt-[2px]" />

      <div>
        {categories.map((cat) => {
          const pct = total > 0 ? (cat.total / total) * 100 : 0;
          const isOpen = expanded === cat.category;

          return (
            <div key={cat.category} className="border-b border-rule-soft">
              <button
                onClick={() => onToggle(cat.category)}
                className="w-full flex items-baseline gap-3 py-3.5 hover:bg-surface/40 transition-colors duration-150 text-left px-1"
              >
                <span className="text-faded text-sm w-3 inline-block">
                  {isOpen ? '▾' : '▸'}
                </span>
                <span className="flex-1 italic text-ink text-lg">{cat.category}</span>
                <span className="font-smallcaps tracking-[0.2em] text-[17px] text-quill">
                  {pct.toFixed(1)}%
                </span>
                <span className="font-display text-lg text-vermillion tabular-nums w-32 text-right">
                  {currencyLabel}{cat.total.toFixed(2)}
                </span>
              </button>
              {isOpen && (
                <div className="pl-7 pr-1 pb-4 pt-1 space-y-2">
                  {/* Subcategory rollups */}
                  <div className="space-y-1">
                    {Array.from(cat.subcategories.entries())
                      .sort((a, b) => b[1] - a[1])
                      .map(([sub, amount]) => {
                        const subPct = cat.total > 0 ? (amount / cat.total) * 100 : 0;
                        return (
                          <div
                            key={sub}
                            className="flex items-baseline gap-3 py-1 text-sm"
                          >
                            <span className="flex-1 italic text-faded">{sub}</span>
                            <span className="relative w-24 h-1 bg-rule-soft">
                              <span
                                className="absolute inset-y-0 left-0 bg-clay/70"
                                style={{ width: `${subPct}%` }}
                              />
                            </span>
                            <span className="tabular-nums text-faded w-24 text-right">
                              {currencyLabel}{amount.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                  </div>

                  {/* Recent transactions */}
                  <div className="mt-4 pt-3 border-t border-rule-soft/70">
                    <p className="font-smallcaps tracking-[0.24em] text-[14px] text-brass mb-2.5">
                      Recent entries
                    </p>
                    <div className="space-y-1">
                      {transactions
                        .filter((t) => (t.type === 'Expense' || t.type === 'ExpenseReturn') && t.category === cat.category)
                        .sort((a, b) => b.date.getTime() - a.date.getTime())
                        .slice(0, 10)
                        .map((t, i) => (
                          <div
                            key={i}
                            className="flex items-baseline gap-3 text-base text-quill"
                          >
                            <span className="w-20 shrink-0 font-smallcaps tracking-[0.18em] text-[14px]">
                              {t.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toLowerCase()}
                            </span>
                            <span className="flex-1 truncate italic">{t.subcategory}</span>
                            {t.description && (
                              <span className="flex-1 truncate text-rule">{t.description}</span>
                            )}
                            <CurrencyBadge currency={t.currency} />
                            <span className="tabular-nums text-vermillion w-24 text-right">
                              {formatAmount(Math.abs(t.amount), t.currency)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
