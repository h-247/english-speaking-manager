import { describe, it, expect } from 'vitest';
import { formatDate, formatDateShort } from '@/lib/format-date';

describe('formatDate with Asia/Ho_Chi_Minh timezone', () => {
  it('formats UTC ISO timestamp into English date in ICT timezone (+7)', () => {
    // 2026-10-25T17:00:00Z corresponds to 2026-10-26 00:00:00 in UTC+7 (Asia/Ho_Chi_Minh)
    const formatted = formatDate('2026-10-25T17:00:00Z', true);
    expect(formatted).toContain('Oct 26, 2026');
    expect(formatted).toContain('12:00 AM');
  });

  it('handles null and undefined gracefully with em-dash', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDateShort(null)).toBe('—');
  });

  it('formats date without time when includeTime is false', () => {
    const formatted = formatDateShort('2026-10-25T17:00:00Z');
    expect(formatted).toBe('Oct 26, 2026');
  });
});
