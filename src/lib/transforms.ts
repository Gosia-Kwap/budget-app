import type { Transaction, Currency } from '../types';

export function filterByDateRange(
  transactions: Transaction[],
  start: Date | null,
  end: Date | null
): Transaction[] {
  if (!start && !end) return transactions;
  return transactions.filter((t) => {
    if (start && t.date < start) return false;
    if (end && t.date > end) return false;
    return true;
  });
}

// Resolve grouped expense returns: for each GroupID that has both Expense and
// ExpenseReturn transactions, compute the net and adjust the original expense
// amounts. The ExpenseReturn rows are removed from the output so downstream
// code (monthly bucketing, category totals) sees only the net cost attributed
// to the original expense's month/category. Non-grouped ExpenseReturns are
// kept as-is for the existing per-month subtraction logic.
export function resolveExpenseReturns(transactions: Transaction[]): Transaction[] {
  // Build groups
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (t.groupId) {
      if (!groups.has(t.groupId)) groups.set(t.groupId, []);
      groups.get(t.groupId)!.push(t);
    }
  }

  const adjustedAmounts = new Map<Transaction, number>();
  const skip = new Set<Transaction>();

  for (const [, group] of groups) {
    const expenses = group.filter((t) => t.type === 'Expense');
    const returns = group.filter((t) => t.type === 'ExpenseReturn');

    if (returns.length === 0) continue;

    // Net of the group: expenses are negative, returns are positive
    const groupNet = group.reduce((s, t) => s + t.amount, 0);
    const totalExpenseAbs = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);

    // Distribute net proportionally across the original expense transactions
    if (totalExpenseAbs > 0) {
      for (const t of expenses) {
        const proportion = Math.abs(t.amount) / totalExpenseAbs;
        adjustedAmounts.set(t, groupNet * proportion);
      }
    }

    // Remove grouped ExpenseReturn rows — their effect is absorbed into the expenses
    for (const t of returns) {
      skip.add(t);
    }
  }

  return transactions
    .filter((t) => !skip.has(t))
    .map((t) => {
      const adj = adjustedAmounts.get(t);
      return adj !== undefined ? { ...t, amount: adj } : t;
    });
}

// Resolve GroupID: returns net amounts per group
// Transactions in a group contribute their net, not individual amounts
export function resolveGroupNets(transactions: Transaction[]): Map<string, number> {
  const groups = new Map<string, number>();
  for (const t of transactions) {
    if (t.groupId) {
      groups.set(t.groupId, (groups.get(t.groupId) ?? 0) + t.amount);
    }
  }
  return groups;
}

// Get the effective amount for a transaction considering its group
export function getEffectiveAmount(t: Transaction, groupNets: Map<string, number>, groupSizes: Map<string, number>): number {
  if (!t.groupId) return t.amount;
  const net = groupNets.get(t.groupId) ?? t.amount;
  const size = groupSizes.get(t.groupId) ?? 1;
  // Distribute net evenly so totals are correct
  return net / size;
}

function getGroupSizes(transactions: Transaction[]): Map<string, number> {
  const sizes = new Map<string, number>();
  for (const t of transactions) {
    if (t.groupId) {
      sizes.set(t.groupId, (sizes.get(t.groupId) ?? 0) + 1);
    }
  }
  return sizes;
}

export interface CurrencySummary {
  income: number;
  expenses: number;
  net: number;
  transfers: number;
}

export function summarizeByCurrency(transactions: Transaction[]): Map<Currency, CurrencySummary> {
  const groupNets = resolveGroupNets(transactions);
  const groupSizes = getGroupSizes(transactions);
  const result = new Map<Currency, CurrencySummary>();

  const ensure = (c: Currency) => {
    if (!result.has(c)) result.set(c, { income: 0, expenses: 0, net: 0, transfers: 0 });
    return result.get(c)!;
  };

  for (const t of transactions) {
    const s = ensure(t.currency);
    const effective = getEffectiveAmount(t, groupNets, groupSizes);

    if (t.type === 'Transfer') {
      s.transfers += Math.abs(effective);
    } else if (t.type === 'Income') {
      s.income += effective;
      s.net += effective;
    } else if (t.type === 'ExpenseReturn') {
      // Expense return offsets expenses: subtract from expenses, add to net
      s.expenses -= Math.abs(effective);
      s.net += Math.abs(effective);
    } else {
      // Expense: amount is negative
      s.expenses += Math.abs(effective);
      s.net += effective;
    }
  }

  return result;
}

export interface CategoryTotal {
  category: string;
  total: number;
  subcategories: Map<string, number>;
}

export function groupByCategory(transactions: Transaction[]): CategoryTotal[] {
  const groupNets = resolveGroupNets(transactions);
  const groupSizes = getGroupSizes(transactions);
  const cats = new Map<string, { total: number; subs: Map<string, number> }>();

  // Count expenses and expense returns (returns offset the spending)
  const expenseRelated = transactions.filter((t) => t.type === 'Expense' || t.type === 'ExpenseReturn');

  for (const t of expenseRelated) {
    const effective = Math.abs(getEffectiveAmount(t, groupNets, groupSizes));
    const amount = t.type === 'ExpenseReturn' ? -effective : effective;
    const cat = t.category || 'Uncategorized';
    const sub = t.subcategory || 'Other';

    if (!cats.has(cat)) cats.set(cat, { total: 0, subs: new Map() });
    const entry = cats.get(cat)!;
    entry.total += amount;
    entry.subs.set(sub, (entry.subs.get(sub) ?? 0) + amount);
  }

  return Array.from(cats.entries())
    .map(([category, { total, subs }]) => ({ category, total, subcategories: subs }))
    .sort((a, b) => b.total - a.total);
}

export interface MonthlyData {
  month: string; // YYYY-MM
  label: string; // e.g. "Nov 2025"
  income: number;
  expenses: number;
  net: number;
}

export function groupByMonth(transactions: Transaction[]): MonthlyData[] {
  const groupNets = resolveGroupNets(transactions);
  const groupSizes = getGroupSizes(transactions);
  const months = new Map<string, MonthlyData>();

  const nonTransfers = transactions.filter((t) => t.type !== 'Transfer');

  for (const t of nonTransfers) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    const effective = getEffectiveAmount(t, groupNets, groupSizes);

    if (!months.has(key)) {
      const label = t.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      months.set(key, { month: key, label, income: 0, expenses: 0, net: 0 });
    }
    const m = months.get(key)!;

    if (t.type === 'Income') {
      m.income += effective;
    } else if (t.type === 'ExpenseReturn') {
      m.expenses -= Math.abs(effective);
      m.net += Math.abs(effective);
    } else {
      m.expenses += Math.abs(effective);
    }
    m.net += effective;
  }

  return Array.from(months.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export function getDateRange(transactions: Transaction[]): { min: Date; max: Date } {
  if (transactions.length === 0) {
    const now = new Date();
    return { min: now, max: now };
  }
  let min = transactions[0].date;
  let max = transactions[0].date;
  for (const t of transactions) {
    if (t.date < min) min = t.date;
    if (t.date > max) max = t.date;
  }
  return { min, max };
}

export function getAvailableMonths(transactions: Transaction[]): { key: string; label: string }[] {
  const set = new Set<string>();
  const result: { key: string; label: string }[] = [];

  for (const t of transactions) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    if (!set.has(key)) {
      set.add(key);
      result.push({
        key,
        label: t.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      });
    }
  }

  return result.sort((a, b) => a.key.localeCompare(b.key));
}

export function calculateRunningBalances(
  account: string,
  startingBalance: number,
  transactions: Transaction[]
): { date: Date; balance: number }[] {
  const acctTxns = transactions
    .filter((t) => t.account === account)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  let balance = startingBalance;
  const points: { date: Date; balance: number }[] = [{ date: acctTxns[0]?.date ?? new Date(), balance }];

  for (const t of acctTxns) {
    balance += t.amount;
    points.push({ date: t.date, balance });
  }

  return points;
}
