// CONVERSATION CONTINUITY SERVICE - Manages session tracking and context preservation
// Ensures therapeutic conversations maintain context across sessions

import { db } from '../db.js';
import { conversationSessions, conversationThreads } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { 
  IConversationContinuityService, 
  ConversationSession, 
  ConversationThread 
} from './types.js';

export class ConversationContinuityService implements IConversationContinuityService {

  /**
   * Create a new conversation session
   */
  async createSession(userId: number, initialContext?: any): Promise<ConversationSession> {
    console.log(`🔄 Creating new conversation session for user ${userId}`);
    
    try {
      const sessionData = {
        userId,
        sessionKey: nanoid(),
        title: initialContext?.title || "New Therapeutic Session",
        keyTopics: initialContext?.topics || [],
        emotionalTone: initialContext?.emotionalState || "neutral",
        unresolvedThreads: {},
        contextCarryover: initialContext || {},
        messageCount: 0,
        isActive: true,
        lastActivity: new Date(),
        createdAt: new Date()
      };

      const [session] = await db.insert(conversationSessions).values(sessionData).returning();
      console.log(`✅ Created session ${session?.sessionKey} for user ${userId}`);
      return session!;

    } catch (error) {
      console.error('Error creating conversation session:', error);
      throw error;
    }
  }

  /**
   * Get the active session for a user
   */
  async getActiveSession(userId: number): Promise<ConversationSession | null> {
    try {
      const [session] = await db.select()
        .from(conversationSessions)
        .where(and(
          eq(conversationSessions.userId, userId),
          eq(conversationSessions.isActive, true)
        ))
        .orderBy(desc(conversationSessions.lastActivity))
        .limit(1);

      return session || null;
    } catch (error) {
      console.error('Error getting active session:', error);
      return null;
    }
  }

  /**
   * Update a conversation session
   */
  async updateSession(sessionId: number, updates: Partial<ConversationSession>): Promise<ConversationSession> {
    try {
      const updateData = {
        ...updates,
        lastActivity: new Date()
      };

      const [updatedSession] = await db
        .update(conversationSessions)
        .set(updateData)
        .where(eq(conversationSessions.id, sessionId))
        .returning();

      return updatedSession!;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  /**
   * Close a conversation session
   */
  async closeSession(sessionId: number): Promise<void> {
    console.log(`🔄 Closing conversation session ${sessionId}`);
    
    try {
      await db
        .update(conversationSessions)
        .set({ 
          isActive: false,
          lastActivity: new Date()
        })
        .where(eq(conversationSessions.id, sessionId));

      console.log(`✅ Closed session ${sessionId}`);
    } catch (error) {
      console.error('Error closing session:', error);
      throw error;
    }
  }

  /**
   * Load conversation context with fallback mechanisms
   */
  async loadConversationContext(userId: number, sessionId?: number): Promise<any> {
    console.log(`🔄 Loading conversation context for user ${userId}`);
    
    try {
      let session: ConversationSession | null = null;

      // Try to get specific session or active session
      if (sessionId) {
        const [specificSession] = await db.select()
          .from(conversationSessions)
          .where(eq(conversationSessions.id, sessionId));
        session = specificSession || null;
      } else {
        session = await this.getActiveSession(userId);
      }

      if (!session) {
        // Create new session if none exists
        session = await this.createSession(userId);
      }

      // Get active threads for this session
      const activeThreads = await this.getActiveThreads(session.id);

      // Build comprehensive context
      const context = {
        session,
        activeThreads,
        keyTopics: session.keyTopics,
        emotionalTone: session.emotionalTone,
        unresolvedThreads: session.unresolvedThreads,
        previousContext: session.contextCarryover,
        sessionStats: {
          messageCount: session.messageCount,
          sessionDuration: this.calculateSessionDuration(session),
          activeThreadCount: activeThreads.length
        }
      };

      console.log(`📋 Loaded context for session ${session.sessionKey}: ${activeThreads.length} threads, ${session.messageCount} messages`);
      return context;

    } catch (error) {
      console.error('Error loading conversation context:', error);
      throw error;
    }
  }

  /**
   * Update conversation context
   */
  async updateConversationContext(sessionId: number, context: any): Promise<void> {
    try {
      await this.updateSession(sessionId, {
        contextCarryover: context,
        keyTopics: context.topics || [],
        emotionalTone: context.emotionalState || "neutral"
      });
    } catch (error) {
      console.error('Error updating conversation context:', error);
      throw error;
    }
  }

  /**
   * Get session history for a user
   */
  async getSessionHistory(userId: number, limit: number = 10): Promise<ConversationSession[]> {
    try {
      const sessions = await db.select()
        .from(conversationSessions)
        .where(eq(conversationSessions.userId, userId))
        .orderBy(desc(conversationSessions.lastActivity))
        .limit(limit);

      return sessions;
    } catch (error) {
      console.error('Error getting session history:', error);
      return [];
    }
  }

  /**
   * Create a conversation thread
   */
  async createThread(sessionId: number, threadData: Partial<ConversationThread>): Promise<ConversationThread> {
    console.log(`🧵 Creating conversation thread for session ${sessionId}`);
    
    try {
      const thread = {
        sessionId,
        threadType: threadData.threadType || 'main',
        topic: threadData.topic || 'General Discussion',
        emotionalIntensity: threadData.emotionalIntensity || 5,
        isResolved: false,
        keyMessages: threadData.keyMessages || [],
        insights: threadData.insights || [],
        createdAt: new Date()
      };

      const [createdThread] = await db.insert(conversationThreads).values(thread).returning();
      console.log(`✅ Created thread ${createdThread?.id} for session ${sessionId}`);
      return createdThread!;

    } catch (error) {
      console.error('Error creating conversation thread:', error);
      throw error;
    }
  }

  /**
   * Get active threads for a session
   */
  async getActiveThreads(sessionId: number): Promise<ConversationThread[]> {
    try {
      const threads = await db.select()
        .from(conversationThreads)
        .where(and(
          eq(conversationThreads.sessionId, sessionId),
          eq(conversationThreads.isResolved, false)
        ))
        .orderBy(desc(conversationThreads.createdAt));

      return threads;
    } catch (error) {
      console.error('Error getting active threads:', error);
      return [];
    }
  }

  /**
   * Resolve a conversation thread
   */
  async resolveThread(threadId: number, resolution?: string): Promise<void> {
    console.log(`🧵 Resolving conversation thread ${threadId}`);
    
    try {
      const updateData: any = {
        isResolved: true
      };

      if (resolution) {
        // Get current thread to append resolution
        const [currentThread] = await db.select()
          .from(conversationThreads)
          .where(eq(conversationThreads.id, threadId));

        if (currentThread) {
          updateData.insights = [...currentThread.insights, resolution];
        }
      }

      await db
        .update(conversationThreads)
        .set(updateData)
        .where(eq(conversationThreads.id, threadId));

      console.log(`✅ Resolved thread ${threadId}`);
    } catch (error) {
      console.error('Error resolving thread:', error);
      throw error;
    }
  }

  /**
   * Calculate session duration
   */
  private calculateSessionDuration(session: ConversationSession): number {
    const now = new Date();
    const start = new Date(session.createdAt);
    return Math.floor((now.getTime() - start.getTime()) / 1000 / 60); // Duration in minutes
  }

  /**
   * Archive inactive sessions (cleanup operation)
   */
  async archiveInactiveSessions(userId: number, inactiveDays: number = 7): Promise<number> {
    console.log(`🗂️ Archiving inactive sessions for user ${userId}`);
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

      const sessions = await db.select()
        .from(conversationSessions)
        .where(and(
          eq(conversationSessions.userId, userId),
          eq(conversationSessions.isActive, true)
        ));

      const inactiveSessions = sessions.filter(
        session => new Date(session.lastActivity) < cutoffDate
      );

      for (const session of inactiveSessions) {
        await this.closeSession(session.id);
      }

      console.log(`📦 Archived ${inactiveSessions.length} inactive sessions`);
      return inactiveSessions.length;

    } catch (error) {
      console.error('Error archiving inactive sessions:', error);
      return 0;
    }
  }
}