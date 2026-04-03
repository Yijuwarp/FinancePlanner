import { addMonthsToDate } from './dateUtils';

export interface LifeEvent {

  id: string;
  type: 'one_time' | 'duration' | 'job_loss';
  label: string;
  emoji: string;
  date: string; // YYYY-MM
  amount?: number; // one-time cost
  monthlyImpact?: number; // recurring monthly cost
  endDate?: string; // YYYY-MM for duration events
  durationMonths?: number; // alternative to endDate
  repeatEnabled?: boolean;
  repeatInterval?: number;
  repeatUnit?: 'years' | 'months';
}

export interface EventTemplate {
  label: string;
  emoji: string;
  type: 'one_time' | 'duration' | 'job_loss';
  defaultAmount?: number;
  defaultMonthlyImpact?: number;
  defaultDurationMonths?: number;
  description: string;
}

export const EVENT_TEMPLATES: Record<string, EventTemplate> = {
  baby: {
    label: 'Baby',
    emoji: '👶',
    type: 'duration',
    defaultAmount: 400000,
    defaultMonthlyImpact: 35000,
    defaultDurationMonths: 216,
    description: '₹4L one-time + ₹35K/month (18 yrs)',
  },
  house: {
    label: 'House',
    emoji: '🏠',
    type: 'duration',
    defaultAmount: 4000000,
    defaultMonthlyImpact: 100000,
    defaultDurationMonths: 240,
    description: '₹40L down payment + ₹1L/month EMI (20 yrs)',
  },
  car: {
    label: 'Car',
    emoji: '🚗',
    type: 'duration',
    defaultAmount: 500000,
    defaultMonthlyImpact: 20000,
    defaultDurationMonths: 72,
    description: '₹5L down payment + ₹20K/month EMI (6 yrs)',
  },
  wedding: {
    label: 'Wedding',
    emoji: '💍',
    type: 'one_time',
    defaultAmount: 6000000,
    description: '₹60L one-time wedding expense',
  },
  phone: {
    label: 'Phone',
    emoji: '📱',
    type: 'one_time',
    defaultAmount: 100000,
    description: '₹1L one-time purchase',
  },
  emergency: {
    label: 'Emergency',
    emoji: '🚨',
    type: 'one_time',
    defaultAmount: 1200000,
    description: '₹12L emergency fund / expense',
  },
  job_loss: {
    label: 'Job Loss',
    emoji: '⚠️',
    type: 'job_loss',
    defaultAmount: 0,
    defaultMonthlyImpact: 100000, // Used as extra cost during job loss
    defaultDurationMonths: 6,
    description: '0 salary + ₹1L/month expenses (6 months)',
  },
  domestic_trip: {
    label: 'Domestic Vacation',
    emoji: '🇮🇳',
    type: 'one_time',
    defaultAmount: 100000,
    description: '₹1L domestic vacation',
  },
  intl_trip: {
    label: 'International Vacation',
    emoji: '🌍',
    type: 'one_time',
    defaultAmount: 350000,
    description: '₹3.5L international vacation',
  },
  education: {
    label: 'Higher Education',
    emoji: '🎓',
    type: 'one_time',
    defaultAmount: 2500000,
    description: '₹25L higher education expense',
  },
  health_insurance: {
    label: 'Health Insurance',
    emoji: '🏥',
    type: 'duration',
    defaultAmount: 0,
    defaultMonthlyImpact: 8000,
    defaultDurationMonths: 240,
    description: '₹8K/month premium (20 yrs)',
  },
  life_insurance: {
    label: 'Life Insurance',
    emoji: '🛡️',
    type: 'duration',
    defaultAmount: 0,
    defaultMonthlyImpact: 2000,
    defaultDurationMonths: 240,
    description: '₹2K/month premium (20 yrs)',
  },
  parents: {
    label: 'Parents Support',
    emoji: '👵',
    type: 'duration',
    defaultAmount: 0,
    defaultMonthlyImpact: 20000,
    defaultDurationMonths: 180,
    description: '₹20K/month support (15 yrs)',
  },
};


export function reCalculateEndDate(date: string, durationMonths: number): string {
  return addMonthsToDate(date, durationMonths);
}

/**
 * Creates a LifeEvent instance from a template key and a start date.
 * 
 * @param templateKey - Key of the template in EVENT_TEMPLATES.
 * @param date - Start date in 'YYYY-MM' format.
 * @returns A new LifeEvent object with default values from the template.
 */
export function createEventFromTemplate(
  templateKey: string,
  date: string
): LifeEvent {
  const template = EVENT_TEMPLATES[templateKey];
  if (!template) throw new Error(`Template not found: ${templateKey}`);
  
  const id = `${templateKey}-${Date.now()}`;
  const durationMonths = template.defaultDurationMonths || 0;
  const endDate = durationMonths > 0 ? addMonthsToDate(date, durationMonths) : undefined;

  let repeatEnabled = false;
  let repeatInterval = 1;
  let repeatUnit: 'years' | 'months' = 'years';

  // Smart defaults for certain event types
  if (templateKey === 'domestic_trip' || templateKey === 'intl_trip') {
    repeatEnabled = true;
    repeatInterval = 1;
  } else if (templateKey === 'phone') {
    repeatEnabled = true;
    repeatInterval = 2;
  } else if (templateKey === 'car') {
    repeatEnabled = true;
    repeatInterval = 5;
  }

  return {
    id,
    type: template.type,
    label: `${template.emoji} ${template.label}`,
    emoji: template.emoji,
    date,
    amount: template.defaultAmount,
    monthlyImpact: template.defaultMonthlyImpact,
    durationMonths: durationMonths > 0 ? durationMonths : undefined,
    endDate,
    repeatEnabled,
    repeatInterval,
    repeatUnit,
  };
}

