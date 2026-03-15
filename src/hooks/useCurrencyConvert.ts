import { useMemo } from 'react';
import { useBudget } from '../context/BudgetContext';
import type { Transaction } from '../types';
import { convertAmount } from '../lib/currency';

export function useCurrencyConvert(transactions: Transaction[]): Transaction[] {
  const { filters } = useBudget();

  return useMemo(() => {
    if (filters.currencyMode === 'multi') return transactions;

    return transactions.map((t) => ({
      ...t,
      amount: convertAmount(t.amount, t.currency, filters.baseCurrency, filters.exchangeRates),
      currency: filters.baseCurrency,
    }));
  }, [transactions, filters.currencyMode, filters.baseCurrency, filters.exchangeRates]);
}
