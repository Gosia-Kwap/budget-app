import { useMemo } from 'react';
import { useBudget, useBudgetDispatch } from '../../context/BudgetContext';
import { getAvailableMonths } from '../../lib/transforms';

export function MonthPicker() {
  const { data, filters } = useBudget();
  const dispatch = useBudgetDispatch();

  const months = useMemo(() => {
    if (!data) return [];
    return getAvailableMonths(data.transactions);
  }, [data]);

  const currentKey = filters.startDate
    ? `${filters.startDate.getFullYear()}-${String(filters.startDate.getMonth() + 1).padStart(2, '0')}`
    : 'all';

  const currentIdx = months.findIndex((m) => m.key === currentKey);

  const setMonth = (key: string) => {
    if (key === 'all') {
      dispatch({ type: 'SET_FILTERS', payload: { startDate: null, endDate: null } });
    } else {
      const [y, m] = key.split('-').map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59);
      dispatch({ type: 'SET_FILTERS', payload: { startDate: start, endDate: end } });
    }
  };

  const prev = () => {
    if (currentKey === 'all' && months.length > 0) {
      setMonth(months[months.length - 1].key);
    } else if (currentIdx > 0) {
      setMonth(months[currentIdx - 1].key);
    }
  };

  const next = () => {
    if (currentIdx >= 0 && currentIdx < months.length - 1) {
      setMonth(months[currentIdx + 1].key);
    } else {
      setMonth('all');
    }
  };

  return (
    <div className="flex items-center gap-3.5">
      <button
        onClick={prev}
        className="text-faded hover:text-vermillion transition-colors duration-150 text-xl leading-none"
        aria-label="Previous month"
      >
        ‹
      </button>
      <div className="relative">
        <select
          value={currentKey}
          onChange={(e) => setMonth(e.target.value)}
          className="appearance-none bg-transparent pr-6 py-1 text-lg font-serif italic text-ink cursor-pointer border-b border-faded hover:border-vermillion focus:border-vermillion focus:outline-none transition-colors duration-150 min-w-[12ch] text-center"
        >
          <option value="all">all months</option>
          {[...months].reverse().map((m) => (
            <option key={m.key} value={m.key}>
              {m.label.toLowerCase()}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-faded text-sm">▾</span>
      </div>
      <button
        onClick={next}
        className="text-faded hover:text-vermillion transition-colors duration-150 text-xl leading-none"
        aria-label="Next month"
      >
        ›
      </button>
    </div>
  );
}
