import { describe, it, expect } from 'vitest';
import { createAttemptSchema, sessionImportItemSchema } from '@/lib/validation';
import { calculateScore, formatScore } from '@/lib/scoring';

describe('createAttemptSchema', () => {
  it('validates a valid practice attempt payload', () => {
    const valid = {
      passCount: 45,
      failCount: 5,
      practicedAt: '2026-10-26T10:00:00.000Z',
      notes: 'Fluent pacing and better intonation.',
      markCompleted: true,
    };

    const res = createAttemptSchema.safeParse(valid);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.passCount).toBe(45);
      expect(res.data.failCount).toBe(5);
      expect(res.data.notes).toBe('Fluent pacing and better intonation.');
      expect(res.data.markCompleted).toBe(true);
    }
  });

  it('rejects negative numbers for pass or fail count in attempt', () => {
    expect(createAttemptSchema.safeParse({ passCount: -5, failCount: 2 }).success).toBe(false);
    expect(createAttemptSchema.safeParse({ passCount: 50, failCount: -1 }).success).toBe(false);
  });

  it('rejects decimal counters in attempt', () => {
    expect(createAttemptSchema.safeParse({ passCount: 45.5, failCount: 2 }).success).toBe(false);
    expect(createAttemptSchema.safeParse({ passCount: 45, failCount: 1.5 }).success).toBe(false);
  });

  it('allows optional notes and practicedAt', () => {
    const minimal = {
      passCount: 40,
      failCount: 10,
    };
    const res = createAttemptSchema.safeParse(minimal);
    expect(res.success).toBe(true);
  });
});

describe('sessionImportItemSchema with attempts history', () => {
  it('validates a session import item containing attempts list', () => {
    const item = {
      topic: 'Speaking Practice 1',
      chatgptUrl: 'https://chatgpt.com/c/attempt-test-123',
      status: 'COMPLETED',
      attempts: [
        {
          passCount: 30,
          failCount: 20,
          score: 6.0,
          notes: 'Attempt 1 initial try',
          practicedAt: '2026-10-25T10:00:00.000Z',
        },
        {
          passCount: 45,
          failCount: 5,
          score: 9.0,
          notes: 'Attempt 2 retry',
          practicedAt: '2026-10-26T10:00:00.000Z',
        },
      ],
    };

    const res = sessionImportItemSchema.safeParse(item);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.attempts?.length).toBe(2);
      expect(res.data.attempts?.[0].score).toBe(6.0);
      expect(res.data.attempts?.[1].score).toBe(9.0);
    }
  });
});

describe('Multiple attempts progression tracking', () => {
  it('calculates score improvement between consecutive attempts', () => {
    // Attempt 1: 30 Pass, 20 Fail => 10 * 30 / 50 = 6.0
    const score1 = calculateScore(30, 20);
    expect(score1).toBe(6.0);

    // Attempt 2: 40 Pass, 10 Fail => 10 * 40 / 50 = 8.0
    const score2 = calculateScore(40, 10);
    expect(score2).toBe(8.0);

    // Attempt 3: 48 Pass, 2 Fail => 10 * 48 / 50 = 9.6
    const score3 = calculateScore(48, 2);
    expect(score3).toBe(9.6);

    const progression = Math.round(((score3 ?? 0) - (score1 ?? 0)) * 10) / 10;
    expect(progression).toBe(3.6);
  });
});
