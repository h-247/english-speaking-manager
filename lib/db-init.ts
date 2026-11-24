import { getDb, schema } from '@/db';
import { sql } from 'drizzle-orm';
import {
  INITIAL_SEED_SESSIONS,
  INITIAL_SEED_ATTEMPTS,
  INITIAL_SEED_TOPICS,
} from '@/lib/seed-data';

let tablesChecked = false;
let initPromise: Promise<void> | null = null;

export async function ensureDatabaseInitialized(): Promise<void> {
  if (tablesChecked) return;

  if (!initPromise) {
    initPromise = (async () => {
      const db = getDb();

      await db.run(sql`
        CREATE TABLE IF NOT EXISTS practice_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          topic TEXT NOT NULL,
          chatgpt_url TEXT NOT NULL,
          normalized_url TEXT NOT NULL,
          branch_urls TEXT,
          status TEXT NOT NULL DEFAULT 'To Do',
          notes TEXT,
          tags TEXT,
          pass_count INTEGER,
          fail_count INTEGER,
          score REAL,
          practiced_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      await db.run(sql`
        CREATE TABLE IF NOT EXISTS practice_attempts (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL,
          pass_count INTEGER NOT NULL,
          fail_count INTEGER NOT NULL,
          score REAL NOT NULL,
          notes TEXT,
          chatgpt_url TEXT,
          practiced_at TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
      `);

      // Safe column additions for existing databases
      try {
        await db.run(sql`ALTER TABLE practice_sessions ADD COLUMN branch_urls TEXT;`);
      } catch {
        // column already exists
      }
      try {
        await db.run(sql`ALTER TABLE practice_sessions ADD COLUMN chatgpt_url_status TEXT DEFAULT 'To Do';`);
      } catch {
        // column already exists
      }
      try {
        await db.run(sql`ALTER TABLE practice_attempts ADD COLUMN chatgpt_url TEXT;`);
      } catch {
        // column already exists
      }

      await db.run(sql`
        CREATE TABLE IF NOT EXISTS topics (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          color TEXT NOT NULL DEFAULT 'blue',
          icon TEXT NOT NULL DEFAULT '💬',
          description TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      await db.run(sql`
        CREATE TABLE IF NOT EXISTS custom_prompts (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      try {
        await db.run(sql`
          CREATE UNIQUE INDEX IF NOT EXISTS user_topic_name_idx 
          ON topics (user_id, name);
        `);
      } catch {}
      try {
        await db.run(sql`
          CREATE INDEX IF NOT EXISTS topic_user_idx 
          ON topics (user_id);
        `);
      } catch {}

      try {
        await db.run(sql`DROP INDEX IF EXISTS user_normalized_url_idx;`);
      } catch {}
      try {
        await db.run(sql`
          CREATE UNIQUE INDEX IF NOT EXISTS user_normalized_url_idx 
          ON practice_sessions (user_id, normalized_url)
          WHERE normalized_url != '' AND normalized_url IS NOT NULL;
        `);
      } catch {}

      // Create composite and single column indexes safely
      await Promise.all([
        db.run(sql`
          CREATE INDEX IF NOT EXISTS user_status_idx 
          ON practice_sessions (user_id, status);
        `),
        db.run(sql`
          CREATE INDEX IF NOT EXISTS user_created_at_idx 
          ON practice_sessions (user_id, created_at);
        `),
        db.run(sql`
          CREATE INDEX IF NOT EXISTS user_practiced_at_idx 
          ON practice_sessions (user_id, practiced_at);
        `),
        db.run(sql`
          CREATE INDEX IF NOT EXISTS user_updated_at_idx 
          ON practice_sessions (user_id, updated_at);
        `),
        db.run(sql`
          CREATE INDEX IF NOT EXISTS user_topic_idx 
          ON practice_sessions (user_id, topic);
        `),
        db.run(sql`
          CREATE INDEX IF NOT EXISTS attempt_session_idx 
          ON practice_attempts (session_id);
        `),
        db.run(sql`
          CREATE INDEX IF NOT EXISTS attempt_user_idx 
          ON practice_attempts (user_id);
        `),
        db.run(sql`
          CREATE INDEX IF NOT EXISTS attempt_practiced_at_idx 
          ON practice_attempts (practiced_at);
        `),
      ]);

      // Auto-seed preset topics if table is empty
      try {
        const topicRows = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.topics);
        const topicCount = Number(topicRows[0]?.count ?? 0);
        if (topicCount === 0) {
          for (const topic of INITIAL_SEED_TOPICS) {
            await db.insert(schema.topics).values(topic);
          }
        }
      } catch (err) {
        console.error('Error auto-seeding topics:', err);
      }

      // Auto-seed baseline sessions and attempts if table is empty
      try {
        const sessionRows = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.practiceSessions);
        const sessionCount = Number(sessionRows[0]?.count ?? 0);
        if (sessionCount === 0) {
          for (const s of INITIAL_SEED_SESSIONS) {
            await db.insert(schema.practiceSessions).values(s);
          }
          for (const a of INITIAL_SEED_ATTEMPTS) {
            await db.insert(schema.practiceAttempts).values(a);
          }
        }
      } catch (err) {
        console.error('Error auto-seeding sessions:', err);
      }

      tablesChecked = true;
    })();
  }

  await initPromise;
}
