import { describe, it, expect } from 'vitest';
import { createTopicSchema, updateTopicSchema } from '@/lib/validation';
import { getTopicColorConfig, NOTION_TOPIC_COLORS } from '@/lib/topic-theme';

describe('Topic Schemas & Themes', () => {
  it('validates createTopicSchema', () => {
    const valid = {
      name: 'Business English & Negotiations',
      color: 'purple',
      icon: '💼',
      description: 'Negotiation practice prompts',
    };
    const res = createTopicSchema.safeParse(valid);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.name).toBe('Business English & Negotiations');
      expect(res.data.color).toBe('purple');
    }

    const invalid = {
      name: '   ',
    };
    expect(createTopicSchema.safeParse(invalid).success).toBe(false);
  });

  it('validates updateTopicSchema', () => {
    const valid = {
      name: 'Updated Name',
      color: 'green',
    };
    expect(updateTopicSchema.safeParse(valid).success).toBe(true);

    const emptyName = {
      name: '',
    };
    expect(updateTopicSchema.safeParse(emptyName).success).toBe(false);
  });

  it('provides Notion color configs matching colors in photo', () => {
    const green = getTopicColorConfig('green');
    expect(green.id).toBe('green');
    expect(green.pillClass).toContain('bg-[#059669]');

    const purple = getTopicColorConfig('purple');
    expect(purple.id).toBe('purple');
    expect(purple.pillClass).toContain('bg-[#7c3aed]');

    const orange = getTopicColorConfig('orange');
    expect(orange.id).toBe('orange');
    expect(orange.pillClass).toContain('bg-[#ea580c]');

    const blue = getTopicColorConfig('blue');
    expect(blue.id).toBe('blue');
    expect(blue.pillClass).toContain('bg-[#2563eb]');

    const teal = getTopicColorConfig('teal');
    expect(teal.id).toBe('teal');
    expect(teal.pillClass).toContain('bg-[#0d9488]');

    // fallback to blue
    const unknown = getTopicColorConfig('non-existent');
    expect(unknown.id).toBe('blue');
  });
});
