import { useMemo, useState, useEffect, useRef } from 'react';
import type { LifeEvent } from '../utils/eventTemplates';
import { runSimulation, generateInsights } from '../utils/simulation';
import type { MonthData, Insight, SimulationInput } from '../utils/simulation';

/**
 * Props for the useSimulation hook.
 */
export interface UseSimulationProps {
  balance: number;
  salary: number;
  expenses: number;
  years: number;
  inflation: number;
  salaryGrowth: number;
  returns: number;
  events: LifeEvent[];
  retireYears: number;
  scaleEventsWithInflation: boolean;
}

/**
 * Result returned by the useSimulation hook.
 */
export interface UseSimulationResult {
  data: MonthData[];
  insights: Insight[];
}

/**
 * Custom hook to run the financial simulation and generate insights.
 * Implements a 32ms throttle to prevent CPU choking during rapid slider moves.
 */
export function useSimulation(props: UseSimulationProps): UseSimulationResult {
  const { 
    balance, salary, expenses, years, 
    inflation, salaryGrowth, returns, events, 
    retireYears, scaleEventsWithInflation 
  } = props;

  const [throttledInput, setThrottledInput] = useState<UseSimulationProps>(props);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // If a transition is already pending, wait
    if (timeoutRef.current !== null) return;

    timeoutRef.current = window.setTimeout(() => {
      setThrottledInput(props);
      timeoutRef.current = null;
    }, 50); // 50ms (~20fps simulation updates)

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    balance, salary, expenses, years, inflation, 
    salaryGrowth, returns, events, retireYears, scaleEventsWithInflation
  ]);

  const data = useMemo(() => {
    const input: SimulationInput = {
      balance: throttledInput.balance,
      salary: throttledInput.salary,
      expenses: throttledInput.expenses,
      years: throttledInput.years,
      inflation: throttledInput.inflation,
      salaryGrowth: throttledInput.salaryGrowth,
      returns: throttledInput.returns,
      events: throttledInput.events,
      retireYears: throttledInput.retireYears,
      scaleEventsWithInflation: throttledInput.scaleEventsWithInflation,
    };
    return runSimulation(input);
  }, [throttledInput]);

  const insights = useMemo(() => generateInsights(data), [data]);

  return { data, insights };
}
