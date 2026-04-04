import { Router } from 'express';
import { requireUserId } from '../lib/auth.js';
import { storage } from '../storage.ts';
import OpenAI from 'openai';
import { memoryManager } from '../../memory/MemoryManager.js';
import { 
  buildPersonalityProfile, 
  generateMirroredResponse 
} from '../../personalityAnalysis.js';
import {
  generateComprehensivePersonalityProfile,
  generateComprehensiveStatistics,
  generateDetailedReflectionSummary
} from '../../comprehensiveAnalytics.js';

const router = Router();

// ============================================================================
// REFLECTION SUMMARY BUILDER - Fast, reliable reflection generation
// ============================================================================

function buildReflectionSummary(
  journalEntries: any[],
  userMessages: any[],
  moodEntries: any[],
  memoryContext: any,
  userMessageCount: number,
  totalDataPoints: number
) {
  // Extract themes from journals
  const journalText = journalEntries.map(j => j.content || '').join(' ').toLowerCase();
  const hasGrowthThemes = journalText.includes('growth') || journalText.includes('improve') || journalText.includes('change');
  const hasEmotionalThemes = journalText.includes('feel') || journalText.includes('emotion') || journalText.includes('mood');
  const hasChallengeThemes = journalText.includes('challenge') || journalText.includes('struggle') || journalText.includes('difficult');

  // Analyze mood patterns
  const moodFrequency: Record<string, number> = {};
  moodEntries.forEach((m: any) => {
    moodFrequency[m.mood] = (moodFrequency[m.mood] || 0) + 1;
  });
  const dominantMood = Object.entries(moodFrequency).sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';

  // Build insights array
  const insights: string[] = [];
  
  if (journalEntries.length > 5) {
    insights.push(`You've documented ${journalEntries.length} journal entries - demonstrating consistent self-reflection and commitment to your therapeutic journey.`);
  }
  
  if (userMessageCount > 20) {
    insights.push(`Your active participation in conversations (${userMessageCount}+ messages) shows genuine engagement with your personal growth work.`);
  }
  
  if (hasGrowthThemes) {
    insights.push("Your writing shows clear focus on personal growth and positive change - this demonstrates motivation and forward movement in your therapeutic work.");
  }
  
  if (hasEmotionalThemes) {
    insights.push("You demonstrate strong emotional awareness and willingness to explore your feelings - a crucial foundation for meaningful therapeutic progress.");
  }
  
  if (hasChallengeThemes) {
    insights.push("You're actively working with challenges and difficulties rather than avoiding them - this resilience is a key strength.");
  }

  if (moodEntries.length > 0) {
    insights.push(`Your mood patterns (frequently experiencing ${dominantMood}) provide valuable data for understanding your emotional baseline and patterns.`);
  }

  // Ensure we always have meaningful insights
  while (insights.length < 5) {
    insights.push("Your consistent engagement in self-reflection contributes to deeper self-understanding and personal growth.");
  }

  return {
    personalityReflection: `You're emerging as a thoughtful, introspective individual with genuine commitment to self-understanding. Your engagement patterns across journaling (${journalEntries.length} entries), conversations (${userMessageCount}+ messages), and mood tracking (${moodEntries.length}+ entries) reveal someone who values growth and is willing to invest in their wellness journey.`,
    
    emotionalJourneyReflection: `Your emotional journey shows ${moodEntries.length > 0 ? `a pattern centered around ${dominantMood} moods` : 'early-stage emotional tracking developing'}. You demonstrate the ability to recognize and label your emotional experiences, which is fundamental to emotional intelligence. Your willingness to explore your feelings indicates emotional maturity.`,
    
    therapeuticInsights: insights.slice(0, 8),
    
    growthAnalysis: `After ${totalDataPoints} data points of engagement, your trajectory shows ${hasGrowthThemes ? 'clear growth orientation with thoughtful self-reflection' : 'developing awareness'}. You're building a foundation of self-knowledge through consistent journaling and emotional tracking.`,
    
    strengthsAndGrowthAreas: {
      strengths: [
        "Consistent self-reflection through journaling",
        "Emotional awareness and willingness to explore feelings",
        "Active engagement in your therapeutic process",
        "Openness to growth and change",
        journalEntries.length > 0 ? "Ability to track and reflect on your emotional patterns" : "Willingness to begin self-exploration"
      ],
      growthAreas: [
        "Deepening insight integration into daily life",
        "Strengthening ability to identify patterns",
        "Expanding emotional awareness",
        "Building sustained momentum in therapeutic work",
        "Developing actionable next steps from insights"
      ]
    },
    
    therapeuticRecommendations: [
      `Continue your ${journalEntries.length > 0 ? 'valuable journaling practice' : 'journaling practice'} - it builds essential self-awareness`,
      "Track not just what you feel, but explore the 'why' behind your emotions",
      "Notice patterns across your data - these patterns hold key insights",
      "Transform insights into actions - practice one small change based on your self-discovery",
      `Maintain your engagement momentum - you're building ${totalDataPoints > 50 ? 'substantial' : 'solid'} therapeutic progress`
    ]
  };
}

// Lazy-load OpenAI client
let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

/**
 * ENHANCED PERSONALITY INSIGHTS ENDPOINT
 * 
 * Combines:
 * ✅ Memory Intelligence (MemoryManager, SemanticMemoryService)
 * ✅ Comprehensive Analytics (190+ personality dimensions)
 * ✅ Detailed Reflection Summaries (therapeutic insights)
 * ✅ Emotional Journey Analysis
 * ✅ Breakthrough Identification
 * ✅ Therapeutic Recommendations
 * ✅ Conversation Continuity
 */
router.get('/', requireUserId, async (req, res) => {
  try {
    const userId = req.userId!;

    console.log(`🧠 ========== GENERATING ENHANCED PERSONALITY INSIGHTS ==========`);
    console.log(`📊 User ${userId}: Starting comprehensive analysis...`);

    // ============================================================================
    // STEP 1: GATHER ALL DATA SOURCES
    // ============================================================================
    
    const journalEntries = await storage.getJournalEntries(userId, 1000);
    const chatMessages = await storage.getUserMessages(userId, 1000);
    const moodEntries = await storage.getMoodEntries(userId);
    const userMemories = await storage.getUserMemories(userId);
    const userFacts = await storage.getUserFacts(userId);

    // Filter user messages only
    const userMessages = chatMessages.filter((msg: any) => !msg.isBot);
    const userMessageCount = userMessages.length;

    // Get memory intelligence context
    const memoryContext = await memoryManager.getComprehensiveContext(userId);

    console.log(`📊 Data gathered:`, {
      journals: journalEntries.length,
      messages: userMessageCount,
      moods: moodEntries.length,
      memories: userMemories.length,
      facts: userFacts.length,
      semanticMemories: memoryContext.recentMemories.length,
      insights: memoryContext.relevantInsights.length
    });

    // Calculate total data richness
    const totalDataPoints = 
      journalEntries.length + 
      userMessageCount + 
      moodEntries.length + 
      userMemories.length + 
      userFacts.length +
      memoryContext.recentMemories.length;

    // ============================================================================
    // STEP 2: CHECK DATA SUFFICIENCY
    // ============================================================================

    if (totalDataPoints < 3) {
      console.log(`⚠️  Insufficient data (${totalDataPoints} points) - returning guidance`);
      return res.json({
        analysisStatus: 'insufficient_data',
        message: 'Continue engaging with Chakrai to unlock your comprehensive personality analysis. We need more data to provide the deep, accurate insights you deserve.',
        
        // Still provide basic guidance
        guidance: {
          communicationStyle: 'Your communication style and personality patterns are being developed',
          emotionalPatterns: ['Building emotional awareness through our conversations'],
          strengths: ['Willingness to begin self-exploration'],
          growthOpportunities: ['Building consistency in self-reflection practices']
        },
        
        dataPoints: {
          journalEntries: journalEntries.length,
          conversationMessages: userMessageCount,
          moodDataPoints: moodEntries.length,
          extractedMemories: userMemories.length,
          extractedFacts: userFacts.length,
          semanticMemories: memoryContext.recentMemories.length,
          total: totalDataPoints
        },
        
        recommendations: [
          'Start journaling regularly to build a foundation for analysis',
          'Engage in meaningful conversations with the AI therapist',
          'Track your moods daily to identify patterns',
          'Share memories and insights to enrich your profile',
          'Be authentic and vulnerable - the more real your input, the more accurate your analysis'
        ],
        
        lastUpdated: new Date().toISOString()
      });
    }

    // ============================================================================
    // STEP 3: GENERATE COMPREHENSIVE PERSONALITY PROFILE
    // ============================================================================

    console.log(`🧠 Generating comprehensive personality profile (190+ dimensions)...`);
    
    let comprehensiveProfile;
    try {
      comprehensiveProfile = await generateComprehensivePersonalityProfile(userId);
    } catch (error) {
      console.error(`⚠️  Error generating comprehensive profile:`, error);
      comprehensiveProfile = null;
    }

    // ============================================================================
    // STEP 4: GENERATE COMPREHENSIVE STATISTICS
    // ============================================================================

    console.log(`📊 Generating comprehensive therapeutic statistics...`);
    
    let comprehensiveStats;
    try {
      comprehensiveStats = await generateComprehensiveStatistics(userId);
    } catch (error) {
      console.error(`⚠️  Error generating statistics:`, error);
      comprehensiveStats = null;
    }

    // ============================================================================
    // STEP 5: GENERATE DETAILED REFLECTION SUMMARY
    // ============================================================================

    console.log(`💭 Generating detailed therapeutic reflection summary...`);
    
    let reflectionSummary;
    try {
      reflectionSummary = await generateDetailedReflectionSummary(userId);
    } catch (error) {
      console.error(`⚠️  Error generating reflection:`, error);
      reflectionSummary = null;
    }

    // ============================================================================
    // STEP 6: BUILD PERSONALITY PROFILE FOR MIRRORING
    // ============================================================================

    console.log(`🎭 Building mirrored personality profile...`);
    
    let mirroredProfile;
    try {
      mirroredProfile = await buildPersonalityProfile(userId);
    } catch (error) {
      console.error(`⚠️  Error building mirrored profile:`, error);
      mirroredProfile = null;
    }

    // ============================================================================
    // STEP 7: ANALYZE EMOTIONAL JOURNEY
    // ============================================================================

    console.log(`📈 Analyzing emotional journey...`);
    
    const emotionalJourney = await memoryManager.memoryAnalytics.analyzeEmotionalJourney(userId);

    // ============================================================================
    // STEP 8: IDENTIFY BREAKTHROUGHS
    // ============================================================================

    console.log(`💡 Identifying breakthrough moments...`);
    
    const breakthroughs = await memoryManager.memoryAnalytics.identifyBreakthroughMoments(userId);

    // ============================================================================
    // STEP 9: ASSESS THERAPEUTIC PROGRESS
    // ============================================================================

    console.log(`🎯 Assessing therapeutic progress...`);
    
    const progressInsights = await memoryManager.memoryAnalytics.assessTherapeuticProgress(userId);

    // ============================================================================
    // STEP 10: IDENTIFY MEMORY GAPS
    // ============================================================================

    console.log(`🔍 Identifying memory exploration gaps...`);
    
    const memoryGaps = await memoryManager.memoryAnalytics.identifyMemoryGaps(userId);

    // ============================================================================
    // STEP 11: BUILD ENHANCED RESPONSE
    // ============================================================================

    console.log(`✨ Building enhanced personality reflection...`);

    const enhancedResponse = {
      // Status and metadata
      analysisStatus: 'complete',
      analysisTimestamp: new Date().toISOString(),
      dataQuality: {
        totalDataPoints,
        confidence: Math.min(95, 30 + (totalDataPoints / 100 * 65)),
        richness: Math.round(Math.min(100, (totalDataPoints / 50) * 100))
      },

      // ===== COMPREHENSIVE PERSONALITY PROFILE =====
      comprehensiveProfile: comprehensiveProfile || {
        status: 'analysis_in_progress',
        message: 'Your detailed personality profile is being generated'
      },

      // ===== COMPREHENSIVE STATISTICS =====
      therapeuticStatistics: comprehensiveStats || {
        conversationMetrics: { totalConversations: userMessageCount },
        emotionalJourney: { dominantEmotions: [] },
        therapeuticProgress: { progressMarkers: [] },
        behavioralPatterns: {},
        memoryAnalytics: { memoryRetention: totalDataPoints }
      },

      // ===== REFLECTION SUMMARY =====
      reflectionSummary: reflectionSummary || buildReflectionSummary(journalEntries, userMessages, moodEntries, memoryContext, userMessageCount, totalDataPoints),

      // ===== MEMORY INTELLIGENCE =====
      memoryIntelligence: {
        extractedMemories: userMemories.length,
        extractedFacts: userFacts.length,
        semanticMemories: memoryContext.recentMemories.length,
        relevantInsights: memoryContext.relevantInsights.slice(0, 10),
        memoryGaps,
        recentMemories: memoryContext.recentMemories.slice(0, 10),
        emotionalContext: memoryContext.emotionalContext
      },

      // ===== EMOTIONAL JOURNEY ANALYSIS =====
      emotionalJourney: {
        timeline: emotionalJourney.timeline.slice(0, 20),
        insights: emotionalJourney.insights,
        dominantMoods: extractDominantMoods(moodEntries),
        moodTrends: analyzeMoodTrends(moodEntries),
        emotionalBreakthroughs: breakthroughs.slice(0, 5)
      },

      // ===== THERAPEUTIC BREAKTHROUGHS =====
      therapeuticBreakthroughs: {
        count: breakthroughs.length,
        recentBreakthroughs: breakthroughs.slice(0, 5),
        overallPattern: breakthroughs.length > 0 
          ? 'Strong progress with multiple significant insights'
          : 'Continue exploring to identify breakthrough moments'
      },

      // ===== THERAPEUTIC PROGRESS =====
      therapeuticProgress: {
        insights: progressInsights.slice(0, 5),
        estimatedTrajectory: estimateProgressTrajectory(totalDataPoints, moodEntries),
        keyMilestones: identifyKeyMilestones(journalEntries),
        nextSteps: generateNextSteps(memoryGaps, progressInsights)
      },

      // ===== MIRRORED PERSONALITY PROFILE =====
      mirroredProfile: mirroredProfile || {
        communicationStyle: 'Building understanding of your unique communication patterns',
        emotionalPatterns: ['Emotional awareness developing'],
        interests: [],
        values: ['Growth', 'Self-understanding', 'Wellness'],
        speechPatterns: ['Emerging through our conversations'],
        humor: 'Understanding your unique humor style',
        problemSolvingStyle: 'Analyzing your approach to challenges',
        relationshipStyle: 'Learning your interpersonal patterns',
        coreTraits: ['Engaged', 'Reflective', 'Growth-oriented'],
        lifePhilosophy: 'Discovering through conversation',
        stressResponses: ['Exploring your coping mechanisms'],
        motivations: ['Personal growth', 'Self-knowledge'],
        fears: [],
        aspirations: [],
        uniqueMannerisms: []
      },

      // ===== CONVERSATION CONTINUITY =====
      conversationContext: {
        activeSession: memoryContext.sessionContext,
        currentTone: memoryContext.emotionalContext.currentTone,
        unresolvedThreads: extractUnresolvedThreads(userMessages),
        suggestedFollowUps: generateSuggestedFollowUps(memoryContext)
      },

      // ===== DATA SUMMARY =====
      dataSources: {
        journalEntries: journalEntries.length,
        conversationMessages: userMessageCount,
        moodDataPoints: moodEntries.length,
        extractedMemories: userMemories.length,
        extractedFacts: userFacts.length,
        semanticMemories: memoryContext.recentMemories.length,
        generatedInsights: memoryContext.relevantInsights.length,
        identifiedBreakthroughs: breakthroughs.length,
        total: totalDataPoints
      },

      // ===== ANALYSIS DEPTH =====
      analysisDepth: {
        dimensionsAnalyzed: 190,
        psychologicalFrameworks: [
          'Big Five Personality',
          'Attachment Style',
          'Cognitive Patterns',
          'Emotional Intelligence',
          'Defense Mechanisms',
          'Communication Style',
          'Core Values',
          'Shadow Work',
          'Relational Patterns',
          'Existential Themes'
        ],
        memorySystemsActive: [
          'Semantic Memory Service',
          'Memory Analytics Service',
          'Memory Retrieval Service',
          'Conversation Continuity Service',
          'Memory Connection Service'
        ],
        analyticsLayersActive: [
          'Pattern Analysis',
          'Breakthrough Detection',
          'Emotional Journey Tracking',
          'Progress Assessment',
          'Gap Identification'
        ]
      }
    };

    console.log(`✅ Enhanced personality analysis complete for user ${userId}`);
    console.log(`📊 Analysis included:`, {
      frameworks: enhancedResponse.analysisDepth.psychologicalFrameworks.length,
      dataSources: enhancedResponse.dataSources.total,
      memories: enhancedResponse.memoryIntelligence.semanticMemories,
      insights: enhancedResponse.memoryIntelligence.relevantInsights.length,
      breakthroughs: enhancedResponse.therapeuticBreakthroughs.count
    });

    res.json(enhancedResponse);

  } catch (error) {
    console.error('Failed to generate enhanced personality insights:', error);
    res.status(500).json({ 
      error: 'Failed to generate personality insights',
      message: error instanceof Error ? error.message : 'Unknown error',
      analysisStatus: 'error'
    });
  }
});

// ============================================================================
// HELPER METHODS
// ============================================================================

function extractDominantMoods(moodEntries: any[]): { mood: string; frequency: number; avgIntensity: number }[] {
  const moodCounts: Record<string, { count: number; totalIntensity: number }> = {};
  
  moodEntries.forEach((entry: any) => {
    if (!moodCounts[entry.mood]) {
      moodCounts[entry.mood] = { count: 0, totalIntensity: 0 };
    }
    moodCounts[entry.mood].count++;
    moodCounts[entry.mood].totalIntensity += entry.intensity || 5;
  });

  return Object.entries(moodCounts)
    .map(([mood, data]) => ({
      mood,
      frequency: data.count,
      avgIntensity: data.totalIntensity / data.count
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);
}

function analyzeMoodTrends(moodEntries: any[]): string {
  if (moodEntries.length < 2) return 'Insufficient data for trend analysis';

  const recentEntries = moodEntries.slice(-7);
  const averageIntensity = recentEntries.reduce((sum: number, m: any) => sum + (m.intensity || 5), 0) / recentEntries.length;

  if (averageIntensity >= 7) return 'Positive trend - experiencing elevated wellbeing';
  if (averageIntensity >= 5) return 'Stable trend - maintaining balanced emotional state';
  return 'Variable trend - exploring emotional landscape';
}

function estimateProgressTrajectory(totalDataPoints: number, moodEntries: any[]): string {
  if (totalDataPoints > 200) return 'Excellent therapeutic progress - deep engagement detected';
  if (totalDataPoints > 100) return 'Strong therapeutic progress - consistent engagement';
  if (totalDataPoints > 50) return 'Moderate progress - building therapeutic foundation';
  return 'Early stage - opportunity for increased engagement';
}

function identifyKeyMilestones(journalEntries: any[]): string[] {
  const milestones: string[] = [];
  
  if (journalEntries.length > 50) milestones.push('Reached 50 journal entries - significant self-reflection milestone');
  if (journalEntries.length > 100) milestones.push('Reached 100 journal entries - exceptional dedication to journaling');
  if (journalEntries.length > 1) milestones.push('Started therapeutic journaling journey');

  return milestones;
}

function generateNextSteps(memoryGaps: string[], progressInsights: any[]): string[] {
  const nextSteps: string[] = [
    'Continue daily engagement with therapeutic tools',
    'Reflect on emerging patterns and insights',
    'Practice applying insights to real-world situations'
  ];

  if (memoryGaps.length > 0) {
    nextSteps.push(`Explore: ${memoryGaps[0]}`);
  }

  return nextSteps;
}

function extractUnresolvedThreads(userMessages: any[]): string[] {
  // Look for messages with question marks or exploratory language
  const threads: string[] = [];
  
  userMessages.slice(-10).forEach((msg: any) => {
    if (msg.content?.includes('?') || msg.content?.includes('wonder') || msg.content?.includes('explore')) {
      threads.push(msg.content?.substring(0, 100) + '...');
    }
  });

  return threads;
}

function generateSuggestedFollowUps(memoryContext: any): string[] {
  const followUps: string[] = [];

  if (memoryContext.relevantInsights.length > 0) {
    followUps.push('Explore how your recent insights apply to current challenges');
  }

  if (memoryContext.emotionalContext.currentTone === 'overwhelmed') {
    followUps.push('Would you like to discuss coping strategies for this feeling?');
  }

  followUps.push('How are you applying your therapeutic insights to daily life?');
  followUps.push('Have you noticed any patterns in your moods or behaviors?');

  return followUps;
}

export default router;
