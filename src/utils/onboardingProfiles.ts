import { createEventFromTemplate, EVENT_TEMPLATES, type LifeEvent } from './eventTemplates';
import { getCurrentDateKey } from './dateUtils';

export interface JobOption {
  role: string;
  seniority: string;
}

export const INDIAN_JOBS: JobOption[] = [
  { role: 'Software Engineer', seniority: 'Mid-level' },
  { role: 'IT Support / Services', seniority: 'Individual Contributor' },
  { role: 'Private Company Employee', seniority: 'Mid-level' },
  { role: 'Government Employee', seniority: 'Mid-level' },
  { role: 'Teacher', seniority: 'Individual Contributor' },
  { role: 'Nurse / Healthcare Worker', seniority: 'Individual Contributor' },
  { role: 'Sales Executive', seniority: 'Individual Contributor' },
  { role: 'Accountant', seniority: 'Individual Contributor' },
  { role: 'Bank Employee', seniority: 'Mid-level' },
  { role: 'Call Center / BPO', seniority: 'Individual Contributor' },
  { role: 'Small Business Owner', seniority: 'Owner' },
  { role: 'Shop Owner', seniority: 'Owner' },
  { role: 'Freelancer', seniority: 'Individual Contributor' },
  { role: 'Driver / Delivery', seniority: 'Individual Contributor' },
  { role: 'Student', seniority: 'Individual Contributor' },
  { role: 'Homemaker', seniority: 'Individual Contributor' },
  { role: 'Other', seniority: 'Individual Contributor' },
];

export const TIER_1_CITIES = [
  'Bangalore',
  'Mumbai',
  'Delhi',
  'Hyderabad',
  'Chennai',
  'Pune',
  'Gurgaon',
  'Noida',
  'Kolkata',
] as const;

export const TIER_2_CITIES = [
  'Ahmedabad',
  'Jaipur',
  'Chandigarh',
  'Indore',
  'Lucknow',
  'Kochi',
  'Coimbatore',
  'Vadodara',
  'Bhopal',
  'Surat',
  'Nagpur',
  'Mysore',
  'Visakhapatnam',
  'Vijayawada',
] as const;

export const INDIAN_CITIES = [...TIER_1_CITIES, ...TIER_2_CITIES, 'Other'];

export type CityTier = 1 | 2 | 3;

type JobCategory =
  | 'tech'
  | 'corporate'
  | 'government'
  | 'service'
  | 'self_employed'
  | 'student'
  | 'homemaker';

const JOB_CATEGORY_MAP: Record<string, JobCategory> = {
  'Software Engineer': 'tech',
  'IT Support / Services': 'tech',
  'Private Company Employee': 'corporate',
  'Government Employee': 'government',
  Teacher: 'service',
  'Nurse / Healthcare Worker': 'service',
  'Sales Executive': 'corporate',
  Accountant: 'corporate',
  'Bank Employee': 'corporate',
  'Call Center / BPO': 'corporate',
  'Small Business Owner': 'self_employed',
  'Shop Owner': 'self_employed',
  Freelancer: 'self_employed',
  'Driver / Delivery': 'service',
  Student: 'student',
  Homemaker: 'homemaker',
  Other: 'corporate',
};

const SALARY_TABLE: Record<JobCategory, Record<CityTier, number>> = {
  tech: { 1: 120000, 2: 70000, 3: 45000 },
  corporate: { 1: 60000, 2: 45000, 3: 30000 },
  government: { 1: 70000, 2: 55000, 3: 40000 },
  service: { 1: 40000, 2: 30000, 3: 20000 },
  self_employed: { 1: 80000, 2: 50000, 3: 35000 },
  student: { 1: 0, 2: 0, 3: 0 },
  homemaker: { 1: 0, 2: 0, 3: 0 },
};

const eventAliases: Record<string, string[]> = {
  higher_education: ['education'],
  marriage: ['wedding'],
  house_purchase: ['house'],
  child: ['baby'],
  vehicle: ['car'],
  retirement: ['retirement'],
};

export interface OnboardingDefaults {
  age: number;
  job: string;
  jobCategory: JobCategory;
  location: string;
  tier: CityTier;
  salary: number;
  expenses: number;
  savings: number;
  years: number;
  retireYears: number;
}

export function getTier(location: string): CityTier {
  if (TIER_1_CITIES.includes(location as (typeof TIER_1_CITIES)[number])) return 1;
  if (TIER_2_CITIES.includes(location as (typeof TIER_2_CITIES)[number])) return 2;
  return 3;
}

export function findJobOption(role: string): JobOption {
  return INDIAN_JOBS.find((job) => job.role === role) || { role: 'Other', seniority: 'Individual Contributor' };
}

function findEventKey(expectedKey: string): string | null {
  const aliases = eventAliases[expectedKey] || [];
  return aliases.find((key) => Boolean(EVENT_TEMPLATES[key])) || null;
}

function buildEvent(templateKey: string, ageOffset: number, currentAge: number, amount?: number): LifeEvent {
  const ageForEvent = Math.min(80, Math.max(currentAge + ageOffset, currentAge));
  const date = getCurrentDateKey((ageForEvent - currentAge) * 12);
  const base = createEventFromTemplate(templateKey, date);

  if (amount !== undefined) {
    base.amount = amount;
  }

  return base;
}

export function suggestOnboardingDefaults(age: number, job: string, location: string): OnboardingDefaults {
  const normalizedAge = Math.min(60, Math.max(18, age));
  const jobCategory = JOB_CATEGORY_MAP[job] || 'corporate';
  const tier = getTier(location);

  const salary = SALARY_TABLE[jobCategory][tier];

  let baseRatio = ({ 1: 0.7, 2: 0.6, 3: 0.5 } as const)[tier];
  if (jobCategory === 'government') baseRatio -= 0.05;
  if (jobCategory === 'self_employed') baseRatio += 0.05;

  let expenses = Math.round(salary * baseRatio);

  if (jobCategory === 'student') expenses = tier === 1 ? 15000 : tier === 2 ? 12000 : 10000;
  if (jobCategory === 'homemaker') expenses = tier === 1 ? 40000 : tier === 2 ? 30000 : 20000;

  const savings = normalizedAge < 25 ? salary * 2 : normalizedAge < 35 ? salary * 4 : salary * 8;
  const years = Math.max(10, 80 - (normalizedAge + 10));
  const retireYears = Math.max(1, 60 - normalizedAge);

  return {
    age: normalizedAge,
    job,
    jobCategory,
    location,
    tier,
    salary,
    expenses,
    savings,
    years,
    retireYears,
  };
}

export function createSuggestedEvents(age: number, defaults: OnboardingDefaults): LifeEvent[] {
  const events: LifeEvent[] = [];

  const educationKey = findEventKey('higher_education');
  const marriageKey = findEventKey('marriage');
  const childKey = findEventKey('child');
  const houseKey = findEventKey('house_purchase');
  const vehicleKey = findEventKey('vehicle');
  const retirementKey = findEventKey('retirement');

  if (age <= 30 && educationKey) events.push(buildEvent(educationKey, 3, age, 1500000));
  if (age >= 23 && age <= 35 && marriageKey && defaults.jobCategory !== 'student') {
    events.push(buildEvent(marriageKey, 4, age, 1000000));
  }

  if (age >= 25 && age <= 40 && defaults.jobCategory !== 'student') {
    if (childKey) events.push(buildEvent(childKey, 5, age, 1500000));
    if (houseKey) {
      const houseCost = defaults.tier === 1 ? 7000000 : defaults.tier === 2 ? 5000000 : 3000000;
      events.push(buildEvent(houseKey, 7, age, houseCost));
    }
  }

  if (vehicleKey) {
    const vehicle = buildEvent(vehicleKey, 3, age, 800000);
    vehicle.amount = 0;
    vehicle.monthlyImpact = 0;
    events.push(vehicle);
  }

  if (retirementKey) {
    const retirementAtAge = Math.max(60, age);
    const retirement = buildEvent(retirementKey, retirementAtAge - age, age, defaults.expenses * 12 * 20);
    events.push(retirement);
  }

  return events;
}
