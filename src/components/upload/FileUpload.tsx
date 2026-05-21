import { useCallback, useEffect, useState } from 'react';
import { useBudgetDispatch } from '../../context/BudgetContext';
import { parseExcelFile } from '../../lib/parser';
import { Flourish } from '../shared/Ornaments';

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

export function FileUpload() {
  const dispatch = useBudgetDispatch();
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [existingFile, setExistingFile] = useState<ArrayBuffer | null>(null);

  useEffect(() => {
    async function checkExisting() {
      try {
        setStatus('looking for budget.xlsx…');
        const res = await fetch('/data/budget.xlsx');
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          setExistingFile(buffer);
        }
      } catch { /* file not found */ }
      setStatus('');
    }
    checkExisting();
  }, []);

  const loadExisting = useCallback(async () => {
    if (!existingFile) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      setStatus('parsing budget.xlsx…');
      const data = await parseExcelFile(existingFile);
      dispatch({ type: 'SET_DATA', payload: data });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: `failed to parse file: ${e}` });
    }
  }, [existingFile, dispatch]);

  const handleFile = useCallback(
    async (file: File) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const data = await parseExcelFile(file);
        dispatch({ type: 'SET_DATA', payload: data });
      } catch (e) {
        dispatch({ type: 'SET_ERROR', payload: `failed to parse file: ${e}` });
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

  const today = new Date();

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-xl">

        {/* Title page */}
        <div className="text-center">
          <div className="font-smallcaps tracking-[0.28em] text-[15px] text-brass mb-6">
            volume {toRoman(today.getFullYear() - 2023)}  ·  privately kept
          </div>

          <h1 className="font-display text-6xl font-normal tracking-wide text-ink leading-none">
            The Ledger
          </h1>

          <p className="font-serif italic text-faded text-xl mt-4">
            a private account of monies kept &amp; spent
          </p>

          <Flourish className="mx-auto mt-6 text-brass w-44 h-5" />

          <div className="mt-3 mb-12 font-smallcaps tracking-[0.24em] text-[14px] text-quill">
            opened on {today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }).toLowerCase()} · {toRoman(today.getFullYear())}
          </div>
        </div>

        {/* Drop area */}
        <div
          className={`relative py-12 px-6 border-t border-b transition-colors duration-150 ${
            dragging ? 'border-vermillion bg-surface/60' : 'border-rule'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <div className="absolute inset-x-0 top-[3px] border-t border-rule-soft" />
          <div className="absolute inset-x-0 bottom-[3px] border-t border-rule-soft" />

          {status ? (
            <p className="text-center font-serif italic text-faded text-lg">{status}</p>
          ) : existingFile ? (
            <div className="text-center">
              <p className="font-serif italic text-faded text-lg">
                a volume was found —{' '}
                <span className="not-italic font-smallcaps tracking-[0.18em] text-[15px] text-ink">budget.xlsx</span>
              </p>
              <p className="font-serif italic text-quill text-base mt-1.5">
                open it, or supply another in its place
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8">
                <button
                  onClick={loadExisting}
                  className="font-smallcaps tracking-[0.24em] text-[16.5px] text-vermillion border-b border-vermillion pb-1 hover:text-brass hover:border-brass transition-colors duration-150"
                >
                  open this volume
                </button>
                <span className="text-rule">·</span>
                <label className="font-smallcaps tracking-[0.24em] text-[16.5px] text-faded border-b border-rule pb-1 hover:text-ink hover:border-ink transition-colors duration-150 cursor-pointer">
                  supply another
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={onFileInput}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="font-serif italic text-faded text-lg">
                lay a workbook upon the page
              </p>
              <p className="font-serif italic text-quill text-base mt-1.5">
                drop a budget.xlsx here, or
              </p>

              <label className="inline-block mt-6 font-smallcaps tracking-[0.24em] text-[16.5px] text-vermillion border-b border-vermillion pb-1 hover:text-brass hover:border-brass transition-colors duration-150 cursor-pointer">
                choose a file
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={onFileInput}
                />
              </label>
            </div>
          )}
        </div>

        <div className="mt-12 text-center font-smallcaps tracking-[0.24em] text-[14px] text-quill">
          kept by hand · marked &amp; sealed
        </div>
      </div>
    </div>
  );
}
