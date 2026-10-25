import { CreateSessionInput, UpdateSessionInput, RecordResultInput, ImportPayload } from '@/lib/validation';

export interface SessionItem {
  id: string;
  userId: string;
  topic: string;
  chatgptUrl: string;
  normalizedUrl: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
  notes: string | null;
  tags: string[];
  passCount: number | null;
  failCount: number | null;
  score: number | null;
  practicedAt: string | null;
  createdAt: string;
  updatedAt: string;
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
