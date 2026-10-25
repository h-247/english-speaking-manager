import { describe, it, expect } from 'vitest';
import {
  createSessionSchema,
  updateSessionSchema,
  recordResultSchema,
  sessionStatusSchema,
  importPayloadSchema,
} from '@/lib/validation';

describe('createSessionSchema', () => {
  it('validates a valid session payload', () => {
    const valid = {
      topic: 'How to Speak with Confidence',
      chatgptUrl: 'https://chatgpt.com/c/12345-6789',
      status: 'PLANNED',
      notes: 'Focus on pauses',
      tags: ['ted', 'confidence'],
    };

    const res = createSessionSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects empty or whitespace-only topic', () => {
    const invalid = {
      topic: '   ',
      chatgptUrl: 'https://chatgpt.com/c/12345',
    };

    const res = createSessionSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('rejects invalid ChatGPT URL', () => {
    const invalid = {
      topic: 'Valid Topic',
      chatgptUrl: 'https://evil-site.com/c/12345',
    };

    const res = createSessionSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('validates status enum strictly', () => {
    expect(sessionStatusSchema.safeParse('PLANNED').success).toBe(true);
    expect(sessionStatusSchema.safeParse('IN_PROGRESS').success).toBe(true);
    expect(sessionStatusSchema.safeParse('COMPLETED').success).toBe(true);
    expect(sessionStatusSchema.safeParse('UNKNOWN').success).toBe(false);
  });
});

describe('recordResultSchema', () => {
  it('accepts valid non-negative integer counters', () => {
    const valid = {
      passCount: 48,
      failCount: 12,
    };
    const res = recordResultSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects negative pass or fail count', () => {
    expect(recordResultSchema.safeParse({ passCount: -1, failCount: 5 }).success).toBe(false);
    expect(recordResultSchema.safeParse({ passCount: 5, failCount: -2 }).success).toBe(false);
  });

  it('rejects fractional counts', () => {
    expect(recordResultSchema.safeParse({ passCount: 4.5, failCount: 2 }).success).toBe(false);
    expect(recordResultSchema.safeParse({ passCount: 4, failCount: 1.2 }).success).toBe(false);
  });
});

describe('importPayloadSchema', () => {
  it('validates a well-formed import payload', () => {
    const payload = {
      version: '1.0.0',
      exportedAt: '2026-10-26T00:00:00Z',
      sessions: [
        {
          topic: 'Sample Presentation',
          chatgptUrl: 'https://chatgpt.com/c/sample-1',
          status: 'COMPLETED',
          passCount: 50,
          failCount: 0,
        },
      ],
      duplicateStrategy: 'skip',
    };

    const res = importPayloadSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });

  it('rejects import payload missing sessions array', () => {
    const res = importPayloadSchema.safeParse({ version: '1.0.0' });
    expect(res.success).toBe(false);
  });
});
