import type { Currency, Transaction } from '../../types';
import type { CategoryTotal } from '../../lib/transforms';
import { formatAmount } from '../../lib/currency';
import { CurrencyBadge } from '../shared/CurrencyBadge';
import { SectionHeading } from '../overview/SummaryCards';

interface Props {
  perCurrency: Map<Currency, { transactions: Transaction[]; categories: CategoryTotal[] }>;
}

export function CurrencyComparisonTable({ perCurrency }: Props) {
  const currencies = Array.from(perCurrency.keys());

  const allCategories = new Set<string>();
  for (const { categories } of perCurrency.values()) {
    for (const cat of categories) allCategories.add(cat.category);
  }

  const lookup = new Map<string, Map<Currency, number>>();
  for (const [currency, { categories }] of perCurrency) {
    for (const cat of categories) {
      if (!lookup.has(cat.category)) lookup.set(cat.category, new Map());
      lookup.get(cat.category)!.set(currency, cat.total);
    }
  }

  const sortedCategories = Array.from(allCategories).sort((a, b) => {
    const totalA = currencies.reduce((s, c) => s + (lookup.get(a)?.get(c) ?? 0), 0);
    const totalB = currencies.reduce((s, c) => s + (lookup.get(b)?.get(c) ?? 0), 0);
    return totalB - totalA;
  });

  const totals = new Map<Currency, number>();
  for (const [currency, { categories }] of perCurrency) {
    totals.set(currency, categories.reduce((s, c) => s + c.total, 0));
  }

  return (
    <section>
      <SectionHeading kicker="A comparison" title="Spending by currency" />
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead>
            <tr>
              <th className="text-left py-2.5 pl-1 pr-4 font-smallcaps tracking-[0.2em] text-[14px] text-quill font-normal border-y border-ink">
                Category
              </th>
              {currencies.map((c) => (
                <th key={c} className="text-right py-2.5 px-4 font-normal border-y border-ink">
                  <CurrencyBadge currency={c} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedCategories.map((cat) => (
              <tr key={cat} className="border-b border-rule-soft">
                <td className="py-2 pl-1 pr-4 text-ink italic">{cat}</td>
                {currencies.map((c) => {
                  const amount = lookup.get(cat)?.get(c);
                  const total = totals.get(c) ?? 1;
                  const pct = amount ? (amount / total) * 100 : 0;
                  return (
                    <td key={c} className="py-2 px-4 text-right tabular-nums">
                      {amount ? (
                        <span className="text-ink">
                          {formatAmount(amount, c)}
                          <span className="text-[14px] text-quill ml-2 font-smallcaps tracking-[0.18em]">
                            {pct.toFixed(0)}%
                          </span>
                        </span>
                      ) : (
                        <span className="text-rule">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-t border-ink">
              <td className="py-3.5 pl-1 pr-4 font-smallcaps tracking-[0.22em] text-[16.5px] text-vermillion">
                Total
              </td>
              {currencies.map((c) => (
                <td key={c} className="py-3.5 px-4 text-right font-display text-lg text-vermillion tabular-nums">
                  {formatAmount(totals.get(c) ?? 0, c)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
