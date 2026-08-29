import * as XLSX from 'xlsx';
import { config } from '../config';
import type { BudgetData, Transaction, AccountBalance, CategoryMapping, Currency, TransactionType } from '../types';

/**
 * Thrown when the workbook doesn't look like the app expects. The message is
 * written to be read by the person who made the spreadsheet, not by a
 * developer — it names the sheet, the missing columns, and what was found
 * instead.
 */
export class WorkbookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkbookError';
  }
}

const REQUIRED_TRANSACTION_COLUMNS = ['Date', 'Amount', 'Currency'];
const REQUIRED_ACCOUNT_COLUMNS = ['Account', 'Currency'];
const REQUIRED_CATEGORY_COLUMNS = ['Subcategory', 'Category'];

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(value);
    if (!date) return null;
    return new Date(date.y, date.m - 1, date.d);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // DD.MM.YYYY / DD-MM-YYYY / DD/MM/YYYY
    const parts = trimmed.split(/[./-]/);
    if (parts.length === 3 && parts[0].length <= 2) {
      const [d, m, y] = parts.map(Number);
      if (!Number.isNaN(d) && !Number.isNaN(m) && !Number.isNaN(y)) {
        return new Date(y, m - 1, d);
      }
    }
    // Anything else the browser understands, e.g. YYYY-MM-DD
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function normalizeType(type: string): TransactionType {
  const t = type?.trim().toLowerCase();
  const { income, transfer, expenseReturn } = config.transactionTypes;
  if (income.includes(t)) return 'Income';
  if (transfer.includes(t)) return 'Transfer';
  if (expenseReturn.includes(t)) return 'ExpenseReturn';
  return 'Expense';
}

/**
 * Currency codes are taken as written (upper-cased and trimmed) — the app
 * doesn't hold a list of "allowed" currencies, so nothing gets silently
 * relabelled as something else.
 */
function normalizeCurrency(c: unknown): Currency {
  return String(c ?? '').trim().toUpperCase();
}

/** True when the text contains any of the savings words from config.ts. */
function looksLikeSavings(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return config.savingsAccountWords.some((w) => w && t.includes(w.toLowerCase()));
}

function isTruthyFlag(value: unknown): boolean {
  const v = String(value ?? '').trim().toLowerCase();
  return v === 'true' || v === 'yes' || v === 'y' || v === '1' || v === 'x';
}

function sheetOrThrow(wb: XLSX.WorkBook, configKey: keyof typeof config.sheets): XLSX.WorkSheet {
  const name = config.sheets[configKey];
  const sheet = wb.Sheets[name];
  if (!sheet) {
    throw new WorkbookError(
      `This workbook has no sheet named "${name}" (the ${configKey} sheet). ` +
        `Sheets found: ${wb.SheetNames.map((s) => `"${s}"`).join(', ') || 'none'}. ` +
        `Rename your sheet, or change sheets.${configKey} in src/config.ts.`
    );
  }
  return sheet;
}

/**
 * The literal header row of a sheet. Read from row 1 rather than from the
 * keys of a parsed row, because blank cells simply don't produce keys — a
 * first transaction with no Description would otherwise look like a
 * workbook with no Description column at all.
 */
function sheetHeaders(sheet: XLSX.WorkSheet): string[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });
  const first = rows[0];
  if (!Array.isArray(first)) return [];
  return first.map((h) => String(h ?? '').trim()).filter(Boolean);
}

function requireColumns(sheet: XLSX.WorkSheet, required: string[], sheetName: string): Set<string> {
  const headers = new Set(sheetHeaders(sheet));
  if (headers.size === 0) {
    throw new WorkbookError(`The "${sheetName}" sheet is empty — it needs a header row and at least one row of data.`);
  }
  const missing = required.filter((c) => !headers.has(c));
  if (missing.length > 0) {
    throw new WorkbookError(
      `The "${sheetName}" sheet is missing the column${missing.length > 1 ? 's' : ''} ` +
        `${missing.map((m) => `"${m}"`).join(', ')}. ` +
        `Columns found: ${Array.from(headers).map((h) => `"${h}"`).join(', ')}.`
    );
  }
  return headers;
}

export async function parseExcelFile(file: File | ArrayBuffer): Promise<BudgetData> {
  const buffer = file instanceof File ? await file.arrayBuffer() : file;

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'array' });
  } catch (e) {
    throw new WorkbookError(`That file could not be opened as a spreadsheet (${String(e)}).`);
  }

  const transactions = parseTransactions(workbook);
  const accounts = parseAccounts(workbook);
  const categories = parseCategories(workbook);

  if (transactions.length === 0) {
    throw new WorkbookError(
      `The "${config.sheets.transactions}" sheet has no usable rows — every row needs at least a Date and an Amount.`
    );
  }

  return { transactions, accounts, categories };
}

function parseTransactions(wb: XLSX.WorkBook): Transaction[] {
  const name = config.sheets.transactions;
  const sheet = sheetOrThrow(wb, 'transactions');
  requireColumns(sheet, REQUIRED_TRANSACTION_COLUMNS, name);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const badDates: number[] = [];

  const transactions: Transaction[] = [];
  rows.forEach((r, i) => {
    if (r['Date'] == null || r['Amount'] == null) return;
    const date = parseDate(r['Date']);
    if (!date) {
      badDates.push(i + 2); // +2: header row, and spreadsheets are 1-indexed
      return;
    }
    transactions.push({
      date,
        week: Number(r['Week']) || 0,
      category: String(r['Category'] ?? ''),
      subcategory: String(r['Subcategory'] ?? ''),
      type: normalizeType(String(r['Type'] ?? '')),
      amount: Number(r['Amount']) || 0,
      currency: normalizeCurrency(r['Currency']),
      account: String(r['Account'] ?? ''),
      context: String(r['Context'] ?? ''),
      groupId: r['GroupID'] ? String(r['GroupID']) : null,
      description: String(r['Description'] ?? ''),
    });
  });

  if (badDates.length > 0) {
    throw new WorkbookError(
      `The "${name}" sheet has ${badDates.length} row${badDates.length > 1 ? 's' : ''} with a date that ` +
        `couldn't be read (row${badDates.length > 1 ? 's' : ''} ${badDates.slice(0, 5).join(', ')}` +
        `${badDates.length > 5 ? ', …' : ''}). Use real Excel dates or the DD.MM.YYYY format.`
    );
  }

  const missingCurrency = transactions.filter((t) => !t.currency).length;
  if (missingCurrency > 0) {
    throw new WorkbookError(
      `${missingCurrency} row${missingCurrency > 1 ? 's' : ''} in "${name}" ha${missingCurrency > 1 ? 've' : 's'} ` +
        `no Currency. Every amount needs a currency code (CHF, EUR, GBP …) so it isn't counted in the wrong total.`
    );
  }

  return transactions;
}

function parseAccounts(wb: XLSX.WorkBook): AccountBalance[] {
  const name = config.sheets.accounts;
  const sheet = sheetOrThrow(wb, 'accounts');
  // A `Type` or `Savings` column is the reliable way to mark savings accounts.
  // Without one, fall back to matching the account name — see config.ts.
  const headers = requireColumns(sheet, REQUIRED_ACCOUNT_COLUMNS, name);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  const hasTypeColumn = headers.has('Type');
  const hasSavingsColumn = headers.has('Savings');

  return rows
    .filter((r) => r['Account'] != null)
    .map((r) => {
      const account = String(r['Account'] ?? '');
      let isSavings: boolean;
      if (hasSavingsColumn) {
        isSavings = isTruthyFlag(r['Savings']);
      } else if (hasTypeColumn) {
        isSavings = looksLikeSavings(String(r['Type'] ?? ''));
      } else {
        isSavings = looksLikeSavings(account);
      }

      return {
        account,
        // 'StartingB' / 'Current b' are truncated headers some older
        // workbooks were saved with — kept so those files still open.
        startingBalance: Number(r['StartingBalance'] ?? r['StartingB'] ?? 0),
        startDate: parseDate(r['StartDate']) ?? new Date(),
        currentBalance: Number(r['Current balance'] ?? r['CurrentBalance'] ?? r['Current b'] ?? 0),
        currency: normalizeCurrency(r['Currency']),
        isSavings,
      };
    });
}

function parseCategories(wb: XLSX.WorkBook): CategoryMapping[] {
  const name = config.sheets.categories;
  const sheet = wb.Sheets[name];
  // The Categories sheet is optional: without it the app still works, it just
  // falls back to alphabetical ordering instead of your preferred order.
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  if (rows.length === 0) return [];
  requireColumns(sheet, REQUIRED_CATEGORY_COLUMNS, name);

  return rows
    .filter((r) => r['Subcategory'] != null)
    .map((r) => ({
      subcategory: String(r['Subcategory'] ?? ''),
      category: String(r['Category'] ?? ''),
    }));
}
