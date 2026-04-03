import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { LifeEvent } from '../utils/eventTemplates';

/**
 * State for all financial inputs and events.
 */
interface FinanceState {
  balance: number;
  salary: number;
  expenses: number;
  years: number;
  inflation: number;
  salaryGrowth: number;
  returns: number;
  retireYears: number;
  scaleEventsWithInflation: boolean;
  events: LifeEvent[];
  highlightedEventId: string | null;
  filterLevel: 'all' | 'medium' | 'high';
}

interface FinanceContextType extends FinanceState {
  setBalance: (v: number) => void;
  setSalary: (v: number) => void;
  setExpenses: (v: number) => void;
  setYears: (v: number) => void;
  setInflation: (v: number) => void;
  setSalaryGrowth: (v: number) => void;
  setReturns: (v: number) => void;
  setRetireYears: (v: number) => void;
  setScaleEventsWithInflation: (v: boolean) => void;
  setFilterLevel: (v: 'all' | 'medium' | 'high') => void;
  addEvent: (e: LifeEvent) => void;
  updateEvent: (e: LifeEvent) => void;
  removeEvent: (id: string) => void;
  highlightEvent: (id: string | null) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

/**
 * Provider component to manage financial state globally.
 * Separates input state from the expensive simulation calculations.
 */
export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState(300000);
  const [salary, setSalary] = useState(80000);
  const [expenses, setExpenses] = useState(40000);
  const [years, setYears] = useState(10);
  const [inflation, setInflation] = useState(6);
  const [salaryGrowth, setSalaryGrowth] = useState(10);
  const [returns, setReturns] = useState(8);
  const [retireYears, setRetireYears] = useState(25);
  const [scaleEventsWithInflation, setScaleEventsWithInflation] = useState(false);
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<'all' | 'medium' | 'high'>('high');

  const addEvent = useCallback((event: LifeEvent) => {
    setEvents(prev => [...prev, event]);
  }, []);

  const updateEvent = useCallback((updatedEvent: LifeEvent) => {
    setEvents(prev => prev.map(e => (e.id === updatedEvent.id ? updatedEvent : e)));
  }, []);

  const removeEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    if (highlightedEventId === id) setHighlightedEventId(null);
  }, [highlightedEventId]);

  const highlightEvent = useCallback((id: string | null) => {
    setHighlightedEventId(id);
  }, []);

  const value = useMemo(() => ({
    balance, setBalance,
    salary, setSalary,
    expenses, setExpenses,
    years, setYears,
    inflation, setInflation,
    salaryGrowth, setSalaryGrowth,
    returns, setReturns,
    retireYears, setRetireYears,
    scaleEventsWithInflation, setScaleEventsWithInflation,
    events, addEvent, updateEvent, removeEvent,
    highlightedEventId, highlightEvent,
    filterLevel, setFilterLevel
  }), [
    balance, salary, expenses, years, inflation, 
    salaryGrowth, returns, retireYears, scaleEventsWithInflation, 
    events, addEvent, updateEvent, removeEvent, 
    highlightedEventId, highlightEvent, filterLevel
  ]);

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};

/**
 * Hook to access the financial state and actions.
 */
export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
