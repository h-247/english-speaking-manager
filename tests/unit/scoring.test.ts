import { describe, it, expect } from 'vitest';
import { calculateScore, formatScore } from '@/lib/scoring';

describe('calculateScore', () => {
  it('correctly calculates example scores from Section 20 specification', () => {
    // 48 Pass, 12 Fail => 8.0
    expect(calculateScore(48, 12)).toBe(8.0);

    // 50 Pass, 0 Fail => 10.0
    expect(calculateScore(50, 0)).toBe(10.0);

    // 0 Pass, 10 Fail => 0.0
    expect(calculateScore(0, 10)).toBe(0.0);

    // 7 Pass, 3 Fail => 7.0
    expect(calculateScore(7, 3)).toBe(7.0);

    // 2 Pass, 1 Fail => 6.7 (6.666... rounded to 1 decimal place)
    expect(calculateScore(2, 1)).toBe(6.7);

    // 0 Pass, 0 Fail => null (Unavailable)
    expect(calculateScore(0, 0)).toBeNull();
  });

  it('handles zero denominator without throwing and returns null', () => {
    expect(calculateScore(0, 0)).toBeNull();
  });

  it('returns null when either pass or fail count is null or undefined', () => {
    expect(calculateScore(null, 10)).toBeNull();
    expect(calculateScore(10, null)).toBeNull();
    expect(calculateScore(undefined, 10)).toBeNull();
    expect(calculateScore(10, undefined)).toBeNull();
  });

  it('rejects negative numbers and returns null', () => {
    expect(calculateScore(-1, 10)).toBeNull();
    expect(calculateScore(10, -5)).toBeNull();
  });

  it('rejects fractional numbers and returns null', () => {
    expect(calculateScore(10.5, 5)).toBeNull();
    expect(calculateScore(5, 2.3)).toBeNull();
  });
});

describe('formatScore', () => {
  it('formats null as em-dash', () => {
    expect(formatScore(null)).toBe('—');
    expect(formatScore(undefined)).toBe('—');
  });

  it('formats numbers with one decimal place and /10', () => {
    expect(formatScore(8.0)).toBe('8.0/10');
    expect(formatScore(10)).toBe('10.0/10');
    expect(formatScore(0)).toBe('0.0/10');
    expect(formatScore(6.7)).toBe('6.7/10');
  });
});
