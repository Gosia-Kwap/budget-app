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
import type { AccountBalance, Transaction, Currency } from '../../../types';
import { useBudget } from '../../../context/BudgetContext';
import { currencySymbol, formatAmount } from '../../../lib/currency';
import { TrendingUp, Wallet, PiggyBank, Percent } from 'lucide-react';
import { formatMonthLabel } from '../../../lib/format';

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
      const label = formatMonthLabel(t.date);
      months.set(key, { month: key, label, deposits: 0, withdrawals: 0, net: 0 });
    }
    const m = months.get(key)!;
    if (t.amount > 0) {
      m.deposits += t.amount;
    } else {
      m.withdrawals += Math.abs(t.amount);
    }
    m.net += t.amount;
  }

  return Array.from(months.values()).sort((a, b) => a.month.localeCompare(b.month));
}

function CurrencySavingsChart({
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
  const savingsNames = accounts.map((a) => a.account);

  const monthlyData = useMemo(
    () => buildMonthlySavings(savingsNames, transactions),
    [savingsNames.join(','), transactions]
  );

  const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);

  // Income for savings rate: all income in this currency across all accounts
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

  const textColor = darkMode ? '#9ca3af' : '#6b7280';
  const gridColor = darkMode ? '#374151' : '#e5e7eb';

  if (monthlyData.length === 0) return null;

  return (
    <div>
      <h4 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">
        {currencySymbol(currency)} Savings
      </h4>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard
          icon={<PiggyBank className="w-4 h-4" />}
          label="Balance"
          value={formatAmount(totalBalance, currency)}
          color="text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Avg monthly saving"
          value={formatAmount(avgNet, currency)}
          color={avgNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
        />
        <StatCard
          icon={<Wallet className="w-4 h-4" />}
          label="Total net saved"
          value={formatAmount(totalNet, currency)}
          color={totalNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
        />
        <StatCard
          icon={<Percent className="w-4 h-4" />}
          label="Savings rate"
          value={`${savingsRate.toFixed(1)}%`}
          color={savingsRate >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
        />
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={monthlyData}>
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
                Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString()
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? '#1f2937' : '#fff',
                border: `1px solid ${gridColor}`,
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value, name) => [
                `${currencySymbol(currency)} ${Math.abs(Number(value)).toFixed(2)}`,
                name,
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: textColor }} />
            <Bar
              dataKey="deposits"
              name="Deposits"
              fill="#22c55e"
              opacity={0.8}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="withdrawals"
              name="Withdrawals"
              fill="#ef4444"
              opacity={0.8}
              radius={[4, 4, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="net"
              name="Net"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 3, fill: '#6366f1' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 mb-1">
        {icon}
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <div className={`text-sm font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

export function SavingsOverview({ accounts, transactions }: Props) {
  const { darkMode, filters } = useBudget();

  const savingsAccounts = useMemo(
    () => accounts.filter((a) => a.isSavings),
    [accounts]
  );

  // Group savings accounts by currency
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
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-5">
        Savings Overview
      </h3>
      <div className="space-y-8">
        {currencies.map((cur) => (
          <CurrencySavingsChart
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
