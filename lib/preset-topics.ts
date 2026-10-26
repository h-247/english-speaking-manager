export interface PresetTopic {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const PRESET_TOPICS: PresetTopic[] = [
  {
    id: 'job-study',
    name: 'Job & Study',
    icon: '💼',
    description: 'Workplace, career goals, university life, academic achievements, and daily tasks.',
  },
  {
    id: 'accommodation-buildings',
    name: 'Accommodation & Buildings',
    icon: '🏢',
    description: 'Living spaces, modern architecture, dream houses, neighborhoods, and interior design.',
  },
  {
    id: 'travel-tourism',
    name: 'Travel & Tourism',
    icon: '✈️',
    description: 'Vacations, cultural explorations, favorite destinations, road trips, and adventures.',
  },
  {
    id: 'technology-media',
    name: 'Technology & Media',
    icon: '💻',
    description: 'AI, social media, smart devices, digital communication, and future innovations.',
  },
  {
    id: 'food-health',
    name: 'Food & Health',
    icon: '🥗',
    description: 'Nutrition, culinary traditions, fitness habits, mental health, and wellness routines.',
  },
  {
    id: 'hobbies-leisure',
    name: 'Hobbies & Leisure',
    icon: '🎨',
    description: 'Passions, creative pursuits, sports, weekend pastimes, and relaxation activities.',
  },
  {
    id: 'environment-nature',
    name: 'Environment & Nature',
    icon: '🌿',
    description: 'Climate change, wildlife, renewable energy, eco-friendly living, and outdoor scenery.',
  },
  {
    id: 'family-friends',
    name: 'Family & Friends',
    icon: '👥',
    description: 'Relationships, memorable gatherings, childhood memories, and social life.',
  },
  {
    id: 'arts-culture',
    name: 'Arts & Culture',
    icon: '🎭',
    description: 'Music, cinema, literature, traditional festivals, museums, and artistic expression.',
  },
  {
    id: 'hometown-places',
    name: 'Hometown & Places',
    icon: '🏙️',
    description: 'Local traditions, urban development, scenic spots, and historical landmarks.',
  },
];

export function getPresetTopicByName(name: string): PresetTopic | undefined {
  const normalized = name.trim().toLowerCase();
  return PRESET_TOPICS.find((t) => t.name.toLowerCase() === normalized);
}
