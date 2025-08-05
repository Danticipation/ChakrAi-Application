import { db } from "../db.js";
import { 
  journalEntries, journalAnalytics,
  type JournalEntry, type InsertJournalEntry,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IJournalStorage {
  createJournalEntry(data: InsertJournalEntry): Promise<JournalEntry>;
  getJournalEntries(userId: number, limit?: number): Promise<JournalEntry[]>;
  migrateJournalEntries(currentUserId: number): Promise<number>;
  createJournalAnalytics(data: any): Promise<any>;
  getJournalAnalytics(userId: number, entryId?: number): Promise<any[]>;
  clearUserJournalEntries(userId: number): Promise<void>;
}

export class JournalStorage implements IJournalStorage {
  async createJournalEntry(data: InsertJournalEntry): Promise<JournalEntry> {
    const result = await db.insert(journalEntries).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    return result[0]!;
  }

  async getJournalEntries(userId: number, limit: number = 50): Promise<JournalEntry[]> {
    return await db.select().from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt))
      .limit(limit);
  }

  async migrateJournalEntries(currentUserId: number): Promise<number> {
    // Implementation for migrating journal entries
    return 0;
  }

  async createJournalAnalytics(data: any): Promise<any> {
    const result = await db.insert(journalAnalytics).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    return result[0]!;
  }

  async getJournalAnalytics(userId: number, entryId?: number): Promise<any[]> {
    let query = db.select().from(journalAnalytics).where(eq(journalAnalytics.userId, userId));
    // Temporarily remove entryId filter due to schema mismatch
    // if (entryId) {
    //   query = query.where(eq(journalAnalytics.entryId, entryId));
    // }
    return await query.orderBy(desc(journalAnalytics.createdAt));
  }

  async clearUserJournalEntries(userId: number): Promise<void> {
    await db.delete(journalEntries).where(eq(journalEntries.userId, userId));
    await db.delete(journalAnalytics).where(eq(journalAnalytics.userId, userId));
  }
}