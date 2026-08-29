/**
 * Writes an empty budget-template.xlsx with the three sheets and the exact
 * column headers the app expects, plus one example row per sheet so the
 * formats are obvious. Run with: npm run template
 */
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// One example row each — delete them once you start entering your own.
const transactions = [
  {
    Date: '01.01.2026',
    Week: 1,
    Category: 'Food',
    Subcategory: 'groceries',
    Type: 'Expense',
    Amount: -42.5,
    Currency: 'EUR',
    Account: 'Everyday',
    Context: '',
    GroupID: '',
    Description: 'example row — delete me',
  },
];

const accounts = [
  {
    Account: 'Everyday',
    Type: 'Everyday',
    StartingBalance: 1000,
    StartDate: '01.01.2026',
    'Current balance': 957.5,
    Currency: 'EUR',
  },
  {
    Account: 'Rainy day',
    Type: 'Savings',
    StartingBalance: 5000,
    StartDate: '01.01.2026',
    'Current balance': 5000,
    Currency: 'EUR',
  },
];

// The order of this sheet is the order categories appear in the app.
const categories = [
  { Subcategory: 'groceries', Category: 'Food' },
  { Subcategory: 'eating out', Category: 'Food' },
  { Subcategory: 'rent', Category: 'Fixed' },
  { Subcategory: 'Salary', Category: 'Income' },
  { Subcategory: 'Savings', Category: 'Transfer' },
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(transactions), 'Data');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(accounts), 'Accounts');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(categories), 'Categories');

const outPath = join(__dirname, '..', 'budget-template.xlsx');
XLSX.writeFile(wb, outPath);
console.log(`Blank template written to ${outPath}`);
