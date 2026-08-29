import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { Transaction } from '../../types';
import { groupByMonth } from '../../lib/transforms';
import { SectionHeading } from './SummaryCards';

interface Props {
  transactions: Transaction[];
}

export function MonthlyTrendChart({ transactions }: Props) {
  const data = useMemo(() => groupByMonth(transactions), [transactions]);
  if (data.length === 0) return null;

  return (
    <section>
      <SectionHeading kicker="Plate I" title="Income against expenses" />
      <div className="border-t border-rule" />
      <div className="h-80 pt-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={3} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#b0a585" strokeDasharray="1 4" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 13, fill: '#4a4a2e', fontFamily: 'EB Garamond, Georgia, serif', fontStyle: 'italic' }}
              axisLine={{ stroke: '#8a8060' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 13, fill: '#4a4a2e', fontFamily: 'EB Garamond, Georgia, serif' }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              cursor={{ fill: 'rgba(154,125,58,0.08)' }}
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
              formatter={(value) => Number(value).toFixed(2)}
            />
            <Bar dataKey="income" name="Income" fill="#4a5d3a" radius={[1, 1, 0, 0]} animationDuration={300} />
            <Bar dataKey="expenses" name="Expenses" fill="#7a3520" radius={[1, 1, 0, 0]} animationDuration={300} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex items-center gap-6 font-smallcaps tracking-[0.22em] text-[14px] text-quill">
        <span className="flex items-center gap-2">
          <span className="w-3 h-2 inline-block" style={{ backgroundColor: '#4a5d3a' }} /> income
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-2 inline-block" style={{ backgroundColor: '#7a3520' }} /> expenses
        </span>
      </div>
    </section>
  );
}
