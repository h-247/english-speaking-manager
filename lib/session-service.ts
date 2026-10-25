import { getDb, schema } from '@/db';
import { ensureDatabaseInitialized } from '@/lib/db-init';
import { calculateScore } from '@/lib/scoring';
import { normalizeChatGPTUrl } from '@/lib/chatgpt-url';
import {
  CreateSessionInput,
  UpdateSessionInput,
  RecordResultInput,
  ImportPayload,
} from '@/lib/validation';
import { eq, and, desc, asc, like, or, sql, not } from 'drizzle-orm';

export interface ListSessionsOptions {
  search?: string;
  status?: string;
  tag?: string;
  sortBy?:
    | 'recently_updated'
    | 'recently_created'
    | 'oldest_created'
    | 'topic_asc'
    | 'topic_desc'
    | 'highest_score'
    | 'lowest_score';
  limit?: number;
  offset?: number;
}

export class SessionService {
  /**
   * Retrieves all sessions for a user with searching, filtering, and sorting.
   */
  static async listSessions(userId: string, options: ListSessionsOptions = {}) {
    await ensureDatabaseInitialized();
    const db = getDb();

    const conditions = [eq(schema.practiceSessions.userId, userId)];

    // Status filter
    if (
      options.status &&
      options.status !== 'ALL' &&
      ['PLANNED', 'IN_PROGRESS', 'COMPLETED'].includes(options.status)
    ) {
      conditions.push(
        eq(
          schema.practiceSessions.status,
          options.status as 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED',
        ),
      );
    }

    // Search filter: topic, notes, tags
    if (options.search && options.search.trim().length > 0) {
      const term = `%${options.search.trim()}%`;
      conditions.push(
        or(
          like(schema.practiceSessions.topic, term),
          like(schema.practiceSessions.notes, term),
          like(schema.practiceSessions.tags, term),
        )!,
      );
    }

    // Tag filter
    if (options.tag && options.tag.trim().length > 0) {
      const tagTerm = `%"${options.tag.trim()}"%`;
      conditions.push(like(schema.practiceSessions.tags, tagTerm));
    }

    const whereClause = and(...conditions);

    // Sorting
    let orderBy;
    switch (options.sortBy) {
      case 'recently_created':
        orderBy = [desc(schema.practiceSessions.createdAt)];
        break;
      case 'oldest_created':
        orderBy = [asc(schema.practiceSessions.createdAt)];
        break;
      case 'topic_asc':
        orderBy = [asc(schema.practiceSessions.topic)];
        break;
      case 'topic_desc':
        orderBy = [desc(schema.practiceSessions.topic)];
        break;
      case 'highest_score':
        // Put scored sessions first, sorted descending, followed by unscored
        orderBy = [
          sql`CASE WHEN ${schema.practiceSessions.score} IS NULL THEN 1 ELSE 0 END ASC`,
          desc(schema.practiceSessions.score),
          desc(schema.practiceSessions.updatedAt),
        ];
        break;
      case 'lowest_score':
        // Put scored sessions first, sorted ascending, followed by unscored
        orderBy = [
          sql`CASE WHEN ${schema.practiceSessions.score} IS NULL THEN 1 ELSE 0 END ASC`,
          asc(schema.practiceSessions.score),
          desc(schema.practiceSessions.updatedAt),
        ];
        break;
      case 'recently_updated':
      default:
        orderBy = [desc(schema.practiceSessions.updatedAt)];
        break;
    }

    const limit = options.limit ?? 100;
    const offset = options.offset ?? 0;

    const [sessions, countResult] = await Promise.all([
      db
        .select()
        .from(schema.practiceSessions)
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(schema.practiceSessions)
        .where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;

    return {
      sessions: sessions.map(deserializeSession),
      total,
      limit,
      offset,
    };
  }

  /**
   * Retrieves a single session by ID, scoped to user.
   */
  static async getSessionById(userId: string, sessionId: string) {
    await ensureDatabaseInitialized();
    const db = getDb();

    const [session] = await db
      .select()
      .from(schema.practiceSessions)
      .where(
        and(
          eq(schema.practiceSessions.userId, userId),
          eq(schema.practiceSessions.id, sessionId),
        ),
      )
      .limit(1);

    if (!session) return null;
    return deserializeSession(session);
  }

  /**
   * Creates a new session with URL duplicate protection.
   */
  static async createSession(userId: string, input: CreateSessionInput) {
    await ensureDatabaseInitialized();
    const db = getDb();

    const normalizedUrl = normalizeChatGPTUrl(input.chatgptUrl);

    // Duplicate detection for the same user
    const [existing] = await db
      .select({ id: schema.practiceSessions.id })
      .from(schema.practiceSessions)
      .where(
        and(
          eq(schema.practiceSessions.userId, userId),
          eq(schema.practiceSessions.normalizedUrl, normalizedUrl),
        ),
      )
      .limit(1);

    if (existing) {
      throw new Error(
        'A practice session with this ChatGPT conversation link already exists in your library.',
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const score = calculateScore(input.passCount, input.failCount);

    const tagsJson =
      input.tags && input.tags.length > 0 ? JSON.stringify(input.tags) : null;

    const newSession = {
      id,
      userId,
      topic: input.topic.trim(),
      chatgptUrl: input.chatgptUrl.trim(),
      normalizedUrl,
      status: input.status ?? 'PLANNED',
      notes: input.notes?.trim() || null,
      tags: tagsJson,
      passCount: input.passCount ?? null,
      failCount: input.failCount ?? null,
      score,
      practicedAt: input.practicedAt ?? (score !== null ? now : null),
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(schema.practiceSessions).values(newSession);

    return deserializeSession(newSession);
  }

  /**
   * Updates an existing session with owner verification and duplicate protection.
   */
  static async updateSession(
    userId: string,
    sessionId: string,
    input: UpdateSessionInput,
  ) {
    await ensureDatabaseInitialized();
    const db = getDb();

    const [existing] = await db
      .select()
      .from(schema.practiceSessions)
      .where(
        and(
          eq(schema.practiceSessions.userId, userId),
          eq(schema.practiceSessions.id, sessionId),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new Error('Session not found or access denied.');
    }

    const now = new Date().toISOString();
    const updates: Partial<schema.NewPracticeSession> = {
      updatedAt: now,
    };

    if (input.topic !== undefined) {
      updates.topic = input.topic.trim();
    }

    if (input.chatgptUrl !== undefined) {
      const normalizedUrl = normalizeChatGPTUrl(input.chatgptUrl);
      // Check if another session for this user has this URL
      const [duplicate] = await db
        .select({ id: schema.practiceSessions.id })
        .from(schema.practiceSessions)
        .where(
          and(
            eq(schema.practiceSessions.userId, userId),
            eq(schema.practiceSessions.normalizedUrl, normalizedUrl),
            not(eq(schema.practiceSessions.id, sessionId)),
          ),
        )
        .limit(1);

      if (duplicate) {
        throw new Error(
          'Another practice session with this ChatGPT conversation link already exists.',
        );
      }

      updates.chatgptUrl = input.chatgptUrl.trim();
      updates.normalizedUrl = normalizedUrl;
    }

    if (input.status !== undefined) {
      updates.status = input.status;
    }

    if (input.notes !== undefined) {
      updates.notes = input.notes?.trim() || null;
    }

    if (input.tags !== undefined) {
      updates.tags =
        input.tags && input.tags.length > 0 ? JSON.stringify(input.tags) : null;
    }

    // Check if passCount or failCount are being updated
    const newPass =
      input.passCount !== undefined ? input.passCount : existing.passCount;
    const newFail =
      input.failCount !== undefined ? input.failCount : existing.failCount;

    if (input.passCount !== undefined) updates.passCount = input.passCount;
    if (input.failCount !== undefined) updates.failCount = input.failCount;

    if (input.passCount !== undefined || input.failCount !== undefined) {
      updates.score = calculateScore(newPass, newFail);
    }

    if (input.practicedAt !== undefined) {
      updates.practicedAt = input.practicedAt;
    }

    await db
      .update(schema.practiceSessions)
      .set(updates)
      .where(
        and(
          eq(schema.practiceSessions.userId, userId),
          eq(schema.practiceSessions.id, sessionId),
        ),
      );

    const [updated] = await db
      .select()
      .from(schema.practiceSessions)
      .where(
        and(
          eq(schema.practiceSessions.userId, userId),
          eq(schema.practiceSessions.id, sessionId),
        ),
      );

    return deserializeSession(updated);
  }

  /**
   * Deletes a session by ID with owner check.
   */
  static async deleteSession(userId: string, sessionId: string) {
    await ensureDatabaseInitialized();
    const db = getDb();

    const [existing] = await db
      .select({ id: schema.practiceSessions.id })
      .from(schema.practiceSessions)
      .where(
        and(
          eq(schema.practiceSessions.userId, userId),
          eq(schema.practiceSessions.id, sessionId),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new Error('Session not found or access denied.');
    }

    await db
      .delete(schema.practiceSessions)
      .where(
        and(
          eq(schema.practiceSessions.userId, userId),
          eq(schema.practiceSessions.id, sessionId),
        ),
      );

    return { success: true };
  }

  /**
   * Records practice results (PassCount, FailCount, PracticedAt) and recomputes score.
   */
  static async recordResult(
    userId: string,
    sessionId: string,
    input: RecordResultInput,
  ) {
    const score = calculateScore(input.passCount, input.failCount);
    const now = new Date().toISOString();

    return this.updateSession(userId, sessionId, {
      passCount: input.passCount,
      failCount: input.failCount,
      practicedAt: input.practicedAt || now,
      status: input.markCompleted ? 'COMPLETED' : undefined,
    });
  }

  /**
   * Computes aggregated dashboard statistics for a user.
   */
  static async getDashboardStats(userId: string) {
    await ensureDatabaseInitialized();
    const db = getDb();

    const sessions = await db
      .select()
      .from(schema.practiceSessions)
      .where(eq(schema.practiceSessions.userId, userId))
      .orderBy(desc(schema.practiceSessions.updatedAt));

    const totalSessions = sessions.length;
    let plannedSessions = 0;
    let inProgressSessions = 0;
    let completedSessions = 0;
    let totalPass = 0;
    let totalFail = 0;
    let completedScoresSum = 0;
    let completedScoredCount = 0;

    for (const s of sessions) {
      if (s.status === 'PLANNED') plannedSessions++;
      else if (s.status === 'IN_PROGRESS') inProgressSessions++;
      else if (s.status === 'COMPLETED') {
        completedSessions++;
        if (s.score !== null && s.score !== undefined) {
          completedScoresSum += s.score;
          completedScoredCount++;
        }
      }

      if (s.passCount !== null && s.passCount !== undefined) {
        totalPass += s.passCount;
      }
      if (s.failCount !== null && s.failCount !== undefined) {
        totalFail += s.failCount;
      }
    }

    const averageCompletedScore =
      completedScoredCount > 0
        ? Math.round((completedScoresSum / completedScoredCount) * 10) / 10
        : null;

    // Recent 5 practice sessions
    const recentSessions = sessions.slice(0, 5).map(deserializeSession);

    // Unfinished sessions: PLANNED or IN_PROGRESS, max 5 for quick resume
    const unfinishedSessions = sessions
      .filter((s) => s.status === 'PLANNED' || s.status === 'IN_PROGRESS')
      .slice(0, 5)
      .map(deserializeSession);

    return {
      totalSessions,
      plannedSessions,
      inProgressSessions,
      completedSessions,
      averageCompletedScore,
      totalPass,
      totalFail,
      recentSessions,
      unfinishedSessions,
    };
  }

  /**
   * Exports all user sessions in JSON or CSV.
   */
  static async exportData(userId: string, format: 'json' | 'csv' = 'json') {
    await ensureDatabaseInitialized();
    const db = getDb();

    const rows = await db
      .select()
      .from(schema.practiceSessions)
      .where(eq(schema.practiceSessions.userId, userId))
      .orderBy(desc(schema.practiceSessions.createdAt));

    const sessions = rows.map(deserializeSession);

    if (format === 'csv') {
      const headers = [
        'Topic',
        'ChatGPT URL',
        'Status',
        'Score',
        'Pass Count',
        'Fail Count',
        'Notes',
        'Tags',
        'Practiced At',
        'Created At',
        'Updated At',
      ];

      const csvRows = [headers.join(',')];

      for (const s of sessions) {
        const values = [
          escapeCsvField(s.topic),
          escapeCsvField(s.chatgptUrl),
          escapeCsvField(s.status),
          s.score !== null ? s.score.toFixed(1) : '',
          s.passCount !== null ? String(s.passCount) : '',
          s.failCount !== null ? String(s.failCount) : '',
          escapeCsvField(s.notes || ''),
          escapeCsvField(s.tags.join('; ')),
          escapeCsvField(s.practicedAt || ''),
          escapeCsvField(s.createdAt),
          escapeCsvField(s.updatedAt),
        ];
        csvRows.push(values.join(','));
      }

      return {
        contentType: 'text/csv; charset=utf-8',
        filename: `speaking-sessions-${new Date().toISOString().slice(0, 10)}.csv`,
        data: csvRows.join('\r\n'),
      };
    }

    const payload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      totalSessions: sessions.length,
      sessions: sessions.map((s) => ({
        topic: s.topic,
        chatgptUrl: s.chatgptUrl,
        status: s.status,
        notes: s.notes,
        tags: s.tags,
        passCount: s.passCount,
        failCount: s.failCount,
        score: s.score,
        practicedAt: s.practicedAt,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    };

    return {
      contentType: 'application/json; charset=utf-8',
      filename: `speaking-sessions-backup-${new Date().toISOString().slice(0, 10)}.json`,
      data: JSON.stringify(payload, null, 2),
    };
  }

  /**
   * Imports validated sessions into user database.
   */
  static async importData(userId: string, payload: ImportPayload) {
    await ensureDatabaseInitialized();
    const db = getDb();

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors: Array<{ index: number; topic?: string; error: string }> = [];

    const existingRows = await db
      .select({
        id: schema.practiceSessions.id,
        normalizedUrl: schema.practiceSessions.normalizedUrl,
      })
      .from(schema.practiceSessions)
      .where(eq(schema.practiceSessions.userId, userId));

    const existingMap = new Map<string, string>();
    for (const r of existingRows) {
      existingMap.set(r.normalizedUrl, r.id);
    }

    const seenUrlsInBatch = new Set<string>();

    for (let i = 0; i < payload.sessions.length; i++) {
      const item = payload.sessions[i];
      try {
        const normalizedUrl = normalizeChatGPTUrl(item.chatgptUrl);

        if (seenUrlsInBatch.has(normalizedUrl)) {
          skipped++;
          continue; // Deduplicate within the file itself
        }
        seenUrlsInBatch.add(normalizedUrl);

        const now = new Date().toISOString();
        const score = calculateScore(item.passCount, item.failCount);

        let parsedTags: string[] = [];
        if (Array.isArray(item.tags)) {
          parsedTags = item.tags;
        } else if (typeof item.tags === 'string' && item.tags.trim()) {
          parsedTags = item.tags
            .split(/[,;]/)
            .map((t) => t.trim())
            .filter(Boolean);
        }
        const tagsJson = parsedTags.length > 0 ? JSON.stringify(parsedTags) : null;

        const existingId = existingMap.get(normalizedUrl);

        if (existingId) {
          if (payload.duplicateStrategy === 'update' || payload.duplicateStrategy === 'replace') {
            await db
              .update(schema.practiceSessions)
              .set({
                topic: item.topic.trim(),
                chatgptUrl: item.chatgptUrl.trim(),
                status: item.status ?? 'PLANNED',
                notes: item.notes?.trim() || null,
                tags: tagsJson,
                passCount: item.passCount ?? null,
                failCount: item.failCount ?? null,
                score,
                practicedAt: item.practicedAt || (score !== null ? now : null),
                updatedAt: item.updatedAt || now,
              })
              .where(
                and(
                  eq(schema.practiceSessions.userId, userId),
                  eq(schema.practiceSessions.id, existingId),
                ),
              );
            updated++;
          } else {
            // skip
            skipped++;
          }
        } else {
          // insert new
          const id = crypto.randomUUID();
          await db.insert(schema.practiceSessions).values({
            id,
            userId,
            topic: item.topic.trim(),
            chatgptUrl: item.chatgptUrl.trim(),
            normalizedUrl,
            status: item.status ?? 'PLANNED',
            notes: item.notes?.trim() || null,
            tags: tagsJson,
            passCount: item.passCount ?? null,
            failCount: item.failCount ?? null,
            score,
            practicedAt: item.practicedAt || (score !== null ? now : null),
            createdAt: item.createdAt || now,
            updatedAt: item.updatedAt || now,
          });
          existingMap.set(normalizedUrl, id);
          inserted++;
        }
      } catch (err: any) {
        errors.push({
          index: i + 1,
          topic: item.topic,
          error: err.message || 'Failed to process session item.',
        });
      }
    }

    return {
      total: payload.sessions.length,
      inserted,
      updated,
      skipped,
      errors,
    };
  }
}

/**
 * Normalizes DB row to typed PracticeSession with parsed tags array.
 */
function deserializeSession(row: any) {
  let tags: string[] = [];
  if (row.tags) {
    try {
      tags = JSON.parse(row.tags);
    } catch {
      tags = [];
    }
  }

  return {
    ...row,
    tags,
  };
}

/**
 * Escapes CSV field and mitigates CSV formula injection vulnerabilities.
 * Prefixes cells starting with '=', '+', '-', '@', '\t', '\r' with a single quote.
 */
function escapeCsvField(field: string): string {
  if (!field) return '""';
  let sanitized = field;

  // Formula injection prevention
  if (/^[=+\-@\t\r]/.test(sanitized)) {
    sanitized = "'" + sanitized;
  }

  // Escape double quotes
  sanitized = sanitized.replace(/"/g, '""');
  return `"${sanitized}"`;
}
