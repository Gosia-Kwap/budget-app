import type { ActivePage } from '../../types';
import { useBudget, useBudgetDispatch } from '../../context/BudgetContext';

const tabs: { page: ActivePage; label: string }[] = [
  { page: 'overview', label: 'Overview' },
  { page: 'categories', label: 'Categories' },
  { page: 'accounts', label: 'Accounts' },
];

export function NavTabs() {
  const { activePage } = useBudget();
  const dispatch = useBudgetDispatch();

  return (
    <nav className="flex items-center gap-7">
      {tabs.map(({ page, label }, i) => {
        const active = activePage === page;
        return (
          <div key={page} className="flex items-center gap-7">
            {i > 0 && <span className="text-rule">·</span>}
            <button
              onClick={() => dispatch({ type: 'SET_PAGE', payload: page })}
              className={`relative font-smallcaps tracking-[0.2em] text-[18px] transition-colors duration-150 ${
                active
                  ? 'text-vermillion'
                  : 'text-faded hover:text-ink'
              }`}
            >
              {active && (
                <span className="absolute -left-3 top-1/2 -translate-y-1/2 text-brass">
                  ❦
                </span>
              )}
              {label}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
