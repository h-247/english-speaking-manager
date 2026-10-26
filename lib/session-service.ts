import { getDb, schema } from '@/db';
import { ensureDatabaseInitialized } from '@/lib/db-init';
import { calculateScore } from '@/lib/scoring';
import { normalizeChatGPTUrl } from '@/lib/chatgpt-url';
import {
  CreateSessionInput,
  UpdateSessionInput,
  RecordResultInput,
  CreateAttemptInput,
  UpdateAttemptInput,
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

    const [sessions, countResult, attemptCounts] = await Promise.all([
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
      db
        .select({
          sessionId: schema.practiceAttempts.sessionId,
          count: sql<number>`count(*)`,
        })
        .from(schema.practiceAttempts)
        .where(eq(schema.practiceAttempts.userId, userId))
        .groupBy(schema.practiceAttempts.sessionId),
    ]);

    const total = countResult[0]?.count ?? 0;

    const attemptMap = new Map<string, number>();
    for (const a of attemptCounts) {
      attemptMap.set(a.sessionId, a.count);
    }

    return {
      sessions: sessions.map((s) => ({
        ...deserializeSession(s),
        attemptCount: attemptMap.get(s.id) || (s.score !== null ? 1 : 0),
      })),
      total,
      limit,
      offset,
    };
  }

  /**
   * Retrieves a single session by ID, scoped to user, including all practice attempts.
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

    const attempts = await db
      .select()
      .from(schema.practiceAttempts)
      .where(
        and(
          eq(schema.practiceAttempts.userId, userId),
          eq(schema.practiceAttempts.sessionId, sessionId),
        ),
      )
      .orderBy(desc(schema.practiceAttempts.practicedAt), desc(schema.practiceAttempts.createdAt));

    const deserialized = deserializeSession(session);

    // Group all ChatGPT links for this Topic with metadata
    const linkMap = new Map<
      string,
      {
        url: string;
        attemptNumbers: number[];
        attempts: typeof attempts;
        bestScore: number | null;
        latestPracticedAt: string | null;
      }
    >();

    if (deserialized.chatgptUrl) {
      linkMap.set(deserialized.chatgptUrl, {
        url: deserialized.chatgptUrl,
        attemptNumbers: [],
        attempts: [],
        bestScore: null,
        latestPracticedAt: deserialized.practicedAt || null,
      });
    }

    for (const b of deserialized.branchUrls) {
      if (b && !linkMap.has(b)) {
        linkMap.set(b, {
          url: b,
          attemptNumbers: [],
          attempts: [],
          bestScore: null,
          latestPracticedAt: null,
        });
      }
    }

    attempts.forEach((att, index) => {
      const attNum = attempts.length - index;
      const attUrl = att.chatgptUrl || deserialized.chatgptUrl;
      if (attUrl) {
        let entry = linkMap.get(attUrl);
        if (!entry) {
          entry = {
            url: attUrl,
            attemptNumbers: [],
            attempts: [],
            bestScore: null,
            latestPracticedAt: null,
          };
          linkMap.set(attUrl, entry);
        }
        entry.attemptNumbers.push(attNum);
        entry.attempts.push(att);
        if (entry.bestScore === null || att.score > entry.bestScore) {
          entry.bestScore = att.score;
        }
        if (
          !entry.latestPracticedAt ||
          new Date(att.practicedAt).getTime() > new Date(entry.latestPracticedAt).getTime()
        ) {
          entry.latestPracticedAt = att.practicedAt;
        }
      }
    });

    const groupedLinks = Array.from(linkMap.values()).map((item) => ({
      ...item,
      attemptNumbers: item.attemptNumbers.sort((a, b) => a - b),
      attemptCount: item.attemptNumbers.length,
    }));

    return {
      ...deserialized,
      attempts,
      attemptCount: attempts.length > 0 ? attempts.length : session.score !== null ? 1 : 0,
      allChatgptUrls: Array.from(linkMap.keys()),
      groupedLinks,
    };
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
    const practicedAt = input.practicedAt ?? (score !== null ? now : null);

    const tagsJson =
      input.tags && input.tags.length > 0 ? JSON.stringify(input.tags) : null;
    const branchUrlsJson =
      input.branchUrls && input.branchUrls.length > 0
        ? JSON.stringify(input.branchUrls)
        : null;

    const newSession = {
      id,
      userId,
      topic: input.topic.trim(),
      chatgptUrl: input.chatgptUrl.trim(),
      normalizedUrl,
      branchUrls: branchUrlsJson,
      status: input.status ?? 'PLANNED',
      notes: input.notes?.trim() || null,
      tags: tagsJson,
      passCount: input.passCount ?? null,
      failCount: input.failCount ?? null,
      score,
      practicedAt,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(schema.practiceSessions).values(newSession);

    // If initial practice results were entered, also record as first attempt in history
    if (score !== null && typeof input.passCount === 'number' && typeof input.failCount === 'number') {
      await db.insert(schema.practiceAttempts).values({
        id: crypto.randomUUID(),
        sessionId: id,
        userId,
        passCount: input.passCount,
        failCount: input.failCount,
        score,
        notes: input.notes?.trim() || null,
        chatgptUrl: input.chatgptUrl.trim(),
        practicedAt: practicedAt || now,
        createdAt: now,
      });
    }

    return {
      ...deserializeSession(newSession),
      attempts: [],
      attemptCount: score !== null ? 1 : 0,
    };
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

    if (input.branchUrls !== undefined) {
      updates.branchUrls =
        input.branchUrls && input.branchUrls.length > 0
          ? JSON.stringify(input.branchUrls)
          : null;
    }

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

    return this.getSessionById(userId, sessionId);
  }

  /**
   * Deletes a session by ID with owner check. Cascade deletes attempts.
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

    // Delete attempts for this session
    await db
      .delete(schema.practiceAttempts)
      .where(
        and(
          eq(schema.practiceAttempts.userId, userId),
          eq(schema.practiceAttempts.sessionId, sessionId),
        ),
      );

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
   * Adds a new practice attempt / history entry to a session and updates parent scores.
   */
  static async addAttempt(
    userId: string,
    sessionId: string,
    input: CreateAttemptInput,
  ) {
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

    if (!session) {
      throw new Error('Session not found or access denied.');
    }

    const score = calculateScore(input.passCount, input.failCount);
    if (score === null) {
      throw new Error('Valid Pass and Fail counts are required to record practice score.');
    }

    const now = new Date().toISOString();
    const practicedAt = input.practicedAt || now;
    const attemptId = crypto.randomUUID();
    const attemptChatgptUrl = input.chatgptUrl?.trim() || session.chatgptUrl;

    const newAttempt = {
      id: attemptId,
      sessionId,
      userId,
      passCount: input.passCount,
      failCount: input.failCount,
      score,
      notes: input.notes?.trim() || null,
      chatgptUrl: attemptChatgptUrl,
      practicedAt,
      createdAt: now,
    };

    await db.insert(schema.practiceAttempts).values(newAttempt);

    // If a new branched URL was used, add it to the session's branchUrls array
    let currentBranches: string[] = [];
    if (session.branchUrls) {
      try {
        currentBranches = JSON.parse(session.branchUrls);
      } catch {
        currentBranches = [];
      }
    }
    if (
      attemptChatgptUrl &&
      attemptChatgptUrl !== session.chatgptUrl &&
      !currentBranches.includes(attemptChatgptUrl)
    ) {
      currentBranches.push(attemptChatgptUrl);
    }

    // Update parent session with latest attempt score, counts, practicedAt, status
    const newStatus = input.markCompleted
      ? 'COMPLETED'
      : session.status === 'PLANNED'
        ? 'IN_PROGRESS'
        : session.status;

    await db
      .update(schema.practiceSessions)
      .set({
        passCount: input.passCount,
        failCount: input.failCount,
        score,
        practicedAt,
        status: newStatus,
        branchUrls: currentBranches.length > 0 ? JSON.stringify(currentBranches) : session.branchUrls,
        updatedAt: now,
      })
      .where(
        and(
          eq(schema.practiceSessions.userId, userId),
          eq(schema.practiceSessions.id, sessionId),
        ),
      );

    return newAttempt;
  }

  /**
   * Lists all practice attempts for a session.
   */
  static async listAttempts(userId: string, sessionId: string) {
    await ensureDatabaseInitialized();
    const db = getDb();

    return db
      .select()
      .from(schema.practiceAttempts)
      .where(
        and(
          eq(schema.practiceAttempts.userId, userId),
          eq(schema.practiceAttempts.sessionId, sessionId),
        ),
      )
      .orderBy(desc(schema.practiceAttempts.practicedAt), desc(schema.practiceAttempts.createdAt));
  }

  /**
   * Deletes a specific practice attempt and syncs parent session to latest remaining attempt.
   */
  static async deleteAttempt(userId: string, sessionId: string, attemptId: string) {
    await ensureDatabaseInitialized();
    const db = getDb();

    const [attempt] = await db
      .select()
      .from(schema.practiceAttempts)
      .where(
        and(
          eq(schema.practiceAttempts.id, attemptId),
          eq(schema.practiceAttempts.sessionId, sessionId),
          eq(schema.practiceAttempts.userId, userId),
        ),
      )
      .limit(1);

    if (!attempt) {
      throw new Error('Practice attempt not found or access denied.');
    }

    await db
      .delete(schema.practiceAttempts)
      .where(
        and(
          eq(schema.practiceAttempts.id, attemptId),
          eq(schema.practiceAttempts.userId, userId),
        ),
      );

    // Find latest remaining attempt
    const [latest] = await db
      .select()
      .from(schema.practiceAttempts)
      .where(
        and(
          eq(schema.practiceAttempts.sessionId, sessionId),
          eq(schema.practiceAttempts.userId, userId),
        ),
      )
      .orderBy(desc(schema.practiceAttempts.practicedAt), desc(schema.practiceAttempts.createdAt))
      .limit(1);

    const now = new Date().toISOString();
    if (latest) {
      await db
        .update(schema.practiceSessions)
        .set({
          passCount: latest.passCount,
          failCount: latest.failCount,
          score: latest.score,
          practicedAt: latest.practicedAt,
          updatedAt: now,
        })
        .where(
          and(
            eq(schema.practiceSessions.userId, userId),
            eq(schema.practiceSessions.id, sessionId),
          ),
        );
    } else {
      await db
        .update(schema.practiceSessions)
        .set({
          passCount: null,
          failCount: null,
          score: null,
          practicedAt: null,
          updatedAt: now,
        })
        .where(
          and(
            eq(schema.practiceSessions.userId, userId),
            eq(schema.practiceSessions.id, sessionId),
          ),
        );
    }

    return { success: true };
  }

  /**
   * Updates an existing practice attempt (including its ChatGPT link, counts, notes, date).
   */
  static async updateAttempt(
    userId: string,
    sessionId: string,
    attemptId: string,
    input: UpdateAttemptInput,
  ) {
    await ensureDatabaseInitialized();
    const db = getDb();

    const [existing] = await db
      .select()
      .from(schema.practiceAttempts)
      .where(
        and(
          eq(schema.practiceAttempts.id, attemptId),
          eq(schema.practiceAttempts.sessionId, sessionId),
          eq(schema.practiceAttempts.userId, userId),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new Error('Practice attempt not found or access denied.');
    }

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

    if (!session) {
      throw new Error('Session not found or access denied.');
    }

    const newPass = input.passCount !== undefined ? input.passCount : existing.passCount;
    const newFail = input.failCount !== undefined ? input.failCount : existing.failCount;
    const score = calculateScore(newPass, newFail);

    const updates: Partial<typeof schema.practiceAttempts.$inferInsert> = {};
    if (input.passCount !== undefined) updates.passCount = input.passCount;
    if (input.failCount !== undefined) updates.failCount = input.failCount;
    if (score !== null) updates.score = score;
    if (input.practicedAt !== undefined) updates.practicedAt = input.practicedAt || existing.practicedAt;
    if (input.notes !== undefined) updates.notes = input.notes?.trim() || null;

    let attemptChatgptUrl = existing.chatgptUrl;
    if (input.chatgptUrl !== undefined) {
      attemptChatgptUrl = input.chatgptUrl?.trim() || session.chatgptUrl;
      updates.chatgptUrl = attemptChatgptUrl;
    }

    await db
      .update(schema.practiceAttempts)
      .set(updates)
      .where(
        and(
          eq(schema.practiceAttempts.id, attemptId),
          eq(schema.practiceAttempts.userId, userId),
        ),
      );

    // If a new ChatGPT URL was set, add it to the session's branchUrls if not already present
    if (attemptChatgptUrl && attemptChatgptUrl !== session.chatgptUrl) {
      let currentBranches: string[] = [];
      if (session.branchUrls) {
        try {
          currentBranches = JSON.parse(session.branchUrls);
        } catch {
          currentBranches = [];
        }
      }
      if (!currentBranches.includes(attemptChatgptUrl)) {
        currentBranches.push(attemptChatgptUrl);
        await db
          .update(schema.practiceSessions)
          .set({
            branchUrls: JSON.stringify(currentBranches),
            updatedAt: new Date().toISOString(),
          })
          .where(
            and(
              eq(schema.practiceSessions.userId, userId),
              eq(schema.practiceSessions.id, sessionId),
            ),
          );
      }
    }

    // Check if this attempt is the latest one to update the parent session
    const [latest] = await db
      .select()
      .from(schema.practiceAttempts)
      .where(
        and(
          eq(schema.practiceAttempts.sessionId, sessionId),
          eq(schema.practiceAttempts.userId, userId),
        ),
      )
      .orderBy(desc(schema.practiceAttempts.practicedAt), desc(schema.practiceAttempts.createdAt))
      .limit(1);

    if (latest && latest.id === attemptId) {
      const now = new Date().toISOString();
      await db
        .update(schema.practiceSessions)
        .set({
          passCount: latest.passCount,
          failCount: latest.failCount,
          score: latest.score,
          practicedAt: latest.practicedAt,
          updatedAt: now,
        })
        .where(
          and(
            eq(schema.practiceSessions.userId, userId),
            eq(schema.practiceSessions.id, sessionId),
          ),
        );
    }

    const [updatedAttempt] = await db
      .select()
      .from(schema.practiceAttempts)
      .where(eq(schema.practiceAttempts.id, attemptId))
      .limit(1);

    return updatedAttempt;
  }

  /**
   * Records practice results (backward-compatible; logs attempt in history).
   */
  static async recordResult(
    userId: string,
    sessionId: string,
    input: RecordResultInput,
  ) {
    await this.addAttempt(userId, sessionId, {
      passCount: input.passCount,
      failCount: input.failCount,
      practicedAt: input.practicedAt,
      notes: input.notes,
      chatgptUrl: input.chatgptUrl,
      markCompleted: input.markCompleted,
    });

    return this.getSessionById(userId, sessionId);
  }

  /**
   * Computes aggregated dashboard statistics for a user.
   */
  static async getDashboardStats(userId: string) {
    await ensureDatabaseInitialized();
    const db = getDb();

    const [sessions, attempts] = await Promise.all([
      db
        .select()
        .from(schema.practiceSessions)
        .where(eq(schema.practiceSessions.userId, userId))
        .orderBy(desc(schema.practiceSessions.updatedAt)),
      db
        .select()
        .from(schema.practiceAttempts)
        .where(eq(schema.practiceAttempts.userId, userId)),
    ]);

    const totalSessions = sessions.length;
    let plannedSessions = 0;
    let inProgressSessions = 0;
    let completedSessions = 0;
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
    }

    let totalPass = 0;
    let totalFail = 0;

    if (attempts.length > 0) {
      for (const a of attempts) {
        totalPass += a.passCount;
        totalFail += a.failCount;
      }
    } else {
      for (const s of sessions) {
        if (s.passCount !== null && s.passCount !== undefined) totalPass += s.passCount;
        if (s.failCount !== null && s.failCount !== undefined) totalFail += s.failCount;
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
      totalAttempts: attempts.length,
    };
  }

  /**
   * Exports all user sessions and attempts in JSON or CSV.
   */
  static async exportData(userId: string, format: 'json' | 'csv' = 'json') {
    await ensureDatabaseInitialized();
    const db = getDb();

    const [rows, allAttempts] = await Promise.all([
      db
        .select()
        .from(schema.practiceSessions)
        .where(eq(schema.practiceSessions.userId, userId))
        .orderBy(desc(schema.practiceSessions.createdAt)),
      db
        .select()
        .from(schema.practiceAttempts)
        .where(eq(schema.practiceAttempts.userId, userId))
        .orderBy(desc(schema.practiceAttempts.practicedAt)),
    ]);

    const attemptsBySession = new Map<string, any[]>();
    for (const a of allAttempts) {
      const list = attemptsBySession.get(a.sessionId) || [];
      list.push(a);
      attemptsBySession.set(a.sessionId, list);
    }

    const sessions = rows.map((r) => ({
      ...deserializeSession(r),
      attempts: attemptsBySession.get(r.id) || [],
    }));

    if (format === 'csv') {
      const headers = [
        'Topic',
        'ChatGPT URL',
        'Status',
        'Score',
        'Pass Count',
        'Fail Count',
        'Total Attempts',
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
          String(s.attempts.length || (s.score !== null ? 1 : 0)),
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
      version: '1.1.0',
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
        attempts: s.attempts.map((a: any) => ({
          passCount: a.passCount,
          failCount: a.failCount,
          score: a.score,
          notes: a.notes,
          practicedAt: a.practicedAt,
          createdAt: a.createdAt,
        })),
      })),
    };

    return {
      contentType: 'application/json; charset=utf-8',
      filename: `speaking-sessions-backup-${new Date().toISOString().slice(0, 10)}.json`,
      data: JSON.stringify(payload, null, 2),
    };
  }

  /**
   * Imports validated sessions and their attempts into user database.
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
          continue;
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
        const branchUrlsJson =
          item.branchUrls && Array.isArray(item.branchUrls) && item.branchUrls.length > 0
            ? JSON.stringify(item.branchUrls)
            : null;

        const existingId = existingMap.get(normalizedUrl);

        let targetSessionId = existingId;

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
                branchUrls: branchUrlsJson,
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
            skipped++;
            continue;
          }
        } else {
          // Insert new session
          targetSessionId = crypto.randomUUID();
          await db.insert(schema.practiceSessions).values({
            id: targetSessionId,
            userId,
            topic: item.topic.trim(),
            chatgptUrl: item.chatgptUrl.trim(),
            normalizedUrl,
            branchUrls: branchUrlsJson,
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
          existingMap.set(normalizedUrl, targetSessionId);
          inserted++;
        }

        // Import attempts if provided
        if (targetSessionId && Array.isArray(item.attempts) && item.attempts.length > 0) {
          for (const att of item.attempts) {
            const attScore =
              att.score !== undefined && att.score !== null
                ? att.score
                : calculateScore(att.passCount, att.failCount) || 0;

            await db.insert(schema.practiceAttempts).values({
              id: crypto.randomUUID(),
              sessionId: targetSessionId,
              userId,
              passCount: att.passCount,
              failCount: att.failCount,
              score: attScore,
              notes: att.notes?.trim() || null,
              chatgptUrl: att.chatgptUrl?.trim() || item.chatgptUrl.trim(),
              practicedAt: att.practicedAt || now,
              createdAt: att.createdAt || now,
            });
          }
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

  let branchUrls: string[] = [];
  if (row.branchUrls) {
    try {
      branchUrls = JSON.parse(row.branchUrls);
    } catch {
      branchUrls = [];
    }
  }

  const distinctUrls = new Set<string>();
  if (row.chatgptUrl) distinctUrls.add(row.chatgptUrl);
  for (const b of branchUrls) {
    if (b) distinctUrls.add(b);
  }

  return {
    ...row,
    tags,
    branchUrls,
    allChatgptUrls: Array.from(distinctUrls),
  };
}

/**
 * Escapes CSV field and mitigates CSV formula injection vulnerabilities.
 */
function escapeCsvField(field: string): string {
  if (!field) return '""';
  let sanitized = field;

  if (/^[=+\-@\t\r]/.test(sanitized)) {
    sanitized = "'" + sanitized;
  }

  sanitized = sanitized.replace(/"/g, '""');
  return `"${sanitized}"`;
}
