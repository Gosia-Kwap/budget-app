import { useBudget, useBudgetDispatch } from '../../context/BudgetContext';
import type { Currency } from '../../types';

const currencies: Currency[] = ['CHF', 'EUR', 'PLN'];

export function CurrencyToggle() {
  const { filters } = useBudget();
  const dispatch = useBudgetDispatch();

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
