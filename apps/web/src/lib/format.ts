const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

// Deadlines are calendar dates stored at UTC midnight, so format them in UTC
// to avoid showing the previous day in negative-offset time zones.
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export const formatCurrency = (value: number): string => currencyFormatter.format(value);

export const formatCompactCurrency = (value: number): string =>
  compactCurrencyFormatter.format(value);

export const formatDate = (iso: string): string => dateFormatter.format(new Date(iso));

/** `2025-03-14T00:00:00.000Z` -> `2025-03-14` (value for `<input type="date">`). */
export const toDateInputValue = (iso: string): string => iso.slice(0, 10);

/** Today's date as `YYYY-MM-DD` (UTC), the unit deadlines are compared in. */
export const todayIsoDate = (now = new Date()): string => now.toISOString().slice(0, 10);

/** Today's date as `YYYY-MM-DD` in the user's local time zone (what a date picker shows). */
export function localTodayIsoDate(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** A deadline is overdue when it is strictly before today. */
export const isPastDate = (iso: string, now = new Date()): boolean =>
  toDateInputValue(iso) < todayIsoDate(now);

/** "Ada Lovelace" -> "AL" */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}
