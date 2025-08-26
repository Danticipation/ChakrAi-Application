// MEMORY RETRIEVAL SERVICE - Intelligent retrieval of contextually relevant memories
// Provides sophisticated memory search for therapeutic conversation enhancement

import { db } from '../db.ts';
import { semanticMemories, memoryInsights } from '../../shared/schema.ts';
import { eq, and, or, ilike, desc, sql } from 'drizzle-orm';
import type { 
  IMemoryRetrievalService, 
  SemanticMemory, 
  MemoryContext, 
  MemoryInsight 
} from './types.js';

export class MemoryRetrievalService implements IMemoryRetrievalService {

  /**
   * Get contextually relevant memories based on current conversation state
   */
  async getContextualMemories(context: MemoryContext, limit: number = 15): Promise<SemanticMemory[]> {
    console.log(`🎯 Getting contextual memories for user ${context.userId}`);
    
    try {
      const memories: SemanticMemory[] = [];

      // Get memories matching current topics
      if (context.currentTopics && context.currentTopics.length > 0) {
        const topicMemories = await this.getMemoriesByTopics(
          context.userId, 
          context.currentTopics, 
          Math.ceil(limit * 0.4)
        );
        memories.push(...topicMemories);
      }

      // Get emotionally relevant memories
      if (context.emotionalState) {
        const emotionalMemories = await this.getEmotionallyRelevantMemories(
          context.userId, 
          context.emotionalState, 
          Math.ceil(limit * 0.3)
        );
        memories.push(...emotionalMemories);
      }

      // Get recent high-access memories
      const recentMemories = await this.getHighAccessMemories(
        context.userId, 
        Math.ceil(limit * 0.3)
      );
      memories.push(...recentMemories);

      // Remove duplicates and sort by relevance
      const uniqueMemories = this.deduplicateAndRank(memories, context);
      
      console.log(`🎯 Retrieved ${uniqueMemories.length} contextual memories`);
      return uniqueMemories.slice(0, limit);

    } catch (error) {
      console.error('Error getting contextual memories:', error);
      return [];
    }
  }

  /**
   * Get memories relevant to the current conversation message
   */
  async getConversationRelevantMemories(
    userId: number, 
    currentMessage: string, 
    limit: number = 10
  ): Promise<SemanticMemory[]> {
    console.log(`💬 Finding memories relevant to current message for user ${userId}`);
    
    try {
      // Extract keywords from current message
      const keywords = this.extractKeywords(currentMessage);
      
      if (keywords.length === 0) {
        return await this.getRecentMemories(userId, limit);
      }

      // Search memories using keywords
      const searchConditions = keywords.map(keyword => 
        or(
          ilike(semanticMemories.content, `%${keyword}%`),
          sql`${semanticMemories.semanticTags}::text ILIKE ${`%${keyword}%`}`,
          sql`${semanticMemories.relatedTopics}::text ILIKE ${`%${keyword}%`}`
        )
      );

      const relevantMemories = await db.select()
        .from(semanticMemories)
        .where(and(
          eq(semanticMemories.userId, userId),
          eq(semanticMemories.isActiveMemory, true),
          or(...searchConditions)
        ))
        .orderBy(desc(semanticMemories.accessCount), desc(semanticMemories.createdAt))
        .limit(limit * 2); // Get more than needed for ranking

      // Rank by relevance to current message
      const rankedMemories = this.rankMemoriesByRelevance(relevantMemories, currentMessage);
      
      // Update access counts for retrieved memories
      for (const memory of rankedMemories.slice(0, limit)) {
        await this.incrementAccessCount(memory.id);
      }

      console.log(`💬 Found ${rankedMemories.length} relevant memories`);
      return rankedMemories.slice(0, limit);

    } catch (error) {
      console.error('Error getting conversation relevant memories:', error);
      return [];
    }
  }

  /**
   * Get memories that match a specific emotional state
   */
  async getEmotionallyRelevantMemories(
    userId: number, 
    emotionalState: string, 
    limit: number = 10
  ): Promise<SemanticMemory[]> {
    console.log(`😊 Getting emotionally relevant memories for state: ${emotionalState}`);
    
    try {
      // Direct emotional context match
      const directMatches = await db.select()
        .from(semanticMemories)
        .where(and(
          eq(semanticMemories.userId, userId),
          eq(semanticMemories.isActiveMemory, true),
          ilike(semanticMemories.emotionalContext, `%${emotionalState}%`)
        ))
        .orderBy(desc(semanticMemories.createdAt))
        .limit(Math.ceil(limit * 0.7));

      // Related emotional states
      const relatedEmotions = this.getRelatedEmotions(emotionalState);
      const relatedMatches: SemanticMemory[] = [];

      for (const emotion of relatedEmotions) {
        const matches = await db.select()
          .from(semanticMemories)
          .where(and(
            eq(semanticMemories.userId, userId),
            eq(semanticMemories.isActiveMemory, true),
            ilike(semanticMemories.emotionalContext, `%${emotion}%`)
          ))
          .orderBy(desc(semanticMemories.createdAt))
          .limit(3);
        
        relatedMatches.push(...matches);
      }

      // Combine and deduplicate
      const allMatches = [...directMatches, ...relatedMatches];
      const uniqueMatches = allMatches.filter((memory, index, self) => 
        self.findIndex(m => m.id === memory.id) === index
      );

      console.log(`😊 Found ${uniqueMatches.length} emotionally relevant memories`);
      return uniqueMatches.slice(0, limit);

    } catch (error) {
      console.error('Error getting emotionally relevant memories:', error);
      return [];
    }
  }

  /**
   * Find recurring patterns in user's memories
   */
  async findRecurringPatterns(userId: number): Promise<MemoryInsight[]> {
    console.log(`🔄 Finding recurring patterns for user ${userId}`);
    
    try {
      // Get all pattern-type memories
      const patternMemories = await db.select()
        .from(semanticMemories)
        .where(and(
          eq(semanticMemories.userId, userId),
          eq(semanticMemories.memoryType, 'pattern'),
          eq(semanticMemories.isActiveMemory, true)
        ))
        .orderBy(desc(semanticMemories.createdAt));

      const insights: MemoryInsight[] = [];

      // Analyze tag frequency
      const tagFrequency = this.analyzeTagFrequency(patternMemories);
      for (const [tag, frequency] of Object.entries(tagFrequency)) {
        if (frequency >= 3) { // Threshold for pattern recognition
          insights.push({
            id: Date.now() + Math.random(), // Temporary ID
            userId,
            insightType: 'pattern',
            content: `Recurring pattern identified: "${tag}" appears frequently in your reflections (${frequency} times)`,
            relatedMemoryIds: patternMemories
              .filter(m => m.semanticTags && m.semanticTags.includes(tag))
              .map(m => m.id),
            confidence: this.calculatePatternConfidence(frequency),
            therapeuticRelevance: this.assessTherapeuticRelevance(tag),
            actionSuggestions: this.generateActionSuggestions(tag),
            createdAt: new Date()
          });
        }
      }

      // Analyze emotional patterns
      const emotionalPatterns = this.analyzeEmotionalPatterns(patternMemories);
      insights.push(...emotionalPatterns);

      console.log(`🔄 Identified ${insights.length} recurring patterns`);
      return insights;

    } catch (error) {
      console.error('Error finding recurring patterns:', error);
      return [];
    }
  }

  /**
   * Identify progress markers and growth indicators
   */
  async identifyProgressMarkers(userId: number): Promise<SemanticMemory[]> {
    console.log(`📈 Identifying progress markers for user ${userId}`);
    
    try {
      // Get insight and breakthrough memories
      const progressMemories = await db.select()
        .from(semanticMemories)
        .where(and(
          eq(semanticMemories.userId, userId),
          or(
            eq(semanticMemories.memoryType, 'insight'),
            eq(semanticMemories.memoryType, 'breakthrough')
          ),
          eq(semanticMemories.isActiveMemory, true)
        ))
        .orderBy(desc(semanticMemories.createdAt));

      // Filter for progress indicators
      const progressIndicators = progressMemories.filter(memory => 
        this.isProgressMarker(memory)
      );

      console.log(`📈 Identified ${progressIndicators.length} progress markers`);
      return progressIndicators;

    } catch (error) {
      console.error('Error identifying progress markers:', error);
      return [];
    }
  }

  /**
   * Detect emotional trends over time
   */
  async detectEmotionalTrends(userId: number): Promise<MemoryInsight[]> {
    console.log(`📊 Detecting emotional trends for user ${userId}`);
    
    try {
      // Get memories with emotional context from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentMemories = await db.select()
        .from(semanticMemories)
        .where(and(
          eq(semanticMemories.userId, userId),
          eq(semanticMemories.isActiveMemory, true),
          sql`${semanticMemories.createdAt} >= ${thirtyDaysAgo}`
        ))
        .orderBy(desc(semanticMemories.createdAt));

      const emotionalTrends = this.analyzeEmotionalTrends(recentMemories);
      
      console.log(`📊 Detected ${emotionalTrends.length} emotional trends`);
      return emotionalTrends;

    } catch (error) {
      console.error('Error detecting emotional trends:', error);
      return [];
    }
  }

  // Helper methods

  private async getRecentMemories(userId: number, limit: number): Promise<SemanticMemory[]> {
    return await db.select()
      .from(semanticMemories)
      .where(and(
        eq(semanticMemories.userId, userId),
        eq(semanticMemories.isActiveMemory, true)
      ))
      .orderBy(desc(semanticMemories.createdAt))
      .limit(limit);
  }

  private async getMemoriesByTopics(userId: number, topics: string[], limit: number): Promise<SemanticMemory[]> {
    const topicConditions = topics.map(topic => 
      sql`${semanticMemories.relatedTopics}::text ILIKE ${`%${topic}%`}`
    );

    return await db.select()
      .from(semanticMemories)
      .where(and(
        eq(semanticMemories.userId, userId),
        eq(semanticMemories.isActiveMemory, true),
        or(...topicConditions)
      ))
      .orderBy(desc(semanticMemories.accessCount))
      .limit(limit);
  }

  private async getHighAccessMemories(userId: number, limit: number): Promise<SemanticMemory[]> {
    return await db.select()
      .from(semanticMemories)
      .where(and(
        eq(semanticMemories.userId, userId),
        eq(semanticMemories.isActiveMemory, true)
      ))
      .orderBy(desc(semanticMemories.accessCount))
      .limit(limit);
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - in production, use more sophisticated NLP
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));

    return Array.from(new Set(words)).slice(0, 10); // Limit and deduplicate
  }

  private isStopWord(word: string): boolean {
    const stopWords = [
      'that', 'with', 'have', 'this', 'will', 'your', 'from', 'they', 'know',
      'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come',
      'here', 'just', 'like', 'over', 'also', 'back', 'after', 'first', 'well',
      'work', 'feel', 'think', 'said', 'more', 'need', 'going', 'right'
    ];
    return stopWords.includes(word);
  }

  private rankMemoriesByRelevance(memories: SemanticMemory[], currentMessage: string): SemanticMemory[] {
    const keywords = this.extractKeywords(currentMessage);
    
    return memories
      .map(memory => ({
        memory,
        score: this.calculateRelevanceScore(memory, keywords)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.memory);
  }

  private calculateRelevanceScore(memory: SemanticMemory, keywords: string[]): number {
    let score = 0;
    
    // Content keyword matches
    const contentWords = memory.content.toLowerCase().split(/\s+/);
    const keywordMatches = keywords.filter(keyword => 
      contentWords.some(word => word.includes(keyword))
    ).length;
    score += keywordMatches * 2;

    // Tag matches
    const tagMatches = keywords.filter(keyword =>
      memory.semanticTags?.some(tag => tag.toLowerCase().includes(keyword))
    ).length;
    score += tagMatches * 3;

    // Access count boost
    score += Math.min((memory.accessCount ?? 0) * 0.1, 2);

    // Recency boost
    if (memory.createdAt) {
      const daysSinceCreated = (Date.now() - new Date(memory.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 2 - daysSinceCreated * 0.1);
    }

    return score;
  }

  private deduplicateAndRank(memories: SemanticMemory[], context: MemoryContext): SemanticMemory[] {
    // Remove duplicates
    const unique = memories.filter((memory, index, self) => 
      self.findIndex(m => m.id === memory.id) === index
    );

    // Simple ranking by access count and recency
    return unique.sort((a, b) => {
      const timeScoreA = a.createdAt ? (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24 * -1) : 0;
      const timeScoreB = b.createdAt ? (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24 * -1) : 0;
      const scoreA = (a.accessCount ?? 0) + timeScoreA;
      const scoreB = (b.accessCount ?? 0) + timeScoreB;
      return scoreB - scoreA;
    });
  }

  private getRelatedEmotions(emotion: string): string[] {
    const emotionMap: Record<string, string[]> = {
      'happy': ['joy', 'excited', 'content', 'pleased'],
      'sad': ['depressed', 'melancholy', 'down', 'blue'],
      'angry': ['frustrated', 'irritated', 'mad', 'furious'],
      'anxious': ['worried', 'nervous', 'stressed', 'tense'],
      'calm': ['peaceful', 'relaxed', 'serene', 'tranquil'],
      'excited': ['enthusiastic', 'eager', 'thrilled', 'energetic']
    };

    return emotionMap[emotion.toLowerCase()] || [];
  }

  private analyzeTagFrequency(memories: SemanticMemory[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    
    memories.forEach(memory => {
      memory.semanticTags?.forEach(tag => {
        frequency[tag] = (frequency[tag] || 0) + 1;
      });
    });

    return frequency;
  }

  private calculatePatternConfidence(frequency: number): string {
    if (frequency >= 10) return '0.95';
    if (frequency >= 5) return '0.85';
    if (frequency >= 3) return '0.75';
    return '0.65';
  }

  private assessTherapeuticRelevance(tag: string): string {
    const highRelevanceTags = ['anxiety', 'depression', 'stress', 'growth', 'breakthrough', 'insight'];
    const mediumRelevanceTags = ['work', 'relationship', 'family', 'goals'];
    
    if (highRelevanceTags.includes(tag.toLowerCase())) {
      return 'high';
    } else if (mediumRelevanceTags.includes(tag.toLowerCase())) {
      return 'medium';
    }
    return 'low';
  }

  private generateActionSuggestions(tag: string): string[] {
    const suggestions: Record<string, string[]> = {
      'anxiety': [
        'Consider practicing breathing exercises when feeling anxious',
        'Explore mindfulness techniques to manage anxiety',
        'Track anxiety triggers in your daily life'
      ],
      'stress': [
        'Identify stress management techniques that work for you',
        'Consider time management strategies',
        'Explore relaxation techniques'
      ],
      'growth': [
        'Reflect on your growth journey regularly',
        'Set new goals building on your progress',
        'Celebrate your achievements'
      ]
    };

    return suggestions[tag.toLowerCase()] || [
      `Explore this recurring theme: ${tag}`,
      `Discuss this pattern with your therapist`
    ];
  }

  private analyzeEmotionalPatterns(memories: SemanticMemory[]): MemoryInsight[] {
    // Implementation for emotional pattern analysis
    return [];
  }

  private isProgressMarker(memory: SemanticMemory): boolean {
    const progressKeywords = [
      'breakthrough', 'realize', 'understand', 'growth', 'improvement',
      'progress', 'achievement', 'success', 'overcome', 'better'
    ];
    
    return progressKeywords.some(keyword => 
      memory.content.toLowerCase().includes(keyword)
    );
  }

  private analyzeEmotionalTrends(memories: SemanticMemory[]): MemoryInsight[] {
    // Implementation for emotional trend analysis
    return [];
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