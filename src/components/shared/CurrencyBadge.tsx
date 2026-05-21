import type { Currency } from '../../types';
import { CURRENCY_SYMBOLS } from '../../lib/currency';

const inkMap: Record<Currency, string> = {
  CHF: 'text-moss',
  EUR: 'text-indigoink',
  PLN: 'text-clay',
};

export function CurrencyBadge({ currency, withSymbol = false }: { currency: Currency; withSymbol?: boolean }) {
  return (
    <span
      className={`font-smallcaps tracking-[0.22em] text-[15.5px] ${inkMap[currency]}`}
      title={currency}
    >
      {withSymbol ? `${CURRENCY_SYMBOLS[currency]} · ` : ''}{currency.toLowerCase()}
    </span>
  );
}
