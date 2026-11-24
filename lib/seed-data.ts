import { PRESET_TOPICS } from './preset-topics';

export interface SeedSession {
  id: string;
  userId: string;
  topic: string;
  chatgptUrl: string;
  normalizedUrl: string;
  branchUrls: string;
  status: 'To Do' | 'Doing' | 'Done';
  chatgptUrlStatus: 'To Do' | 'Doing' | 'Done';
  notes: string | null;
  tags: string;
  passCount: number;
  failCount: number;
  score: number;
  practicedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeedAttempt {
  id: string;
  sessionId: string;
  userId: string;
  passCount: number;
  failCount: number;
  score: number;
  notes: string | null;
  chatgptUrl: string;
  practicedAt: string;
  createdAt: string;
}

export const INITIAL_SEED_SESSIONS: SeedSession[] = [
  {
    id: '69a990fb-155c-4da4-94e0-10390f6855a1',
    userId: 'local-user',
    topic: 'Job & Study',
    chatgptUrl: 'https://chatgpt.com/c/6ae6dc36-98c8-83ec-955a-4b2e8f596b2b',
    normalizedUrl: 'https://chatgpt.com/c/6ae6dc36-98c8-83ec-955a-4b2e8f596b2b',
    branchUrls: '[]',
    status: 'To Do',
    chatgptUrlStatus: 'Done',
    notes: 'Good speaking flow and pronunciation.',
    tags: '[]',
    passCount: 80,
    failCount: 20,
    score: 8.0,
    practicedAt: '2026-11-05T05:43:41.941Z',
    createdAt: '2026-11-03T06:45:38.158Z',
    updatedAt: '2026-11-05T07:11:50.000Z',
  },
  {
    id: '32e27ecd-da4e-4a08-8700-5625e22f61d9',
    userId: 'local-user',
    topic: 'Communication',
    chatgptUrl: 'https://chatgpt.com/c/6afaaad9-920c-83ec-a8cd-9f041fe5e5c9',
    normalizedUrl: 'https://chatgpt.com/c/6afaaad9-920c-83ec-a8cd-9f041fe5e5c9',
    branchUrls: '[]',
    status: 'To Do',
    chatgptUrlStatus: 'Done',
    notes: 'Clear articulation and tone.',
    tags: '[]',
    passCount: 85,
    failCount: 15,
    score: 8.5,
    practicedAt: '2026-11-16T07:04:08.340Z',
    createdAt: '2026-11-16T07:03:37.897Z',
    updatedAt: '2026-11-16T07:04:08.340Z',
  },
  {
    id: 'e5f1849e-cba7-44d9-b5cd-dfa2c98a2f61',
    userId: 'local-user',
    topic: 'Education & Learning',
    chatgptUrl: 'https://chatgpt.com/c/6af6a82a-0334-83ec-9542-e9e00e1c5fba',
    normalizedUrl: 'https://chatgpt.com/c/6af6a82a-0334-83ec-9542-e9e00e1c5fba',
    branchUrls: '[]',
    status: 'To Do',
    chatgptUrlStatus: 'Done',
    notes: 'Good lexical resource and coherence.',
    tags: '[]',
    passCount: 80,
    failCount: 20,
    score: 8.0,
    practicedAt: '2026-11-13T06:03:34.315Z',
    createdAt: '2026-11-13T06:02:54.000Z',
    updatedAt: '2026-11-13T06:03:34.315Z',
  },
  {
    id: '300269b5-81a8-48be-bd67-bbb74bba8032',
    userId: 'local-user',
    topic: 'Science & Technology',
    chatgptUrl: 'https://chatgpt.com/c/6af563b2-6d7c-83ec-a768-005abcbeb7d9',
    normalizedUrl: 'https://chatgpt.com/c/6af563b2-6d7c-83ec-a768-005abcbeb7d9',
    branchUrls: '[]',
    status: 'To Do',
    chatgptUrlStatus: 'Done',
    notes: 'Accurate grammar and natural pacing.',
    tags: '[]',
    passCount: 90,
    failCount: 10,
    score: 9.0,
    practicedAt: '2026-11-12T06:59:10.545Z',
    createdAt: '2026-11-12T06:58:21.580Z',
    updatedAt: '2026-11-12T06:59:10.545Z',
  },
];

export const INITIAL_SEED_ATTEMPTS: SeedAttempt[] = [
  {
    id: '22aa3f77-4e49-4ebd-86d0-6a7c084d7952',
    sessionId: '69a990fb-155c-4da4-94e0-10390f6855a1',
    userId: 'local-user',
    passCount: 80,
    failCount: 20,
    score: 8.0,
    notes: 'Good speaking flow and pronunciation.',
    chatgptUrl: 'https://chatgpt.com/c/6ae6dc36-98c8-83ec-955a-4b2e8f596b2b',
    practicedAt: '2026-11-05T05:43:41.941Z',
    createdAt: '2026-11-05T05:43:41.992Z',
  },
  {
    id: '51f2bc88-8263-42bf-94e0-5645e22f61d9',
    sessionId: '32e27ecd-da4e-4a08-8700-5625e22f61d9',
    userId: 'local-user',
    passCount: 85,
    failCount: 15,
    score: 8.5,
    notes: 'Clear articulation and tone.',
    chatgptUrl: 'https://chatgpt.com/c/6afaaad9-920c-83ec-a8cd-9f041fe5e5c9',
    practicedAt: '2026-11-16T07:04:08.340Z',
    createdAt: '2026-11-16T07:04:08.340Z',
  },
  {
    id: '73a1cd99-9154-43cb-b5cd-67a2c98a2f61',
    sessionId: 'e5f1849e-cba7-44d9-b5cd-dfa2c98a2f61',
    userId: 'local-user',
    passCount: 80,
    failCount: 20,
    score: 8.0,
    notes: 'Good lexical resource and coherence.',
    chatgptUrl: 'https://chatgpt.com/c/6af6a82a-0334-83ec-9542-e9e00e1c5fba',
    practicedAt: '2026-11-13T06:03:34.315Z',
    createdAt: '2026-11-13T06:03:34.315Z',
  },
  {
    id: '84b2de01-0265-44dc-86e5-78b5abcbeb7d',
    sessionId: '300269b5-81a8-48be-bd67-bbb74bba8032',
    userId: 'local-user',
    passCount: 90,
    failCount: 10,
    score: 9.0,
    notes: 'Accurate grammar and natural pacing.',
    chatgptUrl: 'https://chatgpt.com/c/6af563b2-6d7c-83ec-a768-005abcbeb7d9',
    practicedAt: '2026-11-12T06:59:10.545Z',
    createdAt: '2026-11-12T06:59:10.545Z',
  },
];

export interface SeedTopic {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_SEED_TOPICS: SeedTopic[] = PRESET_TOPICS.map((topic, index) => {
  const m = String(index + 1).padStart(2, '0');
  const timestamp = `2026-11-01T00:${m}:00.000Z`;
  return {
    id: topic.id,
    userId: 'local-user',
    name: topic.name,
    color: 'blue',
    icon: topic.icon || '💬',
    description: topic.description || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
});

