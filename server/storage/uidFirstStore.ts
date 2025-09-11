// server/storage/uidFirstStore.ts
import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../db.js'
import { journalEntries, moodEntries, users } from '../../shared/schema.js'

export type Identity = { uid: string; legacyUserId?: number }

export class UidFirstStore {
  constructor(private readonly bridgeRequired: boolean = true) {}

  /** Get legacy user ID for UID compatibility */
  private async getLegacyIdForUid(uid: string): Promise<number | null> {
    // Convert UID to consistent numeric ID using same hash as HIPAA auth
    const hashCode = uid.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hashCode) % 2147483647;
  }

  // ---------- READS (prefer UID when available) ----------

  async getJournalEntriesByUid(uid: string, { limit = 50, offset = 0 } = {}) {
    try {
      const legacyId = await this.getLegacyIdForUid(uid);
      if (legacyId === null) return [];
      const rows = await db.select().from(journalEntries)
        .where(eq(journalEntries.userId, legacyId))
        .orderBy(desc(journalEntries.createdAt))
        .limit(limit)
        .offset(offset);
      
      console.log(`📔 Retrieved ${rows.length} journal entries for uid ${uid} (legacy: ${legacyId})`);
      return rows;
    } catch (error) {
      console.error('Error getting journal entries by UID:', error);
      return [];
    }
  }

  async getMoodEntriesByUid(uid: string, { since }: { since?: Date } = {}) {
    try {
      const legacyId = await this.getLegacyIdForUid(uid);
      if (legacyId === null) return [];
      const conds = [eq(moodEntries.userId, legacyId)];
      if (since) conds.push(sql`${moodEntries.createdAt} >= ${since}`);
      
      const rows = await db.select().from(moodEntries)
        .where(and(...conds))
        .orderBy(desc(moodEntries.createdAt));
      
      console.log(`🎭 Retrieved ${rows.length} mood entries for uid ${uid} (legacy: ${legacyId})`);
      return rows;
    } catch (error) {
      console.error('Error getting mood entries by UID:', error);
      return [];
    }
  }

  async getUserByUid(uid: string) {
    try {
      const legacyId = await this.getLegacyIdForUid(uid);
      if (legacyId === null) return null;
      const user = await db.select().from(users)
        .where(eq(users.id, legacyId))
        .limit(1);
      
      return user[0] || null;
    } catch (error) {
      console.error('Error getting user by UID:', error);
      return null;
    }
  }

  // ---------- WRITES (create with UID context) ----------

  async addJournalEntry(uid: string, data: any) {
    try {
      console.log('🔗 Testing database connection...');
      
      const legacyId = await this.getLegacyIdForUid(uid);
      console.log('✅ Legacy ID generated:', legacyId);
      
      if (legacyId === null) throw new Error('Could not generate legacy ID');
      
      const entryData = {
        userId: legacyId,
        title: data.title || null,
        content: data.content,
        mood: data.mood || null,
        moodIntensity: data.moodIntensity || null,
        tags: data.tags || [],
        isPrivate: data.isPrivate !== false
      };
      
      console.log('📝 Inserting data:', entryData);
      
      const [entry] = await db.insert(journalEntries).values(entryData).returning();
      console.log(`📔 Created journal entry for uid ${uid} (legacy: ${legacyId})`);
      return entry;
    } catch (error) {
      console.error('❌ Database error details:', error);
      console.error('❌ Error message:', error?.message || 'Unknown error');
      console.error('❌ Error stack:', error?.stack || 'No stack trace');
      throw error;
    }
  }

  async addMoodEntry(uid: string, data: any) {
    try {
      const legacyId = await this.getLegacyIdForUid(uid);
      if (legacyId === null) throw new Error('Could not generate legacy ID');
      const moodData = {
        userId: legacyId,
        mood: data.mood,
        intensity: data.intensity || 5,
        triggers: data.triggers || [],
        notes: data.notes || '',
        date: data.date ? new Date(data.date) : new Date(),
        createdAt: new Date()
      };
      
      const [entry] = await db.insert(moodEntries).values(moodData).returning();
      console.log(`🎭 Created mood entry for uid ${uid} (legacy: ${legacyId})`);
      return entry;
    } catch (error) {
      console.error('Error adding mood entry:', error);
      throw error;
    }
  }

  // ---------- ANALYTICS (UID-based aggregations) ----------

  async createMoodEntryByUid(uid: string, data: any) {
    try {
      const legacyId = await this.getLegacyIdForUid(uid);
      if (legacyId === null) throw new Error('Could not generate legacy ID');
      const moodData = {
        userId: legacyId,
        mood: data.mood,
        intensity: data.intensity || 5,
        triggers: data.triggers || [],
        notes: data.notes || '',
        date: data.date ? new Date(data.date) : new Date(),
        createdAt: new Date()
      };
      
      const [entry] = await db.insert(moodEntries).values(moodData).returning();
      console.log(`🎭 Created mood entry for uid ${uid} (legacy: ${legacyId})`);
      return entry;
    } catch (error) {
      console.error('Error creating mood entry:', error);
      throw error;
    }
  }

  async getDashboardStatsForUid(uid: string) {
    try {
      const legacyId = await this.getLegacyIdForUid(uid);
      if (legacyId === null) throw new Error('Could not generate legacy ID');
      
      // Count journal entries
      const journalCount = await db.select({ count: sql<number>`count(*)` })
        .from(journalEntries)
        .where(eq(journalEntries.userId, legacyId));

      // Count mood entries  
      const moodCount = await db.select({ count: sql<number>`count(*)` })
        .from(moodEntries)
        .where(eq(moodEntries.userId, legacyId));

      // Calculate streak (simplified)
      const recentJournals = await this.getJournalEntriesByUid(uid, { limit: 30 });
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const hasEntry = recentJournals.some((entry: any) => {
          const entryDate = new Date(entry.createdAt!);
          return entryDate.toDateString() === checkDate.toDateString();
        });
        if (hasEntry) {
          streak++;
        } else {
          break;
        }
      }

      return {
        currentStreak: streak,
        streakChange: null,
        aiConversations: 0,
        conversationsChange: null,
        journalEntries: journalCount[0]?.count || 0,
        journalChange: null,
        mindfulMinutes: 0,
        mindfulChange: null,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting dashboard stats for UID:', error);
      return {
        currentStreak: 0,
        streakChange: null,
        aiConversations: 0,
        conversationsChange: null,
        journalEntries: 0,
        journalChange: null,
        mindfulMinutes: 0,
        mindfulChange: null,
        lastUpdated: new Date().toISOString()
      };
    }
  }
}

// Shared instance
export const uidStore = new UidFirstStore(true);
