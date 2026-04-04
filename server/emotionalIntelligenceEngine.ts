import { openai } from './openaiRetry.js';
import * as schema from '../shared/schema.js';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';

// Interface definitions for advanced emotional intelligence
export interface MoodForecast {
  userId: number;
  forecastDate: Date;
  predictedMood: string;
  confidenceScore: number; // 0.0-1.0
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  triggerFactors: string[];
  preventiveRecommendations: string[];
  historicalPatterns: any;
}

export interface EmotionalContext {
  currentMood: string;
  intensity: number; // 1-10
  volatility: number; // 0.0-1.0 (recent emotional changes)
  urgency: 'low' | 'medium' | 'high' | 'critical';
  recentTriggers: string[];
  supportNeeds: string[];
}

export interface ContextualResponse {
  tone: 'empathetic' | 'supportive' | 'calming' | 'energizing' | 'validating' | 'crisis';
  intensity: 'gentle' | 'moderate' | 'strong' | 'urgent';
  responseLength: 'brief' | 'moderate' | 'detailed' | 'comprehensive';
  communicationStyle: string;
  priorityFocus: string[];
}

export interface PredictiveInsight {
  insight: string;
  probability: number;
  timeframe: string; // "next 24 hours", "next 3 days", etc.
  preventiveActions: string[];
  riskMitigation: string[];
}

// Predictive Mood Forecasting Functions
export async function generateMoodForecast(userId: number, storage: any): Promise<MoodForecast> {
  try {
    // Get historical mood data (last 30 days)
    const historicalMoods = await storage.getMoodEntries(userId, 30);
    const recentPatterns = await storage.getEmotionalPattern(userId);
    const journalEntries = await storage.getJournalEntries(userId, 10);
    
    // Analyze patterns for forecasting
    const moodAnalysis = await analyzeMoodPatterns(historicalMoods, journalEntries, recentPatterns);
    
    // Generate AI-powered forecast
    const forecastPrompt = `
    Based on the following emotional and mood data, provide a predictive mood forecast:
    
    Historical Mood Patterns: ${JSON.stringify(moodAnalysis.patterns)}
    Recent Emotional Trends: ${JSON.stringify(moodAnalysis.trends)}
    Identified Triggers: ${JSON.stringify(moodAnalysis.triggers)}
    Coping Effectiveness: ${JSON.stringify(moodAnalysis.copingEffectiveness)}
    
    Provide a JSON response with:
    - predictedMood: most likely mood state in next 24-48 hours
    - confidenceScore: confidence in prediction (0.0-1.0)
    - riskLevel: emotional risk assessment (low/medium/high/critical)
    - triggerFactors: potential triggers to watch for
    - preventiveRecommendations: specific actions to maintain/improve mood
    - timeBasedInsights: insights based on time patterns (weekday/weekend, time of day)
    
    Focus on therapeutic value and actionable insights.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert emotional intelligence AI specialized in mood forecasting and preventive mental health. Provide accurate, therapeutic predictions based on emotional patterns."
        },
        {
          role: "user",
          content: forecastPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const forecastData = JSON.parse(response.choices[0]?.message?.content || '{}');
    
    const moodForecast: MoodForecast = {
      userId,
      forecastDate: new Date(),
      predictedMood: forecastData.predictedMood || 'neutral',
      confidenceScore: forecastData.confidenceScore || 0.5,
      riskLevel: forecastData.riskLevel || 'low',
      triggerFactors: forecastData.triggerFactors || [],
      preventiveRecommendations: forecastData.preventiveRecommendations || [],
      historicalPatterns: moodAnalysis
    };

    // Store forecast for tracking accuracy
    await storage.createMoodForecast(moodForecast);
    
    return moodForecast;

  } catch (error) {
    console.error('Error generating mood forecast:', error);
    throw error;
  }
}

export async function analyzeMoodPatterns(moodEntries: any[], journalEntries: any[], emotionalPattern: any) {
  // Analyze mood volatility
  const moodVolatility = calculateMoodVolatility(moodEntries);
  
  // Identify temporal patterns
  const temporalPatterns = identifyTemporalPatterns(moodEntries);
  
  // Extract trigger patterns from journal entries
  const triggerPatterns = await extractTriggerPatterns(journalEntries);
  
  // Analyze coping strategy effectiveness
  const copingEffectiveness = analyzeCopingEffectiveness(moodEntries, journalEntries);
  
  return {
    patterns: {
      volatility: moodVolatility,
      temporal: temporalPatterns,
      triggers: triggerPatterns,
      baseline: calculateBaselineMood(moodEntries)
    },
    trends: {
      recent: calculateRecentTrend(moodEntries),
      weekly: calculateWeeklyTrend(moodEntries),
      monthly: calculateMonthlyTrend(moodEntries)
    },
    triggers: triggerPatterns,
    copingEffectiveness
  };
}

export function calculateMoodVolatility(moodEntries: any[]): number {
  if (moodEntries.length < 2) return 0;
  
  const intensities = moodEntries.map(entry => entry.intensity);
  const mean = intensities.reduce((sum, val) => sum + val, 0) / intensities.length;
  const variance = intensities.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intensities.length;
  
  return Math.sqrt(variance) / 10; // Normalize to 0-1 scale
}

export function identifyTemporalPatterns(moodEntries: any[]) {
  const dayOfWeekPatterns: Record<number, { total: number; count: number; average?: number }> = {};
  const timeOfDayPatterns: Record<string, { total: number; count: number; average?: number }> = {};
  
  moodEntries.forEach(entry => {
    const date = new Date(entry.createdAt);
    const dayOfWeek = date.getDay();
    const hour = date.getHours();
    
    // Day of week patterns
    if (!dayOfWeekPatterns[dayOfWeek]) {
      dayOfWeekPatterns[dayOfWeek] = { total: 0, count: 0 };
    }
    dayOfWeekPatterns[dayOfWeek].total += entry.intensity;
    dayOfWeekPatterns[dayOfWeek].count += 1;
    
    // Time of day patterns (morning, afternoon, evening, night)
    const timeSlot = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    if (!timeOfDayPatterns[timeSlot]) {
      timeOfDayPatterns[timeSlot] = { total: 0, count: 0 };
    }
    timeOfDayPatterns[timeSlot].total += entry.intensity;
    timeOfDayPatterns[timeSlot].count += 1;
  });
  
  // Calculate averages
  Object.keys(dayOfWeekPatterns).forEach(day => {
    const dayKey = parseInt(day);
    const pattern = dayOfWeekPatterns[dayKey];
    if (pattern) {
      pattern.average = pattern.total / pattern.count;
    }
  });
  
  Object.keys(timeOfDayPatterns).forEach(time => {
    const pattern = timeOfDayPatterns[time];
    if (pattern) {
      pattern.average = pattern.total / pattern.count;
    }
  });
  
  return { dayOfWeek: dayOfWeekPatterns, timeOfDay: timeOfDayPatterns };
}

export async function extractTriggerPatterns(journalEntries: any[]): Promise<string[]> {
  const triggers: string[] = [];
  
  for (const entry of journalEntries) {
    if (entry.triggers && Array.isArray(entry.triggers)) {
      triggers.push(...entry.triggers);
    }
    
    // Extract triggers from text analysis if available
    if (entry.content) {
      const extractedTriggers = await analyzeTextForTriggers(entry.content);
      triggers.push(...extractedTriggers);
    }
  }
  
  // Count frequency and return most common triggers
  const triggerFreq: Record<string, number> = {};
  triggers.forEach(trigger => {
    triggerFreq[trigger] = (triggerFreq[trigger] || 0) + 1;
  });
  
  return Object.entries(triggerFreq)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([trigger]) => trigger);
}

export async function analyzeTextForTriggers(text: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "Extract emotional triggers from the following text. Return a JSON array of triggers (max 3). Focus on specific situations, people, thoughts, or events that may have contributed to emotional changes."
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{"triggers": []}');
    return result.triggers || [];
  } catch (error) {
    console.error('Error analyzing text for triggers:', error);
    return [];
  }
}

export function analyzeCopingEffectiveness(moodEntries: any[], journalEntries: any[]) {
  // Analyze patterns between coping strategies mentioned in journals and subsequent mood improvements
  const copingStrategies = ['meditation', 'exercise', 'journaling', 'social support', 'breathing', 'mindfulness'];
  const effectiveness: Record<string, { usage: number; avgImprovement: number; effectiveness: string }> = {};
  
  copingStrategies.forEach(strategy => {
    const strategyMentions = journalEntries.filter(entry => 
      entry.content && entry.content.toLowerCase().includes(strategy)
    );
    
    if (strategyMentions.length > 0) {
      // Calculate mood improvement after strategy use
      const improvements = strategyMentions.map(mention => {
        const mentionDate = new Date(mention.createdAt);
        const subsequentMoods = moodEntries.filter(mood => 
          new Date(mood.createdAt) > mentionDate && 
          new Date(mood.createdAt) <= new Date(mentionDate.getTime() + 24 * 60 * 60 * 1000)
        );
        
        if (subsequentMoods.length > 0) {
          const avgAfter = subsequentMoods.reduce((sum, mood) => sum + mood.intensity, 0) / subsequentMoods.length;
          return avgAfter;
        }
        return null;
      }).filter((val): val is number => val !== null);
      
      if (improvements.length > 0) {
        effectiveness[strategy] = {
          usage: strategyMentions.length,
          avgImprovement: improvements.reduce((sum, val) => sum + val, 0) / improvements.length,
          effectiveness: improvements.length > 2 ? 'high' : improvements.length > 0 ? 'moderate' : 'low'
        };
      }
    }
  });
  
  return effectiveness;
}

export function calculateBaselineMood(moodEntries: any[]): number {
  if (moodEntries.length === 0) return 5;
  return moodEntries.reduce((sum, entry) => sum + entry.intensity, 0) / moodEntries.length;
}

export function calculateRecentTrend(moodEntries: any[]): string {
  if (moodEntries.length < 3) return 'insufficient_data';
  
  const recent = moodEntries.slice(0, 3);
  const older = moodEntries.slice(3, 6);
  
  const recentAvg = recent.reduce((sum, entry) => sum + entry.intensity, 0) / recent.length;
  const olderAvg = older.length > 0 ? older.reduce((sum, entry) => sum + entry.intensity, 0) / older.length : recentAvg;
  
  const change = recentAvg - olderAvg;
  
  if (change > 1) return 'improving';
  if (change < -1) return 'declining';
  return 'stable';
}

export function calculateWeeklyTrend(moodEntries: any[]): string {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentWeek = moodEntries.filter(entry => new Date(entry.createdAt) >= oneWeekAgo);
  const previousWeek = moodEntries.filter(entry => {
    const entryDate = new Date(entry.createdAt);
    return entryDate < oneWeekAgo && entryDate >= new Date(oneWeekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
  });
  
  if (recentWeek.length === 0) return 'no_data';
  
  const recentAvg = recentWeek.reduce((sum, entry) => sum + entry.intensity, 0) / recentWeek.length;
  const previousAvg = previousWeek.length > 0 ? 
    previousWeek.reduce((sum, entry) => sum + entry.intensity, 0) / previousWeek.length : recentAvg;
  
  const change = recentAvg - previousAvg;
  
  if (change > 0.5) return 'improving';
  if (change < -0.5) return 'declining';
  return 'stable';
}

export function calculateMonthlyTrend(moodEntries: any[]): string {
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentMonth = moodEntries.filter(entry => new Date(entry.createdAt) >= oneMonthAgo);
  
  if (recentMonth.length < 5) return 'insufficient_data';
  
  // Calculate trend using linear regression
  const points = recentMonth.map((entry, index) => ({
    x: index,
    y: entry.intensity
  }));
  
  const n = points.length;
  const sumX = points.reduce((sum, point) => sum + point.x, 0);
  const sumY = points.reduce((sum, point) => sum + point.y, 0);
  const sumXY = points.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumXX = points.reduce((sum, point) => sum + point.x * point.x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  if (slope > 0.1) return 'improving';
  if (slope < -0.1) return 'declining';
  return 'stable';
}

// Contextual Emotional Response Functions
export async function generateContextualResponse(
  userMessage: string,
  emotionalContext: EmotionalContext,
  storage: any,
  userId: number
): Promise<ContextualResponse> {
  try {
    // Analyze current emotional state and urgency
    const responseContext = await determineResponseContext(emotionalContext, userMessage);
    
    // Get user's communication preferences
    const userPrefs = await storage.getUserPreferences(userId);
    
    // Generate contextually appropriate response parameters
    const contextPrompt = `
    Based on the user's current emotional state and message, determine the optimal response approach:
    
    Current Emotional Context:
    - Mood: ${emotionalContext.currentMood}
    - Intensity: ${emotionalContext.intensity}/10
    - Volatility: ${emotionalContext.volatility}
    - Urgency: ${emotionalContext.urgency}
    - Recent Triggers: ${emotionalContext.recentTriggers.join(', ')}
    - Support Needs: ${emotionalContext.supportNeeds.join(', ')}
    
    User Message: "${userMessage}"
    
    User Preferences: ${JSON.stringify(userPrefs)}
    
    Provide a JSON response with:
    - tone: optimal emotional tone (empathetic/supportive/calming/energizing/validating/crisis)
    - intensity: response intensity (gentle/moderate/strong/urgent)
    - responseLength: appropriate length (brief/moderate/detailed/comprehensive)
    - communicationStyle: specific style description
    - priorityFocus: array of key focus areas for the response
    - immediateActions: if urgency is high, specific immediate actions to suggest
    - followUpRecommendations: longer-term recommendations based on context
    
    Prioritize therapeutic value and emotional safety.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert in contextual emotional intelligence for therapeutic AI. Determine the optimal response approach based on emotional context and urgency."
        },
        {
          role: "user",
          content: contextPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const contextData = JSON.parse(response.choices[0]?.message?.content || '{}');
    
    const contextualResponse: ContextualResponse = {
      tone: contextData.tone || 'supportive',
      intensity: contextData.intensity || 'moderate',
      responseLength: contextData.responseLength || 'moderate',
      communicationStyle: contextData.communicationStyle || 'warm and supportive',
      priorityFocus: contextData.priorityFocus || ['emotional validation', 'support']
    };

    return contextualResponse;

  } catch (error) {
    console.error('Error generating contextual response:', error);
    // Return safe default response context
    return {
      tone: 'supportive',
      intensity: 'gentle',
      responseLength: 'moderate',
      communicationStyle: 'warm and empathetic',
      priorityFocus: ['emotional validation', 'safety']
    };
  }
}

export async function determineResponseContext(
  emotionalContext: EmotionalContext,
  userMessage: string
): Promise<any> {
  // Analyze urgency indicators in message
  const urgencyKeywords = ['crisis', 'emergency', 'help', 'suicide', 'harm', 'can\'t cope', 'overwhelmed'];
  const hasUrgencyIndicators = urgencyKeywords.some(keyword => 
    userMessage.toLowerCase().includes(keyword)
  );
  
  // Analyze emotional volatility
  const isHighVolatility = emotionalContext.volatility > 0.7;
  const isLowMood = emotionalContext.intensity <= 3;
  const isHighIntensity = emotionalContext.intensity >= 8;
  
  return {
    hasUrgencyIndicators,
    isHighVolatility,
    isLowMood,
    isHighIntensity,
    recommendedApproach: determineApproach(emotionalContext, hasUrgencyIndicators),
    riskLevel: determineRiskLevel(emotionalContext, hasUrgencyIndicators)
  };
}

export function determineApproach(emotionalContext: EmotionalContext, hasUrgencyIndicators: boolean): string {
  if (hasUrgencyIndicators || emotionalContext.urgency === 'critical') {
    return 'crisis_intervention';
  }
  
  if (emotionalContext.volatility > 0.7) {
    return 'stabilizing';
  }
  
  if (emotionalContext.intensity <= 3) {
    return 'uplifting';
  }
  
  if (emotionalContext.intensity >= 8) {
    return 'calming';
  }
  
  return 'supportive';
}

export function determineRiskLevel(emotionalContext: EmotionalContext, hasUrgencyIndicators: boolean): string {
  if (hasUrgencyIndicators) return 'critical';
  if (emotionalContext.urgency === 'critical') return 'critical';
  if (emotionalContext.volatility > 0.8 && emotionalContext.intensity <= 2) return 'high';
  if (emotionalContext.volatility > 0.6 || emotionalContext.intensity <= 3) return 'medium';
  return 'low';
}

// Enhanced Response Generation with Emotional Context
export async function generateEmotionallyIntelligentResponse(
  userMessage: string,
  userId: number,
  storage: any
): Promise<string> {
  try {
    // Get current emotional context
    const recentMoods = await storage.getMoodEntries(userId, 3);
    const emotionalPattern = await storage.getEmotionalPattern(userId);
    
    // Build emotional context
    const emotionalContext: EmotionalContext = {
      currentMood: recentMoods[0]?.emotion || 'neutral',
      intensity: recentMoods[0]?.intensity || 5,
      volatility: calculateMoodVolatility(recentMoods),
      urgency: determineUrgency(recentMoods, userMessage),
      recentTriggers: emotionalPattern?.triggers || [],
      supportNeeds: determineSupportNeeds(recentMoods, userMessage)
    };
    
    // Get contextual response parameters
    const responseContext = await generateContextualResponse(userMessage, emotionalContext, storage, userId);
    
    // Generate response with emotional intelligence
    const responsePrompt = `
    Generate a therapeutically appropriate response based on this emotional context:
    
    User Message: "${userMessage}"
    
    Response Context:
    - Tone: ${responseContext.tone}
    - Intensity: ${responseContext.intensity}
    - Length: ${responseContext.responseLength}
    - Style: ${responseContext.communicationStyle}
    - Priority Focus: ${responseContext.priorityFocus.join(', ')}
    
    Current Emotional State:
    - Mood: ${emotionalContext.currentMood}
    - Intensity: ${emotionalContext.intensity}/10
    - Volatility: ${emotionalContext.volatility}
    - Urgency: ${emotionalContext.urgency}
    
    Generate a response that:
    1. Matches the specified tone and intensity
    2. Addresses the priority focus areas
    3. Provides appropriate therapeutic support
    4. Includes specific, actionable recommendations if needed
    5. Maintains emotional safety and validation
    
    Adapt your language, empathy level, and suggestions to match the emotional context.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an emotionally intelligent therapeutic AI companion. Adapt your responses to match the user's emotional state and needs while providing genuine support and guidance."
        },
        {
          role: "user",
          content: responsePrompt
        }
      ],
      temperature: 0.7,
      max_tokens: getMaxTokensForLength(responseContext.responseLength)
    });

    return response.choices[0]?.message?.content || "I'm here to support you. How are you feeling right now?";

  } catch (error) {
    console.error('Error generating emotionally intelligent response:', error);
    return "I understand you're reaching out, and I want you to know that I'm here to support you. How are you feeling right now?";
  }
}

export function determineUrgency(recentMoods: any[], userMessage: string): 'low' | 'medium' | 'high' | 'critical' {
  const urgencyKeywords = ['crisis', 'emergency', 'suicide', 'harm', 'can\'t cope'];
  const hasUrgencyIndicators = urgencyKeywords.some(keyword => 
    userMessage.toLowerCase().includes(keyword)
  );
  
  if (hasUrgencyIndicators) return 'critical';
  
  if (recentMoods.length > 0) {
    const avgIntensity = recentMoods.reduce((sum, mood) => sum + mood.intensity, 0) / recentMoods.length;
    
    if (avgIntensity <= 2) return 'high';
    if (avgIntensity <= 4) return 'medium';
  }
  
  return 'low';
}

export function determineSupportNeeds(recentMoods: any[], userMessage: string): string[] {
  const supportNeeds = [];
  
  // Analyze message content for support needs
  if (userMessage.toLowerCase().includes('lonely') || userMessage.toLowerCase().includes('alone')) {
    supportNeeds.push('social connection');
  }
  
  if (userMessage.toLowerCase().includes('anxious') || userMessage.toLowerCase().includes('worried')) {
    supportNeeds.push('anxiety management');
  }
  
  if (userMessage.toLowerCase().includes('sad') || userMessage.toLowerCase().includes('depressed')) {
    supportNeeds.push('mood elevation');
  }
  
  if (userMessage.toLowerCase().includes('stress') || userMessage.toLowerCase().includes('overwhelmed')) {
    supportNeeds.push('stress relief');
  }
  
  // Analyze mood patterns for support needs
  if (recentMoods.length > 0) {
    const avgIntensity = recentMoods.reduce((sum, mood) => sum + mood.intensity, 0) / recentMoods.length;
    
    if (avgIntensity <= 3) {
      supportNeeds.push('emotional validation', 'gentle encouragement');
    }
    
    if (avgIntensity >= 8) {
      supportNeeds.push('calming techniques', 'grounding exercises');
    }
  }
  
  return supportNeeds.length > 0 ? supportNeeds : ['general support', 'active listening'];
}

export function getMaxTokensForLength(responseLength: string): number {
  switch (responseLength) {
    case 'brief': return 100;
    case 'moderate': return 200;
    case 'detailed': return 400;
    case 'comprehensive': return 600;
    default: return 200;
  }
}
