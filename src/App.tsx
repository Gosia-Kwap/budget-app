import { useEffect } from 'react';
import { config } from './config';
import { BudgetProvider, useBudget, useBudgetDispatch } from './context/BudgetContext';
import { FileUpload as LedgerFileUpload } from './components/upload/FileUpload';
import { Shell as LedgerShell } from './components/layout/Shell';
import { FileUpload as ClassicFileUpload } from './components/classic/upload/FileUpload';
import { Shell as ClassicShell } from './components/classic/layout/Shell';

function AppContent() {
  const { data, error, darkMode, viewMode } = useBudget();
  const dispatch = useBudgetDispatch();
  const isClassic = viewMode === 'classic';

  useEffect(() => {
    document.title = config.appName;
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('classic-mode', isClassic);
    document.documentElement.classList.toggle('dark', darkMode && isClassic);
  }, [isClassic, darkMode]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-xl text-center border-t border-b border-vermillion py-8 px-6">
          <p className="font-smallcaps tracking-[0.22em] text-vermillion text-xs mb-3">
            an irregularity
          </p>
          <p className="font-serif italic text-faded">{error}</p>
          <button
            onClick={() => dispatch({ type: 'SET_ERROR', payload: null })}
            className="mt-6 font-smallcaps tracking-[0.24em] text-[15px] text-vermillion border-b border-vermillion pb-1 hover:text-brass hover:border-brass transition-colors duration-150"
          >
            try another workbook
          </button>
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
