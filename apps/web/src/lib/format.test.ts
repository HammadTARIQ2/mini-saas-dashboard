import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate, initials, isPastDate, toDateInputValue } from './format';

describe('format helpers', () => {
  it('formats currency without decimals', () => {
    expect(formatCurrency(125000)).toBe('$125,000');
  });

  it('formats deadlines in UTC so the calendar day never shifts', () => {
    expect(formatDate('2025-03-14T00:00:00.000Z')).toBe('Mar 14, 2025');
    expect(toDateInputValue('2025-03-14T00:00:00.000Z')).toBe('2025-03-14');
  });

  it('treats only dates before today as past', () => {
    const now = new Date('2025-06-10T15:00:00.000Z');
    expect(isPastDate('2025-06-09T00:00:00.000Z', now)).toBe(true);
    expect(isPastDate('2025-06-10T00:00:00.000Z', now)).toBe(false);
    expect(isPastDate('2025-06-11T00:00:00.000Z', now)).toBe(false);
  });

  it('builds initials from up to two names', () => {
    expect(initials('Ada Lovelace')).toBe('AL');
    expect(initials('Plato')).toBe('P');
    expect(initials('Mary Ann Evans')).toBe('MA');
  });
});
