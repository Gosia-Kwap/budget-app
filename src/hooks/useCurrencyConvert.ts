import { useMemo } from 'react';
import { useBudget } from '../context/BudgetContext';
import type { Transaction } from '../types';

export function useCurrencyConvert(transactions: Transaction[]): Transaction[] {
  const { filters } = useBudget();

  return useMemo(() => {
    if (filters.currencyMode === 'all') return transactions;

    return transactions.filter((t) => t.currency === filters.filterCurrency);
  }, [transactions, filters.currencyMode, filters.filterCurrency]);
}
