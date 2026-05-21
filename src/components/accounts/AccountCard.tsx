import { useMemo } from 'react';
import type { Transaction, AccountBalance } from '../../types';
import { formatAmount } from '../../lib/currency';
import { CurrencyBadge } from '../shared/CurrencyBadge';
import { InkArrow } from '../shared/Ornaments';

interface Props {
  account: AccountBalance;
  transactions: Transaction[];
  index?: number;
}

function toRomanLower(n: number): string {
  const vals: [number, string][] = [
    [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'],
    [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i'],
  ];
  let out = '';
  for (const [v, s] of vals) { while (n >= v) { out += s; n -= v; } }
  return out;
}

export function AccountCard({ account, transactions, index }: Props) {
  const stats = useMemo(() => {
    const acctTxns = transactions.filter((t) => t.account === account.account);
    const income = acctTxns.filter((t) => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
    const expenses = acctTxns.filter((t) => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
    const expenseReturns = acctTxns.filter((t) => t.type === 'ExpenseReturn').reduce((s, t) => s + Math.abs(t.amount), 0);
    const transfersIn = acctTxns.filter((t) => t.type === 'Transfer' && t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const transfersOut = acctTxns.filter((t) => t.type === 'Transfer' && t.amount < 0).reduce((s, t) => s + t.amount, 0);
    const net = income + expenses + expenseReturns;
    return { income, expenses: Math.abs(expenses), transfersIn, transfersOut: Math.abs(transfersOut), net };
  }, [account.account, transactions]);

  const netPositive = stats.net > 0;
  const netNeutral = stats.net === 0;

  return (
    <article className="py-5 border-b border-rule-soft">
      <header className="flex items-baseline justify-between mb-2 gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          {index != null && (
            <span className="font-smallcaps tracking-[0.22em] text-[16px] text-brass shrink-0">
              no. {toRomanLower(index)}
            </span>
          )}
          <h3 className="font-display text-xl text-ink truncate" title={account.account}>
            {account.account}
          </h3>
        </div>
        <CurrencyBadge currency={account.currency} />
      </header>

      <div className="font-display text-xl font-normal text-ink tabular-nums mb-3">
        {formatAmount(account.currentBalance, account.currency)}
      </div>

      <dl className="text-sm space-y-1 mb-3">
        <Row label="Income"   value={`+ ${formatAmount(stats.income, account.currency)}`}   tone="moss" />
        <Row label="Expenses" value={`− ${formatAmount(stats.expenses, account.currency)}`} tone="vermillion" />
        {stats.transfersIn > 0 && (
          <Row label="Transfers in"  value={`+ ${formatAmount(stats.transfersIn, account.currency)}`}  tone="indigo" />
        )}
        {stats.transfersOut > 0 && (
          <Row label="Transfers out" value={`− ${formatAmount(stats.transfersOut, account.currency)}`} tone="indigo" />
        )}
      </dl>

      <div className="flex items-center gap-2 pt-2 border-t border-rule-soft/60">
        {!netNeutral && (
          <InkArrow
            direction={netPositive ? 'up' : 'down'}
            className={`w-2.5 h-3 ${netPositive ? 'text-moss' : 'text-vermillion'}`}
          />
        )}
        <span className="font-smallcaps tracking-[0.22em] text-[15px] text-quill">net</span>
        <span className={`text-sm tabular-nums ${netPositive ? 'text-moss' : netNeutral ? 'text-faded' : 'text-vermillion'}`}>
          {netPositive ? '+ ' : netNeutral ? '' : '− '}{formatAmount(Math.abs(stats.net), account.currency)}
        </span>
      </div>
    </article>
  );
}

const toneClass: Record<string, string> = {
  moss: 'text-moss',
  vermillion: 'text-vermillion',
  indigo: 'text-indigoink',
};

function Row({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="font-smallcaps tracking-[0.22em] text-[14px] text-quill">{label}</span>
      <span className={`tabular-nums ${toneClass[tone]} truncate`}>{value}</span>
    </div>
  );
}
