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
