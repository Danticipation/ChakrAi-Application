// MEMORY ANALYTICS SERVICE - Advanced analysis and insights from therapeutic memories
// Provides deep insights into therapeutic progress and patterns

import { db } from '../db.js';
import { semanticMemories, memoryInsights } from '@shared/schema';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import type { 
  IMemoryAnalyticsService, 
  SemanticMemory, 
  MemoryInsight 
} from './types.js';

export class MemoryAnalyticsService implements IMemoryAnalyticsService {

  /**
   * Generate comprehensive memory insights for therapeutic progress
   */
  async generateMemoryInsights(userId: number): Promise<MemoryInsight[]> {
    console.log(`📊 Generating memory insights for user ${userId}`);
    
    try {
      const insights: MemoryInsight[] = [];

      // Generate different types of insights
      const patternInsights = await this.generatePatternInsights(userId);
      const growthInsights = await this.generateGrowthInsights(userId);
      const concernInsights = await this.generateConcernInsights(userId);
      const breakthroughInsights = await this.generateBreakthroughInsights(userId);

      insights.push(...patternInsights, ...growthInsights, ...concernInsights, ...breakthroughInsights);

      // Store insights in database for future reference
      for (const insight of insights) {
        await this.storeInsight(insight);
      }

      console.log(`📊 Generated ${insights.length} memory insights`);
      return insights;

    } catch (error) {
      console.error('Error generating memory insights:', error);
      return [];
    }
  }

  /**
   * Analyze memory growth and usage patterns
   */
  async analyzeMemoryGrowth(userId: number): Promise<{
    totalMemories: number;
    growthRate: number;
    categories: Record<string, number>;
  }> {
    console.log(`📈 Analyzing memory growth for user ${userId}`);
    
    try {
      // Get total memory count
      const [totalResult] = await db.select({ count: count() })
        .from(semanticMemories)
        .where(and(
          eq(semanticMemories.userId, userId),
          eq(semanticMemories.isActiveMemory, true)
        ));

      const totalMemories = totalResult.count;

      // Calculate growth rate (memories created in last 7 days vs previous 7 days)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const [recentResult] = await db.select({ count: count() })
        .from(semanticMemories)
        .where(and(
          eq(semanticMemories.userId, userId),
          eq(semanticMemories.isActiveMemory, true),
          sql`${semanticMemories.createdAt} >= ${sevenDaysAgo}`
        ));

      const [previousResult] = await db.select({ count: count() })
        .from(semanticMemories)
        .where(and(
          eq(semanticMemories.userId, userId),
          eq(semanticMemories.isActiveMemory, true),
          sql`${semanticMemories.createdAt} >= ${fourteenDaysAgo} AND ${semanticMemories.createdAt} < ${sevenDaysAgo}`
        ));

      const recentCount = recentResult.count;
      const previousCount = previousResult.count;
      const growthRate = previousCount > 0 ? (recentCount - previousCount) / previousCount : 0;

      // Analyze categories
      const allMemories = await db.select()
        .from(semanticMemories)
        .where(and(
          eq(semanticMemories.userId, userId),
          eq(semanticMemories.isActiveMemory, true)
        ));

      const categories: Record<string, number> = {};
      allMemories.forEach(memory => {
        categories[memory.memoryType] = (categories[memory.memoryType] || 0) + 1;
      });

      console.log(`📈 Memory growth analysis: ${totalMemories} total, ${(growthRate * 100).toFixed(1)}% growth rate`);
      return { totalMemories, growthRate, categories };

    } catch (error) {
      console.error('Error analyzing memory growth:', error);
      return { totalMemories: 0, growthRate: 0, categories: {} };
    }
  }

  /**
   * Identify potential gaps in memory coverage
   */
  async identifyMemoryGaps(userId: number): Promise<string[]> {
    console.log(`🔍 Identifying memory gaps for user ${userId}`);
    
    try {
      const memories = await db.select()
        .from(semanticMemories)
        .where(and(
          eq(semanticMemories.userId, userId),
          eq(semanticMemories.isActiveMemory, true)
        ));

      const gaps: string[] = [];

      // Check for missing memory types
      const memoryTypes = new Set(memories.map(m => m.memoryType));
      const expectedTypes = ['conversation', 'insight', 'pattern', 'goal', 'breakthrough'];
      
      expectedTypes.forEach(type => {
        if (!memoryTypes.has(type)) {
          gaps.push(`Missing ${type} memories - consider reflecting on ${this.getTypeDescription(type)}`);
        }
      });

      // Check for emotional coverage gaps
      const emotionalStates = memories
        .map(m => m.emotionalContext)
        .filter(Boolean)
        .map(e => e!.toLowerCase());
      
      const expectedEmotions = ['happy', 'sad', 'anxious', 'calm', 'frustrated', 'excited'];
      expectedEmotions.forEach(emotion => {
        if (!emotionalStates.some(state => state.includes(emotion))) {
          gaps.push(`Limited ${emotion} emotional memories - consider capturing experiences with this emotion`);
        }
      });

      // Check for topic coverage gaps
      const topics = memories.flatMap(m => m.relatedTopics);
      const importantTopics = ['work', 'relationships', 'family', 'health', 'goals', 'stress'];
      
      importantTopics.forEach(topic => {
        if (!topics.some(t => t.toLowerCase().includes(topic))) {
          gaps.push(`No memories about ${topic} - this might be an important area to explore`);
        }
      });

      console.log(`🔍 Identified ${gaps.length} potential memory gaps`);
      return gaps;

    } catch (error) {
      console.error('Error identifying memory gaps:', error);
      return [];
    }
  }

  /**
   * Assess therapeutic progress based on memory patterns
   */
  async assessTherapeuticProgress(userId: number): Promise<MemoryInsight[]> {
    console.log(`🎯 Assessing therapeutic progress for user ${userId}`);
    
    try {
      const insights: MemoryInsight[] = [];

      // Analyze insight frequency over time
      const insightProgress = await this.analyzeInsightProgression(userId);
      if (insightProgress) {
        insights.push(insightProgress);
      }

      // Analyze goal achievement patterns
      const goalProgress = await this.analyzeGoalAchievement(userId);
      if (goalProgress) {
        insights.push(goalProgress);
      }

      // Analyze emotional regulation improvement
      const emotionalProgress = await this.analyzeEmotionalRegulation(userId);
      if (emotionalProgress) {
        insights.push(emotionalProgress);
      }

      // Analyze coping strategy development
      const copingProgress = await this.analyzeCopingStrategies(userId);
      if (copingProgress) {
        insights.push(copingProgress);
      }

      console.log(`🎯 Generated ${insights.length} therapeutic progress insights`);
      return insights;

    } catch (error) {
      console.error('Error assessing therapeutic progress:', error);
      return [];
    }
  }

  /**
   * Identify breakthrough moments in therapeutic journey
   */
  async identifyBreakthroughMoments(userId: number): Promise<SemanticMemory[]> {
    console.log(`💡 Identifying breakthrough moments for user ${userId}`);
    
    try {
      // Get memories marked as breakthroughs
      const breakthroughMemories = await db.select()
        .from(semanticMemories)
        .where(and(
          eq(semanticMemories.userId, userId),
          eq(semanticMemories.memoryType, 'breakthrough'),
          eq(semanticMemories.isActiveMemory, true)
        ))
        .orderBy(desc(semanticMemories.createdAt));

      // Also look for insights with high confidence and breakthrough keywords
      const insightMemories = await db.select()
        .from(semanticMemories)
        .where(and(
          eq(semanticMemories.userId, userId),
          eq(semanticMemories.memoryType, 'insight'),
          eq(semanticMemories.isActiveMemory, true)
        ))
        .orderBy(desc(semanticMemories.createdAt));

      const potentialBreakthroughs = insightMemories.filter(memory => 
        this.isLikelyBreakthrough(memory)
      );

      const allBreakthroughs = [...breakthroughMemories, ...potentialBreakthroughs];
      
      // Remove duplicates and sort by significance
      const uniqueBreakthroughs = allBreakthroughs
        .filter((memory, index, self) => 
          self.findIndex(m => m.id === memory.id) === index
        )
        .sort((a, b) => parseFloat(b.confidence) - parseFloat(a.confidence));

      console.log(`💡 Identified ${uniqueBreakthroughs.length} breakthrough moments`);
      return uniqueBreakthroughs;

    } catch (error) {
      console.error('Error identifying breakthrough moments:', error);
      return [];
    }
  }

  /**
   * Analyze emotional journey over time
   */
  async analyzeEmotionalJourney(userId: number): Promise<{
    timeline: any[];
    insights: MemoryInsight[];
  }> {
    console.log(`📈 Analyzing emotional journey for user ${userId}`);
    
    try {
      // Get memories with emotional context over time
      const emotionalMemories = await db.select()
        .from(semanticMemories)
        .where(and(
          eq(semanticMemories.userId, userId),
          eq(semanticMemories.isActiveMemory, true)
        ))
        .orderBy(desc(semanticMemories.createdAt))
        .limit(100);

      const memoriesWithEmotions = emotionalMemories.filter(m => m.emotionalContext);

      // Build timeline
      const timeline = memoriesWithEmotions.map(memory => ({
        date: memory.createdAt,
        emotion: memory.emotionalContext,
        content: memory.content.substring(0, 100) + '...',
        memoryType: memory.memoryType,
        confidence: parseFloat(memory.confidence)
      }));

      // Generate insights from emotional patterns
      const insights = await this.generateEmotionalInsights(memoriesWithEmotions);

      console.log(`📈 Emotional journey: ${timeline.length} emotional entries, ${insights.length} insights`);
      return { timeline, insights };

    } catch (error) {
      console.error('Error analyzing emotional journey:', error);
      return { timeline: [], insights: [] };
    }
  }

  // Private helper methods

  private async generatePatternInsights(userId: number): Promise<MemoryInsight[]> {
    const patternMemories = await db.select()
      .from(semanticMemories)
      .where(and(
        eq(semanticMemories.userId, userId),
        eq(semanticMemories.memoryType, 'pattern'),
        eq(semanticMemories.isActiveMemory, true)
      ));

    if (patternMemories.length < 3) return [];

    return [{
      id: Date.now(),
      userId,
      insightType: 'pattern',
      content: `You have identified ${patternMemories.length} behavioral patterns. This shows strong self-awareness and is a positive indicator for therapeutic progress.`,
      relatedMemoryIds: patternMemories.map(m => m.id),
      confidence: '0.85',
      therapeuticRelevance: 'high',
      actionSuggestions: [
        'Continue monitoring these patterns',
        'Discuss pattern-breaking strategies with your therapist',
        'Celebrate your increased self-awareness'
      ],
      createdAt: new Date()
    }];
  }

  private async generateGrowthInsights(userId: number): Promise<MemoryInsight[]> {
    const insightMemories = await db.select()
      .from(semanticMemories)
      .where(and(
        eq(semanticMemories.userId, userId),
        eq(semanticMemories.memoryType, 'insight'),
        eq(semanticMemories.isActiveMemory, true)
      ));

    if (insightMemories.length < 2) return [];

    const recentInsights = insightMemories.filter(memory => {
      const daysSinceCreated = (Date.now() - new Date(memory.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreated <= 30;
    });

    if (recentInsights.length === 0) return [];

    return [{
      id: Date.now() + 1,
      userId,
      insightType: 'growth',
      content: `You've had ${recentInsights.length} insights in the past month, showing active engagement in your therapeutic journey and personal growth.`,
      relatedMemoryIds: recentInsights.map(m => m.id),
      confidence: '0.90',
      therapeuticRelevance: 'high',
      actionSuggestions: [
        'Build on these insights with concrete action steps',
        'Share these insights with your support system',
        'Document how these insights change your daily life'
      ],
      createdAt: new Date()
    }];
  }

  private async generateConcernInsights(userId: number): Promise<MemoryInsight[]> {
    // This would identify concerning patterns that might need attention
    // For now, return empty array
    return [];
  }

  private async generateBreakthroughInsights(userId: number): Promise<MemoryInsight[]> {
    const breakthroughs = await this.identifyBreakthroughMoments(userId);
    
    if (breakthroughs.length === 0) return [];

    return [{
      id: Date.now() + 2,
      userId,
      insightType: 'breakthrough',
      content: `You've experienced ${breakthroughs.length} significant breakthrough moments. These represent major progress in your therapeutic journey.`,
      relatedMemoryIds: breakthroughs.map(m => m.id),
      confidence: '0.95',
      therapeuticRelevance: 'high',
      actionSuggestions: [
        'Reflect on what led to these breakthroughs',
        'Apply insights from breakthroughs to current challenges',
        'Celebrate these significant achievements'
      ],
      createdAt: new Date()
    }];
  }

  private async analyzeInsightProgression(userId: number): Promise<MemoryInsight | null> {
    // Analyze how insights have evolved over time
    return null; // Placeholder
  }

  private async analyzeGoalAchievement(userId: number): Promise<MemoryInsight | null> {
    // Analyze goal-setting and achievement patterns
    return null; // Placeholder
  }

  private async analyzeEmotionalRegulation(userId: number): Promise<MemoryInsight | null> {
    // Analyze improvements in emotional regulation
    return null; // Placeholder
  }

  private async analyzeCopingStrategies(userId: number): Promise<MemoryInsight | null> {
    // Analyze development of coping strategies
    return null; // Placeholder
  }

  private isLikelyBreakthrough(memory: SemanticMemory): boolean {
    const breakthroughKeywords = [
      'breakthrough', 'epiphany', 'realization', 'suddenly understood',
      'it clicked', 'aha moment', 'finally see', 'major insight'
    ];
    
    const content = memory.content.toLowerCase();
    return breakthroughKeywords.some(keyword => content.includes(keyword)) &&
           parseFloat(memory.confidence) > 0.8;
  }

  private async generateEmotionalInsights(memories: SemanticMemory[]): Promise<MemoryInsight[]> {
    // Analyze emotional patterns and generate insights
    return []; // Placeholder
  }

  private getTypeDescription(type: string): string {
    const descriptions: Record<string, string> = {
      'conversation': 'meaningful discussions and interactions',
      'insight': 'personal realizations and understanding',
      'pattern': 'recurring behaviors and tendencies',
      'goal': 'aspirations and objectives',
      'breakthrough': 'significant moments of understanding'
    };
    
    return descriptions[type] || type;
  }

  private async storeInsight(insight: MemoryInsight): Promise<void> {
    try {
      await db.insert(memoryInsights).values({
        userId: insight.userId,
        insightType: insight.insightType,
        content: insight.content,
        relatedMemoryIds: insight.relatedMemoryIds,
        confidence: insight.confidence,
        therapeuticRelevance: insight.therapeuticRelevance,
        actionSuggestions: insight.actionSuggestions || [],
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error storing insight:', error);
    }
  }
}