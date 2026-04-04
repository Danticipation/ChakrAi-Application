import { db } from "../db.js";
import { 
  moodEntries, moodForecasts, emotionalPatterns, emotionalContexts,
  type MoodEntry, type InsertMoodEntry,
  type MoodForecast, type InsertMoodForecast,
  type EmotionalPattern, type InsertEmotionalPattern,
  type EmotionalContext, type InsertEmotionalContext,
} from "../../shared/schema.ts";
import { eq, desc } from "drizzle-orm";

export interface IMoodStorage {
  createMoodEntry(data: InsertMoodEntry): Promise<MoodEntry>;
  getMoodEntries(userId: number, limit?: number): Promise<MoodEntry[]>;
  createMoodForecast(data: InsertMoodForecast): Promise<MoodForecast>;
  getMoodForecasts(userId: number, limit?: number): Promise<MoodForecast[]>;
  createEmotionalContext(data: InsertEmotionalContext): Promise<EmotionalContext>;
  getEmotionalContexts(userId: number, limit?: number): Promise<EmotionalContext[]>;
  clearUserMoodEntries(userId: number): Promise<void>;
}

export class MoodStorage implements IMoodStorage {
  async createMoodEntry(data: InsertMoodEntry): Promise<MoodEntry> {
    const result = await db.insert(moodEntries).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    return result[0]!;
  }

  async getMoodEntries(userId: number, limit: number = 50): Promise<MoodEntry[]> {
    return await db.select().from(moodEntries)
      .where(eq(moodEntries.userId, userId))
      .orderBy(desc(moodEntries.createdAt))
      .limit(limit);
  }

  async createMoodForecast(data: InsertMoodForecast): Promise<MoodForecast> {
    const result = await db.insert(moodForecasts).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    return result[0]!;
  }

  async getMoodForecasts(userId: number, limit: number = 10): Promise<MoodForecast[]> {
    return await db.select().from(moodForecasts)
      .where(eq(moodForecasts.userId, userId))
      .orderBy(desc(moodForecasts.createdAt))
      .limit(limit);
  }

  async createEmotionalContext(data: InsertEmotionalContext): Promise<EmotionalContext> {
    const result = await db.insert(emotionalContexts).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    return result[0]!;
  }

  async getEmotionalContexts(userId: number, limit: number = 20): Promise<EmotionalContext[]> {
    return await db.select().from(emotionalContexts)
      .where(eq(emotionalContexts.userId, userId))
      .orderBy(desc(emotionalContexts.createdAt))
      .limit(limit);
  }

  async clearUserMoodEntries(userId: number): Promise<void> {
    await db.delete(moodEntries).where(eq(moodEntries.userId, userId));
    await db.delete(emotionalContexts).where(eq(emotionalContexts.userId, userId));
  }
}
