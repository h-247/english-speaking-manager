export interface TopicColorConfig {
  id: string;
  name: string;
  pillClass: string;
  bgHex: string;
  borderClass: string;
  textClass: string;
}

export const NOTION_TOPIC_COLORS: TopicColorConfig[] = [
  {
    id: 'green',
    name: 'Green',
    pillClass: 'bg-[#059669] text-white border border-[#10b981]/30',
    bgHex: '#059669',
    borderClass: 'border-emerald-600/50',
    textClass: 'text-emerald-300',
  },
  {
    id: 'purple',
    name: 'Purple',
    pillClass: 'bg-[#7c3aed] text-white border border-[#8b5cf6]/30',
    bgHex: '#7c3aed',
    borderClass: 'border-purple-600/50',
    textClass: 'text-purple-300',
  },
  {
    id: 'orange',
    name: 'Orange',
    pillClass: 'bg-[#ea580c] text-white border border-[#f97316]/30',
    bgHex: '#ea580c',
    borderClass: 'border-orange-600/50',
    textClass: 'text-orange-300',
  },
  {
    id: 'blue',
    name: 'Blue',
    pillClass: 'bg-[#2563eb] text-white border border-[#3b82f6]/30',
    bgHex: '#2563eb',
    borderClass: 'border-blue-600/50',
    textClass: 'text-blue-300',
  },
  {
    id: 'teal',
    name: 'Teal',
    pillClass: 'bg-[#0d9488] text-white border border-[#14b8a6]/30',
    bgHex: '#0d9488',
    borderClass: 'border-teal-600/50',
    textClass: 'text-teal-300',
  },
  {
    id: 'rose',
    name: 'Rose',
    pillClass: 'bg-[#e11d48] text-white border border-[#f43f5e]/30',
    bgHex: '#e11d48',
    borderClass: 'border-rose-600/50',
    textClass: 'text-rose-300',
  },
  {
    id: 'amber',
    name: 'Amber',
    pillClass: 'bg-[#d97706] text-white border border-[#f59e0b]/30',
    bgHex: '#d97706',
    borderClass: 'border-amber-600/50',
    textClass: 'text-amber-300',
  },
  {
    id: 'pink',
    name: 'Pink',
    pillClass: 'bg-[#db2777] text-white border border-[#ec4899]/30',
    bgHex: '#db2777',
    borderClass: 'border-pink-600/50',
    textClass: 'text-pink-300',
  },
  {
    id: 'gray',
    name: 'Gray',
    pillClass: 'bg-[#4b5563] text-white border border-[#6b7280]/30',
    bgHex: '#4b5563',
    borderClass: 'border-gray-600/50',
    textClass: 'text-gray-300',
  },
];

export function getTopicColorConfig(colorId?: string): TopicColorConfig {
  const found = NOTION_TOPIC_COLORS.find(
    (c) => c.id.toLowerCase() === (colorId || '').toLowerCase(),
  );
  return found || NOTION_TOPIC_COLORS[3]; // default to blue
}
