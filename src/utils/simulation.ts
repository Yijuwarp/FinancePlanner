import type { LifeEvent } from './eventTemplates';
import { formatINRShort } from './formatINR';
import { dateKeyToIndex, formatChartLabel } from './dateUtils';

/**
 * Input parameters for the financial simulation.
 */
export interface SimulationInput {
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
 * Information about an active financial event in a specific month.
 */
export interface ActiveEventInfo {
  id: string;
  label: string;
  emoji?: string;
  type: 'one_time' | 'duration' | 'job_loss';
  oneTimeImpact: number;
  recurringImpact: number;
  isStart: boolean;
  isRepeat?: boolean;
  impactLevel?: 'low' | 'medium' | 'high';
}

/**
 * Data point for a single month in the simulation.
 */
export interface MonthData {
  monthIndex: number;
  label: string;
  dateKey: string;
  balance: number;
  baselineBalance: number;
  salary: number;
  expenses: number;
  activeEvents: ActiveEventInfo[];
  returnsEarned: number;
  netCashFlow: number;
}

/**
 * Categorizes an event's financial impact relative to current salary.
 * 
 * @param oneTime - One-time cost of the event.
 * @param recurring - Monthly recurring cost of the event.
 * @param salary - User's current monthly salary for scale.
 * @returns 'low', 'medium', or 'high'.
 */
function calculateImpact(oneTime: number, recurring: number, salary: number): 'low' | 'medium' | 'high' {
  const s = Math.max(salary, 1); // Avoid division by zero
  if (oneTime > s || recurring > s * 0.33) return 'high';
  if (oneTime > s * 0.5 || recurring > s * 0.15) return 'medium';
  return 'low';
}

/**
 * Pre-calculates all event impacts for each month to optimize the main simulation loop.
 * 
 * @param input - Simulation inputs containing events and configuration.
 * @param totalMonths - Total number of months to project.
 * @param startYear - Simulation start year.
 * @param startMonth - Simulation start month (1-12).
 * @param monthlyInflation - Calculated monthly inflation rate.
 * @param getSalaryAt - Helper function to get salary at a specific month index.
 * @returns A Map matching month index to an array of active events for that month.
 */
function preprocessEvents(
  input: SimulationInput,
  totalMonths: number,
  startYear: number,
  startMonth: number,
  monthlyInflation: number,
  getSalaryAt: (idx: number) => number
): Map<number, ActiveEventInfo[]> {
  const monthlyImpacts = new Map<number, ActiveEventInfo[]>();

  const addEventToMonth = (idx: number, info: ActiveEventInfo) => {
    if (idx < 0 || idx >= totalMonths) return;
    const existing = monthlyImpacts.get(idx) || [];
    existing.push(info);
    monthlyImpacts.set(idx, existing);
  };

  const getMultiplier = (idx: number) => {
    return input.scaleEventsWithInflation ? Math.pow(1 + monthlyInflation, idx) : 1;
  };

  for (const event of input.events) {
    const eventIdx = dateKeyToIndex(event.date, startYear, startMonth);
    if (eventIdx === -1) continue;

    const processInstance = (idx: number, isRepeat: boolean) => {
      const mult = getMultiplier(idx);
      const oneTimeAmt = (event.amount || 0) * mult;
      const monthlyAmt = (event.monthlyImpact || 0) * mult;
      const salary = getSalaryAt(idx);
      const impactLevel = calculateImpact(oneTimeAmt, monthlyAmt, salary);

      if (event.type === 'one_time') {
        addEventToMonth(idx, {
          id: isRepeat ? `${event.id}-rep-${idx}` : event.id,
          label: event.label,
          emoji: event.emoji,
          type: 'one_time',
          oneTimeImpact: oneTimeAmt,
          recurringImpact: 0,
          isStart: true,
          isRepeat,
          impactLevel
        });
      } else {
        // Duration or Job Loss
        const instanceDuration = event.durationMonths || 24;
        const endIdx = isRepeat 
          ? idx + instanceDuration - 1
          : (event.endDate ? dateKeyToIndex(event.endDate, startYear, startMonth) : idx + instanceDuration - 1);
        
        if (endIdx < idx) return;

        for (let i = idx; i <= Math.min(endIdx, totalMonths - 1); i++) {
          const isStart = i === idx;
          addEventToMonth(i, {
            id: isRepeat ? `${event.id}-rep-${idx}` : event.id,
            label: event.label,
            emoji: event.emoji,
            type: event.type,
            oneTimeImpact: isStart ? oneTimeAmt : 0,
            recurringImpact: monthlyAmt,
            isStart,
            isRepeat,
            impactLevel
          });
        }
      }
    };

    // Process initial instance
    processInstance(eventIdx, false);

    // Process repeats
    if (event.repeatEnabled && event.repeatInterval && event.repeatInterval > 0) {
      const intervalMonths = event.repeatUnit === 'months' ? event.repeatInterval : event.repeatInterval * 12;
      let nextIdx = eventIdx + intervalMonths;
      while (nextIdx < totalMonths) {
        processInstance(nextIdx, true);
        nextIdx += intervalMonths;
      }
    }
  }

  return monthlyImpacts;
}

/**
 * Runs the financial simulation based on user inputs.
 * Uses pre-calculated event impacts and growth multipliers for performance.
 * 
 * @param input - All simulation parameters.
 * @returns Array of data points for each month in the projection.
 */
export function runSimulation(input: SimulationInput): MonthData[] {
  const totalMonths = input.years * 12;
  const now = new Date();
  const startYear = now.getFullYear();
  const startMonth = now.getMonth() + 1;

  const monthlyInflation = Math.pow(1 + input.inflation / 100, 1 / 12) - 1;
  const monthlySalaryGrowth = Math.pow(1 + input.salaryGrowth / 100, 1 / 12) - 1;
  const monthlyReturns = Math.pow(1 + input.returns / 100, 1 / 12) - 1;
  const retireInMonths = input.retireYears * 12;

  // Caching salary growth multipliers
  const salaryMultipliers = new Float64Array(totalMonths);
  for (let i = 0; i < totalMonths; i++) {
    const monthsOfGrowth = Math.min(i, retireInMonths - 1);
    salaryMultipliers[i] = Math.pow(1 + monthlySalaryGrowth, Math.max(0, monthsOfGrowth));
  }

  const getSalaryAt = (idx: number) => {
    return Math.max(input.salary * salaryMultipliers[idx], 1);
  };

  // Pre-process all events into a lookup table
  const monthlyEventImpactMap = preprocessEvents(
    input, totalMonths, startYear, startMonth, monthlyInflation, getSalaryAt
  );

  const results: MonthData[] = [];
  let balance = input.balance;
  let baselineBalance = input.balance;
  
  // Caching inflation for core expenses
  const inflationMultipliers = new Float64Array(totalMonths);
  for (let i = 0; i < totalMonths; i++) {
    inflationMultipliers[i] = Math.pow(1 + monthlyInflation, i);
  }

  for (let i = 0; i < totalMonths; i++) {
    const isRetired = i >= retireInMonths;
    const currentMonth = ((startMonth - 1 + i) % 12) + 1;
    const currentYear = startYear + Math.floor((startMonth - 1 + i) / 12);
    const label = formatChartLabel(currentYear, currentMonth);
    const dateKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    const currentSalary = isRetired ? 0 : getSalaryAt(i);
    const currentExpenses = input.expenses * inflationMultipliers[i];

    // 1. Baseline calculation (no events)
    if (!isRetired) baselineBalance += currentSalary;
    baselineBalance -= currentExpenses;
    if (baselineBalance > 0) baselineBalance *= (1 + monthlyReturns);

    // 2. Active events and current balance calculation
    const activeEvents = monthlyEventImpactMap.get(i) || [];
    const jobLossActive = activeEvents.some(ae => ae.type === 'job_loss');

    // Apply income/expense for simulation balance
    if (!jobLossActive && !isRetired) balance += currentSalary;
    
    // Sum impacts efficiently
    let monthOneTimeImpact = 0;
    let monthRecurringImpact = 0;
    for (let j = 0; j < activeEvents.length; j++) {
      monthOneTimeImpact += activeEvents[j].oneTimeImpact;
      monthRecurringImpact += activeEvents[j].recurringImpact;
    }
    
    // Inflation for core expenses is now tied to the same toggle
    const adjustedExpenses = input.scaleEventsWithInflation ? currentExpenses : input.expenses;
    
    balance -= adjustedExpenses;
    balance -= monthOneTimeImpact;
    balance -= monthRecurringImpact;

    const netCashFlow = currentSalary - adjustedExpenses - monthOneTimeImpact - monthRecurringImpact;

    const returnsEarned = balance > 0 ? balance * monthlyReturns : 0;
    if (balance > 0) balance += returnsEarned;

    results.push({
      monthIndex: i,
      label,
      dateKey,
      balance: Math.round(balance),
      baselineBalance: Math.round(baselineBalance),
      salary: Math.round(currentSalary),
      expenses: Math.round(adjustedExpenses),
      activeEvents: [...activeEvents],
      returnsEarned: Math.round(returnsEarned),
      netCashFlow: Math.round(netCashFlow),
    });
  }

  return results;
}

/**
 * A simple insight message.
 */
export interface Insight {
  type: 'danger' | 'warning' | 'info' | 'success';
  icon: string;
  message: string;
}

/**
 * Generates automated financial insights based on the simulation results.
 * 
 * @param data - The output from runSimulation.
 * @returns Array of insights related to solvency, cost of events, and lowest balances.
 */
export function generateInsights(data: MonthData[]): Insight[] {
  const insights: Insight[] = [];
  if (data.length === 0) return insights;

  const negativeMonth = data.find(d => d.balance < 0);
  if (negativeMonth) {
    insights.push({
      type: 'danger', icon: '🚨',
      message: `You run out of money in ${negativeMonth.label}`,
    });
  }

  let lowestBalance = Infinity;
  let lowestMonth = data[0];
  for (const d of data) {
    if (d.balance < lowestBalance) {
      lowestBalance = d.balance;
      lowestMonth = d;
    }
  }
  
  insights.push({
    type: lowestBalance < 0 ? 'danger' : 'warning', icon: '📉',
    message: `Lowest balance: ₹${formatINRShort(Math.abs(lowestBalance))} ${lowestBalance < 0 ? '(deficit)' : ''} in ${lowestMonth.label}`,
  });

  if (negativeMonth) {
    const firstNegIdx = data.findIndex(d => d.balance < 0);
    const recovery = data.slice(firstNegIdx).find(d => d.balance >= 0);
    if (recovery) {
      insights.push({
        type: 'info', icon: '📈',
        message: `Recovery takes ${recovery.monthIndex - firstNegIdx} months (back to positive in ${recovery.label})`,
      });
    } else {
      insights.push({
        type: 'danger', icon: '⚠️',
        message: `No recovery within the projected period — balance stays negative`,
      });
    }
  }

  const finalData = data[data.length - 1];
  const diff = finalData.baselineBalance - finalData.balance;
  if (diff > 0) {
    insights.push({
      type: 'info', icon: '💡',
      message: `Life events cost you ₹${formatINRShort(diff)} over the projected period`,
    });
  }

  if (!negativeMonth) {
    insights.push({
      type: 'success', icon: '✅',
      message: `You stay financially positive! Final balance: ₹${formatINRShort(finalData.balance)}`,
    });
  }

  return insights;
}
