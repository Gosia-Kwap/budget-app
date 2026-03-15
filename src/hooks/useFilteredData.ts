import { useMemo } from 'react';
import { useBudget } from '../context/BudgetContext';
import { filterByDateRange } from '../lib/transforms';

export function useFilteredData() {
  const { data, filters } = useBudget();

  const filtered = useMemo(() => {
    if (!data) return [];
    return filterByDateRange(data.transactions, filters.startDate, filters.endDate);
  }, [data, filters.startDate, filters.endDate]);

  return filtered;
}
