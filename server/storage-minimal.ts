// MINIMAL STORAGE IMPLEMENTATION - MEMORY SYSTEM FIX
// This provides only the essential semantic memory methods needed for chat functionality

import { db } from './db.js';
import { 
  semanticMemories, memoryConnections, 
  type SemanticMemory, type MemoryConnection,
  type InsertSemanticMemory, type InsertMemoryConnection
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
}

export const storage = new MinimalStorage();