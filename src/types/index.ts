export type Currency = 'CHF' | 'EUR' | 'PLN';
export type TransactionType = 'Expense' | 'Income' | 'Transfer';
export type ActivePage = 'overview' | 'categories' | 'accounts';

export interface Transaction {
  date: Date;
  week: number;
  category: string;
  subcategory: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  account: string;
  context: string;
  groupId: string | null;
  description: string;
}

export interface AccountBalance {
  account: string;
  startingBalance: number;
  startDate: Date;
  currentBalance: number;
  currency: Currency;
}

export interface CategoryMapping {
  subcategory: string;
  category: string;
}

export interface BudgetData {
  transactions: Transaction[];
  accounts: AccountBalance[];
  categories: CategoryMapping[];
}

export interface FilterState {
  startDate: Date | null;
  endDate: Date | null;
  currencyMode: 'all' | 'filtered';
  filterCurrency: Currency;
}

export interface AppState {
  data: BudgetData | null;
  filters: FilterState;
  activePage: ActivePage;
  darkMode: boolean;
  loading: boolean;
  error: string | null;
}

export type AppAction =
  | { type: 'SET_DATA'; payload: BudgetData }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PAGE'; payload: ActivePage }
  | { type: 'SET_FILTERS'; payload: Partial<FilterState> }
  | { type: 'TOGGLE_DARK_MODE' };
