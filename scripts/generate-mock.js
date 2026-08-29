import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const transactions = [
  { Date: '01.11.2025', Week: 44, Category: 'Jedzenie', Subcategory: 'spożywcze', Type: 'Expense', Amount: -45.30, Currency: 'CHF', Account: 'UBS Everyday', Context: '', GroupID: '', Description: 'Migros weekly' },
  { Date: '02.11.2025', Week: 44, Category: 'Jedzenie', Subcategory: 'kawa', Type: 'Expense', Amount: -5.50, Currency: 'CHF', Account: 'UBS Everyday', Context: '', GroupID: '', Description: 'Starbucks' },
  { Date: '03.11.2025', Week: 44, Category: 'Transport', Subcategory: 'abonament', Type: 'Expense', Amount: -80.00, Currency: 'CHF', Account: 'UBS Everyday', Context: '', GroupID: '', Description: 'GA monthly' },
  { Date: '05.11.2025', Week: 45, Category: 'Jedzenie', Subcategory: 'jedzenie na mieście', Type: 'Expense', Amount: -22.50, Currency: 'EUR', Account: 'ABN Everyday', Context: 'Netherlands', GroupID: '', Description: 'Restaurant' },
  { Date: '06.11.2025', Week: 45, Category: 'Obowiązkowe', Subcategory: 'czynsz', Type: 'Expense', Amount: -850.00, Currency: 'CHF', Account: 'UBS Everyday', Context: '', GroupID: '', Description: 'Rent November' },
  { Date: '07.11.2025', Week: 45, Category: 'Zakupy', Subcategory: 'ubrania', Type: 'Expense', Amount: -65.00, Currency: 'EUR', Account: 'ABN Everyday', Context: '', GroupID: 'G001', Description: 'Jacket (will return)' },
  { Date: '10.11.2025', Week: 45, Category: 'Zakupy', Subcategory: 'ubrania', Type: 'Income', Amount: 65.00, Currency: 'EUR', Account: 'ABN Everyday', Context: '', GroupID: 'G001', Description: 'Jacket return' },
  { Date: '08.11.2025', Week: 45, Category: 'Income', Subcategory: 'Salary', Type: 'Income', Amount: 3200.00, Currency: 'CHF', Account: 'UBS Everyday', Context: '', GroupID: '', Description: 'November salary' },
  { Date: '09.11.2025', Week: 45, Category: 'Transfer', Subcategory: 'Savings', Type: 'Transfer', Amount: -500.00, Currency: 'CHF', Account: 'UBS Everyday', Context: '', GroupID: '', Description: 'To savings' },
  { Date: '09.11.2025', Week: 45, Category: 'Transfer', Subcategory: 'Savings', Type: 'Transfer', Amount: 500.00, Currency: 'CHF', Account: 'UBS Save', Context: '', GroupID: '', Description: 'From everyday' },
  { Date: '10.11.2025', Week: 45, Category: 'Jedzenie', Subcategory: 'alkohol', Type: 'Expense', Amount: -18.90, Currency: 'CHF', Account: 'Revolut CH', Context: '', GroupID: '', Description: 'Wine' },
  { Date: '12.11.2025', Week: 46, Category: 'Kosmetyki', Subcategory: 'potrzebne', Type: 'Expense', Amount: -32.00, Currency: 'CHF', Account: 'UBS Everyday', Context: '', GroupID: '', Description: 'Shampoo etc' },
  { Date: '13.11.2025', Week: 46, Category: 'Dodatkowe', Subcategory: 'wyjścia ze znajomymi', Type: 'Expense', Amount: -35.00, Currency: 'CHF', Account: 'Revolut CH', Context: '', GroupID: '', Description: 'Dinner with friends' },
  { Date: '14.11.2025', Week: 46, Category: 'Uni', Subcategory: 'papiernicze', Type: 'Expense', Amount: -15.50, Currency: 'CHF', Account: 'UBS Everyday', Context: '', GroupID: '', Description: 'Notebooks' },
  { Date: '15.11.2025', Week: 46, Category: 'Transport', Subcategory: 'bilety lokalne', Type: 'Expense', Amount: -13.55, Currency: 'EUR', Account: 'ABN Everyday', Context: 'Netherlands/Spain', GroupID: '', Description: '' },
  { Date: '18.11.2025', Week: 47, Category: 'Leki', Subcategory: 'leki', Type: 'Expense', Amount: -28.00, Currency: 'CHF', Account: 'UBS Everyday', Context: '', GroupID: '', Description: 'Pharmacy' },
  { Date: '20.11.2025', Week: 47, Category: 'Jedzenie', Subcategory: 'słodycze', Type: 'Expense', Amount: -8.20, Currency: 'PLN', Account: 'mBank', Context: 'Poland', GroupID: '', Description: 'Chocolates' },
  { Date: '22.11.2025', Week: 47, Category: 'Income', Subcategory: 'Scholarship', Type: 'Income', Amount: 400.00, Currency: 'EUR', Account: 'ABN Everyday', Context: '', GroupID: '', Description: 'Monthly scholarship' },
  { Date: '25.11.2025', Week: 48, Category: 'Obowiązkowe', Subcategory: 'ubezpieczenia', Type: 'Expense', Amount: -120.00, Currency: 'CHF', Account: 'UBS Everyday', Context: '', GroupID: '', Description: 'Health insurance' },
  { Date: '26.11.2025', Week: 48, Category: 'Zakupy', Subcategory: 'sprzęt', Type: 'Expense', Amount: -89.00, Currency: 'EUR', Account: 'ABN Everyday', Context: '', GroupID: '', Description: 'USB-C hub' },
  { Date: '28.11.2025', Week: 48, Category: 'Jedzenie', Subcategory: 'spożywcze', Type: 'Expense', Amount: -55.00, Currency: 'CHF', Account: 'UBS Everyday', Context: '', GroupID: '', Description: 'Coop weekly' },
  { Date: '30.11.2025', Week: 48, Category: 'Obowiązkowe', Subcategory: 'telefon', Type: 'Expense', Amount: -25.00, Currency: 'CHF', Account: 'UBS Everyday', Context: '', GroupID: '', Description: 'Swisscom' },
  // December
  { Date: '01.12.2025', Week: 49, Category: 'Jedzenie', Subcategory: 'spożywcze', Type: 'Expense', Amount: -62.00, Currency: 'CHF', Account: 'UBS Everyday', Context: '', GroupID: '', Description: 'Migros weekly' },
  { Date: '03.12.2025', Week: 49, Category: 'Obowiązkowe', Subcategory: 'czynsz', Type: 'Expense', Amount: -850.00, Currency: 'CHF', Account: 'UBS Everyday', Context: '', GroupID: '', Description: 'Rent December' },
  { Date: '05.12.2025', Week: 49, Category: 'Income', Subcategory: 'Salary', Type: 'Income', Amount: 3200.00, Currency: 'CHF', Account: 'UBS Everyday', Context: '', GroupID: '', Description: 'December salary' },
  { Date: '05.12.2025', Week: 49, Category: 'Dodatkowe', Subcategory: 'prezenty', Type: 'Expense', Amount: -120.00, Currency: 'EUR', Account: 'ABN Everyday', Context: '', GroupID: '', Description: 'Christmas gifts' },
  { Date: '10.12.2025', Week: 50, Category: 'Transfer', Subcategory: 'Spending', Type: 'Transfer', Amount: -200.00, Currency: 'EUR', Account: 'ABN Everyday', Context: '', GroupID: '', Description: 'To Revolut' },
  { Date: '10.12.2025', Week: 50, Category: 'Transfer', Subcategory: 'Spending', Type: 'Transfer', Amount: 200.00, Currency: 'EUR', Account: 'Revolut EUR', Context: '', GroupID: '', Description: 'From ABN' },
  { Date: '15.12.2025', Week: 51, Category: 'Income', Subcategory: 'Gifts', Type: 'Income', Amount: 200.00, Currency: 'PLN', Account: 'mBank', Context: '', GroupID: '', Description: 'Birthday money' },
  { Date: '20.12.2025', Week: 51, Category: 'Jedzenie', Subcategory: 'ekstra', Type: 'Expense', Amount: -95.00, Currency: 'CHF', Account: 'Revolut CH', Context: '', GroupID: '', Description: 'Christmas dinner' },
];

// `Type` is optional but recommended: it is what marks an account as savings,
// instead of the app having to guess from the account's name.
const accounts = [
  { Account: 'UBS Everyday', Type: 'Everyday', StartingBalance: 5000, StartDate: '01.10.2025', 'Current balance': 4200, Currency: 'CHF' },
  { Account: 'UBS Save', Type: 'Savings', StartingBalance: 10000, StartDate: '01.10.2025', 'Current balance': 10500, Currency: 'CHF' },
  { Account: 'ABN Everyday', Type: 'Everyday', StartingBalance: 2000, StartDate: '01.10.2025', 'Current balance': 1800, Currency: 'EUR' },
  { Account: 'ABN Save', Type: 'Savings', StartingBalance: 5000, StartDate: '01.10.2025', 'Current balance': 5000, Currency: 'EUR' },
  { Account: 'mBank', Type: 'Everyday', StartingBalance: 1500, StartDate: '01.10.2025', 'Current balance': 1692, Currency: 'PLN' },
  { Account: 'Revolut CH', Type: 'Everyday', StartingBalance: 200, StartDate: '01.10.2025', 'Current balance': 146, Currency: 'CHF' },
  { Account: 'Revolut EUR', Type: 'Everyday', StartingBalance: 100, StartDate: '01.10.2025', 'Current balance': 300, Currency: 'EUR' },
];

const categories = [
  { Subcategory: 'spożywcze', Category: 'Jedzenie' },
  { Subcategory: 'jedzenie na mieście', Category: 'Jedzenie' },
  { Subcategory: 'kawa', Category: 'Jedzenie' },
  { Subcategory: 'słodycze', Category: 'Jedzenie' },
  { Subcategory: 'ekstra', Category: 'Jedzenie' },
  { Subcategory: 'alkohol', Category: 'Jedzenie' },
  { Subcategory: 'potrzebne', Category: 'Kosmetyki' },
  { Subcategory: 'makeup', Category: 'Kosmetyki' },
  { Subcategory: 'leki', Category: 'Leki' },
  { Subcategory: 'ubrania', Category: 'Zakupy' },
  { Subcategory: 'buty', Category: 'Zakupy' },
  { Subcategory: 'niezbędne', Category: 'Zakupy' },
  { Subcategory: 'zachcianki', Category: 'Zakupy' },
  { Subcategory: 'książki', Category: 'Zakupy' },
  { Subcategory: 'sprzęt', Category: 'Zakupy' },
  { Subcategory: 'stowarzyszenia', Category: 'Uni' },
  { Subcategory: 'kursy', Category: 'Uni' },
  { Subcategory: 'papiernicze', Category: 'Uni' },
  { Subcategory: 'czynsz', Category: 'Obowiązkowe' },
  { Subcategory: 'czesne', Category: 'Obowiązkowe' },
  { Subcategory: 'ubezpieczenia', Category: 'Obowiązkowe' },
  { Subcategory: 'telefon', Category: 'Obowiązkowe' },
  { Subcategory: 'transfer fees', Category: 'Obowiązkowe' },
  { Subcategory: 'wydatki państwowe', Category: 'Obowiązkowe' },
  { Subcategory: 'wyjścia ze znajomymi', Category: 'Dodatkowe' },
  { Subcategory: 'drinks', Category: 'Dodatkowe' },
  { Subcategory: 'kosmetyczka', Category: 'Dodatkowe' },
  { Subcategory: 'bilety na coś', Category: 'Dodatkowe' },
  { Subcategory: 'prezenty', Category: 'Dodatkowe' },
  { Subcategory: 'inne dodatkowe', Category: 'Dodatkowe' },
  { Subcategory: 'wycieczki', Category: 'Transport' },
  { Subcategory: 'wracanie do domu', Category: 'Transport' },
  { Subcategory: 'abonament', Category: 'Transport' },
  { Subcategory: 'bilety lokalne', Category: 'Transport' },
  { Subcategory: 'Savings', Category: 'Transfer' },
  { Subcategory: 'Spending', Category: 'Transfer' },
  { Subcategory: 'Parents', Category: 'Income' },
  { Subcategory: 'Salary', Category: 'Income' },
  { Subcategory: 'Scholarship', Category: 'Income' },
  { Subcategory: 'Gifts', Category: 'Income' },
  { Subcategory: 'Inne zarobki', Category: 'Income' },
];

const wb = XLSX.utils.book_new();

const wsData = XLSX.utils.json_to_sheet(transactions);
XLSX.utils.book_append_sheet(wb, wsData, 'Data');

const wsAccounts = XLSX.utils.json_to_sheet(accounts);
XLSX.utils.book_append_sheet(wb, wsAccounts, 'Accounts');

const wsCategories = XLSX.utils.json_to_sheet(categories);
XLSX.utils.book_append_sheet(wb, wsCategories, 'Categories');

const outPath = join(__dirname, '..', 'public', 'data', 'budget.xlsx');
XLSX.writeFile(wb, outPath);
console.log(`Mock budget.xlsx written to ${outPath}`);
