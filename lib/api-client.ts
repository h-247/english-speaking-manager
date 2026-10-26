import {
  CreateSessionInput,
  UpdateSessionInput,
  RecordResultInput,
  CreateAttemptInput,
  UpdateAttemptInput,
  ImportPayload,
} from '@/lib/validation';

export interface TopicGroupedLink {
  url: string;
  isPrimary?: boolean;
  attemptNumbers: number[];
  attemptCount: number;
  bestScore: number | null;
  latestPracticedAt: string | null;
  attempts?: PracticeAttemptItem[];
}

export interface PracticeAttemptItem {
  id: string;
  sessionId: string;
  userId: string;
  passCount: number;
  failCount: number;
  score: number;
  notes: string | null;
  chatgptUrl?: string | null;
  practicedAt: string;
  createdAt: string;
}

export interface SessionItem {
  id: string;
  userId: string;
  topic: string;
  chatgptUrl: string;
  normalizedUrl: string;
  branchUrls?: string[];
  allChatgptUrls?: string[];
  groupedLinks?: TopicGroupedLink[];
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
  notes: string | null;
  tags: string[];
  passCount: number | null;
  failCount: number | null;
  score: number | null;
  practicedAt: string | null;
  createdAt: string;
  updatedAt: string;
  attemptCount?: number;
  attempts?: PracticeAttemptItem[];
}

export interface DashboardData {
  totalSessions: number;
  plannedSessions: number;
  inProgressSessions: number;
  completedSessions: number;
  averageCompletedScore: number | null;
  totalPass: number;
  totalFail: number;
  recentSessions: SessionItem[];
  unfinishedSessions: SessionItem[];
  totalAttempts?: number;
}

export interface SessionsResponse {
  sessions: SessionItem[];
  total: number;
  limit: number;
  offset: number;
}

export async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch('/api/dashboard');
  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load dashboard data');
  }
  return res.json();
}

export async function fetchSessions(params: {
  search?: string;
  status?: string;
  tag?: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<SessionsResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.tag) query.set('tag', params.tag);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.offset !== undefined) query.set('offset', String(params.offset));

  const res = await fetch(`/api/sessions?${query.toString()}`);
  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch sessions');
  }
  return res.json();
}

export async function fetchSession(id: string): Promise<SessionItem> {
  const res = await fetch(`/api/sessions/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch session');
  }
  return res.json();
}

export async function createSession(data: CreateSessionInput): Promise<SessionItem> {
  const res = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create session');
  }
  return res.json();
}

export async function updateSession(
  id: string,
  data: UpdateSessionInput,
): Promise<SessionItem> {
  const res = await fetch(`/api/sessions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update session');
  }
  return res.json();
}

export async function deleteSession(id: string): Promise<void> {
  const res = await fetch(`/api/sessions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete session');
  }
}

export async function recordResult(
  id: string,
  data: RecordResultInput,
): Promise<SessionItem> {
  const res = await fetch(`/api/sessions/${encodeURIComponent(id)}/result`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to record results');
  }
  return res.json();
}

export async function fetchAttempts(sessionId: string): Promise<PracticeAttemptItem[]> {
  const res = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/attempts`);
  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch practice attempts');
  }
  return res.json();
}

export async function addAttempt(
  sessionId: string,
  data: CreateAttemptInput,
): Promise<PracticeAttemptItem> {
  const res = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/attempts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to add practice attempt');
  }
  return res.json();
}

export async function updateAttempt(
  sessionId: string,
  attemptId: string,
  data: UpdateAttemptInput,
): Promise<PracticeAttemptItem> {
  const res = await fetch(
    `/api/sessions/${encodeURIComponent(sessionId)}/attempts/${encodeURIComponent(attemptId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update practice attempt');
  }
  const result = (await res.json()) as { success: boolean; attempt: PracticeAttemptItem };
  return result.attempt;
}

export async function deleteAttempt(
  sessionId: string,
  attemptId: string,
): Promise<void> {
  const res = await fetch(
    `/api/sessions/${encodeURIComponent(sessionId)}/attempts/${encodeURIComponent(attemptId)}`,
    {
      method: 'DELETE',
    },
  );
  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete practice attempt');
  }
}

export async function addTopicLink(
  sessionId: string,
  chatgptUrl: string,
): Promise<SessionItem> {
  const current = await fetchSession(sessionId);
  const existing = current.branchUrls || [];
  if (!existing.includes(chatgptUrl) && chatgptUrl !== current.chatgptUrl) {
    return updateSession(sessionId, {
      branchUrls: [...existing, chatgptUrl],
    });
  }
  return current;
}

export async function removeTopicLink(
  sessionId: string,
  chatgptUrl: string,
): Promise<SessionItem> {
  const current = await fetchSession(sessionId);
  const existing = current.branchUrls || [];
  if (current.chatgptUrl === chatgptUrl) {
    if (existing.length > 0) {
      return updateSession(sessionId, {
        chatgptUrl: existing[0],
        branchUrls: existing.slice(1),
      });
    }
  }
  return updateSession(sessionId, {
    branchUrls: existing.filter((u) => u !== chatgptUrl),
  });
}

export async function importSessions(payload: ImportPayload) {
  const res = await fetch('/api/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to import sessions');
  }
  return res.json();
}
