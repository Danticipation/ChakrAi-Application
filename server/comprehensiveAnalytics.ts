// COMPREHENSIVE ANALYTICS SYSTEM - Detailed therapeutic insights and statistics
// Provides exceptionally detailed personality reflections and comprehensive data analysis

import { openai } from './openaiRetry.js';
import { storage } from './src/storage.js';
import { retryOpenAIRequest } from './openaiRetry.js';

export interface ComprehensivePersonalityProfile {
  // Communication Analysis
  communicationStyle: string;
  speechPatterns: string[];
  conversationFlow: string;
  digitalCommunicationStyle: string;
  listeningStyle: string;
  
  // Emotional Architecture
  emotionalPatterns: string[];
  emotionalRegulation: string[];
  stressResponses: string[];
  joyTriggers: string[];
  griefProcessing: string;
  angerExpression: string;
  anxietyPatterns: string[];
  
  // Cognitive Patterns
  problemSolvingStyle: string;
  decisionMakingStyle: string;
  learningStyle: string;
  memoryPatterns: string;
  focusStyle: string;
  
  // Core Identity
  valueHierarchy: string[];
  beliefSystems: string[];
  identityMarkers: string[];
  purposeAndMeaning: string;
  selfPerception: string;
  
  // Growth & Aspirations
  goalSettingPatterns: string;
  successDefinitions: string[];
  failureHandling: string;
  growthMindset: string;
  riskTolerance: string;
  
  // Relationship Dynamics
  attachmentStyle: string;
  boundaryPatterns: string;
  conflictStyle: string;
  supportPatterns: string[];
  trustBuilding: string;
  
  // Unique Characteristics
  uniqueMannerisms: string[];
  humorStyle: string;
  energyPatterns: string;
  comfortNeeds: string[];
  creativeExpression: string;
}

export interface ComprehensiveStatistics {
  // Conversation Analytics
  conversationMetrics: {
    totalConversations: number;
    averageLength: number;
    topicDiversity: number;
    emotionalRange: number;
    communicationEvolution: string[];
  };
  
  // Emotional Journey Analytics
  emotionalJourney: {
    dominantEmotions: Array<{emotion: string, frequency: number, contexts: string[]}>;
    emotionalVolatility: number;
    emotionalGrowth: string[];
    triggerPatterns: Array<{trigger: string, emotional_response: string, frequency: number}>;
    copingMechanisms: Array<{mechanism: string, effectiveness: number, usage_contexts: string[]}>;
    emotionalBreakthroughs: Array<{date: string, breakthrough: string, impact: string}>;
  };
  
  // Therapeutic Progress Analytics
  therapeuticProgress: {
    progressMarkers: Array<{date: string, milestone: string, significance: string}>;
    skillDevelopment: Array<{skill: string, progress_level: number, evidence: string[]}>;
    insightEvolution: Array<{insight: string, depth_level: number, integration: string}>;
    challengeResolution: Array<{challenge: string, resolution_approach: string, outcome: string}>;
    resistancePatterns: Array<{resistance_type: string, frequency: number, breakthrough_methods: string[]}>;
  };
  
  // Behavioral Pattern Analytics
  behavioralPatterns: {
    decisionMakingPatterns: Array<{scenario: string, approach: string, consistency: number}>;
    stressResponseEvolution: Array<{stressor: string, old_response: string, new_response: string, improvement: number}>;
    relationshipPatterns: Array<{relationship_type: string, patterns: string[], growth_areas: string[]}>;
    communicationEvolution: Array<{timeframe: string, old_style: string, new_style: string, contexts: string[]}>;
  };
  
  // Memory & Learning Analytics
  memoryAnalytics: {
    memoryRetention: number;
    learningSpeed: string;
    insightIntegration: number;
    patternRecognition: string[];
    memoryConnections: number;
    contextualRecall: number;
  };
}

/**
 * Generate exceptionally detailed personality profile
 */
export async function generateComprehensivePersonalityProfile(userId: number): Promise<ComprehensivePersonalityProfile> {
  try {
    console.log(`🧠 Generating comprehensive personality profile for user ${userId}`);
    
    // Gather extensive user data
    const [memories, facts, messages, moodEntries] = await Promise.all([
      storage.getUserMemories(userId),
      storage.getUserFacts(userId),
      storage.getUserMessages(userId, 100), // Last 100 messages for comprehensive analysis
      storage.getMoodEntries(userId).catch(() => [])
    ]);

    const memoryText = memories.map(m => m.memory).join('\n');
    const factText = facts.map(f => f.fact).join('\n');
    const conversationText = messages.slice(-20).map(m => 
      `${m.isBot ? 'AI' : 'User'}: ${m.content}`
    ).join('\n');
    const moodText = moodEntries.slice(-10).map(m => 
      `${m.mood}: ${m.intensity}/10 - ${m.context || 'No context'}`
    ).join('\n');

    const comprehensivePrompt = `
COMPREHENSIVE PERSONALITY ANALYSIS TASK:
Create an EXCEPTIONALLY DETAILED personality profile that captures every nuance of this individual's psychological, emotional, and behavioral patterns. This analysis must be SO SPECIFIC that it could NEVER apply to any other person.

USER DATA FOR ANALYSIS:
======================

MEMORY DATA:
${memoryText || 'No memories recorded yet'}

FACTUAL DATA:
${factText || 'No facts recorded yet'}

RECENT CONVERSATIONS:
${conversationText || 'No conversations recorded yet'}

MOOD PATTERNS:
${moodText || 'No mood data recorded yet'}

ANALYSIS REQUIREMENTS:
=====================

Provide a comprehensive analysis covering these detailed dimensions:

🗣️ COMMUNICATION ARCHITECTURE:
- Exact speech patterns, vocabulary preferences, sentence structure
- Conversation flow (interruption patterns, topic transitions, question styles)
- Digital communication quirks (punctuation, emojis, response timing)
- Active listening style and validation methods
- Conflict communication approach

💭 EMOTIONAL ARCHITECTURE:
- Primary emotional states with specific triggers
- Emotional regulation strategies (healthy and unhealthy patterns)
- Stress response patterns with physiological indicators
- Joy expressions and specific happiness triggers
- Grief processing style and loss handling mechanisms
- Anger expression patterns and conflict resolution
- Anxiety manifestations and management strategies

🧠 COGNITIVE ARCHITECTURE:
- Problem-solving methodology with decision trees
- Learning preferences and information processing style
- Memory patterns (detail vs. big picture orientation)
- Focus style and attention management
- Creative thinking patterns

🌟 IDENTITY ARCHITECTURE:
- Value hierarchy with priority ranking
- Core belief systems and worldview framework
- Identity markers and role identifications
- Purpose and meaning-making mechanisms
- Self-perception vs. external perception gaps

🚀 GROWTH ARCHITECTURE:
- Goal-setting patterns and achievement styles
- Success definitions and motivation drivers
- Failure handling and resilience mechanisms
- Growth mindset indicators and fixed mindset areas
- Risk tolerance and comfort zone boundaries

👥 RELATIONSHIP ARCHITECTURE:
- Attachment style with specific behavioral indicators
- Boundary setting and maintenance patterns
- Trust building and vulnerability comfort levels
- Support seeking and offering patterns
- Conflict resolution preferences

⚡ UNIQUE SIGNATURE PATTERNS:
- Distinctive mannerisms and behavioral quirks
- Humor style and laughter triggers
- Energy rhythms and intensity patterns
- Comfort needs and self-soothing methods
- Creative expression outlets

Respond with comprehensive JSON:`;

    const response = await retryOpenAIRequest(() =>
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert clinical psychologist specializing in comprehensive personality assessment. Create detailed, specific profiles that capture the unique psychological fingerprint of each individual."
          },
          {
            role: "user",
            content: comprehensivePrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2000
      })
    );

    const profileData = JSON.parse(response.choices[0]?.message?.content || '{}');
    console.log(`🧠 Generated comprehensive personality profile with ${Object.keys(profileData).length} dimensions`);
    
    return profileData as ComprehensivePersonalityProfile;

  } catch (error) {
    console.error('Error generating comprehensive personality profile:', error);
    return generateFallbackPersonalityProfile();
  }
}

/**
 * Generate comprehensive therapeutic statistics
 */
export async function generateComprehensiveStatistics(userId: number): Promise<ComprehensiveStatistics> {
  try {
    console.log(`📊 Generating comprehensive statistics for user ${userId}`);
    
    // Gather all available data
    const [messages, memories, semanticMemories, insights, moodEntries] = await Promise.all([
      storage.getUserMessages(userId, 200),
      storage.getUserMemories(userId),
      storage.getRecentSemanticMemories(userId, 50),
      storage.getMemoryInsights(userId).catch(() => []),
      storage.getMoodEntries(userId).catch(() => [])
    ]);

    const statisticsPrompt = `
COMPREHENSIVE THERAPEUTIC STATISTICS ANALYSIS:
Generate detailed, specific statistics and analytics that provide deep insights into this user's therapeutic journey, emotional patterns, and personal growth.

DATA FOR ANALYSIS:
=================

CONVERSATION DATA:
Total Messages: ${messages.length}
Recent Conversations: ${messages.slice(-10).map(m => `${m.isBot ? 'AI' : 'User'}: ${m.content}`).join('\n')}

MEMORY DATA:
Total Memories: ${memories.length}
Memory Content: ${memories.map(m => m.memory).join('\n')}

SEMANTIC MEMORIES:
Total Semantic Memories: ${semanticMemories.length}
Recent Semantic Content: ${semanticMemories.slice(-5).map(m => m.content).join('\n')}

THERAPEUTIC INSIGHTS:
Insights Count: ${insights.length}
Recent Insights: ${insights.slice(-3).map(i => i.insight || i.content).join('\n')}

MOOD DATA:
Mood Entries: ${moodEntries.length}
Recent Moods: ${moodEntries.slice(-5).map(m => `${m.mood}: ${m.intensity}/10`).join('\n')}

GENERATE COMPREHENSIVE STATISTICS:
================================

Analyze the data to provide detailed statistics in these categories:

1. CONVERSATION ANALYTICS (specific metrics, not generic)
2. EMOTIONAL JOURNEY ANALYTICS (detailed emotional patterns with contexts)
3. THERAPEUTIC PROGRESS ANALYTICS (specific milestones and breakthroughs)
4. BEHAVIORAL PATTERN ANALYTICS (decision-making and response patterns)
5. MEMORY & LEARNING ANALYTICS (retention and integration patterns)

Each statistic must be:
- SPECIFIC to this user's actual data
- DETAILED with context and examples
- THERAPEUTICALLY VALUABLE for understanding their journey
- NEVER generic or applicable to anyone else

Return comprehensive JSON with specific numerical and qualitative data.`;

    const response = await retryOpenAIRequest(() =>
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a therapeutic data analyst specializing in comprehensive user statistics. Generate detailed, specific analytics that provide deep insights into individual therapeutic journeys."
          },
          {
            role: "user",
            content: statisticsPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 2000
      })
    );

    const statisticsData = JSON.parse(response.choices[0]?.message?.content || '{}');
    console.log(`📊 Generated comprehensive statistics with detailed analytics`);
    
    return statisticsData as ComprehensiveStatistics;

  } catch (error) {
    console.error('Error generating comprehensive statistics:', error);
    return generateFallbackStatistics();
  }
}

/**
 * Generate detailed therapeutic reflection summary
 */
export async function generateDetailedReflectionSummary(userId: number): Promise<{
  personalityReflection: string;
  emotionalJourneyReflection: string;
  therapeuticInsights: string[];
  growthAnalysis: string;
  strengthsAndGrowthAreas: {
    strengths: string[];
    growthAreas: string[];
  };
  therapeuticRecommendations: string[];
}> {
  try {
    const profile = await generateComprehensivePersonalityProfile(userId);
    const statistics = await generateComprehensiveStatistics(userId);
    
    const reflectionPrompt = `
Based on this comprehensive personality profile and therapeutic statistics, generate a detailed reflection summary that provides deep, specific insights into this individual's therapeutic journey.

PERSONALITY PROFILE:
${JSON.stringify(profile, null, 2)}

THERAPEUTIC STATISTICS:
${JSON.stringify(statistics, null, 2)}

Generate a detailed reflection that includes:

1. PERSONALITY REFLECTION: A comprehensive paragraph about their unique personality patterns, communication style, and core identity markers
2. EMOTIONAL JOURNEY REFLECTION: Detailed analysis of their emotional patterns, growth, and journey
3. THERAPEUTIC INSIGHTS: Specific insights about their therapeutic development (minimum 5 detailed insights)
4. GROWTH ANALYSIS: Analysis of their personal growth trajectory and evolution
5. STRENGTHS AND GROWTH AREAS: Specific strengths they've shown and areas for continued development
6. THERAPEUTIC RECOMMENDATIONS: Specific, personalized recommendations for their continued journey

Each section must be:
- EXCEPTIONALLY DETAILED and specific to this individual
- Based on actual data patterns and behaviors
- Therapeutically valuable and insightful
- NEVER generic or applicable to anyone else

Return comprehensive JSON format.`;

    const response = await retryOpenAIRequest(() =>
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert therapeutic analyst creating comprehensive, personalized reflection summaries. Generate detailed insights that demonstrate deep understanding of the individual's unique therapeutic journey."
          },
          {
            role: "user",
            content: reflectionPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 2000
      })
    );

    return JSON.parse(response.choices[0]?.message?.content || '{}');

  } catch (error) {
    console.error('Error generating detailed reflection summary:', error);
    return generateFallbackReflection();
  }
}

// Fallback functions for error cases
function generateFallbackPersonalityProfile(): ComprehensivePersonalityProfile {
  return {
    communicationStyle: "Analysis in progress - gathering more conversational data for detailed profiling",
    speechPatterns: ["Pattern analysis developing", "Communication style emerging"],
    conversationFlow: "Conversation patterns being analyzed",
    digitalCommunicationStyle: "Digital communication patterns developing",
    listeningStyle: "Listening style assessment in progress",
    emotionalPatterns: ["Emotional patterns being identified", "Emotional response style developing"],
    emotionalRegulation: ["Regulation strategies being observed"],
    stressResponses: ["Stress response patterns emerging"],
    joyTriggers: ["Joy triggers being identified"],
    griefProcessing: "Grief processing style assessment developing",
    angerExpression: "Anger expression patterns being observed",
    anxietyPatterns: ["Anxiety management patterns emerging"],
    problemSolvingStyle: "Problem-solving approach analysis in progress",
    decisionMakingStyle: "Decision-making patterns being identified",
    learningStyle: "Learning preferences assessment developing",
    memoryPatterns: "Memory processing patterns emerging",
    focusStyle: "Focus and attention patterns being analyzed",
    valueHierarchy: ["Core values being identified", "Value priorities emerging"],
    beliefSystems: ["Belief systems being observed"],
    identityMarkers: ["Identity patterns developing"],
    purposeAndMeaning: "Purpose and meaning framework developing",
    selfPerception: "Self-perception patterns being analyzed",
    goalSettingPatterns: "Goal-setting approach being observed",
    successDefinitions: ["Success patterns emerging"],
    failureHandling: "Failure response patterns developing",
    growthMindset: "Growth orientation being assessed",
    riskTolerance: "Risk approach patterns emerging",
    attachmentStyle: "Attachment patterns being identified",
    boundaryPatterns: "Boundary setting style developing",
    conflictStyle: "Conflict resolution approach emerging",
    supportPatterns: ["Support patterns being observed"],
    trustBuilding: "Trust building patterns developing",
    uniqueMannerisms: ["Unique characteristics being identified"],
    humorStyle: "Humor style and preferences emerging",
    energyPatterns: "Energy rhythms being observed",
    comfortNeeds: ["Comfort preferences being identified"],
    creativeExpression: "Creative expression patterns developing"
  };
}

function generateFallbackStatistics(): ComprehensiveStatistics {
  return {
    conversationMetrics: {
      totalConversations: 0,
      averageLength: 0,
      topicDiversity: 0,
      emotionalRange: 0,
      communicationEvolution: ["Analysis developing"]
    },
    emotionalJourney: {
      dominantEmotions: [],
      emotionalVolatility: 0,
      emotionalGrowth: ["Emotional growth tracking initializing"],
      triggerPatterns: [],
      copingMechanisms: [],
      emotionalBreakthroughs: []
    },
    therapeuticProgress: {
      progressMarkers: [],
      skillDevelopment: [],
      insightEvolution: [],
      challengeResolution: [],
      resistancePatterns: []
    },
    behavioralPatterns: {
      decisionMakingPatterns: [],
      stressResponseEvolution: [],
      relationshipPatterns: [],
      communicationEvolution: []
    },
    memoryAnalytics: {
      memoryRetention: 0,
      learningSpeed: "Assessment in progress",
      insightIntegration: 0,
      patternRecognition: [],
      memoryConnections: 0,
      contextualRecall: 0
    }
  };
}

function generateFallbackReflection() {
  return {
    personalityReflection: "Comprehensive personality analysis is developing as we gather more interaction data. Your unique patterns and characteristics are being carefully observed and will become more detailed over time.",
    emotionalJourneyReflection: "Your emotional journey analysis is in progress. As we continue our conversations, detailed patterns in your emotional responses, triggers, and growth will emerge.",
    therapeuticInsights: [
      "Therapeutic pattern recognition is initializing",
      "Personal growth tracking is beginning", 
      "Communication style analysis is developing",
      "Emotional response patterns are being identified",
      "Individual strengths are being observed"
    ],
    growthAnalysis: "Your personal growth trajectory is being carefully tracked. As our therapeutic relationship develops, specific growth patterns and milestones will be identified and analyzed.",
    strengthsAndGrowthAreas: {
      strengths: ["Engagement in therapeutic process", "Openness to self-reflection"],
      growthAreas: ["Detailed growth areas will emerge through continued interaction"]
    },
    therapeuticRecommendations: [
      "Continue engaging in regular therapeutic conversations",
      "Share thoughts and feelings openly for better analysis",
      "Allow time for comprehensive patterns to develop",
      "Maintain consistency in communication for deeper insights"
    ]
  };
}

export default {
  generateComprehensivePersonalityProfile,
  generateComprehensiveStatistics,
  generateDetailedReflectionSummary
};