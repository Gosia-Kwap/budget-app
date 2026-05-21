import { useMemo } from 'react';
import type { Transaction, Currency } from '../../types';
import { summarizeByCurrency } from '../../lib/transforms';
import { CURRENCY_SYMBOLS } from '../../lib/currency';

interface Props {
  transactions: Transaction[];
}

type Col = {
  label: string;
  key: 'income' | 'expenses' | 'net' | 'transfers';
  tone: 'moss' | 'vermillion' | 'brass' | 'indigo';
};

const COLS: Col[] = [
  { label: 'Income',    key: 'income',    tone: 'moss' },
  { label: 'Expenses',  key: 'expenses',  tone: 'vermillion' },
  { label: 'Net',       key: 'net',       tone: 'brass' },
  { label: 'Transfers', key: 'transfers', tone: 'indigo' },
];

const toneClass: Record<Col['tone'], string> = {
  moss: 'text-moss',
  vermillion: 'text-vermillion',
  brass: 'text-brass',
  indigo: 'text-indigoink',
};

export function SummaryCards({ transactions }: Props) {
  const summary = useMemo(() => summarizeByCurrency(transactions), [transactions]);
  const currencies = Array.from(summary.keys()).sort();

  return (
    <section className="mb-10">
      <SectionHeading kicker="Recapitulation" title="Summary of the period" />

      <div className="border-t border-rule">
        <div className="border-t border-rule-soft mt-[2px]" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 md:gap-x-12 py-6">
        {COLS.map((col, idx) => (
          <div
            key={col.key}
            className={`relative ${idx > 0 ? 'md:pl-8 md:border-l md:border-rule-soft' : ''}`}
          >
            <div className="font-smallcaps tracking-[0.24em] text-[16px] text-faded mb-4">
              {col.label}
            </div>
            <div className="space-y-2">
              {currencies.map((c) => {
                const s = summary.get(c)!;
                let val: number;
                if (col.key === 'net') val = s.net;
                else if (col.key === 'transfers') val = s.transfers;
                else if (col.key === 'income') val = s.income;
                else val = Math.abs(s.expenses);
                if (col.key === 'transfers' && val === 0) return null;

                const isNegativeNet = col.key === 'net' && val < 0;
                const display = formatLedger(Math.abs(val), c);

                return (
                  <div key={c} className="flex items-baseline justify-between gap-3">
                    <span className="font-smallcaps tracking-[0.2em] text-[16px] text-quill">
                      {c.toLowerCase()}
                    </span>
                    <span className={`font-display text-xl font-normal ${toneClass[col.tone]} ${isNegativeNet ? 'text-vermillion' : ''}`}>
                      {col.key === 'net' && val !== 0 && (val > 0 ? '+ ' : '− ')}
                      {display}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-rule-soft" />
      <div className="border-t border-rule mt-[2px]" />
    </section>
  );
}

function formatLedger(n: number, c: Currency): string {
  const sym = CURRENCY_SYMBOLS[c];
  const fixed = n >= 1000
    ? n.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : n.toFixed(2);
  return `${sym} ${fixed}`;
}

export function SectionHeading({
  kicker,
  title,
  right,
}: {
  kicker?: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-4 gap-6 flex-wrap">
      <div>
        {kicker && (
          <div className="font-smallcaps tracking-[0.24em] text-[16px] text-brass mb-2">
            {kicker}
          </div>
        )}
        <h2 className="font-display text-4xl font-normal text-ink leading-none">
          {title}
        </h2>
      </div>
      {right && <div className="text-faded">{right}</div>}
    </div>
  );
}
