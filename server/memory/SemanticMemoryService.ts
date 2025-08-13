// SEMANTIC MEMORY SERVICE - Handles extraction, storage, and retrieval of semantic memories
// Core component for preserving therapeutic conversation insights

import { db } from '../db.js';
import { semanticMemories } from '@shared/schema';
import { eq, desc, and, or, ilike, sql } from 'drizzle-orm';
import type { ISemanticMemoryService, SemanticMemory, MemoryContext } from './types.js';

export class SemanticMemoryService implements ISemanticMemoryService {

  /**
   * Extract semantic memories from conversation content using AI analysis
   */
  async extractAndStoreMemories(content: string, context: MemoryContext): Promise<SemanticMemory[]> {
    console.log(`🔍 Extracting semantic memories from content for user ${context.userId}`);
    
    try {
      // Analyze content for extractable memories
      const extractedMemories = await this.analyzeContentForMemories(content, context);
      const storedMemories: SemanticMemory[] = [];

      // Store each extracted memory
      for (const memoryData of extractedMemories) {
        const memory = await this.createMemory({
          userId: context.userId,
          memoryType: memoryData.type,
          content: memoryData.content,
          semanticTags: memoryData.tags,
          emotionalContext: context.emotionalState,
          temporalContext: context.timeContext?.toISOString(),
          relatedTopics: context.currentTopics || [],
          confidence: memoryData.confidence,
          sourceConversationId: context.sessionId,
          isActiveMemory: true
        });
        
        storedMemories.push(memory);
      }

      console.log(`💾 Extracted and stored ${storedMemories.length} semantic memories`);
      return storedMemories;

    } catch (error) {
      console.error('Error extracting semantic memories:', error);
      return [];
    }
  }

  /**
   * Create a new semantic memory
   */
  async createMemory(memory: Partial<SemanticMemory>): Promise<SemanticMemory> {
    try {
      const memoryData = {
        userId: memory.userId!,
        memoryType: memory.memoryType || 'conversation',
        content: memory.content!,
        semanticTags: memory.semanticTags || [],
        emotionalContext: memory.emotionalContext,
        temporalContext: memory.temporalContext,
        relatedTopics: memory.relatedTopics || [],
        confidence: memory.confidence || '0.80',
        accessCount: 0,
        sourceConversationId: typeof memory.sourceConversationId === 'string' ? 
          parseInt(memory.sourceConversationId) || null : memory.sourceConversationId,
        isActiveMemory: memory.isActiveMemory !== false,
        createdAt: new Date()
      };

      const [createdMemory] = await db.insert(semanticMemories).values(memoryData).returning();
      console.log(`💾 Created semantic memory: ${createdMemory?.id}`);
      return createdMemory!;

    } catch (error) {
      console.error('Error creating semantic memory:', error);
      throw error;
    }
  }

  /**
   * Update an existing semantic memory
   */
  async updateMemory(id: number, updates: Partial<SemanticMemory>): Promise<SemanticMemory> {
    try {
      const [updatedMemory] = await db
        .update(semanticMemories)
        .set({ ...updates, lastAccessedAt: new Date() })
        .where(eq(semanticMemories.id, id))
        .returning();

      return updatedMemory!;
    } catch (error) {
      console.error('Error updating semantic memory:', error);
      throw error;
    }
  }

  /**
   * Get recent memories for a user
   */
  async getRecentMemories(userId: number, limit: number = 20): Promise<SemanticMemory[]> {
    try {
      const memories = await db.select()
        .from(semanticMemories)
        .where(and(
          eq(semanticMemories.userId, userId),
          eq(semanticMemories.isActiveMemory, true)
        ))
        .orderBy(desc(semanticMemories.createdAt))
        .limit(limit);

      // Update access counts
      for (const memory of memories) {
        await this.incrementAccessCount(memory.id);
      }

      return memories;
    } catch (error) {
      console.error('Error getting recent memories:', error);
      return [];
    }
  }

  /**
   * Get memories by type
   */
  async getMemoriesByType(userId: number, type: SemanticMemory['memoryType']): Promise<SemanticMemory[]> {
    try {
      const memories = await db.select()
        .from(semanticMemories)
        .where(and(
          eq(semanticMemories.userId, userId),
          eq(semanticMemories.memoryType, type),
          eq(semanticMemories.isActiveMemory, true)
        ))
        .orderBy(desc(semanticMemories.createdAt));

      return memories;
    } catch (error) {
      console.error('Error getting memories by type:', error);
      return [];
    }
  }

  /**
   * Search memories using text similarity
   */
  async searchMemories(userId: number, query: string, limit: number = 10): Promise<SemanticMemory[]> {
    try {
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
      
      if (searchTerms.length === 0) {
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

      // Update access counts for searched memories
      for (const memory of memories) {
        await this.incrementAccessCount(memory.id);
      }

      console.log(`🔍 Found ${memories.length} memories for query: "${query}"`);
      return memories;

    } catch (error) {
      console.error('Error searching memories:', error);
      return [];
    }
  }

  /**
   * Get memories related to a specific memory
   */
  async getRelatedMemories(memoryId: number): Promise<SemanticMemory[]> {
    try {
      // Get the source memory to find related topics and tags
      const [sourceMemory] = await db.select()
        .from(semanticMemories)
        .where(eq(semanticMemories.id, memoryId));

      if (!sourceMemory) {
        return [];
      }

      // Find memories with overlapping tags or topics
      const relatedConditions = [
        ...sourceMemory.semanticTags.map(tag => 
          ilike(semanticMemories.semanticTags, `%${tag}%`)
        ),
        ...sourceMemory.relatedTopics.map(topic => 
          ilike(semanticMemories.relatedTopics, `%${topic}%`)
        )
      ];

      if (relatedConditions.length === 0) {
        return [];
      }

      const relatedMemories = await db.select()
        .from(semanticMemories)
        .where(and(
          eq(semanticMemories.userId, sourceMemory.userId),
          eq(semanticMemories.isActiveMemory, true),
          or(...relatedConditions)
        ))
        .orderBy(desc(semanticMemories.createdAt))
        .limit(10);

      return relatedMemories.filter(memory => memory.id !== memoryId);

    } catch (error) {
      console.error('Error getting related memories:', error);
      return [];
    }
  }

  /**
   * Analyze content for extractable memories using pattern recognition
   */
  private async analyzeContentForMemories(content: string, context: MemoryContext): Promise<Array<{
    type: SemanticMemory['memoryType'];
    content: string;
    tags: string[];
    confidence: string;
  }>> {
    const memories: Array<{
      type: SemanticMemory['memoryType'];
      content: string;
      tags: string[];
      confidence: string;
    }> = [];

    // Extract insights (therapeutic breakthroughs, realizations)
    if (this.containsInsight(content)) {
      memories.push({
        type: 'insight',
        content: this.extractInsightContent(content),
        tags: this.extractTags(content, 'insight'),
        confidence: '0.85'
      });
    }

    // Extract patterns (recurring behaviors, thoughts)
    if (this.containsPattern(content)) {
      memories.push({
        type: 'pattern',
        content: this.extractPatternContent(content),
        tags: this.extractTags(content, 'pattern'),
        confidence: '0.75'
      });
    }

    // Extract goals (therapeutic objectives, personal aspirations)
    if (this.containsGoal(content)) {
      memories.push({
        type: 'goal',
        content: this.extractGoalContent(content),
        tags: this.extractTags(content, 'goal'),
        confidence: '0.90'
      });
    }

    // Extract significant conversations
    if (content.length > 50) {
      memories.push({
        type: 'conversation',
        content: content.substring(0, 500), // Keep first 500 chars
        tags: this.extractTags(content, 'conversation'),
        confidence: '0.70'
      });
    }

    return memories;
  }

  // Pattern recognition helpers
  private containsInsight(content: string): boolean {
    const insightKeywords = [
      'i realize', 'i understand now', 'i see that', 'i discovered', 
      'breakthrough', 'epiphany', 'aha moment', 'clarity', 'perspective'
    ];
    return insightKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
  }

  private containsPattern(content: string): boolean {
    const patternKeywords = [
      'always', 'never', 'usually', 'often', 'repeatedly', 'pattern',
      'habit', 'tendency', 'every time', 'whenever'
    ];
    return patternKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
  }

  private containsGoal(content: string): boolean {
    const goalKeywords = [
      'want to', 'hope to', 'goal', 'aspire', 'aim to', 'plan to',
      'working towards', 'trying to', 'want to improve'
    ];
    return goalKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
  }

  private extractInsightContent(content: string): string {
    // Find sentences containing insight keywords
    const sentences = content.split(/[.!?]+/);
    const insightSentences = sentences.filter(sentence =>
      this.containsInsight(sentence)
    );
    return insightSentences.join('. ').trim();
  }

  private extractPatternContent(content: string): string {
    const sentences = content.split(/[.!?]+/);
    const patternSentences = sentences.filter(sentence =>
      this.containsPattern(sentence)
    );
    return patternSentences.join('. ').trim();
  }

  private extractGoalContent(content: string): string {
    const sentences = content.split(/[.!?]+/);
    const goalSentences = sentences.filter(sentence =>
      this.containsGoal(sentence)
    );
    return goalSentences.join('. ').trim();
  }

  private extractTags(content: string, type: string): string[] {
    const tags = [type];
    
    // Extract emotion tags
    const emotions = ['happy', 'sad', 'angry', 'anxious', 'calm', 'excited', 'worried', 'content'];
    emotions.forEach(emotion => {
      if (content.toLowerCase().includes(emotion)) {
        tags.push(emotion);
      }
    });

    // Extract topic tags
    const topics = ['work', 'family', 'relationship', 'health', 'stress', 'growth', 'goals'];
    topics.forEach(topic => {
      if (content.toLowerCase().includes(topic)) {
        tags.push(topic);
      }
    });

    return [...new Set(tags)]; // Remove duplicates
  }

  private async incrementAccessCount(memoryId: number): Promise<void> {
    try {
      await db.update(semanticMemories)
        .set({
          accessCount: sql`${semanticMemories.accessCount} + 1`,
          lastAccessedAt: new Date()
        })
        .where(eq(semanticMemories.id, memoryId));
    } catch (error) {
      console.error('Error incrementing access count:', error);
    }
  }
}