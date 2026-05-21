import { BudgetProvider, useBudget } from './context/BudgetContext';
import { FileUpload } from './components/upload/FileUpload';
import { Shell } from './components/layout/Shell';

function AppContent() {
  const { data, error } = useBudget();

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
