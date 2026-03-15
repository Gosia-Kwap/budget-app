import { useCallback, useEffect, useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { useBudgetDispatch } from '../../context/BudgetContext';
import { parseExcelFile } from '../../lib/parser';

export function FileUpload() {
  const dispatch = useBudgetDispatch();
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<string>('');

  // Try auto-load from /data/budget.xlsx
  useEffect(() => {
    async function autoLoad() {
      try {
        setStatus('Looking for budget.xlsx...');
        const res = await fetch('/data/budget.xlsx');
        if (res.ok) {
          setStatus('Parsing budget.xlsx...');
          const buffer = await res.arrayBuffer();
          const data = await parseExcelFile(buffer);
          dispatch({ type: 'SET_DATA', payload: data });
          return;
        }
      } catch {
        // File not found, show upload UI
      }
      setStatus('');
    }
    autoLoad();
  }, [dispatch]);

  const handleFile = useCallback(
    async (file: File) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const data = await parseExcelFile(file);
        dispatch({ type: 'SET_DATA', payload: data });
      } catch (e) {
        dispatch({ type: 'SET_ERROR', payload: `Failed to parse file: ${e}` });
      }
    },
    [dispatch]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
      <div
        className={`w-full max-w-lg p-12 rounded-2xl border-2 border-dashed transition-colors text-center ${
          dragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
            : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
            <FileSpreadsheet className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Budget Dashboard
        </h2>
        {status ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{status}</p>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Drop your budget.xlsx here or click to upload.
              <br />
              <span className="text-xs">
                Place the file at <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">public/data/budget.xlsx</code> for auto-loading.
              </span>
            </p>
            <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm cursor-pointer hover:bg-indigo-700 transition-colors">
              <Upload className="w-4 h-4" />
              Choose File
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={onFileInput}
              />
            </label>
          </>
        )}
      </div>
    </div>
  );
}
