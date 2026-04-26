import { createEventFromTemplate, type LifeEvent } from './eventTemplates';
import { getCurrentDateKey } from './dateUtils';

export const INDIAN_JOBS = [
  'Software Engineer', 'Teacher', 'Accountant', 'Sales Executive', 'Nurse',
  'Government Officer', 'Bank Employee', 'Small Business Owner',
  'Customer Support', 'Factory Supervisor', 'Marketing Executive',
  'Operations Manager', 'Civil Engineer', 'Pharmacist', 'Graphic Designer',
  'HR Executive', 'Delivery Partner', 'Electrician', 'Mechanic', 'Freelancer'
];

export const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata',
  'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Indore', 'Bhopal', 'Kochi',
  'Chandigarh', 'Nagpur', 'Patna', 'Visakhapatnam', 'Coimbatore', 'Noida'
];

const JOB_SALARY_MAP: Record<string, number> = {
  'Software Engineer': 130000,
  'Teacher': 50000,
  'Accountant': 65000,
  'Sales Executive': 60000,
  'Nurse': 55000,
  'Government Officer': 70000,
  'Bank Employee': 62000,
  'Small Business Owner': 90000,
  'Customer Support': 42000,
  'Factory Supervisor': 52000,
  'Marketing Executive': 70000,
  'Operations Manager': 85000,
  'Civil Engineer': 80000,
  'Pharmacist': 55000,
  'Graphic Designer': 65000,
  'HR Executive': 70000,
  'Delivery Partner': 35000,
  'Electrician': 45000,
  'Mechanic': 42000,
  'Freelancer': 60000,
};

const LOCATION_MULTIPLIER: Record<string, number> = {
  Mumbai: 1.18,
  Delhi: 1.12,
  Bengaluru: 1.15,
  Hyderabad: 1.05,
  Chennai: 1.03,
  Pune: 1.04,
};

export function suggestOnboardingDefaults(age: number, job: string, location: string) {
  const normalizedAge = Math.min(60, Math.max(21, age));
  const baseSalary = JOB_SALARY_MAP[job] || 65000;
  const locationMultiplier = LOCATION_MULTIPLIER[location] || 1;
  const ageMultiplier = normalizedAge < 30 ? 0.85 : normalizedAge < 40 ? 1 : 1.08;

  const salary = Math.round(baseSalary * locationMultiplier * ageMultiplier);
  const expenses = Math.round(salary * (locationMultiplier > 1.1 ? 0.62 : 0.55));
  const years = Math.max(5, Math.min(50, 80 - (normalizedAge + 10)));
  const retireYears = Math.max(1, Math.min(years, 60 - normalizedAge));

  return { salary, expenses, years, retireYears };
}

export function suggestLifeEventKeys(age: number, job: string): string[] {
  const keys = new Set<string>(['health_insurance']);

  if (age < 30) {
    keys.add('phone');
    keys.add('domestic_trip');
    keys.add('car');
  } else if (age < 40) {
    keys.add('house');
    keys.add('parents');
    keys.add('life_insurance');
  } else {
    keys.add('education');
    keys.add('parents');
    keys.add('life_insurance');
  }

  if (job === 'Small Business Owner' || job === 'Freelancer') {
    keys.add('emergency');
  }

  return Array.from(keys);
}

export function createSuggestedEvents(keys: string[]): LifeEvent[] {
  return keys.map((key, index) => createEventFromTemplate(key, getCurrentDateKey(2 + index * 4)));
}
