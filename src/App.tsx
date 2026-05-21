import { useEffect } from 'react';
import { BudgetProvider, useBudget } from './context/BudgetContext';
import { FileUpload as LedgerFileUpload } from './components/upload/FileUpload';
import { Shell as LedgerShell } from './components/layout/Shell';
import { FileUpload as ClassicFileUpload } from './components/classic/upload/FileUpload';
import { Shell as ClassicShell } from './components/classic/layout/Shell';

function AppContent() {
  const { data, error, darkMode, viewMode } = useBudget();
  const isClassic = viewMode === 'classic';

  useEffect(() => {
    document.documentElement.classList.toggle('classic-mode', isClassic);
    document.documentElement.classList.toggle('dark', darkMode && isClassic);
  }, [isClassic, darkMode]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center border-t border-b border-vermillion py-8 px-6">
          <p className="font-smallcaps tracking-[0.22em] text-vermillion text-xs mb-3">
            an irregularity
          </p>
          <p className="font-serif italic text-faded">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return isClassic ? <ClassicFileUpload /> : <LedgerFileUpload />;
  }

  return isClassic ? <ClassicShell /> : <LedgerShell />;
}

export default function App() {
  return (
    <BudgetProvider>
      <AppContent />
    </BudgetProvider>
  );
}
