import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import type { AppState, AppAction, FilterState } from '../types';
import { DEFAULT_RATES } from '../lib/currency';

const initialFilters: FilterState = {
  startDate: null,
  endDate: null,
  currencyMode: 'multi',
  baseCurrency: 'CHF',
  exchangeRates: DEFAULT_RATES,
};

const initialState: AppState = {
  data: null,
  filters: initialFilters,
  activePage: 'overview',
  darkMode: localStorage.getItem('darkMode') === 'true',
  loading: false,
  error: null,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, data: action.payload, loading: false, error: null };
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
