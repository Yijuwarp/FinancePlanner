import type { LifeEvent } from './eventTemplates';

export interface SimulationInput {
  balance: number;
  salary: number;
  expenses: number;
  years: number;
  inflation: number;
  salaryGrowth: number;
  returns: number;
  events: LifeEvent[];
}

export interface ActiveEventInfo {
  id: string;
  label: string;
  type: 'one_time' | 'duration' | 'job_loss';
  oneTimeImpact: number;
  recurringImpact: number;
  isStart: boolean;
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
  const [y, m] = dateKey.split('-').map(Number);
  return (y - startYear) * 12 + (m - startMonth);
}

export function runSimulation(input: SimulationInput): MonthData[] {
  const totalMonths = input.years * 12;
  const now = new Date();
  const startYear = now.getFullYear();
  const startMonth = now.getMonth() + 1;

  const monthlyInflation = Math.pow(1 + input.inflation / 100, 1 / 12) - 1;
  const monthlySalaryGrowth = Math.pow(1 + input.salaryGrowth / 100, 1 / 12) - 1;
  const monthlyReturns = Math.pow(1 + input.returns / 100, 1 / 12) - 1;

  // Pre-process events
  const oneTimeEvents = new Map<number, { id: string; amount: number; label: string }[]>();
  const durationEvents: {
    id: string; startIdx: number; endIdx: number;
    monthlyImpact: number; label: string; oneTimeAmount: number;
    type: 'duration' | 'job_loss';
  }[] = [];

  for (const event of input.events) {
    const eventIdx = dateKeyToIndex(event.date, startYear, startMonth);

    if (event.type === 'one_time') {
      const existing = oneTimeEvents.get(eventIdx) || [];
      existing.push({ id: event.id, amount: event.amount || 0, label: event.label });
      oneTimeEvents.set(eventIdx, existing);
    } else if (event.type === 'duration') {
      const endIdx = event.endDate
        ? dateKeyToIndex(event.endDate, startYear, startMonth)
        : eventIdx + (event.durationMonths || 12) - 1;
      durationEvents.push({
        id: event.id, startIdx: eventIdx, endIdx,
        monthlyImpact: event.monthlyImpact || 0, label: event.label,
        oneTimeAmount: event.amount || 0, type: 'duration',
      });
    } else if (event.type === 'job_loss') {
      const endIdx = event.endDate
        ? dateKeyToIndex(event.endDate, startYear, startMonth)
        : eventIdx + (event.durationMonths || 6) - 1;
      durationEvents.push({
        id: event.id, startIdx: eventIdx, endIdx,
        monthlyImpact: event.monthlyImpact || 0, label: event.label,
        oneTimeAmount: event.amount || 0, type: 'job_loss',
      });
    }
  }

  const results: MonthData[] = [];
  let balance = input.balance;
  let baselineBalance = input.balance;
  let currentSalary = input.salary;
  let currentExpenses = input.expenses;

  for (let i = 0; i < totalMonths; i++) {
    const currentMonth = ((startMonth - 1 + i) % 12) + 1;
    const currentYear = startYear + Math.floor((startMonth - 1 + i) / 12);
    const yearShort = currentYear % 100;
    const label = `${MONTH_NAMES[currentMonth - 1]} '${yearShort.toString().padStart(2, '0')}`;
    const dateKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    if (i > 0) {
      currentSalary *= (1 + monthlySalaryGrowth);
      currentExpenses *= (1 + monthlyInflation);
    }

    // Baseline
    baselineBalance += currentSalary;
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
            id: de.id, label: de.label, type: 'job_loss',
            oneTimeImpact: isStart ? de.oneTimeAmount : 0,
            recurringImpact: de.monthlyImpact, isStart,
          });
        } else {
          activeEvents.push({
            id: de.id, label: de.label, type: 'duration',
            oneTimeImpact: isStart ? de.oneTimeAmount : 0,
            recurringImpact: de.monthlyImpact, isStart,
          });
        }
      }
    }

    const oneTimeHits = oneTimeEvents.get(i);
    if (oneTimeHits) {
      for (const hit of oneTimeHits) {
        activeEvents.push({
          id: hit.id, label: hit.label, type: 'one_time',
          oneTimeImpact: hit.amount, recurringImpact: 0, isStart: true,
        });
      }
    }

    // Apply financial impacts
    if (!jobLossActive) balance += currentSalary;
    balance -= currentExpenses;

    for (const ae of activeEvents) {
      if (ae.type === 'one_time') {
        balance -= ae.oneTimeImpact;
      } else if (ae.type === 'duration' || ae.type === 'job_loss') {
        balance -= ae.oneTimeImpact;
        balance -= ae.recurringImpact;
      }
    }

    if (balance > 0) balance *= (1 + monthlyReturns);

    results.push({
      monthIndex: i, label, dateKey,
      balance: Math.round(balance),
      baselineBalance: Math.round(baselineBalance),
      salary: Math.round(currentSalary),
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
    message: `Lowest balance: ₹${Math.abs(lowestBalance).toLocaleString('en-IN')} ${lowestBalance < 0 ? '(deficit)' : ''} in ${lowestMonth.label}`,
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
      message: `Life events cost you ₹${diff.toLocaleString('en-IN')} over the projected period`,
    });
  }

  if (!negativeMonth) {
    insights.push({
      type: 'success', icon: '✅',
      message: `You stay financially positive! Final balance: ₹${finalData.balance.toLocaleString('en-IN')}`,
    });
  }

  return insights;
}
