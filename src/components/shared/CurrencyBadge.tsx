import { useMemo } from 'react';
import type { Currency } from '../../types';
import { currencySymbol, listCurrencies, currencyIndex } from '../../lib/currency';
import { useBudget } from '../../context/BudgetContext';

// Accent inks, assigned by the currency's position in the workbook rather
// than by name — so any set of currencies gets distinct colours.
const INKS = ['text-moss', 'text-indigoink', 'text-clay', 'text-brass', 'text-vermillion', 'text-quill'];

export function CurrencyBadge({ currency, withSymbol = false }: { currency: Currency; withSymbol?: boolean }) {
  const { data } = useBudget();
  const all = useMemo(() => listCurrencies(data), [data]);
  const ink = INKS[currencyIndex(currency, all) % INKS.length];

  return (
    <span
      className={`font-smallcaps tracking-[0.22em] text-[15.5px] ${ink}`}
      title={currency}
    >
      {withSymbol ? `${currencySymbol(currency)} · ` : ''}{currency.toLowerCase()}
    </span>
  );
}
