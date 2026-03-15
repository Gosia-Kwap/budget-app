import { LayoutDashboard, PieChart, Wallet } from 'lucide-react';
import type { ActivePage } from '../../types';
import { useBudget, useBudgetDispatch } from '../../context/BudgetContext';

const tabs: { page: ActivePage; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'overview', label: 'Overview', icon: LayoutDashboard },
  { page: 'categories', label: 'Categories', icon: PieChart },
  { page: 'accounts', label: 'Accounts', icon: Wallet },
];

export function NavTabs() {
  const { activePage } = useBudget();
  const dispatch = useBudgetDispatch();

  return (
    <nav className="flex gap-1">
      {tabs.map(({ page, label, icon: Icon }) => (
        <button
          key={page}
          onClick={() => dispatch({ type: 'SET_PAGE', payload: page })}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activePage === page
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </nav>
  );
}
