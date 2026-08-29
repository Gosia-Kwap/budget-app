import { useCallback, useEffect, useState } from 'react';
import { useBudgetDispatch } from '../../context/BudgetContext';
import { parseExcelFile, WorkbookError } from '../../lib/parser';
import { Flourish } from '../shared/Ornaments';
import { formatDate, toRoman } from '../../lib/format';
import { config } from '../../config';

const dataFileName = config.dataFile.split('/').pop() ?? config.dataFile;

export function FileUpload() {
  const dispatch = useBudgetDispatch();
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [existingFile, setExistingFile] = useState<ArrayBuffer | null>(null);

  useEffect(() => {
    async function checkExisting() {
      try {
        setStatus(`looking for ${dataFileName}…`);
        const res = await fetch(config.dataFile);
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
      setStatus(`parsing ${dataFileName}…`);
      const data = await parseExcelFile(existingFile);
      dispatch({ type: 'SET_DATA', payload: data });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: describeError(e) });
    }
  }, [existingFile, dispatch]);

  const handleFile = useCallback(
    async (file: File) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const data = await parseExcelFile(file);
        dispatch({ type: 'SET_DATA', payload: data });
      } catch (e) {
        dispatch({ type: 'SET_ERROR', payload: describeError(e) });
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
            volume {toRoman(today.getFullYear() - config.firstYear + 1)}  ·  privately kept
          </div>

          <h1 className="font-display text-6xl font-normal tracking-wide text-ink leading-none">
            {config.appName}
          </h1>

          <p className="font-serif italic text-faded text-xl mt-4">
            {config.tagline}
          </p>

          <Flourish className="mx-auto mt-6 text-brass w-44 h-5" />

          <div className="mt-3 mb-12 font-smallcaps tracking-[0.24em] text-[14px] text-quill">
            opened on {formatDate(today, { day: 'numeric', month: 'long' }).toLowerCase()} · {toRoman(today.getFullYear())}
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
                <span className="not-italic font-smallcaps tracking-[0.18em] text-[15px] text-ink">{dataFileName}</span>
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
                drop a workbook here, or
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
          {config.colophon}
        </div>
      </div>
    </div>
  );
}

/**
 * WorkbookError messages are written for the person who made the
 * spreadsheet, so they're shown as-is. Anything else is a genuine bug.
 */
function describeError(e: unknown): string {
  if (e instanceof WorkbookError) return e.message;
  return `That file could not be read: ${e instanceof Error ? e.message : String(e)}`;
}
