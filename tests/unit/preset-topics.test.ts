import { describe, it, expect } from 'vitest';
import { PRESET_TOPICS, getPresetTopicByName } from '@/lib/preset-topics';

describe('Preset Topics Library', () => {
  it('includes core speaking topics like Job & Study and Accommodation & Buildings', () => {
    const topicNames = PRESET_TOPICS.map((t) => t.name);
    expect(topicNames).toContain('Job & Study');
    expect(topicNames).toContain('Accommodation & Buildings');
    expect(topicNames).toContain('Travel & Tourism');
    expect(topicNames).toContain('Technology & Media');
    expect(topicNames).toContain('Food & Health');
    expect(PRESET_TOPICS.length).toBeGreaterThanOrEqual(8);
  });

  it('matches topics case-insensitively using getPresetTopicByName', () => {
    const job = getPresetTopicByName('job & study');
    expect(job).toBeDefined();
    expect(job?.icon).toBe('💼');

    const accom = getPresetTopicByName('ACCOMMODATION & BUILDINGS');
    expect(accom).toBeDefined();
    expect(accom?.icon).toBe('🏢');

    const unknown = getPresetTopicByName('Unknown Topic XYZ');
    expect(unknown).toBeUndefined();
  });
});
