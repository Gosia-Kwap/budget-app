import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import type { AppState, AppAction, FilterState } from '../types';
import { listCurrencies } from '../lib/currency';

const initialFilters: FilterState = {
  startDate: null,
  endDate: null,
  currencyMode: 'all',
  // Filled in from the workbook once it loads — there is no default currency.
  filterCurrency: '',
};

const initialState: AppState = {
  data: null,
  filters: initialFilters,
  activePage: 'overview',
  darkMode: localStorage.getItem('darkMode') !== null ? localStorage.getItem('darkMode') === 'true' : false,
  viewMode: (localStorage.getItem('viewMode') === 'classic' ? 'classic' : 'ledger'),
  loading: false,
  error: null,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_DATA': {
      // Point the currency filter at a currency that actually exists in this
      // workbook, so switching off "all" can never land on an empty view.
      const available = listCurrencies(action.payload);
      const filterCurrency = available.includes(state.filters.filterCurrency)
        ? state.filters.filterCurrency
        : available[0] ?? '';
      return {
        ...state,
        data: action.payload,
        filters: { ...state.filters, filterCurrency },
        loading: false,
        error: null,
      };
    }
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_PAGE':
      return { ...state, activePage: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'TOGGLE_DARK_MODE': {
      const next = !state.darkMode;
      localStorage.setItem('darkMode', String(next));
      return { ...state, darkMode: next };
    }
    case 'TOGGLE_VIEW_MODE': {
      const next = state.viewMode === 'ledger' ? 'classic' : 'ledger';
      localStorage.setItem('viewMode', next);
      return { ...state, viewMode: next };
    }
    default:
      return state;
  }
}

const BudgetContext = createContext<AppState>(initialState);
const DispatchContext = createContext<Dispatch<AppAction>>(() => {});

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <BudgetContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  return useContext(BudgetContext);
}

export function useBudgetDispatch() {
  return useContext(DispatchContext);
}
