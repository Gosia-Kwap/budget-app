import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategoryTotal } from '../../lib/transforms';
import { useBudget } from '../../context/BudgetContext';
import { currencySymbol, listCurrencies, currencyIndex } from '../../lib/currency';
import { toRoman } from '../../lib/format';
import type { Currency } from '../../types';
import { SectionHeading } from '../overview/SummaryCards';

// Ledger ramp — earth tones with brass and indigo accents
const COLORS = [
  '#7a3520', '#8b5a3c', '#9a7d3a', '#4a5d3a',
  '#2c4a6b', '#4a4a2e', '#2f3622', '#2e3a25',
  '#a89878', '#8a8060', '#5a4a3a', '#0c1206',
];

interface Props {
  categories: CategoryTotal[];
  selected: string | null;
  onSelect: (cat: string | null) => void;
  currencyOverride?: Currency;
  compact?: boolean;
}

export function CategoryPieChart({ categories, selected, onSelect, currencyOverride, compact }: Props) {
  const { filters, data: budget } = useBudget();
  const allCurrencies = useMemo(() => listCurrencies(budget), [budget]);
  const currency = currencyOverride ?? (filters.currencyMode === 'filtered' ? filters.filterCurrency : undefined);
  const currencyLabel = currency ? `${currencySymbol(currency)} ` : '';

  const data = categories.map((c) => ({
    name: c.category,
    value: Math.round(c.total * 100) / 100,
  }));

  const title = currencyOverride ? `In ${currencyOverride.toLowerCase()}` : 'Spending by category';
  // Plates I-III are the fixed charts; the per-currency plates carry on from IV.
  const kicker = currencyOverride
    ? `Plate ${toRoman(4 + currencyIndex(currencyOverride, allCurrencies))}`
    : 'Plate III';

  return (
    <section>
      <SectionHeading kicker={kicker} title={title} />
      <div className="border-t border-rule" />
      <div className={`${compact ? 'h-64' : 'h-80'} pt-6`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={compact ? 42 : 72}
              outerRadius={compact ? 76 : 120}
              paddingAngle={1}
              dataKey="value"
              animationDuration={300}
              onClick={(_, idx) => {
                const name = data[idx]?.name;
                onSelect(selected === name ? null : name);
              }}
              className="cursor-pointer"
            >
              {data.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[i % COLORS.length]}
                  opacity={selected && selected !== entry.name ? 0.25 : 1}
                  stroke="#e8e2d0"
                  strokeWidth={selected === entry.name ? 2 : 1}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#eee5cb',
                border: '1px solid #8a8060',
                borderRadius: 0,
                fontSize: 12,
                fontFamily: 'EB Garamond, Georgia, serif',
                color: '#0c1206',
                padding: '6px 10px',
              }}
              labelStyle={{ color: '#2f3622', fontStyle: 'italic' }}
              formatter={(value) => `${currencyLabel}${Number(value).toFixed(2)}`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 justify-center">
        {data.map((d, i) => (
          <button
            key={d.name}
            onClick={() => onSelect(selected === d.name ? null : d.name)}
            className={`flex items-center gap-2 text-base italic transition-opacity duration-150 ${
              selected && selected !== d.name ? 'opacity-30' : ''
            }`}
          >
            <span
              className="w-2.5 h-2.5 inline-block"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-faded">{d.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
