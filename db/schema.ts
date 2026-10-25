import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
  index,
} from 'drizzle-orm/sqlite-core';

export const sessionStatusEnum = ['PLANNED', 'IN_PROGRESS', 'COMPLETED'] as const;
export type SessionStatus = (typeof sessionStatusEnum)[number];

export const practiceSessions = sqliteTable(
  'practice_sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    topic: text('topic').notNull(),
    chatgptUrl: text('chatgpt_url').notNull(),
    normalizedUrl: text('normalized_url').notNull(),
    status: text('status', { enum: sessionStatusEnum }).notNull().default('PLANNED'),
    notes: text('notes'),
    tags: text('tags'), // JSON string array e.g. '["business","b2"]'
    passCount: integer('pass_count'),
    failCount: integer('fail_count'),
    score: real('score'), // Calculated: 10 * pass / (pass + fail), rounded to 1 decimal place
    practicedAt: text('practiced_at'), // ISO 8601 string
    createdAt: text('created_at').notNull(), // ISO 8601 string
    updatedAt: text('updated_at').notNull(), // ISO 8601 string
  },
  (table) => [
    uniqueIndex('user_normalized_url_idx').on(table.userId, table.normalizedUrl),
    index('user_status_idx').on(table.userId, table.status),
    index('user_created_at_idx').on(table.userId, table.createdAt),
    index('user_practiced_at_idx').on(table.userId, table.practicedAt),
    index('user_updated_at_idx').on(table.userId, table.updatedAt),
    index('user_topic_idx').on(table.userId, table.topic),
  ],
);

export const customPrompts = sqliteTable(
  'custom_prompts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('prompt_user_idx').on(table.userId),
  ],
);

export type PracticeSession = typeof practiceSessions.$inferSelect;
export type NewPracticeSession = typeof practiceSessions.$inferInsert;
export type CustomPrompt = typeof customPrompts.$inferSelect;
export type NewCustomPrompt = typeof customPrompts.$inferInsert;
