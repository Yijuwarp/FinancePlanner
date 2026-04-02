/**
 * Format a number to INR display format using K, L, Cr notation
 */
export function formatINR(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1_00_00_000) {
    const cr = absValue / 1_00_00_000;
    return `${sign}₹${formatNum(cr)}Cr`;
  }
  if (absValue >= 1_00_000) {
    const l = absValue / 1_00_000;
    return `${sign}₹${formatNum(l)}L`;
  }
  if (absValue >= 1_000) {
    const k = absValue / 1_000;
    return `${sign}₹${formatNum(k)}K`;
  }
  return `${sign}₹${Math.round(absValue)}`;
}

function formatNum(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  const rounded = Math.round(n * 10) / 10;
  if (Number.isInteger(rounded)) return rounded.toString();
  return rounded.toFixed(1);
}

/**
 * Format for chart axis - shorter
 */
export function formatINRShort(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1_00_00_000) {
    return `${sign}${(absValue / 1_00_00_000).toFixed(1)}Cr`;
  }
  if (absValue >= 1_00_000) {
    return `${sign}${(absValue / 1_00_000).toFixed(1)}L`;
  }
  if (absValue >= 1_000) {
    return `${sign}${(absValue / 1_000).toFixed(0)}K`;
  }
  return `${sign}${Math.round(absValue)}`;
}

/**
 * Parse INR-like input strings (e.g., "5L", "25K", "1Cr") to numbers
 */
export function parseINR(input: string): number | null {
  const cleaned = input.replace(/[₹,\s]/g, '').trim();
  const match = cleaned.match(/^(-?\d+\.?\d*)\s*(cr|l|k)?$/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const unit = (match[2] || '').toLowerCase();
  switch (unit) {
    case 'cr': return num * 1_00_00_000;
    case 'l': return num * 1_00_000;
    case 'k': return num * 1_000;
    default: return num;
  }
}
