import { describe, it, expect } from 'vitest';
import { ORIGINAL_COACH_PROMPT } from '@/lib/coach-prompt';

describe('ORIGINAL_COACH_PROMPT integrity', () => {
  it('is available as a local bundled resource without network access', () => {
    expect(ORIGINAL_COACH_PROMPT).toBeDefined();
    expect(ORIGINAL_COACH_PROMPT.length).toBeGreaterThan(500);
  });

  it('contains all required TED-Talk presentation parameters', () => {
    expect(ORIGINAL_COACH_PROMPT).toContain('5 minutes');
    expect(ORIGINAL_COACH_PROMPT).toContain('48 to 60 sentences');
    expect(ORIGINAL_COACH_PROMPT).toContain('475 to 600 words');
    expect(ORIGINAL_COACH_PROMPT).toContain('8 and 15 space-separated words');
    expect(ORIGINAL_COACH_PROMPT).toContain('CEFR B2');
    expect(ORIGINAL_COACH_PROMPT).toContain('Hook');
    expect(ORIGINAL_COACH_PROMPT).toContain('Personal Story');
    expect(ORIGINAL_COACH_PROMPT).toContain('Three Main Points');
    expect(ORIGINAL_COACH_PROMPT).toContain('Examples');
    expect(ORIGINAL_COACH_PROMPT).toContain('Conclusion');
  });

  it('contains all required Echo Mode parameters and commands', () => {
    expect(ORIGINAL_COACH_PROMPT).toContain('Echo Mode');
    expect(ORIGINAL_COACH_PROMPT).toContain('Vietnamese translation');
    expect(ORIGINAL_COACH_PROMPT).toContain('Pass');
    expect(ORIGINAL_COACH_PROMPT).toContain('Fail');
    expect(ORIGINAL_COACH_PROMPT).toContain('`h`');
    expect(ORIGINAL_COACH_PROMPT).toContain('`meaning`');
    expect(ORIGINAL_COACH_PROMPT).toContain('`slower`');
    expect(ORIGINAL_COACH_PROMPT).toContain('PassCount');
    expect(ORIGINAL_COACH_PROMPT).toContain('FailCount');
    expect(ORIGINAL_COACH_PROMPT).toContain('Score = 10 × PassCount / (PassCount + FailCount)');
  });
});
