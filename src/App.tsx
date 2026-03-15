import { useEffect } from 'react';
import { BudgetProvider, useBudget } from './context/BudgetContext';
import { FileUpload } from './components/upload/FileUpload';
import { Shell } from './components/layout/Shell';

function AppContent() {
  const { data, darkMode, error } = useBudget();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md text-center">
          <p className="text-red-600 dark:text-red-400 font-medium mb-2">Error</p>
          <p className="text-sm text-red-500 dark:text-red-400/80">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <FileUpload />;
  }

  return <Shell />;
}

export default function App() {
  return (
    <BudgetProvider>
      <AppContent />
    </BudgetProvider>
  );
}
