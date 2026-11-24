export interface PresetTopic {
  id: string;
  name: string;
  icon: string;
  description: string;
  category?: string;
}

export const PRESET_TOPICS: PresetTopic[] = [
  {
    id: 'job-study',
    name: 'Job & Study',
    icon: '',
    category: 'Career & Education',
    description: 'Workplace, career goals, university life, academic achievements, and daily tasks.',
  },
  {
    id: 'accommodation-buildings',
    name: 'Accommodation & Buildings',
    icon: '',
    category: 'Living & Architecture',
    description: 'Living spaces, modern architecture, dream houses, neighborhoods, and interior design.',
  },
  {
    id: 'cities-towns',
    name: 'Cities & Towns',
    icon: '',
    category: 'Places & Geography',
    description: 'Urban life, public facilities, architecture, hometown culture, and local neighborhoods.',
  },
  {
    id: 'leisure-time-hobbies',
    name: 'Leisure Time & Hobbies',
    icon: '',
    category: 'Lifestyle & Hobbies',
    description: 'Free time activities, creative pursuits, weekend routines, and relaxing pastimes.',
  },
  {
    id: 'music-art',
    name: 'Music & Art',
    icon: '',
    category: 'Arts & Culture',
    description: 'Musical genres, visual arts, concerts, creative exhibitions, and cultural performances.',
  },
  {
    id: 'fashion-shopping',
    name: 'Fashion & Shopping',
    icon: '',
    category: 'Lifestyle & Shopping',
    description: 'Clothing styles, retail shopping, online purchases, trends, and personal grooming.',
  },
  {
    id: 'sport-activities',
    name: 'Sport & Activities',
    icon: '',
    category: 'Sports & Fitness',
    description: 'Physical exercise, team sports, outdoor workouts, competitive matches, and fitness.',
  },
  {
    id: 'people',
    name: 'People',
    icon: '',
    category: 'Relationships & Society',
    description: 'Personality traits, role models, family members, friends, and memorable encounters.',
  },
  {
    id: 'food-health',
    name: 'Food & Health',
    icon: '',
    category: 'Health & Nutrition',
    description: 'Healthy eating, culinary traditions, dietary habits, physical wellness, and medical care.',
  },
  {
    id: 'travel-transportation',
    name: 'Travel & Transportation',
    icon: '',
    category: 'Travel & Commuting',
    description: 'Vacation journeys, public transit, road trips, flight experiences, and commuting habits.',
  },
  {
    id: 'weather-nature',
    name: 'Weather & Nature',
    icon: '',
    category: 'Nature & Environment',
    description: 'Seasonal climates, weather conditions, landscapes, wildlife, and natural wonders.',
  },
  {
    id: 'special-events',
    name: 'Special Events',
    icon: '',
    category: 'Celebrations & Events',
    description: 'Festivals, wedding ceremonies, birthday parties, holidays, and milestone celebrations.',
  },
  {
    id: 'daily-life',
    name: 'Daily Life',
    icon: '',
    category: 'Daily Routines',
    description: 'Morning routines, household chores, work-life balance, and typical weekday schedules.',
  },
  {
    id: 'life-experiences',
    name: 'Life Experiences',
    icon: '',
    category: 'Personal Experiences',
    description: 'Unforgettable memories, personal challenges, achievements, and lessons learned.',
  },
  {
    id: 'education-learning',
    name: 'Education & Learning',
    icon: '',
    category: 'Education & Skills',
    description: 'School memories, language learning, study methods, university education, and teachers.',
  },
  {
    id: 'communication',
    name: 'Communication',
    icon: '',
    category: 'Communication & Media',
    description: 'Interpersonal talks, body language, letters, digital messaging, and public speaking.',
  },
  {
    id: 'science-technology',
    name: 'Science & Technology',
    icon: '',
    category: 'Tech & Science',
    description: 'Technological gadgets, modern computing, scientific discoveries, and artificial intelligence.',
  },
  {
    id: 'media',
    name: 'Media',
    icon: '',
    category: 'Media & News',
    description: 'Social media platforms, journalism, television programs, podcasts, and digital news.',
  },
  {
    id: 'history-tradition',
    name: 'History & Tradition',
    icon: '',
    category: 'History & Heritage',
    description: 'Historical events, cultural heritage, ancient monuments, folklore, and national traditions.',
  },
  {
    id: 'society',
    name: 'Society',
    icon: '',
    category: 'Society & Culture',
    description: 'Social changes, community initiatives, volunteering, population trends, and modern culture.',
  },
];

export function getPresetTopicByName(name: string): PresetTopic | undefined {
  const normalized = name.trim().toLowerCase();
  return PRESET_TOPICS.find((t) => t.name.toLowerCase() === normalized);
}
