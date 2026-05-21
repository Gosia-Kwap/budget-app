import { NavTabs } from './NavTabs';
import { MonthPicker } from '../filters/MonthPicker';
import { CurrencyToggle } from '../filters/CurrencyToggle';
import { OverviewPage } from '../overview/OverviewPage';
import { CategoriesPage } from '../categories/CategoriesPage';
import { AccountsPage } from '../accounts/AccountsPage';
import { useBudget, useBudgetDispatch } from '../../context/BudgetContext';
import { Flourish } from '../shared/Ornaments';

const pages = {
  overview: OverviewPage,
  categories: CategoriesPage,
  accounts: AccountsPage,
};

const pageRoman: Record<keyof typeof pages, string> = {
  overview: 'i',
  categories: 'ii',
  accounts: 'iii',
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toRoman(n: number): string {
  const vals: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let out = '';
  for (const [v, s] of vals) { while (n >= v) { out += s; n -= v; } }
  return out;
}

export function Shell() {
  const { activePage } = useBudget();
  const dispatch = useBudgetDispatch();
  const Page = pages[activePage];

  const today = new Date();
  const monthYear = `${monthNames[today.getMonth()]} · ${toRoman(today.getFullYear())}`;
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );

  return (
    <div className="min-h-screen text-ink">
      <div className="max-w-[1680px] mx-auto px-8 lg:px-16 xl:px-24 pt-12 pb-24">

        {/* Frontispiece */}
        <header className="mb-10">
          <div className="flex items-start justify-between text-faded font-smallcaps tracking-[0.22em] text-[16px]">
            <span>{monthYear}</span>
            <span>fol. {pageRoman[activePage]} · no. {dayOfYear}</span>
          </div>

          <div className="mt-6 flex flex-col items-center">
            <h1 className="font-display text-5xl lg:text-6xl font-normal tracking-wide text-ink">
              The Ledger
            </h1>
            <p className="font-serif italic text-faded text-xl mt-2">
              a private account of monies kept &amp; spent
            </p>
            <Flourish className="mt-5 text-brass w-44 h-4" />
          </div>

          {/* Double rule */}
          <div className="mt-6 border-t border-rule" />
          <div className="mt-[3px] border-t border-rule-soft" />

          {/* Running header: nav + filters */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-y-3 gap-x-6">
            <NavTabs />
            <div className="flex items-center gap-6 text-faded">
              <MonthPicker />
              <span className="text-rule">·</span>
              <CurrencyToggle />
              <span className="text-rule">·</span>
              <button
                onClick={() => dispatch({ type: 'SET_DATA', payload: null as never })}
                className="font-smallcaps tracking-[0.2em] text-[16.5px] text-faded border-b border-transparent hover:border-vermillion hover:text-vermillion transition-colors duration-150"
                title="Open a different volume"
              >
                new volume
              </button>
            </div>
          </div>
        </header>

        <main>
          <Page />
        </main>

        {/* Colophon */}
        <footer className="mt-20 pt-6 border-t border-rule text-center text-faded font-smallcaps tracking-[0.24em] text-[16px]">
          <span>kept by hand · {toRoman(today.getFullYear())}</span>
        </footer>
      </div>
    </div>
  );
}
