/**
 * Utility functions for date manipulation and formatting in the Finance Planner.
 * Standardizes the 'YYYY-MM' dateKey format used throughout the application.
 */

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Converts a date string (YYYY-MM) to a relative month index from a start date.
 * 
 * @param dateKey - Date string in 'YYYY-MM' format.
 * @param startYear - The year to start counting from.
 * @param startMonth - The month (1-12) to start counting from.
 * @returns The number of months since the start date, or -1 if invalid.
 */
export function dateKeyToIndex(dateKey: string, startYear: number, startMonth: number): number {
  if (!dateKey || !dateKey.includes('-')) return -1;
  const [y, m] = dateKey.split('-').map(Number);
  if (isNaN(y) || isNaN(m)) return -1;
  return (y - startYear) * 12 + (m - startMonth);
}

/**
 * Calculates an end date string by adding a duration in months to a start date.
 * 
 * @param dateKey - Start date string in 'YYYY-MM' format.
 * @param durationMonths - Number of months to add.
 * @returns New date string in 'YYYY-MM' format.
 */
export function addMonthsToDate(dateKey: string, durationMonths: number): string {
  if (!dateKey || !dateKey.includes('-')) return dateKey;
  const [year, month] = dateKey.split('-').map(Number);
  if (isNaN(year) || isNaN(month)) return dateKey;
  
  const totalMonths = month + durationMonths - 1;
  const targetYear = year + Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
}

/**
 * Formats a dateKey (YYYY-MM) into a human-readable string (e.g., "Jan 2024").
 * 
 * @param dateKey - Date string in 'YYYY-MM' format.
 * @returns Formatted date string.
 */
export function formatEventDate(dateKey: string): string {
  if (!dateKey) return '';
  const [year, month] = dateKey.split('-').map(Number);
  if (isNaN(year) || isNaN(month)) return '';
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/**
 * Formats a date for the chart labels (e.g., "Jan '24").
 * 
 * @param year - Full year.
 * @param month - Month (1-12).
 * @returns Formatted short date string.
 */
export function formatChartLabel(year: number, month: number): string {
  const yearShort = year % 100;
  return `${MONTH_NAMES[month - 1]} '${yearShort.toString().padStart(2, '0')}`;
}

/**
 * Gets the current month in 'YYYY-MM' format.
 * 
 * @param offset - Optional offset in months from current date.
 * @returns Date string in 'YYYY-MM' format.
 */
export function getCurrentDateKey(offset = 0): string {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1 + offset;
  
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  
  return `${year}-${String(month).padStart(2, '0')}`;
}
