import { describe, it, expect } from 'vitest';
import {
  INITIAL_SEED_SESSIONS,
  INITIAL_SEED_ATTEMPTS,
  INITIAL_SEED_TOPICS,
} from '@/lib/seed-data';

describe('Seed Data Persistence', () => {
  it('contains the 4 baseline practice sessions with non-null metrics and valid ChatGPT links', () => {
    expect(INITIAL_SEED_SESSIONS).toHaveLength(4);

    const topics = INITIAL_SEED_SESSIONS.map((s) => s.topic);
    expect(topics).toContain('Job & Study');
    expect(topics).toContain('Communication');
    expect(topics).toContain('Education & Learning');
    expect(topics).toContain('Science & Technology');

    for (const session of INITIAL_SEED_SESSIONS) {
      expect(session.id).toBeTruthy();
      expect(session.userId).toBe('local-user');
      expect(session.chatgptUrl).toMatch(/^https:\/\/chatgpt\.com\/c\/[a-zA-Z0-9-]+$/);
      expect(session.score).toBeGreaterThanOrEqual(1.0);
      expect(session.score).toBeLessThanOrEqual(10.0);
      expect(session.passCount).toBeGreaterThan(0);
      expect(session.failCount).toBeGreaterThanOrEqual(0);
      expect(session.chatgptUrlStatus).toBe('Done');
    }
  });

  it('contains matching practice attempts for all 4 baseline sessions', () => {
    expect(INITIAL_SEED_ATTEMPTS).toHaveLength(4);

    const sessionIds = INITIAL_SEED_SESSIONS.map((s) => s.id);
    for (const attempt of INITIAL_SEED_ATTEMPTS) {
      expect(sessionIds).toContain(attempt.sessionId);
      expect(attempt.score).toBeGreaterThanOrEqual(1.0);
      expect(attempt.score).toBeLessThanOrEqual(10.0);
      expect(attempt.chatgptUrl).toMatch(/^https:\/\/chatgpt\.com\/c\/[a-zA-Z0-9-]+$/);
    }
  });

  it('contains 20 preset topics with default styling and icons', () => {
    expect(INITIAL_SEED_TOPICS).toHaveLength(20);

    const topicNames = INITIAL_SEED_TOPICS.map((t) => t.name);
    expect(topicNames).toContain('Job & Study');
    expect(topicNames).toContain('Communication');
    expect(topicNames).toContain('Education & Learning');
    expect(topicNames).toContain('Science & Technology');
  });
});
