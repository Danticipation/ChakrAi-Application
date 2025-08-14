// MINIMAL STORAGE IMPLEMENTATION - MEMORY SYSTEM FIX
// This provides only the essential semantic memory methods needed for chat functionality

import { db } from './db.js';
import { 
  semanticMemories, memoryConnections, users, journalEntries, messages, moodEntries, memoryInsights,
  learningMilestones, progressMetrics, adaptiveLearningInsights, wellnessJourneyEvents,
  type SemanticMemory, type MemoryConnection, type LearningMilestone, type ProgressMetric,
  type AdaptiveLearningInsight, type WellnessJourneyEvent,
  type InsertSemanticMemory, type InsertMemoryConnection, type InsertLearningMilestone,
  type InsertProgressMetric, type InsertAdaptiveLearningInsight, type InsertWellnessJourneyEvent
} from '@shared/schema';
import { eq, desc, and, or, ilike, sql } from 'drizzle-orm';

export interface IStorage {
  // Essential semantic memory methods
  getRecentSemanticMemories(userId: number, limit?: number): Promise<any[]>;
  createSemanticMemory(data: any): Promise<any>;
  searchSemanticMemories(userId: number, searchTerms: string[], limit?: number): Promise<any[]>;
  getMemoryConnections(memoryId: number): Promise<any[]>;
  createMemoryConnection(data: any): Promise<any>;
  updateMemoryAccessCount(memoryId: number): Promise<void>;
  getAllUserMemoryConnections(userId: number): Promise<any[]>;
  
  // Basic conversation continuity methods
  getConversationSessionHistory(userId: number, limit?: number): Promise<any[]>;
  getUnaddressedContinuity(userId: number): Promise<any[]>;
  getActiveConversationThreads(userId: number): Promise<any[]>;
  markContinuityAddressed(continuityId: number): Promise<void>;
  getActiveConversationSession(userId: number): Promise<any>;
  createConversationSession(data: any): Promise<any>;
  updateConversationSession(id: number, data: any): Promise<any>;
  createConversationThread(data: any): Promise<any>;
  updateConversationThread(id: number, data: any): Promise<any>;
  createSessionContinuity(data: any): Promise<any>;
  
  // Essential user management methods
  getUserByDeviceFingerprint(deviceFingerprint: string): Promise<any>;
  updateUserLastActive(userId: number): Promise<void>;
  createUser(data: any): Promise<any>;
  createJournalEntry(data: any): Promise<any>;
  getJournalEntries(userId: number, limit?: number): Promise<any[]>;
  getJournalEntry(entryId: number): Promise<any>;
  deleteJournalEntry(entryId: number): Promise<void>;
  getUserMessages(userId: number, limit?: number): Promise<any[]>;
  getUserMemories(userId: number): Promise<any[]>;
  getUserFacts(userId: number): Promise<any[]>;
  getMoodEntries(userId: number): Promise<any[]>;
  getUserMoodEntries(userId: number, limit?: number): Promise<any[]>;
  getMemoryInsights(userId: number): Promise<any[]>;
  createMessage(data: any): Promise<any>;
  
  // Adaptive learning methods
  getProgressOverview(userId: number): Promise<any>;
  getLearningMilestones(userId: number): Promise<LearningMilestone[]>;
  createLearningMilestone(data: InsertLearningMilestone): Promise<LearningMilestone>;
  updateLearningMilestone(id: number, data: Partial<LearningMilestone>): Promise<LearningMilestone>;
  markMilestoneCompleted(id: number): Promise<LearningMilestone>;
  getProgressMetrics(userId: number, timeframe?: string, metricType?: string): Promise<ProgressMetric[]>;
  createProgressMetric(data: InsertProgressMetric): Promise<ProgressMetric>;
  getAdaptiveLearningInsights(userId: number, activeFilter?: boolean): Promise<AdaptiveLearningInsight[]>;
  markInsightViewed(id: number): Promise<AdaptiveLearningInsight>;
  updateInsightFeedback(id: number, feedback: string): Promise<AdaptiveLearningInsight>;
  getWellnessJourneyEvents(userId: number): Promise<WellnessJourneyEvent[]>;
  createWellnessJourneyEvent(data: InsertWellnessJourneyEvent): Promise<WellnessJourneyEvent>;
  markCelebrationShown(id: number): Promise<WellnessJourneyEvent>;
  calculateLearningProgress(userId: number): Promise<void>;
  generateProgressInsights(userId: number): Promise<void>;
}

export class MinimalStorage implements IStorage {
  
  // CRITICAL SEMANTIC MEMORY METHODS IMPLEMENTATION
  async getRecentSemanticMemories(userId: number, limit: number = 10): Promise<any[]> {
    try {
      const memories = await db.select()
        .from(semanticMemories)
        .where(eq(semanticMemories.userId, userId))
        .orderBy(desc(semanticMemories.createdAt))
        .limit(limit);
      
      console.log(`📚 Retrieved ${memories.length} semantic memories for user ${userId}`);
      return memories;
    } catch (error) {
      console.error('Error retrieving semantic memories:', error);
      return [];
    }
  }

  async createSemanticMemory(data: any): Promise<any> {
    try {
      const memoryData = {
        userId: data.userId,
        memoryType: data.memoryType || 'conversation',
        content: data.content,
        semanticTags: data.semanticTags || [],
        emotionalContext: data.emotionalContext,
        temporalContext: data.temporalContext,
        relatedTopics: data.relatedTopics || [],
        confidence: data.confidence || '0.85',
        accessCount: 0,
        sourceConversationId: data.sourceConversationId,
        isActiveMemory: true,
        createdAt: new Date()
      };
      
      const [memory] = await db.insert(semanticMemories).values(memoryData).returning();
      console.log(`💾 Created semantic memory: ${memory?.id}`);
      return memory;
    } catch (error) {
      console.error('Error creating semantic memory:', error);
      throw error;
    }
  }

  async searchSemanticMemories(userId: number, searchTerms: string[], limit: number = 5): Promise<any[]> {
    try {
      if (!searchTerms || searchTerms.length === 0) {
        return [];
      }
      
      const searchConditions = searchTerms.map(term => 
        or(
          ilike(semanticMemories.content, `%${term}%`),
          ilike(semanticMemories.emotionalContext, `%${term}%`)
        )
      );
      
      const memories = await db.select()
        .from(semanticMemories)
        .where(and(
          eq(semanticMemories.userId, userId),
          eq(semanticMemories.isActiveMemory, true),
          or(...searchConditions)
        ))
        .orderBy(desc(semanticMemories.lastAccessedAt), desc(semanticMemories.createdAt))
        .limit(limit);
      
      console.log(`🔍 Found ${memories.length} semantic memories for search: ${searchTerms.join(', ')}`);
      return memories;
    } catch (error) {
      console.error('Error searching semantic memories:', error);
      return [];
    }
  }

  async getMemoryConnections(memoryId: number): Promise<any[]> {
    try {
      const connections = await db.select()
        .from(memoryConnections)
        .where(or(
          eq(memoryConnections.fromMemoryId, memoryId),
          eq(memoryConnections.toMemoryId, memoryId)
        ));
      
      return connections;
    } catch (error) {
      console.error('Error getting memory connections:', error);
      return [];
    }
  }

  async createMemoryConnection(data: any): Promise<any> {
    try {
      const connectionData = {
        userId: data.userId,
        fromMemoryId: data.fromMemoryId,
        toMemoryId: data.toMemoryId,
        connectionType: data.connectionType || 'relates_to',
        strength: data.strength || '0.50',
        automaticConnection: data.automaticConnection !== false,
        createdAt: new Date()
      };
      
      const [connection] = await db.insert(memoryConnections).values(connectionData).returning();
      return connection;
    } catch (error) {
      console.error('Error creating memory connection:', error);
      throw error;
    }
  }

  async updateMemoryAccessCount(memoryId: number): Promise<void> {
    try {
      await db.update(semanticMemories)
        .set({
          accessCount: sql`${semanticMemories.accessCount} + 1`,
          lastAccessedAt: new Date()
        })
        .where(eq(semanticMemories.id, memoryId));
    } catch (error) {
      console.error('Error updating memory access count:', error);
    }
  }

  async getAllUserMemoryConnections(userId: number): Promise<any[]> {
    try {
      const connections = await db.select()
        .from(memoryConnections)
        .where(eq(memoryConnections.userId, userId));
      
      return connections;
    } catch (error) {
      console.error('Error getting user memory connections:', error);
      return [];
    }
  }

  // Basic conversation continuity implementations
  async getConversationSessionHistory(userId: number, limit: number = 3): Promise<any[]> {
    return [];
  }

  async getUnaddressedContinuity(userId: number): Promise<any[]> {
    return [];
  }

  async getActiveConversationThreads(userId: number): Promise<any[]> {
    return [];
  }

  async markContinuityAddressed(continuityId: number): Promise<void> {
    // Placeholder
  }

  async getActiveConversationSession(userId: number): Promise<any> {
    return null;
  }

  async createConversationSession(data: any): Promise<any> {
    return {
      id: Date.now(),
      userId: data.userId,
      sessionKey: data.sessionKey,
      title: data.title || "New Conversation",
      keyTopics: data.keyTopics || [],
      emotionalTone: data.emotionalTone || "neutral",
      unresolvedThreads: data.unresolvedThreads || {},
      contextCarryover: data.contextCarryover || {},
      messageCount: data.messageCount || 0,
      isActive: true,
      lastActivity: new Date(),
      createdAt: new Date()
    };
  }

  async updateConversationSession(id: number, data: any): Promise<any> {
    return { ...data, id, updatedAt: new Date() };
  }

  async createConversationThread(data: any): Promise<any> {
    return { ...data, id: Date.now(), createdAt: new Date() };
  }

  async updateConversationThread(id: number, data: any): Promise<any> {
    return { ...data, id, updatedAt: new Date() };
  }

  async createSessionContinuity(data: any): Promise<any> {
    return { ...data, id: Date.now(), createdAt: new Date() };
  }

  // ESSENTIAL USER MANAGEMENT METHODS
  async getUserByDeviceFingerprint(deviceFingerprint: string): Promise<any> {
    try {
      const user = await db.select()
        .from(users)
        .where(eq(users.deviceFingerprint, deviceFingerprint))
        .limit(1);
      
      return user[0] || null;
    } catch (error) {
      console.error('Error getting user by device fingerprint:', error);
      return null;
    }
  }

  async updateUserLastActive(userId: number): Promise<void> {
    try {
      await db.update(users)
        .set({ lastActiveAt: new Date() })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating user last active:', error);
    }
  }

  async createUser(data: any): Promise<any> {
    try {
      const userData = {
        username: data.username,
        sessionId: data.sessionId,
        deviceFingerprint: data.deviceFingerprint,
        isAnonymous: data.isAnonymous || true,
        createdAt: new Date(),
        lastActiveAt: new Date()
      };
      
      const [user] = await db.insert(users).values(userData).returning();
      console.log(`👤 Created user: ${user?.id}`);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async createJournalEntry(data: any): Promise<any> {
    try {
      const entryData = {
        userId: data.userId,
        title: data.title,
        content: data.content,
        mood: data.mood,
        moodIntensity: data.moodIntensity,
        tags: data.tags || [],
        isPrivate: data.isPrivate !== false, // Default to private
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const [entry] = await db.insert(journalEntries).values(entryData).returning();
      console.log(`📔 Created journal entry: ${entry?.id}`);
      return entry;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  }

  async getJournalEntries(userId: number, limit: number = 50): Promise<any[]> {
    try {
      const entries = await db.select()
        .from(journalEntries)
        .where(eq(journalEntries.userId, userId))
        .orderBy(desc(journalEntries.createdAt))
        .limit(limit);
      
      console.log(`📔 Retrieved ${entries.length} journal entries for user ${userId}`);
      return entries;
    } catch (error) {
      console.error('Error getting journal entries:', error);
      return [];
    }
  }

  async getJournalEntry(entryId: number): Promise<any> {
    try {
      const result = await db.select()
        .from(journalEntries)
        .where(eq(journalEntries.id, entryId))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error getting journal entry:', error);
      return null;
    }
  }

  async deleteJournalEntry(entryId: number): Promise<void> {
    try {
      await db.delete(journalEntries)
        .where(eq(journalEntries.id, entryId));
      
      console.log(`✅ Deleted journal entry: ${entryId}`);
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw error;
    }
  }

  async getUserMessages(userId: number, limit: number = 50): Promise<any[]> {
    try {
      const userMessages = await db.select()
        .from(messages)
        .where(eq(messages.userId, userId))
        .orderBy(desc(messages.createdAt))
        .limit(limit);
      
      return userMessages;
    } catch (error) {
      console.error('Error getting user messages:', error);
      return [];
    }
  }

  async getUserMemories(userId: number): Promise<any[]> {
    try {
      const memories = await db.select()
        .from(semanticMemories)
        .where(and(
          eq(semanticMemories.userId, userId),
          eq(semanticMemories.isActiveMemory, true)
        ))
        .orderBy(desc(semanticMemories.createdAt));
      
      return memories;
    } catch (error) {
      console.error('Error getting user memories:', error);
      return [];
    }
  }

  async getUserFacts(userId: number): Promise<any[]> {
    try {
      // Return semantic memories as facts for now
      const userFacts = await db.select()
        .from(semanticMemories)
        .where(and(
          eq(semanticMemories.userId, userId),
          eq(semanticMemories.memoryType, 'fact')
        ))
        .orderBy(desc(semanticMemories.createdAt));
      
      return userFacts;
    } catch (error) {
      console.error('Error getting user facts:', error);
      return [];
    }
  }

  async getUserMoodEntries(userId: number, limit: number = 50): Promise<any[]> {
    try {
      const moods = await db.select()
        .from(moodEntries)
        .where(eq(moodEntries.userId, userId))
        .orderBy(desc(moodEntries.createdAt))
        .limit(limit);
      
      return moods;
    } catch (error) {
      console.error('Error getting user mood entries:', error);
      return [];
    }
  }

  async getMoodEntries(userId: number): Promise<any[]> {
    try {
      const moods = await db.select()
        .from(moodEntries)
        .where(eq(moodEntries.userId, userId))
        .orderBy(desc(moodEntries.createdAt));
      
      return moods;
    } catch (error) {
      console.error('Error getting mood entries:', error);
      return [];
    }
  }

  async getMemoryInsights(userId: number): Promise<any[]> {
    try {
      const insights = await db.select()
        .from(memoryInsights)
        .where(eq(memoryInsights.userId, userId))
        .orderBy(desc(memoryInsights.createdAt));
      
      return insights;
    } catch (error) {
      console.error('Error getting memory insights:', error);
      return [];
    }
  }

  async createMessage(data: any): Promise<any> {
    try {
      const messageData = {
        userId: data.userId,
        text: data.content || '', // Database expects 'text' field
        content: data.content || '',
        isBot: data.isBot || false,
        timestamp: new Date(),
        metadata: data.metadata || {}
      };
      
      console.log('💬 Saving message for user:', data.userId);
      const [message] = await db.insert(messages).values(messageData).returning();
      console.log('✅ Message saved successfully:', message.id);
      return message;
    } catch (error) {
      console.error('❌ Error saving message:', error);
      throw error;
    }
  }

  // ============== ADAPTIVE LEARNING METHODS ==============

  async getProgressOverview(userId: number): Promise<any> {
    try {
      // Get milestone counts by category
      const milestones = await db.select()
        .from(learningMilestones)
        .where(eq(learningMilestones.userId, userId));

      const completed = milestones.filter(m => m.isCompleted).length;
      const total = milestones.length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      // Get recent progress metrics
      const recentMetrics = await db.select()
        .from(progressMetrics)
        .where(eq(progressMetrics.userId, userId))
        .orderBy(desc(progressMetrics.date))
        .limit(30);

      // Calculate streak
      const journalEntries = await db.select()
        .from(journalEntries)
        .where(eq(journalEntries.userId, userId))
        .orderBy(desc(journalEntries.createdAt))
        .limit(30);

      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const hasEntry = journalEntries.some(entry => {
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
        totalMilestones: total,
        completedMilestones: completed,
        completionRate,
        currentStreak: streak,
        recentMetrics: recentMetrics.slice(0, 7),
        lastActivity: new Date()
      };
    } catch (error) {
      console.error('Error getting progress overview:', error);
      return {
        totalMilestones: 0,
        completedMilestones: 0,
        completionRate: 0,
        currentStreak: 0,
        recentMetrics: [],
        lastActivity: new Date()
      };
    }
  }

  async getLearningMilestones(userId: number): Promise<LearningMilestone[]> {
    try {
      const milestones = await db.select()
        .from(learningMilestones)
        .where(eq(learningMilestones.userId, userId))
        .orderBy(desc(learningMilestones.priority), desc(learningMilestones.createdAt));
      
      return milestones;
    } catch (error) {
      console.error('Error getting learning milestones:', error);
      return [];
    }
  }

  async createLearningMilestone(data: InsertLearningMilestone): Promise<LearningMilestone> {
    try {
      const [milestone] = await db.insert(learningMilestones).values(data).returning();
      return milestone;
    } catch (error) {
      console.error('Error creating learning milestone:', error);
      throw error;
    }
  }

  async updateLearningMilestone(id: number, data: Partial<LearningMilestone>): Promise<LearningMilestone> {
    try {
      const [milestone] = await db
        .update(learningMilestones)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(learningMilestones.id, id))
        .returning();
      return milestone;
    } catch (error) {
      console.error('Error updating learning milestone:', error);
      throw error;
    }
  }

  async markMilestoneCompleted(id: number): Promise<LearningMilestone> {
    try {
      const [milestone] = await db
        .update(learningMilestones)
        .set({ 
          isCompleted: true, 
          completedAt: new Date(),
          celebrationShown: false,
          updatedAt: new Date()
        })
        .where(eq(learningMilestones.id, id))
        .returning();
      return milestone;
    } catch (error) {
      console.error('Error marking milestone completed:', error);
      throw error;
    }
  }

  async getProgressMetrics(userId: number, timeframe?: string, metricType?: string): Promise<ProgressMetric[]> {
    try {
      let query = db.select().from(progressMetrics).where(eq(progressMetrics.userId, userId));
      
      if (metricType) {
        query = query.where(eq(progressMetrics.metricType, metricType));
      }
      
      // Apply timeframe filter
      if (timeframe) {
        const now = new Date();
        let startDate = new Date();
        
        switch (timeframe) {
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            startDate.setMonth(now.getMonth() - 3);
            break;
          default:
            startDate.setDate(now.getDate() - 30);
        }
        
        query = query.where(sql`${progressMetrics.date} >= ${startDate}`);
      }
      
      const metrics = await query.orderBy(desc(progressMetrics.date));
      return metrics;
    } catch (error) {
      console.error('Error getting progress metrics:', error);
      return [];
    }
  }

  async createProgressMetric(data: InsertProgressMetric): Promise<ProgressMetric> {
    try {
      const [metric] = await db.insert(progressMetrics).values(data).returning();
      return metric;
    } catch (error) {
      console.error('Error creating progress metric:', error);
      throw error;
    }
  }

  async getAdaptiveLearningInsights(userId: number, activeFilter?: boolean): Promise<AdaptiveLearningInsight[]> {
    try {
      let query = db.select().from(adaptiveLearningInsights).where(eq(adaptiveLearningInsights.userId, userId));
      
      if (activeFilter !== undefined) {
        query = query.where(eq(adaptiveLearningInsights.isActive, activeFilter));
      }
      
      const insights = await query.orderBy(desc(adaptiveLearningInsights.createdAt));
      return insights;
    } catch (error) {
      console.error('Error getting adaptive learning insights:', error);
      return [];
    }
  }

  async markInsightViewed(id: number): Promise<AdaptiveLearningInsight> {
    try {
      const [insight] = await db
        .update(adaptiveLearningInsights)
        .set({ 
          viewedAt: new Date(),
          viewCount: sql`${adaptiveLearningInsights.viewCount} + 1`
        })
        .where(eq(adaptiveLearningInsights.id, id))
        .returning();
      return insight;
    } catch (error) {
      console.error('Error marking insight viewed:', error);
      throw error;
    }
  }

  async updateInsightFeedback(id: number, feedback: string): Promise<AdaptiveLearningInsight> {
    try {
      const [insight] = await db
        .update(adaptiveLearningInsights)
        .set({ userFeedback: feedback })
        .where(eq(adaptiveLearningInsights.id, id))
        .returning();
      return insight;
    } catch (error) {
      console.error('Error updating insight feedback:', error);
      throw error;
    }
  }

  async getWellnessJourneyEvents(userId: number): Promise<WellnessJourneyEvent[]> {
    try {
      const events = await db.select()
        .from(wellnessJourneyEvents)
        .where(eq(wellnessJourneyEvents.userId, userId))
        .orderBy(desc(wellnessJourneyEvents.createdAt));
      
      return events;
    } catch (error) {
      console.error('Error getting wellness journey events:', error);
      return [];
    }
  }

  async createWellnessJourneyEvent(data: InsertWellnessJourneyEvent): Promise<WellnessJourneyEvent> {
    try {
      const [event] = await db.insert(wellnessJourneyEvents).values(data).returning();
      return event;
    } catch (error) {
      console.error('Error creating wellness journey event:', error);
      throw error;
    }
  }

  async markCelebrationShown(id: number): Promise<WellnessJourneyEvent> {
    try {
      const [event] = await db
        .update(wellnessJourneyEvents)
        .set({ celebrationShown: true })
        .where(eq(wellnessJourneyEvents.id, id))
        .returning();
      return event;
    } catch (error) {
      console.error('Error marking celebration shown:', error);
      throw error;
    }
  }

  async calculateLearningProgress(userId: number): Promise<void> {
    try {
      // Calculate progress metrics for the user
      const journalCount = await db.select({ count: sql<number>`count(*)` })
        .from(journalEntries)
        .where(eq(journalEntries.userId, userId));

      const chatCount = await db.select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(and(eq(messages.userId, userId), eq(messages.isBot, false)));

      const moodCount = await db.select({ count: sql<number>`count(*)` })
        .from(moodEntries)
        .where(eq(moodEntries.userId, userId));

      // Create progress metrics
      const today = new Date();
      const metrics = [
        {
          userId,
          metricType: 'journal_entries',
          value: journalCount[0]?.count || 0,
          date: today
        },
        {
          userId,
          metricType: 'chat_sessions',
          value: chatCount[0]?.count || 0,
          date: today
        },
        {
          userId,
          metricType: 'mood_logs',
          value: moodCount[0]?.count || 0,
          date: today
        }
      ];

      // Insert metrics if they don't exist for today
      for (const metric of metrics) {
        const existing = await db.select()
          .from(progressMetrics)
          .where(and(
            eq(progressMetrics.userId, userId),
            eq(progressMetrics.metricType, metric.metricType),
            sql`DATE(${progressMetrics.date}) = DATE(${today})`
          ))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(progressMetrics).values(metric);
        }
      }

      console.log(`✅ Calculated learning progress for user ${userId}`);
    } catch (error) {
      console.error('Error calculating learning progress:', error);
    }
  }

  async generateProgressInsights(userId: number): Promise<void> {
    try {
      // Get recent user data for insight generation
      const recentJournals = await db.select()
        .from(journalEntries)
        .where(eq(journalEntries.userId, userId))
        .orderBy(desc(journalEntries.createdAt))
        .limit(10);

      const recentMoods = await db.select()
        .from(moodEntries)
        .where(eq(moodEntries.userId, userId))
        .orderBy(desc(moodEntries.createdAt))
        .limit(10);

      // Generate insights based on patterns
      const insights = [];

      // Journal consistency insight
      if (recentJournals.length >= 3) {
        const daysBetween = recentJournals.length > 1 ? 
          Math.abs(new Date(recentJournals[0].createdAt!).getTime() - new Date(recentJournals[recentJournals.length - 1].createdAt!).getTime()) / (1000 * 60 * 60 * 24) : 0;
        
        if (daysBetween <= 7) {
          insights.push({
            userId,
            insightType: 'behavioral_pattern',
            title: 'Consistent Journaling',
            content: 'You\'ve been maintaining a regular journaling practice. This consistency helps build self-awareness and emotional regulation skills.',
            confidence: '0.85',
            actionSuggestions: ['Continue your daily journaling habit', 'Try exploring different journaling prompts'],
            isActive: true,
            therapeuticRelevance: 'high'
          });
        }
      }

      // Mood pattern insight
      if (recentMoods.length >= 5) {
        const avgMood = recentMoods.reduce((sum, mood) => sum + (mood.intensity || 5), 0) / recentMoods.length;
        
        if (avgMood > 7) {
          insights.push({
            userId,
            insightType: 'emotional_growth',
            title: 'Positive Mood Trend',
            content: 'Your recent mood entries show a positive trend. You\'re developing emotional resilience and finding effective coping strategies.',
            confidence: '0.80',
            actionSuggestions: ['Reflect on what\'s contributing to your positive mood', 'Consider sharing your strategies with others'],
            isActive: true,
            therapeuticRelevance: 'high'
          });
        }
      }

      // Save insights
      for (const insight of insights) {
        // Check if similar insight already exists
        const existing = await db.select()
          .from(adaptiveLearningInsights)
          .where(and(
            eq(adaptiveLearningInsights.userId, userId),
            eq(adaptiveLearningInsights.insightType, insight.insightType),
            eq(adaptiveLearningInsights.title, insight.title)
          ))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(adaptiveLearningInsights).values(insight);
        }
      }

      console.log(`✅ Generated ${insights.length} progress insights for user ${userId}`);
    } catch (error) {
      console.error('Error generating progress insights:', error);
    }
  }
}

export const storage = new MinimalStorage();