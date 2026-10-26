import { getDb } from '@/db';
import { sql } from 'drizzle-orm';

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
          status TEXT NOT NULL DEFAULT 'PLANNED',
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
          practiced_at TEXT NOT NULL,
          created_at TEXT NOT NULL
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

      // Create composite and single column indexes safely
      await Promise.all([
        db.run(sql`
          CREATE UNIQUE INDEX IF NOT EXISTS user_normalized_url_idx 
          ON practice_sessions (user_id, normalized_url);
        `),
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

      tablesChecked = true;
    })();
  }

  await initPromise;
}
