import { useMemo } from 'react';
import type { LifeEvent } from '../utils/eventTemplates';
import { runSimulation, generateInsights } from '../utils/simulation';
import type { MonthData, Insight, SimulationInput } from '../utils/simulation';

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

export interface UseSimulationResult {
  data: MonthData[];
  insights: Insight[];
}

export function useSimulation(props: UseSimulationProps): UseSimulationResult {
  const { balance, salary, expenses, years, inflation, salaryGrowth, returns, events, retireYears, scaleEventsWithInflation } = props;

  const data = useMemo(() => {
    const input: SimulationInput = {
      balance,
      salary,
      expenses,
      years,
      inflation,
      salaryGrowth,
      returns,
      events,
      retireYears,
      scaleEventsWithInflation,
    };
    return runSimulation(input);
  }, [balance, salary, expenses, years, inflation, salaryGrowth, returns, events, retireYears, scaleEventsWithInflation]);

  const insights = useMemo(() => generateInsights(data), [data]);

  return { data, insights };
}
