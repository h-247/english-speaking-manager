import { describe, it, expect } from 'vitest';
import { createAttemptSchema, updateAttemptSchema, sessionImportItemSchema } from '@/lib/validation';
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

  it('allows optional notes, practicedAt, and valid chatgptUrl', () => {
    const withLink = {
      passCount: 40,
      failCount: 10,
      chatgptUrl: 'https://chatgpt.com/c/link-test-12345',
    };
    const res = createAttemptSchema.safeParse(withLink);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.chatgptUrl).toBe('https://chatgpt.com/c/link-test-12345');
    }
  });

  it('rejects invalid ChatGPT link', () => {
    const invalidLink = {
      passCount: 40,
      failCount: 10,
      chatgptUrl: 'https://malicious-site.com/c/fake-chat',
    };
    const res = createAttemptSchema.safeParse(invalidLink);
    expect(res.success).toBe(false);
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

describe('Topic grouping of ChatGPT links and practice attempts', () => {
  it('groups multiple ChatGPT links under a topic with corresponding attempts and scores', () => {
    const attempts = [
      {
        id: 'att-1',
        attemptNumber: 1,
        chatgptUrl: 'https://chatgpt.com/c/main-chat',
        passCount: 40,
        failCount: 10,
        score: 8.0,
      },
      {
        id: 'att-2',
        attemptNumber: 2,
        chatgptUrl: 'https://chatgpt.com/c/branch-chat-1',
        passCount: 45,
        failCount: 5,
        score: 9.0,
      },
      {
        id: 'att-3',
        attemptNumber: 3,
        chatgptUrl: 'https://chatgpt.com/c/branch-chat-1',
        passCount: 48,
        failCount: 2,
        score: 9.6,
      },
    ];

    // Grouping by link
    const linkMap = new Map<string, { url: string; attemptCount: number; bestScore: number }>();
    for (const att of attempts) {
      const entry = linkMap.get(att.chatgptUrl) || { url: att.chatgptUrl, attemptCount: 0, bestScore: 0 };
      entry.attemptCount++;
      if (att.score > entry.bestScore) entry.bestScore = att.score;
      linkMap.set(att.chatgptUrl, entry);
    }

    expect(linkMap.size).toBe(2);
    expect(linkMap.get('https://chatgpt.com/c/main-chat')?.attemptCount).toBe(1);
    expect(linkMap.get('https://chatgpt.com/c/main-chat')?.bestScore).toBe(8.0);
    expect(linkMap.get('https://chatgpt.com/c/branch-chat-1')?.attemptCount).toBe(2);
    expect(linkMap.get('https://chatgpt.com/c/branch-chat-1')?.bestScore).toBe(9.6);
  });
});

describe('updateAttemptSchema', () => {
  it('validates partial update of pass and fail counters', () => {
    const res = updateAttemptSchema.safeParse({ passCount: 52, failCount: 4 });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.passCount).toBe(52);
      expect(res.data.failCount).toBe(4);
    }
  });

  it('validates updating the ChatGPT URL for an attempt', () => {
    const res = updateAttemptSchema.safeParse({
      chatgptUrl: 'https://chatgpt.com/c/updated-chat-url',
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.chatgptUrl).toBe('https://chatgpt.com/c/updated-chat-url');
    }
  });

  it('rejects invalid ChatGPT URL in attempt update', () => {
    const res = updateAttemptSchema.safeParse({
      chatgptUrl: 'https://invalid-host.com/c/fake-chat',
    });
    expect(res.success).toBe(false);
  });

  it('rejects negative numbers when updating counters', () => {
    expect(updateAttemptSchema.safeParse({ passCount: -1 }).success).toBe(false);
    expect(updateAttemptSchema.safeParse({ failCount: -2 }).success).toBe(false);
  });
});
