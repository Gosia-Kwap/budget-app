import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import type { Transaction } from '../../types';
import { groupByCategory } from '../../lib/transforms';
import { SectionHeading } from './SummaryCards';

// Muted ledger-palette ramp — moss → clay → vermillion → brass → indigoink
const COLORS = [
  '#7a3520', '#8b5a3c', '#9a7d3a', '#4a5d3a',
  '#2c4a6b', '#4a4a2e', '#2f3622', '#2e3a25',
];

interface Props {
  transactions: Transaction[];
}

export function TopCategoriesChart({ transactions }: Props) {
  const data = useMemo(() => {
    const cats = groupByCategory(transactions);
    return cats.slice(0, 8).map((c) => ({
      name: c.category,
      total: Math.round(c.total * 100) / 100,
    }));
  }, [transactions]);

  if (data.length === 0) return null;

  return (
    <section>
      <SectionHeading kicker="Plate II" title="The greatest expenses" />
      <div className="border-t border-rule" />
      <div className="h-80 pt-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 16, left: 10, bottom: 0 }}>
            <CartesianGrid stroke="#b0a585" strokeDasharray="1 4" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 13, fill: '#4a4a2e', fontFamily: 'EB Garamond, Georgia, serif' }}
              axisLine={{ stroke: '#8a8060' }}
              tickLine={false}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 13, fill: '#0c1206', fontFamily: 'EB Garamond, Georgia, serif', fontStyle: 'italic' }}
              axisLine={false}
              tickLine={false}
              width={110}
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
              formatter={(value: number) => value.toFixed(2)}
            />
            <Bar dataKey="total" name="Total" radius={[0, 1, 1, 0]} animationDuration={300}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
