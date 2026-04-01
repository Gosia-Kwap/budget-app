import * as XLSX from 'xlsx';
import type { BudgetData, Transaction, AccountBalance, CategoryMapping, Currency, TransactionType } from '../types';

function parseDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(value);
    return new Date(date.y, date.m - 1, date.d);
  }
  if (typeof value === 'string') {
    // DD.MM.YYYY format
    const parts = value.split('.');
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
  }
  return new Date();
}

function normalizeType(type: string): TransactionType {
  const t = type?.trim().toLowerCase();
  if (t === 'income') return 'Income';
  if (t === 'transfer') return 'Transfer';
  if (t === 'expense return' || t === 'expensereturn') return 'ExpenseReturn';
  return 'Expense';
}

function normalizeCurrency(c: string): Currency {
  const upper = c?.trim().toUpperCase();
  if (upper === 'EUR') return 'EUR';
  if (upper === 'PLN') return 'PLN';
  return 'CHF';
}

export async function parseExcelFile(file: File | ArrayBuffer): Promise<BudgetData> {
  const buffer = file instanceof File ? await file.arrayBuffer() : file;
  const workbook = XLSX.read(buffer, { type: 'array' });

  const transactions = parseTransactions(workbook);
  const accounts = parseAccounts(workbook);
  const categories = parseCategories(workbook);

  return { transactions, accounts, categories };
}

function parseTransactions(wb: XLSX.WorkBook): Transaction[] {
  const sheet = wb.Sheets['Data'];
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  return rows
    .filter((r) => r['Date'] != null && r['Amount'] != null)
    .map((r) => ({
      date: parseDate(r['Date']),
      week: Number(r['Week']) || 0,
      category: String(r['Category'] ?? ''),
      subcategory: String(r['Subcategory'] ?? ''),
      type: normalizeType(String(r['Type'] ?? 'Expense')),
      amount: Number(r['Amount']) || 0,
      currency: normalizeCurrency(String(r['Currency'] ?? 'CHF')),
      account: String(r['Account'] ?? ''),
      context: String(r['Context'] ?? ''),
      groupId: r['GroupID'] ? String(r['GroupID']) : null,
      description: String(r['Description'] ?? ''),
    }));
}

function parseAccounts(wb: XLSX.WorkBook): AccountBalance[] {
  const sheet = wb.Sheets['Accounts'];
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  return rows
    .filter((r) => r['Account'] != null)
    .map((r) => ({
      account: String(r['Account'] ?? ''),
      startingBalance: Number(r['StartingBalance'] ?? r['StartingB'] ?? 0),
      startDate: parseDate(r['StartDate'] ?? new Date()),
      currentBalance: Number(r['Current balance'] ?? r['Current b'] ?? 0),
      currency: normalizeCurrency(String(r['Currency'] ?? 'CHF')),
    }));
}

function parseCategories(wb: XLSX.WorkBook): CategoryMapping[] {
  const sheet = wb.Sheets['Categories'];
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  return rows
    .filter((r) => r['Subcategory'] != null)
    .map((r) => ({
      subcategory: String(r['Subcategory'] ?? ''),
      category: String(r['Category'] ?? ''),
    }));
}
