import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { AccountBalance, Transaction, Currency } from '../../../types';
import { calculateRunningBalances } from '../../../lib/transforms';
import { useBudget } from '../../../context/BudgetContext';
import { CURRENCY_SYMBOLS } from '../../../lib/currency';

const LINE_COLORS = [
  '#6366f1', '#22c55e', '#ef4444', '#f97316',
  '#8b5cf6', '#06b6d4', '#ec4899',
];

interface Props {
  accounts: AccountBalance[];
  transactions: Transaction[];
}

/** Build a unified daily timeline for a set of accounts sharing one currency. */
function buildTimeline(accounts: AccountBalance[], transactions: Transaction[]) {
  const balancesByAccount = accounts.map((acc) => ({
    account: acc.account,
    points: calculateRunningBalances(acc.account, acc.startingBalance, transactions),
  }));

  // Collect all dates across accounts, keyed by YYYY-MM-DD
  const allDates = new Map<string, Record<string, number>>();

  for (const { account, points } of balancesByAccount) {
    for (const p of points) {
      const key = p.date.toISOString().split('T')[0];
      const row = allDates.get(key) ?? {};
      // Keep only the last balance per day (cumulative)
      row[account] = p.balance;
      allDates.set(key, row);
    }
  }

  // Sort chronologically and forward-fill gaps
  const sorted = Array.from(allDates.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  const lastKnown: Record<string, number> = {};

  return sorted.map(([date, values]) => {
    for (const acc of accounts) {
      if (values[acc.account] != null) {
        lastKnown[acc.account] = values[acc.account];
      } else {
        values[acc.account] = lastKnown[acc.account] ?? acc.startingBalance;
      }
    }

    const d = new Date(date);
    return {
      date,
      label: d.toLocaleDateString('de-CH', { day: '2-digit', month: 'short' }),
      ...values,
    };
  });
}

function CurrencyChart({
  currency,
  accounts,
  transactions,
  darkMode,
}: {
  currency: Currency;
  accounts: AccountBalance[];
  transactions: Transaction[];
  darkMode: boolean;
}) {
  const data = useMemo(
    () => buildTimeline(accounts, transactions),
    [accounts, transactions],
  );

  if (data.length === 0) return null;

  const textColor = darkMode ? '#9ca3af' : '#6b7280';
  const gridColor = darkMode ? '#374151' : '#e5e7eb';

  return (
    <div>
      <h4 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
        {CURRENCY_SYMBOLS[currency]} Accounts
      </h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: textColor }}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 11, fill: textColor }}
              width={70}
              tickFormatter={(v: number) =>
                v >= 1000 || v <= -1000
                  ? `${(v / 1000).toFixed(1)}k`
                  : v.toString()
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? '#1f2937' : '#fff',
                border: `1px solid ${gridColor}`,
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: darkMode ? '#e5e7eb' : '#111827' }}
              formatter={(value: number, name: string) => [
                `${CURRENCY_SYMBOLS[currency]} ${value.toFixed(2)}`,
                name,
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: textColor }} />
            {accounts.map((acc, i) => (
              <Line
                key={acc.account}
                type="monotone"
                dataKey={acc.account}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function BalanceTimeline({ accounts, transactions }: Props) {
  const { darkMode, filters } = useBudget();

  // Group accounts by currency
  const byCurrency = useMemo(() => {
    const map = new Map<Currency, AccountBalance[]>();
    for (const acc of accounts) {
      const list = map.get(acc.currency) ?? [];
      list.push(acc);
      map.set(acc.currency, list);
    }
    return map;
  }, [accounts]);

  // If filtering by currency, only show that currency's chart
  const currencies = useMemo(() => {
    if (filters.currencyMode === 'filtered') {
      return byCurrency.has(filters.filterCurrency)
        ? [filters.filterCurrency]
        : [];
    }
    return Array.from(byCurrency.keys());
  }, [byCurrency, filters.currencyMode, filters.filterCurrency]);

  if (currencies.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-5">
        Balance Over Time
      </h3>
      <div className="space-y-8">
        {currencies.map((cur) => (
          <CurrencyChart
            key={cur}
            currency={cur}
            accounts={byCurrency.get(cur) ?? []}
            transactions={transactions}
            darkMode={darkMode}
          />
        ))}
      </div>
    </div>
  );
}
