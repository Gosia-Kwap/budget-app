import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
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

  const currentLabel = currentKey === 'all'
    ? 'All Time'
    : months.find((m) => m.key === currentKey)?.label ?? 'All Time';

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
    <div className="flex items-center gap-1">
      <button
        onClick={prev}
        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div className="relative">
        <select
          value={currentKey}
          onChange={(e) => setMonth(e.target.value)}
          className="appearance-none bg-transparent pl-7 pr-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <option value="all">All Time</option>
          {[...months].reverse().map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
        <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>
      <button
        onClick={next}
        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
