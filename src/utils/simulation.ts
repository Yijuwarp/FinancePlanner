import type { LifeEvent } from './eventTemplates';
import { formatINRShort } from './formatINR';

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

export interface MonthData {
  monthIndex: number;
  label: string;
  dateKey: string;
  balance: number;
  baselineBalance: number;
  salary: number;
  expenses: number;
  activeEvents: ActiveEventInfo[];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dateKeyToIndex(dateKey: string, startYear: number, startMonth: number): number {
  if (!dateKey || !dateKey.includes('-')) return -1;
  const [y, m] = dateKey.split('-').map(Number);
  if (isNaN(y) || isNaN(m)) return -1;
  return (y - startYear) * 12 + (m - startMonth);
}

function calculateImpact(oneTime: number, recurring: number, salary: number): 'low' | 'medium' | 'high' {
  const s = Math.max(salary, 1); // Avoid division by zero
  if (oneTime > s || recurring > s * 0.33) return 'high';
  if (oneTime > s * 0.5 || recurring > s * 0.15) return 'medium';
  return 'low';
}

export function runSimulation(input: SimulationInput): MonthData[] {
  const totalMonths = input.years * 12;
  const now = new Date();
  const startYear = now.getFullYear();
  const startMonth = now.getMonth() + 1;

  const monthlyInflation = Math.pow(1 + input.inflation / 100, 1 / 12) - 1;
  const monthlySalaryGrowth = Math.pow(1 + input.salaryGrowth / 100, 1 / 12) - 1;
  const monthlyReturns = Math.pow(1 + input.returns / 100, 1 / 12) - 1;
  const retireInMonths = input.retireYears * 12;

  // Track salary for impact calculation reference
  const getSalaryAt = (idx: number) => {
    const monthsOfGrowth = Math.min(idx, retireInMonths - 1);
    const s = input.salary * Math.pow(1 + monthlySalaryGrowth, Math.max(0, monthsOfGrowth));
    return Math.max(s, 1);
  };

  // Pre-process events
  const oneTimeEvents = new Map<number, { 
    id: string; amount: number; label: string; emoji: string; isRepeat: boolean; impactLevel: 'low' | 'medium' | 'high' 
  }[]>();
  
  const addOneTime = (idx: number, eventData: { id: string; amount: number; label: string; emoji: string; isRepeat: boolean; impactLevel: 'low' | 'medium' | 'high' }) => {
    const existing = oneTimeEvents.get(idx) || [];
    existing.push(eventData);
    oneTimeEvents.set(idx, existing);
  };

  const durationEvents: {
    id: string; startIdx: number; endIdx: number;
    monthlyImpact: number; label: string; emoji: string; oneTimeAmount: number;
    type: 'duration' | 'job_loss'; isRepeat: boolean; impactLevel: 'low' | 'medium' | 'high';
  }[] = [];

  for (const event of input.events) {
    const eventIdx = dateKeyToIndex(event.date, startYear, startMonth);
    if (eventIdx === -1) continue;

    const getMultiplier = (idx: number) => {
      if (isNaN(idx) || idx < 0) return 1;
      return input.scaleEventsWithInflation ? Math.pow(1 + monthlyInflation, idx) : 1;
    };

    if (event.type === 'one_time') {
      if (eventIdx >= 0 && eventIdx < totalMonths) {
        const amt = (event.amount || 0) * getMultiplier(eventIdx);
        addOneTime(eventIdx, { 
          id: event.id, 
          amount: amt, 
          label: event.label,
          emoji: event.emoji,
          isRepeat: false,
          impactLevel: calculateImpact(amt, 0, getSalaryAt(eventIdx))
        });
      }

      // Handle repeats
      if (event.repeatEnabled && event.repeatInterval && event.repeatInterval > 0) {
        const intervalMonths = event.repeatUnit === 'months' ? event.repeatInterval : event.repeatInterval * 12;
        if (intervalMonths > 0) {
          let nextIdx = eventIdx + intervalMonths;
          while (nextIdx < totalMonths) {
            if (nextIdx >= 0) {
              const amt = (event.amount || 0) * getMultiplier(nextIdx);
              addOneTime(nextIdx, { 
                id: `${event.id}-rep-${nextIdx}`, 
                amount: amt, 
                label: event.label,
                emoji: event.emoji,
                isRepeat: true,
                impactLevel: calculateImpact(amt, 0, getSalaryAt(nextIdx))
              });
            }
            nextIdx += intervalMonths;
          }
        }
      }
    } else if (event.type === 'duration') {
      const endIdx = event.endDate
        ? dateKeyToIndex(event.endDate, startYear, startMonth)
        : eventIdx + (event.durationMonths || 24) - 1;
      
      if (endIdx === -1 || isNaN(endIdx)) continue;
      
      const durationLength = endIdx - eventIdx;
      const initialAmt = (event.amount || 0) * getMultiplier(eventIdx);
      const initialMonthly = (event.monthlyImpact || 0) * getMultiplier(eventIdx);

      durationEvents.push({
        id: event.id, startIdx: eventIdx, endIdx,
        monthlyImpact: initialMonthly, 
        label: event.label,
        emoji: event.emoji,
        oneTimeAmount: initialAmt, 
        type: 'duration',
        isRepeat: false,
        impactLevel: calculateImpact(initialAmt, initialMonthly, getSalaryAt(eventIdx))
      });

      // Handle repeats
      if (event.repeatEnabled && event.repeatInterval && event.repeatInterval > 0) {
        const intervalMonths = event.repeatUnit === 'months' ? event.repeatInterval : event.repeatInterval * 12;
        if (intervalMonths > 0) {
          let nextIdx = eventIdx + intervalMonths;
          while (nextIdx < totalMonths) {
            if (nextIdx >= 0) {
              const m = getMultiplier(nextIdx);
              const amt = (event.amount || 0) * m;
              const monthly = (event.monthlyImpact || 0) * m;
              durationEvents.push({
                id: `${event.id}-rep-${nextIdx}`, 
                startIdx: nextIdx, 
                endIdx: nextIdx + durationLength,
                monthlyImpact: monthly, 
                label: event.label,
                emoji: event.emoji,
                oneTimeAmount: amt, 
                type: 'duration',
                isRepeat: true,
                impactLevel: calculateImpact(amt, monthly, getSalaryAt(nextIdx))
              });
            }
            nextIdx += intervalMonths;
          }
        }
      }
    } else if (event.type === 'job_loss') {
      const endIdx = event.endDate
        ? dateKeyToIndex(event.endDate, startYear, startMonth)
        : eventIdx + (event.durationMonths || 6) - 1;
      
      const m = getMultiplier(eventIdx);
      const amt = (event.amount || 0) * m;
      const monthly = (event.monthlyImpact || 0) * m;
      durationEvents.push({
        id: event.id, startIdx: eventIdx, endIdx,
        monthlyImpact: monthly, 
        label: event.label,
        emoji: event.emoji,
        oneTimeAmount: amt, 
        type: 'job_loss',
        isRepeat: false,
        impactLevel: calculateImpact(amt, monthly, getSalaryAt(eventIdx))
      });
    }
  }

  const results: MonthData[] = [];
  let balance = input.balance;
  let baselineBalance = input.balance;
  let currentSalary = input.salary;
  let currentExpenses = input.expenses;

  for (let i = 0; i < totalMonths; i++) {
    const isRetired = i >= retireInMonths;
    const currentMonth = ((startMonth - 1 + i) % 12) + 1;
    const currentYear = startYear + Math.floor((startMonth - 1 + i) / 12);
    const yearShort = currentYear % 100;
    const label = `${MONTH_NAMES[currentMonth - 1]} '${yearShort.toString().padStart(2, '0')}`;
    const dateKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    if (i > 0) {
      if (!isRetired) currentSalary *= (1 + monthlySalaryGrowth);
      currentExpenses *= (1 + monthlyInflation);
    }

    // Baseline calculation
    if (!isRetired) baselineBalance += currentSalary;
    baselineBalance -= currentExpenses;
    if (baselineBalance > 0) baselineBalance *= (1 + monthlyReturns);

    // Build active events for this month
    const activeEvents: ActiveEventInfo[] = [];
    let jobLossActive = false;

    for (const de of durationEvents) {
      if (i >= de.startIdx && i <= de.endIdx) {
        const isStart = i === de.startIdx;
        
        if (de.type === 'job_loss') {
          jobLossActive = true;
          activeEvents.push({
            id: de.id, label: de.label, emoji: de.emoji, type: 'job_loss',
            oneTimeImpact: isStart ? de.oneTimeAmount : 0,
            recurringImpact: de.monthlyImpact, isStart,
            isRepeat: de.isRepeat, impactLevel: de.impactLevel
          });
        } else {
          activeEvents.push({
            id: de.id, label: de.label, emoji: de.emoji, type: 'duration',
            oneTimeImpact: isStart ? de.oneTimeAmount : 0,
            recurringImpact: de.monthlyImpact, isStart,
            isRepeat: de.isRepeat, impactLevel: de.impactLevel
          });
        }
      }
    }

    const oneTimeHits = oneTimeEvents.get(i);
    if (oneTimeHits) {
      for (const hit of oneTimeHits) {
        activeEvents.push({
          id: hit.id, label: hit.label, emoji: hit.emoji, type: 'one_time',
          oneTimeImpact: hit.amount, recurringImpact: 0, 
          isStart: true, isRepeat: hit.isRepeat,
          impactLevel: hit.impactLevel
        });
      }
    }

    // Apply financial impacts
    if (!jobLossActive && !isRetired) balance += currentSalary;
    balance -= currentExpenses;

    for (const ae of activeEvents) {
      balance -= ae.oneTimeImpact;
      balance -= ae.recurringImpact;
    }

    if (balance > 0) balance *= (1 + monthlyReturns);

    results.push({
      monthIndex: i, label, dateKey,
      balance: Math.round(balance),
      baselineBalance: Math.round(baselineBalance),
      salary: isRetired ? 0 : Math.round(currentSalary),
      expenses: Math.round(currentExpenses),
      activeEvents,
    });
  }

  return results;
}

export interface Insight {
  type: 'danger' | 'warning' | 'info' | 'success';
  icon: string;
  message: string;
}

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
