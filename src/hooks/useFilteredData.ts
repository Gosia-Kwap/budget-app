import { useMemo } from 'react';
import { useBudget } from '../context/BudgetContext';
import { filterByDateRange, resolveExpenseReturns } from '../lib/transforms';

export function useFilteredData() {
  const { data, filters } = useBudget();

  // Resolve grouped expense returns across ALL transactions first,
  // so cross-month groups are netted correctly before date filtering.
  const resolved = useMemo(() => {
    if (!data) return [];
    return resolveExpenseReturns(data.transactions);
  }, [data]);

  const filtered = useMemo(() => {
    return filterByDateRange(resolved, filters.startDate, filters.endDate);
  }, [resolved, filters.startDate, filters.endDate]);

  return filtered;
}
