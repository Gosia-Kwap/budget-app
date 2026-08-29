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
import type { AccountBalance, Transaction, Currency } from '../../types';
import { calculateRunningBalances } from '../../lib/transforms';
import { useBudget } from '../../context/BudgetContext';
import { currencySymbol } from '../../lib/currency';
import { SectionHeading } from '../overview/SummaryCards';
import { formatDayMonth } from '../../lib/format';

const LINE_COLORS = [
  '#7a3520', '#4a5d3a', '#2c4a6b', '#9a7d3a',
  '#8b5a3c', '#4a4a2e', '#2f3622',
];

interface Props {
  accounts: AccountBalance[];
  transactions: Transaction[];
}

function buildTimeline(accounts: AccountBalance[], transactions: Transaction[]) {
  const balancesByAccount = accounts.map((acc) => ({
    account: acc.account,
    points: calculateRunningBalances(acc.account, acc.startingBalance, transactions),
  }));

  const allDates = new Map<string, Record<string, number>>();

  for (const { account, points } of balancesByAccount) {
    for (const p of points) {
      const key = p.date.toISOString().split('T')[0];
      const row = allDates.get(key) ?? {};
      row[account] = p.balance;
      allDates.set(key, row);
    }
  }

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
      label: formatDayMonth(d),
      ...values,
    };
  });
}

function CurrencyChart({
  currency,
  accounts,
  transactions,
}: {
  currency: Currency;
  accounts: AccountBalance[];
  transactions: Transaction[];
}) {
  const data = useMemo(
    () => buildTimeline(accounts, transactions),
    [accounts, transactions],
  );

  if (data.length === 0) return null;

  return (
    <div>
      <h4 className="font-smallcaps tracking-[0.24em] text-[18px] text-brass mb-3">
        in {currency.toLowerCase()}  ·  {currencySymbol(currency)}
      </h4>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#b0a585" strokeDasharray="1 4" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 13, fill: '#4a4a2e', fontFamily: 'EB Garamond, Georgia, serif', fontStyle: 'italic' }}
              axisLine={{ stroke: '#8a8060' }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 13, fill: '#4a4a2e', fontFamily: 'EB Garamond, Georgia, serif' }}
              axisLine={false}
              tickLine={false}
              width={60}
              tickFormatter={(v: number) =>
                v >= 1000 || v <= -1000
                  ? `${(v / 1000).toFixed(1)}k`
                  : v.toString()
              }
            />
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
              labelStyle={{ color: '#2f3622', fontStyle: 'italic', marginBottom: 2 }}
              formatter={(value, name) => [
                `${currencySymbol(currency)} ${Number(value).toFixed(2)}`,
                name,
              ]}
            />
            <Legend
              wrapperStyle={{
                fontSize: 12,
                fontFamily: 'EB Garamond, Georgia, serif',
                fontStyle: 'italic',
                color: '#2f3622',
              }}
              iconType="plainline"
            />
            {accounts.map((acc, i) => (
              <Line
                key={acc.account}
                type="monotone"
                dataKey={acc.account}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={1.5}
                dot={false}
                connectNulls
                animationDuration={350}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function BalanceTimeline({ accounts, transactions }: Props) {
  const { filters } = useBudget();

  const byCurrency = useMemo(() => {
    const map = new Map<Currency, AccountBalance[]>();
    for (const acc of accounts) {
      const list = map.get(acc.currency) ?? [];
      list.push(acc);
      map.set(acc.currency, list);
    }
    return map;
  }, [accounts]);

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
    <section className="mt-12">
      <SectionHeading kicker="A chronicle" title="Balance through time" />
      <div className="border-t border-rule" />
      <div className="space-y-10 pt-6">
        {currencies.map((cur) => (
          <CurrencyChart
            key={cur}
            currency={cur}
            accounts={byCurrency.get(cur) ?? []}
            transactions={transactions}
          />
        ))}
      </div>
    </section>
  );
}
