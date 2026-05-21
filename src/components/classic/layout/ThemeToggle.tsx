import { Moon, Sun } from 'lucide-react';
import { useBudget, useBudgetDispatch } from '../../../context/BudgetContext';

export function ThemeToggle() {
  const { darkMode } = useBudget();
  const dispatch = useBudgetDispatch();

  return (
    <button
      onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle dark mode"
    >
      {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
