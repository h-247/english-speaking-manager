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
      ]);

      tablesChecked = true;
    })();
  }

  await initPromise;
}
