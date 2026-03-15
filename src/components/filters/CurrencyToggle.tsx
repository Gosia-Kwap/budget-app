import { useBudget, useBudgetDispatch } from '../../context/BudgetContext';
import type { Currency } from '../../types';

const currencies: Currency[] = ['CHF', 'EUR', 'PLN'];

export function CurrencyToggle() {
  const { filters } = useBudget();
  const dispatch = useBudgetDispatch();

  return (
    <div className="flex items-center gap-2">
      <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => dispatch({ type: 'SET_FILTERS', payload: { currencyMode: 'multi' } })}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            filters.currencyMode === 'multi'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          Multi
        </button>
        {currencies.map((c) => (
          <button
            key={c}
            onClick={() =>
              dispatch({
                type: 'SET_FILTERS',
                payload: { currencyMode: 'converted', baseCurrency: c },
              })
            }
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-gray-200 dark:border-gray-700 ${
              filters.currencyMode === 'converted' && filters.baseCurrency === c
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
