import { useMemo } from 'react';
import {
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ComposedChart,
} from 'recharts';
import type { AccountBalance, Transaction, Currency } from '../../types';
import { useBudget } from '../../context/BudgetContext';
import { CURRENCY_SYMBOLS, formatAmount } from '../../lib/currency';
import { SectionHeading } from '../overview/SummaryCards';

interface Props {
  accounts: AccountBalance[];
  transactions: Transaction[];
}

interface MonthSavingsData {
  month: string;
  label: string;
  deposits: number;
  withdrawals: number;
  net: number;
}

function isSavingsAccount(name: string): boolean {
  return name.toLowerCase().includes('save');
}

function buildMonthlySavings(
  savingsAccountNames: string[],
  transactions: Transaction[]
): MonthSavingsData[] {
  const months = new Map<string, MonthSavingsData>();

  const transfers = transactions.filter(
    (t) => t.type === 'Transfer' && savingsAccountNames.includes(t.account)
  );

  for (const t of transfers) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    if (!months.has(key)) {
      const label = t.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      months.set(key, { month: key, label, deposits: 0, withdrawals: 0, net: 0 });
    }
    const m = months.get(key)!;
    if (t.amount > 0) m.deposits += t.amount;
    else m.withdrawals += Math.abs(t.amount);
    m.net += t.amount;
  }

  return Array.from(months.values()).sort((a, b) => a.month.localeCompare(b.month));
}

function CurrencySavingsChart({
  currency,
  accounts,
  transactions,
}: {
  currency: Currency;
  accounts: AccountBalance[];
  transactions: Transaction[];
}) {
  const savingsNames = accounts.map((a) => a.account);

  const monthlyData = useMemo(
    () => buildMonthlySavings(savingsNames, transactions),
    [savingsNames.join(','), transactions]
  );

  const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);

  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'Income' && t.currency === currency)
        .reduce((s, t) => s + t.amount, 0),
    [transactions, currency]
  );

  const totalDeposits = monthlyData.reduce((s, m) => s + m.deposits, 0);
  const totalWithdrawals = monthlyData.reduce((s, m) => s + m.withdrawals, 0);
  const totalNet = totalDeposits - totalWithdrawals;
  const avgNet = monthlyData.length > 0 ? totalNet / monthlyData.length : 0;
  const savingsRate = totalIncome > 0 ? (totalNet / totalIncome) * 100 : 0;

  if (monthlyData.length === 0) return null;

  return (
    <div>
      <h4 className="font-smallcaps tracking-[0.24em] text-[18px] text-brass mb-4">
        savings in {currency.toLowerCase()}  ·  {CURRENCY_SYMBOLS[currency]}
      </h4>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 mb-6 py-3 border-y border-rule-soft">
        <Stat label="Balance"          value={formatAmount(totalBalance, currency)} tone="brass" />
        <Stat label="Avg per month"    value={formatAmount(avgNet, currency)}        tone={avgNet >= 0 ? 'moss' : 'vermillion'} />
        <Stat label="Total saved"      value={formatAmount(totalNet, currency)}      tone={totalNet >= 0 ? 'moss' : 'vermillion'} />
        <Stat label="Savings rate"     value={`${savingsRate.toFixed(1)}%`}          tone={savingsRate >= 0 ? 'moss' : 'vermillion'} />
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
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
                Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString()
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
              formatter={(value: number, name: string) => [
                `${CURRENCY_SYMBOLS[currency]} ${Math.abs(value).toFixed(2)}`,
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
            <Bar dataKey="deposits" name="Deposits" fill="#4a5d3a" radius={[1, 1, 0, 0]} animationDuration={300} />
            <Bar dataKey="withdrawals" name="Withdrawals" fill="#7a3520" radius={[1, 1, 0, 0]} animationDuration={300} />
            <Line
              type="monotone"
              dataKey="net"
              name="Net"
              stroke="#9a7d3a"
              strokeWidth={1.5}
              dot={{ r: 2, fill: '#9a7d3a', stroke: 'none' }}
              animationDuration={350}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const toneClass: Record<string, string> = {
  moss: 'text-moss',
  vermillion: 'text-vermillion',
  brass: 'text-brass',
};

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div>
      <div className="font-smallcaps tracking-[0.24em] text-[16.5px] text-quill mb-2">{label}</div>
      <div className={`font-display text-lg tabular-nums ${toneClass[tone]}`}>{value}</div>
    </div>
  );
}

export function SavingsOverview({ accounts, transactions }: Props) {
  const { filters } = useBudget();

  const savingsAccounts = useMemo(
    () => accounts.filter((a) => isSavingsAccount(a.account)),
    [accounts]
  );

  const byCurrency = useMemo(() => {
    const map = new Map<Currency, AccountBalance[]>();
    for (const acc of savingsAccounts) {
      const list = map.get(acc.currency) ?? [];
      list.push(acc);
      map.set(acc.currency, list);
    }
    return map;
  }, [savingsAccounts]);

  const currencies = useMemo(() => {
    if (filters.currencyMode === 'filtered') {
      return byCurrency.has(filters.filterCurrency) ? [filters.filterCurrency] : [];
    }
    return Array.from(byCurrency.keys()).sort();
  }, [byCurrency, filters.currencyMode, filters.filterCurrency]);

  if (savingsAccounts.length === 0 || currencies.length === 0) return null;

  return (
    <section className="mt-12">
      <SectionHeading kicker="The reserve" title="Of savings &amp; reserve" />
      <div className="border-t border-rule" />
      <div className="space-y-10 pt-6">
        {currencies.map((cur) => (
          <CurrencySavingsChart
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
