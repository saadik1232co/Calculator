/**
 * Shared Pure Utility Functions
 * High-performance, side-effect free helpers for arithmetic and formatting.
 */

/**
 * Clamps a number between a minimum and maximum boundary.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Rounds a number to a specified number of decimal places to eliminate IEEE 754 precision drift.
 * Defaults to 10 decimal places.
 */
export function roundSafe(value: number, precision: number = 10): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

/**
 * Safe division preventing division by zero, Infinity, and NaN.
 * Returns null if division is invalid.
 */
export function safeDivide(numerator: number, denominator: number): number | null {
  if (denominator === 0 || !isFinite(denominator)) {
    return null;
  }
  const result = numerator / denominator;
  return isFinite(result) ? roundSafe(result) : null;
}

/**
 * Formats a number as USD currency with customizable decimal digits.
 */
export function formatCurrency(val: number, decimals: number = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

/**
 * Formats a number as rounded USD currency with zero decimal places (e.g. for mortgage payments).
 */
export function formatCurrencyRounded(val: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(val));
}

/**
 * Formats numeric string or number with thousands separator commas.
 * Preserves decimals and negative signs, while handling special strings like error messages.
 */
export function formatNumber(val: number | string): string {
  const str = String(val);
  if (str === "Cannot divide by zero") return str;

  const isNegative = str.startsWith("-");
  const clean = isNegative ? str.slice(1) : str;
  const parts = clean.split(".");
  const integerPart = parts[0] || "0";
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (str.includes(".")) {
    return `${isNegative ? "-" : ""}${formattedInteger}.${parts[1] ?? ""}`;
  }
  return `${isNegative ? "-" : ""}${formattedInteger}`;
}

/**
 * Counts digits in a string, ignoring minus signs and decimal points.
 */
export function countDigits(str: string): number {
  return str.replace(/[^0-9]/g, "").length;
}
