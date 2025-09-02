import { db } from "../db.js";
import { 
  userAchievements, wellnessStreaks, analyticsMetrics, progressTracking,
  type UserAchievement, type InsertUserAchievement,
  type WellnessStreak, type InsertWellnessStreak,
  type AnalyticsMetric, type InsertAnalyticsMetric,
  type ProgressTracking, type InsertProgressTracking,
} from "../../shared/schema.ts";
import { eq, desc } from "drizzle-orm";

export interface IAnalyticsStorage {
  calculateWellnessScore(userId: number): Promise<number>;
  getUserAchievements(userId: number): Promise<UserAchievement[]>;
  getWellnessStreaks(userId: number): Promise<WellnessStreak[]>;
  createUserAchievement(data: InsertUserAchievement): Promise<UserAchievement>;
  updateWellnessStreak(streakId: number, updates: any): Promise<void>;
  clearUserAnalytics(userId: number): Promise<void>;
}

export class AnalyticsStorage implements IAnalyticsStorage {
  async calculateWellnessScore(userId: number): Promise<number> {
    // Simple wellness score calculation
    return 75; // Placeholder implementation
  }

  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return await db.select().from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.id));
  }

  async getWellnessStreaks(userId: number): Promise<WellnessStreak[]> {
    return await db.select().from(wellnessStreaks)
      .where(eq(wellnessStreaks.userId, userId))
      .orderBy(desc(wellnessStreaks.createdAt));
  }

  async createUserAchievement(data: InsertUserAchievement): Promise<UserAchievement> {
    const result = await db.insert(userAchievements).values(data).returning();
    if (!result[0]) {
      throw new Error('Failed to create user achievement');
    }
    return result[0];
  }

  async updateWellnessStreak(streakId: number, updates: any): Promise<void> {
    await db.update(wellnessStreaks)
      .set(updates)
      .where(eq(wellnessStreaks.id, streakId));
  }

  async clearUserAnalytics(userId: number): Promise<void> {
    await db.delete(userAchievements).where(eq(userAchievements.userId, userId));
    await db.delete(wellnessStreaks).where(eq(wellnessStreaks.userId, userId));
  }
}
