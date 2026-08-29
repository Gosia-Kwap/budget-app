import { useMemo } from 'react';
import { useBudget, useBudgetDispatch } from '../../context/BudgetContext';
import { listCurrencies } from '../../lib/currency';

export function CurrencyToggle() {
  const { filters, data } = useBudget();
  const dispatch = useBudgetDispatch();

  // Whatever currencies the workbook actually contains, in the order they
  // first appear in it.
  const currencies = useMemo(() => listCurrencies(data), [data]);

  // Nothing to toggle between when everything is in one currency.
  if (currencies.length < 2) return null;

  const isAll = filters.currencyMode === 'all';

  return (
    <div className="flex items-center gap-3.5 font-smallcaps tracking-[0.2em] text-[16px]">
      <button
        onClick={() => dispatch({ type: 'SET_FILTERS', payload: { currencyMode: 'all' } })}
        className={`pb-[2px] border-b transition-colors duration-150 ${
          isAll
            ? 'text-vermillion border-vermillion'
            : 'text-faded border-transparent hover:text-ink hover:border-rule'
        }`}
      >
        all
      </button>
      {currencies.map((c) => {
        const active = !isAll && filters.filterCurrency === c;
        return (
          <button
            key={c}
            onClick={() =>
              dispatch({
                type: 'SET_FILTERS',
                payload: { currencyMode: 'filtered', filterCurrency: c },
              })
            }
            className={`pb-[2px] border-b transition-colors duration-150 ${
              active
                ? 'text-vermillion border-vermillion'
                : 'text-faded border-transparent hover:text-ink hover:border-rule'
            }`}
          >
            {c.toLowerCase()}
          </button>
        );
      })}
    </div>
  );
}
