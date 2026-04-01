import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategoryTotal } from '../../lib/transforms';
import { useBudget } from '../../context/BudgetContext';
import { CURRENCY_SYMBOLS } from '../../lib/currency';
import type { Currency } from '../../types';

const COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
];

interface Props {
  categories: CategoryTotal[];
  selected: string | null;
  onSelect: (cat: string | null) => void;
  currencyOverride?: Currency;
  compact?: boolean;
}

export function CategoryPieChart({ categories, selected, onSelect, currencyOverride, compact }: Props) {
  const { darkMode, filters } = useBudget();
  const currency = currencyOverride ?? (filters.currencyMode === 'filtered' ? filters.filterCurrency : undefined);
  const currencyLabel = currency ? `${CURRENCY_SYMBOLS[currency]} ` : '';

  const data = categories.map((c) => ({
    name: c.category,
    value: Math.round(c.total * 100) / 100,
  }));

  const gridColor = darkMode ? '#374151' : '#e5e7eb';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
        {currencyOverride ? `${currencyOverride} Spending` : 'Spending by Category'}
      </h3>
      <div className={compact ? 'h-48' : 'h-72'}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={compact ? 35 : 60}
              outerRadius={compact ? 65 : 100}
              paddingAngle={2}
              dataKey="value"
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
                  opacity={selected && selected !== entry.name ? 0.3 : 1}
                  stroke={selected === entry.name ? '#fff' : 'none'}
                  strokeWidth={selected === entry.name ? 2 : 0}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? '#1f2937' : '#fff',
                border: `1px solid ${gridColor}`,
                borderRadius: 8,
                fontSize: 13,
              }}
              formatter={(value: number) => `${currencyLabel}${value.toFixed(2)}`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {data.map((d, i) => (
          <button
            key={d.name}
            onClick={() => onSelect(selected === d.name ? null : d.name)}
            className={`flex items-center gap-1.5 text-xs transition-opacity ${
              selected && selected !== d.name ? 'opacity-40' : ''
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-gray-600 dark:text-gray-400">{d.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
