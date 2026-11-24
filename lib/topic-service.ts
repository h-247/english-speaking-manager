import { getDb, schema } from '@/db';
import { ensureDatabaseInitialized } from '@/lib/db-init';
import { CreateTopicInput, UpdateTopicInput } from '@/lib/validation';
import { eq, and, asc, sql } from 'drizzle-orm';

export interface TopicItem {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export class TopicService {
  /**
   * Retrieves all topics for a user.
   */
  static async listTopics(userId: string): Promise<TopicItem[]> {
    await ensureDatabaseInitialized();
    const db = getDb();

    const userTopics = await db
      .select()
      .from(schema.topics)
      .where(eq(schema.topics.userId, userId))
      .orderBy(asc(schema.topics.createdAt));

    return userTopics;
  }

  /**
   * Creates a new topic with duplicate protection.
   */
  static async createTopic(userId: string, input: CreateTopicInput): Promise<TopicItem> {
    await ensureDatabaseInitialized();
    const db = getDb();

    const trimmedName = input.name.trim();

    // Check case-insensitive duplicate
    const allTopics = await db
      .select()
      .from(schema.topics)
      .where(eq(schema.topics.userId, userId));

    const exists = allTopics.some(
      (t) => t.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );

    if (exists) {
      throw new Error(`Topic "${trimmedName}" already exists.`);
    }

    const now = new Date().toISOString();
    const newTopic = {
      id: crypto.randomUUID(),
      userId,
      name: trimmedName,
      color: input.color || '',
      icon: input.icon || '',
      description: input.description?.trim() || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(schema.topics).values(newTopic);

    return newTopic;
  }

  /**
   * Updates an existing topic, and renames related sessions if topic name changed.
   */
  static async updateTopic(
    userId: string,
    topicId: string,
    input: UpdateTopicInput,
  ): Promise<TopicItem> {
    await ensureDatabaseInitialized();
    const db = getDb();

    const [existing] = await db
      .select()
      .from(schema.topics)
      .where(and(eq(schema.topics.userId, userId), eq(schema.topics.id, topicId)))
      .limit(1);

    if (!existing) {
      throw new Error('Topic not found.');
    }

    const now = new Date().toISOString();
    const updates: Partial<typeof schema.topics.$inferInsert> = {
      updatedAt: now,
    };

    let nameChanged = false;
    let oldName = existing.name;
    let newName = existing.name;

    if (input.name !== undefined) {
      const trimmed = input.name.trim();
      if (trimmed.toLowerCase() !== existing.name.toLowerCase()) {
        const allTopics = await db
          .select()
          .from(schema.topics)
          .where(eq(schema.topics.userId, userId));

        const isDuplicate = allTopics.some(
          (t) => t.id !== topicId && t.name.trim().toLowerCase() === trimmed.toLowerCase(),
        );

        if (isDuplicate) {
          throw new Error(`Topic "${trimmed}" already exists.`);
        }
      }
      updates.name = trimmed;
      newName = trimmed;
      if (trimmed !== oldName) {
        nameChanged = true;
      }
    }

    if (input.color !== undefined) {
      updates.color = input.color;
    }
    if (input.icon !== undefined) {
      updates.icon = input.icon;
    }
    if (input.description !== undefined) {
      updates.description = input.description?.trim() || null;
    }

    await db
      .update(schema.topics)
      .set(updates)
      .where(and(eq(schema.topics.userId, userId), eq(schema.topics.id, topicId)));

    // Synchronize sessions if topic name was changed
    if (nameChanged) {
      await db
        .update(schema.practiceSessions)
        .set({ topic: newName, updatedAt: now })
        .where(
          and(
            eq(schema.practiceSessions.userId, userId),
            eq(schema.practiceSessions.topic, oldName),
          ),
        );
    }

    return {
      ...existing,
      ...updates,
    } as TopicItem;
  }

  /**
   * Deletes a topic.
   */
  static async deleteTopic(userId: string, topicId: string): Promise<void> {
    await ensureDatabaseInitialized();
    const db = getDb();

    const [existing] = await db
      .select()
      .from(schema.topics)
      .where(and(eq(schema.topics.userId, userId), eq(schema.topics.id, topicId)))
      .limit(1);

    if (!existing) {
      throw new Error('Topic not found.');
    }

    await db
      .delete(schema.topics)
      .where(and(eq(schema.topics.userId, userId), eq(schema.topics.id, topicId)));

    await db
      .delete(schema.practiceSessions)
      .where(
        and(
          eq(schema.practiceSessions.userId, userId),
          eq(schema.practiceSessions.topic, existing.name),
        ),
      );
  }
}
