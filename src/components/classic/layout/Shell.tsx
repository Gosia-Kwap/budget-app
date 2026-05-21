import { NavTabs } from './NavTabs';
import { ThemeToggle } from './ThemeToggle';
import { MonthPicker } from '../filters/MonthPicker';
import { CurrencyToggle } from '../filters/CurrencyToggle';
import { OverviewPage } from '../overview/OverviewPage';
import { CategoriesPage } from '../categories/CategoriesPage';
import { AccountsPage } from '../accounts/AccountsPage';
import { useBudget, useBudgetDispatch } from '../../../context/BudgetContext';
import { RefreshCw } from 'lucide-react';

const pages = {
  overview: OverviewPage,
  categories: CategoriesPage,
  accounts: AccountsPage,
};

export function Shell() {
  const { activePage } = useBudget();
  const dispatch = useBudgetDispatch();
  const Page = pages[activePage];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="px-6 lg:px-10">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Budget</h1>
              <NavTabs />
            </div>
            <div className="flex items-center gap-3">
              <MonthPicker />
              <CurrencyToggle />
              <ThemeToggle />
              <button
                onClick={() => dispatch({ type: 'TOGGLE_VIEW_MODE' })}
                className="px-2.5 py-1 rounded-md text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors"
                title="Switch to ledger view"
              >
                Ledger view
              </button>
              <button
                onClick={() => dispatch({ type: 'SET_DATA', payload: null as any })}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Upload different file"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="px-6 lg:px-10 py-6">
        <Page />
      </main>
    </div>
  );
}
