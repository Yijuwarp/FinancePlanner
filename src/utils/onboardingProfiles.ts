import { createEventFromTemplate, EVENT_TEMPLATES, type LifeEvent } from './eventTemplates';
import { getCurrentDateKey } from './dateUtils';

export interface JobOption {
  role: string;
  seniority: string;
  label: string;
  searchTokens: string[];
}

export const ROLE_ENUM = [
  'Software Engineer',
  'Data Professional',
  'IT / Systems Engineer',
  'Product Manager',
  'Designer (UI/UX)',
  'Operations',
  'Sales',
  'Marketing',
  'Human Resources',
  'Finance',
  'Banking',
  'Insurance',
  'Government',
  'PSU',
  'Teacher / Professor',
  'Doctor',
  'Nurse / Healthcare',
  'Business Owner',
  'Retail / Shop Owner',
  'Freelancer / Consultant',
  'Driver',
  'Delivery / Gig',
  'Technician',
  'Student',
  'Homemaker',
  'Unemployed',
] as const;

const SENIORITY_LEVELS = [
  'Entry',
  'Individual Contributor',
  'Senior',
  'Manager',
  'Director',
  'Vice President',
  'CXO',
] as const;

const SENIORITY_SYNONYMS: Record<string, string[]> = {
  Entry: ['junior'],
  Senior: ['senior'],
  Manager: ['manager'],
  Director: ['director'],
  'Vice President': ['vp'],
  CXO: ['ceo', 'cto', 'cfo', 'chief'],
  'Individual Contributor': ['individual contributor', 'ic'],
  None: ['none'],
};

const ROLE_SYNONYMS: Record<string, string[]> = {
  'Software Engineer': ['engineer', 'developer'],
  'IT / Systems Engineer': ['it', 'systems'],
  'Data Professional': ['data'],
  'Product Manager': ['product'],
  'Designer (UI/UX)': ['design', 'designer', 'ui', 'ux'],
  'Human Resources': ['hr'],
  Operations: ['ops'],
  Banking: ['bank'],
  'Teacher / Professor': ['teacher', 'professor'],
  Doctor: ['doctor'],
  'Nurse / Healthcare': ['nurse', 'healthcare'],
  'Business Owner': ['business'],
  'Retail / Shop Owner': ['shop'],
  'Freelancer / Consultant': ['freelance', 'consultant'],
  Driver: ['driver'],
  'Delivery / Gig': ['delivery', 'gig'],
  Technician: ['electrician', 'plumber', 'technician'],
  Sales: ['sales'],
  Marketing: ['marketing'],
  Finance: ['finance'],
  Insurance: ['insurance'],
};

const NON_EARNING_ROLES = new Set(['Student', 'Homemaker', 'Unemployed']);

function allowedSeniorities(role: string): string[] {
  if (NON_EARNING_ROLES.has(role)) return ['None'];
  if (['Driver', 'Delivery / Gig', 'Technician'].includes(role)) return ['Entry', 'Individual Contributor'];
  if (['Business Owner', 'Retail / Shop Owner'].includes(role)) return ['Individual Contributor', 'Manager'];
  if (role === 'Doctor') return ['Individual Contributor', 'Senior', 'Director'];
  if (role === 'Teacher / Professor') return ['Individual Contributor', 'Senior', 'Manager'];
  return [...SENIORITY_LEVELS];
}

function formatJobLabel(role: string, seniority: string): string {
  if (seniority === 'None' || seniority === 'Individual Contributor') return role;
  if (seniority === 'Entry') return `Junior ${role}`;
  if (seniority === 'Senior') return `Senior ${role}`;
  if (seniority === 'Manager') return `Manager - ${role}`;
  if (seniority === 'Director') return `Director of ${role}`;
  if (seniority === 'Vice President') return `VP - ${role}`;
  if (seniority === 'CXO') return `CXO - ${role}`;
  return role;
}

function buildSearchTokens(role: string, seniority: string, label: string): string[] {
  return [
    role,
    seniority,
    label,
    ...(ROLE_SYNONYMS[role] || []),
    ...(SENIORITY_SYNONYMS[seniority] || []),
  ].map((token) => token.toLowerCase());
}

export const INDIAN_JOBS: JobOption[] = [
  ...ROLE_ENUM.flatMap((role) =>
    allowedSeniorities(role).map((seniority) => {
      const label = formatJobLabel(role, seniority);
      return {
        role,
        seniority,
        label,
        searchTokens: buildSearchTokens(role, seniority, label),
      };
    }),
  ),
  {
    role: 'Other',
    seniority: 'Individual Contributor',
    label: 'Other',
    searchTokens: ['other'],
  },
];

export function searchJobOptions(query: string): JobOption[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return INDIAN_JOBS.slice(0, 16);

  const ranked = INDIAN_JOBS.map((option) => {
    const label = option.label.toLowerCase();
    const role = option.role.toLowerCase();
    const seniority = option.seniority.toLowerCase();
    const tokens = option.searchTokens;

    let score = 999;

    if (label === normalized || role === normalized || `${option.role} ${option.seniority}`.toLowerCase() === normalized) {
      score = 0;
    } else {
      const words = normalized.split(/\s+/).filter(Boolean);
      const roleAndSeniority = words.every((word) => role.includes(word) || seniority.includes(word));
      const roleOnly = words.every((word) => role.includes(word));
      const seniorityOnly = words.every((word) => seniority.includes(word));
      const synonymMatch = words.every((word) => tokens.some((token) => token.includes(word)));

      if (roleAndSeniority) score = 1;
      else if (roleOnly) score = 2;
      else if (seniorityOnly) score = 3;
      else if (synonymMatch) score = 4;
      else if (label.includes(normalized)) score = 5;
    }

    return { option, score };
  })
    .filter((entry) => entry.score < 999)
    .sort((a, b) => a.score - b.score || a.option.label.localeCompare(b.option.label));

  if (!ranked.length) {
    return INDIAN_JOBS.filter((option) => option.role === 'Other');
  }

  return ranked.slice(0, 20).map((entry) => entry.option);
}

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

type SeniorityLevel = (typeof SENIORITY_LEVELS)[number] | 'None';

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
  'Data Professional': 'tech',
  'IT / Systems Engineer': 'tech',
  'Product Manager': 'corporate',
  'Designer (UI/UX)': 'corporate',
  Operations: 'corporate',
  Sales: 'corporate',
  Marketing: 'corporate',
  'Human Resources': 'corporate',
  Finance: 'corporate',
  Banking: 'corporate',
  Insurance: 'corporate',
  Government: 'government',
  PSU: 'government',
  'Teacher / Professor': 'service',
  Doctor: 'service',
  'Nurse / Healthcare': 'service',
  'Business Owner': 'self_employed',
  'Retail / Shop Owner': 'self_employed',
  'Freelancer / Consultant': 'self_employed',
  Driver: 'service',
  'Delivery / Gig': 'service',
  Technician: 'service',
  Student: 'student',
  Homemaker: 'homemaker',
  Unemployed: 'student',
  Other: 'corporate',
};

const TIER_MULTIPLIER: Record<CityTier, number> = {
  1: 1.0,
  2: 0.75,
  3: 0.55,
};

const SENIORITY_MULTIPLIER: Record<SeniorityLevel, number> = {
  None: 0,
  Entry: 0.6,
  'Individual Contributor': 1.0,
  Senior: 1.5,
  Manager: 2.2,
  Director: 3.5,
  'Vice President': 5.5,
  CXO: 8.0,
};

function normalizeSeniority(value: string): SeniorityLevel {
  if (value === 'None') return 'None';
  if ((SENIORITY_LEVELS as readonly string[]).includes(value)) return value as SeniorityLevel;
  return 'Individual Contributor';
}

const NON_EARNING_SET = new Set(['Student', 'Homemaker', 'Unemployed']);

const BASE_ROLE_SALARY_TIER_1: Record<string, number> = {
  'Software Engineer': 120000,
  'Data Professional': 110000,
  'IT / Systems Engineer': 70000,
  'Product Manager': 140000,
  'Designer (UI/UX)': 90000,
  Operations: 60000,
  Sales: 50000,
  Marketing: 60000,
  'Human Resources': 50000,
  Finance: 70000,
  Banking: 60000,
  Insurance: 50000,
  Government: 60000,
  PSU: 80000,
  'Teacher / Professor': 40000,
  Doctor: 120000,
  'Nurse / Healthcare': 30000,
  'Business Owner': 80000,
  'Retail / Shop Owner': 50000,
  'Freelancer / Consultant': 70000,
  Driver: 25000,
  'Delivery / Gig': 20000,
  Technician: 30000,
  Student: 0,
  Homemaker: 0,
  Unemployed: 0,
  Other: 60000,
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

export function findJobOption(labelOrRole: string): JobOption {
  return INDIAN_JOBS.find((job) => job.label === labelOrRole || job.role === labelOrRole) || {
    role: 'Other',
    seniority: 'Individual Contributor',
    label: 'Other',
    searchTokens: ['other'],
  };
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

export function suggestOnboardingDefaults(
  age: number,
  job: string,
  location: string,
  seniority: string = 'Individual Contributor',
): OnboardingDefaults {
  const normalizedAge = Math.min(60, Math.max(18, age));
  const jobCategory = JOB_CATEGORY_MAP[job] || 'corporate';
  const tier = getTier(location);

  const normalizedSeniority = normalizeSeniority(seniority);
  const baseRoleSalary = BASE_ROLE_SALARY_TIER_1[job] ?? BASE_ROLE_SALARY_TIER_1.Other;
  const rawSalary = NON_EARNING_SET.has(job)
    ? 0
    : baseRoleSalary * TIER_MULTIPLIER[tier] * (SENIORITY_MULTIPLIER[normalizedSeniority] ?? 1);

  let salary = rawSalary;
  if (salary > 0 && salary < 15000) salary = 15000;
  if (salary > 1500000) salary = 1500000;
  salary = Math.round(salary / 1000) * 1000;

  let baseRatio = ({ 1: 0.7, 2: 0.6, 3: 0.5 } as const)[tier];
  if (['Manager', 'Director', 'Vice President', 'CXO'].includes(normalizedSeniority)) baseRatio -= 0.05;
  if (['Driver', 'Delivery / Gig'].includes(job)) baseRatio += 0.05;

  const expenses = Math.round((salary * baseRatio) / 1000) * 1000;

  const savings = salary === 0
    ? 10000
    : normalizedAge < 25 ? salary * 2 : normalizedAge < 35 ? salary * 4 : salary * 8;
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
    events.push(buildEvent(vehicleKey, 3, age));
  }

  if (retirementKey) {
    const retirementAtAge = Math.max(60, age);
    const retirement = buildEvent(retirementKey, retirementAtAge - age, age, defaults.expenses * 12 * 20);
    events.push(retirement);
  }

  return events;
}
