// MEMORY MANAGER - Central orchestrator for all memory operations
// Provides high-level memory management for therapeutic conversations

import { SemanticMemoryService } from './SemanticMemoryService.js';
import { ConversationContinuityService } from './ConversationContinuityService.js';
import { MemoryConnectionService } from './MemoryConnectionService.js';
import { MemoryRetrievalService } from './MemoryRetrievalService.js';
import { MemoryAnalyticsService } from './MemoryAnalyticsService.js';

import type {
  IMemoryManager,
  ISemanticMemoryService,
  IConversationContinuityService,
  IMemoryConnectionService,
  IMemoryRetrievalService,
  IMemoryAnalyticsService,
  MemoryContext,
  SemanticMemory,
  MemoryInsight,
  ConversationSession
} from './types.js';

export class MemoryManager implements IMemoryManager {
  public semanticMemory: ISemanticMemoryService;
  public conversationContinuity: IConversationContinuityService;
  public memoryConnection: IMemoryConnectionService;
  public memoryRetrieval: IMemoryRetrievalService;
  public memoryAnalytics: IMemoryAnalyticsService;

  constructor() {
    // Initialize all memory services
    this.semanticMemory = new SemanticMemoryService();
    this.conversationContinuity = new ConversationContinuityService();
    this.memoryConnection = new MemoryConnectionService();
    this.memoryRetrieval = new MemoryRetrievalService();
    this.memoryAnalytics = new MemoryAnalyticsService();
  }

  /**
   * Process a new message and update all memory systems
   * This is the main entry point for memory operations during conversations
   */
  async processMessage(userId: number, message: string, context?: any): Promise<{
    memories: SemanticMemory[];
    insights: MemoryInsight[];
    relevantHistory: SemanticMemory[];
    sessionUpdate: ConversationSession;
  }> {
    console.log(`🧠 Processing message for user ${userId} with memory system`);
    
    try {
      // 1. Get or create active session
      let session = await this.conversationContinuity.getActiveSession(userId);
      if (!session) {
        session = await this.conversationContinuity.createSession(userId, context);
      }

      // 2. Create memory context
      const memoryContext: MemoryContext = {
        userId,
        sessionId: session.sessionKey,
        emotionalState: context?.emotionalState,
        therapeuticGoals: context?.therapeuticGoals || [],
        currentTopics: context?.currentTopics || [],
        timeContext: new Date()
      };

      // 3. Extract and store semantic memories from the message
      const newMemories = await this.semanticMemory.extractAndStoreMemories(message, memoryContext);

      // 4. Get contextually relevant historical memories
      const relevantHistory = await this.memoryRetrieval.getConversationRelevantMemories(
        userId, 
        message, 
        10
      );

      // 5. Generate insights from the new context
      const insights = await this.memoryAnalytics.generateMemoryInsights(userId);

      // 6. Create connections between new and existing memories
      for (const memory of newMemories) {
        await this.memoryConnection.suggestConnections(memory.id);
      }

      // 7. Update session context
      const sessionUpdates = {
        messageCount: session.messageCount + 1,
        lastActivity: new Date(),
        keyTopics: [...new Set([...session.keyTopics, ...(context?.currentTopics || [])])],
        emotionalTone: context?.emotionalState || session.emotionalTone
      };

      const updatedSession = await this.conversationContinuity.updateSession(
        session.id, 
        sessionUpdates
      );

      console.log(`🧠 Memory processing complete: ${newMemories.length} new memories, ${relevantHistory.length} relevant memories`);

      return {
        memories: newMemories,
        insights: insights.slice(0, 3), // Most recent insights
        relevantHistory,
        sessionUpdate: updatedSession
      };

    } catch (error) {
      console.error('Error processing message in memory system:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive memory context for AI responses
   * Provides all relevant memory context for generating therapeutic responses
   */
  async getComprehensiveContext(userId: number, currentMessage?: string): Promise<{
    recentMemories: SemanticMemory[];
    relevantInsights: MemoryInsight[];
    sessionContext: ConversationSession | null;
    emotionalContext: any;
  }> {
    console.log(`🧠 Loading comprehensive memory context for user ${userId}`);

    try {
      // Get current session
      const sessionContext = await this.conversationContinuity.getActiveSession(userId);

      // Get recent memories (last 20)
      const recentMemories = await this.semanticMemory.getRecentMemories(userId, 20);

      // Get contextually relevant memories if we have a current message
      let contextualMemories: SemanticMemory[] = [];
      if (currentMessage) {
        contextualMemories = await this.memoryRetrieval.getConversationRelevantMemories(
          userId, 
          currentMessage, 
          15
        );
      }

      // Combine and deduplicate memories
      const allRelevantMemories = [...recentMemories, ...contextualMemories];
      const uniqueMemories = allRelevantMemories.filter((memory, index, self) => 
        self.findIndex(m => m.id === memory.id) === index
      );

      // Get relevant insights
      const relevantInsights = await this.memoryAnalytics.generateMemoryInsights(userId);

      // Analyze emotional context
      const emotionalMemories = await this.memoryRetrieval.getEmotionallyRelevantMemories(
        userId, 
        sessionContext?.emotionalTone || 'neutral', 
        10
      );

      const emotionalContext = {
        currentTone: sessionContext?.emotionalTone,
        recentEmotionalMemories: emotionalMemories,
        emotionalTrends: await this.memoryAnalytics.analyzeEmotionalJourney(userId)
      };

      console.log(`🧠 Context loaded: ${uniqueMemories.length} memories, ${relevantInsights.length} insights`);

      return {
        recentMemories: uniqueMemories,
        relevantInsights: relevantInsights.slice(0, 5),
        sessionContext,
        emotionalContext
      };

    } catch (error) {
      console.error('Error loading comprehensive context:', error);
      throw error;
    }
  }

  /**
   * Consolidate and optimize memories for better retrieval
   */
  async consolidateMemories(userId: number): Promise<void> {
    console.log(`🧠 Consolidating memories for user ${userId}`);
    
    try {
      // Find and merge similar memories
      const allMemories = await this.semanticMemory.getRecentMemories(userId, 1000);
      
      // Group similar memories by content similarity
      // This would use more sophisticated text similarity algorithms in production
      const groups: SemanticMemory[][] = [];
      
      for (const memory of allMemories) {
        let foundGroup = false;
        for (const group of groups) {
          if (this.areSimilarMemories(memory, group[0])) {
            group.push(memory);
            foundGroup = true;
            break;
          }
        }
        if (!foundGroup) {
          groups.push([memory]);
        }
      }

      // Merge groups with multiple similar memories
      for (const group of groups) {
        if (group.length > 1) {
          await this.mergeSimilarMemories(group);
        }
      }

      console.log(`🧠 Memory consolidation complete for user ${userId}`);
    } catch (error) {
      console.error('Error consolidating memories:', error);
    }
  }

  /**
   * Archive old conversation sessions
   */
  async archiveOldSessions(userId: number, olderThanDays: number = 30): Promise<void> {
    console.log(`🧠 Archiving sessions older than ${olderThanDays} days for user ${userId}`);
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const sessions = await this.conversationContinuity.getSessionHistory(userId, 1000);
      const oldSessions = sessions.filter(session => session.lastActivity < cutoffDate);

      for (const session of oldSessions) {
        await this.conversationContinuity.closeSession(session.id);
      }

      console.log(`🧠 Archived ${oldSessions.length} old sessions for user ${userId}`);
    } catch (error) {
      console.error('Error archiving old sessions:', error);
    }
  }

  /**
   * Optimize memory connections by removing weak connections and strengthening strong ones
   */
  async optimizeMemoryConnections(userId: number): Promise<void> {
    console.log(`🧠 Optimizing memory connections for user ${userId}`);
    
    try {
      const memoryGraph = await this.memoryConnection.getMemoryGraph(userId);
      
      // Remove weak connections (< 0.3 strength)
      const weakConnections = memoryGraph.connections.filter(
        conn => parseFloat(conn.strength) < 0.3
      );

      // Strengthen frequently accessed connections
      const strongConnections = memoryGraph.connections.filter(
        conn => parseFloat(conn.strength) >= 0.7
      );

      console.log(`🧠 Memory optimization complete: removed ${weakConnections.length} weak connections, strengthened ${strongConnections.length} strong connections`);
    } catch (error) {
      console.error('Error optimizing memory connections:', error);
    }
  }

  // Helper methods
  private areSimilarMemories(memory1: SemanticMemory, memory2: SemanticMemory): boolean {
    // Simple similarity check - in production, use more sophisticated algorithms
    const content1 = memory1.content.toLowerCase();
    const content2 = memory2.content.toLowerCase();
    
    // Check if they share significant content or tags
    const sharedTags = memory1.semanticTags.filter(tag => memory2.semanticTags.includes(tag));
    const contentSimilarity = content1.includes(content2.substring(0, 20)) || 
                             content2.includes(content1.substring(0, 20));
    
    return sharedTags.length >= 2 || contentSimilarity;
  }

  private async mergeSimilarMemories(memories: SemanticMemory[]): Promise<void> {
    // Merge logic - combine content, tags, and update connections
    const primary = memories[0];
    const others = memories.slice(1);

    // Combine content and tags
    const combinedContent = memories.map(m => m.content).join('. ');
    const combinedTags = [...new Set(memories.flatMap(m => m.semanticTags))];

    // Update primary memory
    await this.semanticMemory.updateMemory(primary.id, {
      content: combinedContent,
      semanticTags: combinedTags,
      accessCount: memories.reduce((sum, m) => sum + m.accessCount, 0)
    });

    // Archive others (in a real implementation, we'd soft delete)
    // For now, we'll just mark them as inactive
    for (const memory of others) {
      await this.semanticMemory.updateMemory(memory.id, {
        isActiveMemory: false
      });
    }
  }
}

// Export singleton instance
export const memoryManager = new MemoryManager();