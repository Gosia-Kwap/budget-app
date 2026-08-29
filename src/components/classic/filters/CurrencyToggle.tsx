import { useMemo } from 'react';
import { useBudget, useBudgetDispatch } from '../../../context/BudgetContext';
import { listCurrencies } from '../../../lib/currency';

export function CurrencyToggle() {
  const { filters, data } = useBudget();
  const dispatch = useBudgetDispatch();

  // Whatever currencies the workbook actually contains, in the order they
  // first appear in it.
  const currencies = useMemo(() => listCurrencies(data), [data]);

  // Nothing to toggle between when everything is in one currency.
  if (currencies.length < 2) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => dispatch({ type: 'SET_FILTERS', payload: { currencyMode: 'all' } })}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            filters.currencyMode === 'all'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          All
        </button>
        {currencies.map((c) => (
          <button
            key={c}
            onClick={() =>
              dispatch({
                type: 'SET_FILTERS',
                payload: { currencyMode: 'filtered', filterCurrency: c },
              })
            }
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-gray-200 dark:border-gray-700 ${
              filters.currencyMode === 'filtered' && filters.filterCurrency === c
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
