// Adaptive AI learning system for personalized therapeutic experiences
import OpenAI from 'openai';

export interface UserPreferences {
  id: number;
  userId: number;
  communicationStyle: 'formal' | 'casual' | 'warm' | 'direct' | 'supportive';
  preferredTopics: string[];
  avoidedTopics: string[];
  responseLength: 'brief' | 'moderate' | 'detailed';
  emotionalSupport: 'gentle' | 'motivational' | 'practical' | 'reflective';
  sessionTiming: 'morning' | 'afternoon' | 'evening' | 'flexible';
  exercisePreferences: string[];
  voicePreference: string;
  adaptationLevel: number; // 0.0-1.0 how much to adapt
  lastUpdated: Date;
}

export interface ConversationPattern {
  id: number;
  userId: number;
  pattern: string;
  frequency: number;
  effectiveness: number; // 0.0-1.0 based on user feedback
  category: 'greeting' | 'support' | 'guidance' | 'closure' | 'crisis';
  context: string;
  lastUsed: Date;
}

export interface WellnessRecommendation {
  id: string;
  type: 'exercise' | 'meditation' | 'journaling' | 'breathing' | 'activity';
  name: string;
  description: string;
  duration: number;
  difficulty: 'easy' | 'moderate' | 'challenging';
  tags: string[];
  personalizedReason: string;
  confidence: number; // 0.0-1.0
}

export interface AdaptationInsight {
  userId: number;
  conversationThemes: string[];
  emotionalPatterns: string[];
  effectiveApproaches: string[];
  preferredTimes: string[];
  wellnessNeeds: string[];
  learningProgress: number;
  confidenceScore: number;
}

// Analyze conversation patterns to extract user preferences
export async function analyzeConversationPatterns(
  userId: number,
  recentMessages: Array<{ sender: string; text: string; timestamp: Date }>,
  existingPreferences?: UserPreferences
): Promise<AdaptationInsight> {
  try {
    const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY']! });
    
    const userMessages = recentMessages
      .filter(msg => msg.sender === 'user')
      .slice(-20) // Analyze last 20 user messages
      .map(msg => msg.text)
      .join('\n');

    const analysisPrompt = `Analyze the following user messages from a therapeutic conversation to extract personalization insights. Focus on communication preferences, emotional patterns, and wellness needs.

User Messages:
${userMessages}

Existing Preferences: ${existingPreferences ? JSON.stringify(existingPreferences, null, 2) : 'None'}

Please analyze and provide insights in JSON format with these fields:
{
  "conversationThemes": ["array of main conversation topics"],
  "emotionalPatterns": ["array of recurring emotional states"],
  "effectiveApproaches": ["array of communication styles that seem to work"],
  "preferredTimes": ["array of preferred interaction times if mentioned"],
  "wellnessNeeds": ["array of wellness areas needing attention"],
  "learningProgress": number between 0-1,
  "confidenceScore": number between 0-1
}

Focus on:
- Communication style preferences (formal/casual, brief/detailed)
- Emotional support needs (gentle/motivational/practical)
- Topics that resonate vs those to avoid
- Wellness interests and effective interventions
- Time patterns and engagement preferences`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert in therapeutic communication analysis. Provide accurate, privacy-respectful insights for personalizing AI therapeutic interactions."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const analysis = JSON.parse(response.choices[0]?.message?.content || '{}');
    
    return {
      userId,
      conversationThemes: analysis.conversationThemes || [],
      emotionalPatterns: analysis.emotionalPatterns || [],
      effectiveApproaches: analysis.effectiveApproaches || [],
      preferredTimes: analysis.preferredTimes || [],
      wellnessNeeds: analysis.wellnessNeeds || [],
      learningProgress: analysis.learningProgress || 0.1,
      confidenceScore: analysis.confidenceScore || 0.1
    };
  } catch (error) {
    console.error('Error analyzing conversation patterns:', error);
    // Return basic insight with low confidence
    return {
      userId,
      conversationThemes: ['general support'],
      emotionalPatterns: ['varied'],
      effectiveApproaches: ['supportive'],
      preferredTimes: ['flexible'],
      wellnessNeeds: ['emotional support'],
      learningProgress: 0.1,
      confidenceScore: 0.1
    };
  }
}

// Generate personalized wellness recommendations
export async function generatePersonalizedRecommendations(
  insight: AdaptationInsight,
  userPreferences?: UserPreferences,
  recentActivities: string[] = []
): Promise<WellnessRecommendation[]> {
  
  const baseRecommendations: WellnessRecommendation[] = [
    {
      id: 'personalized-breathing',
      type: 'breathing',
      name: 'Personalized Breathing Exercise',
      description: 'Breathing exercise tailored to your current emotional state',
      duration: 5,
      difficulty: 'easy',
      tags: ['stress-relief', 'anxiety', 'calming'],
      personalizedReason: 'Based on your recent stress patterns',
      confidence: 0.8
    },
    {
      id: 'adaptive-meditation',
      type: 'meditation',
      name: 'Adaptive Mindfulness Session',
      description: 'Meditation practice adjusted to your preferences and needs',
      duration: 10,
      difficulty: 'moderate',
      tags: ['mindfulness', 'emotional-regulation', 'self-awareness'],
      personalizedReason: 'Matches your mindfulness interests',
      confidence: 0.7
    },
    {
      id: 'mood-boosting-activity',
      type: 'activity',
      name: 'Personalized Mood Booster',
      description: 'Activity designed to lift your spirits based on what works for you',
      duration: 15,
      difficulty: 'easy',
      tags: ['mood-improvement', 'energy', 'positivity'],
      personalizedReason: 'Based on activities you\'ve enjoyed before',
      confidence: 0.6
    },
    {
      id: 'reflective-journaling',
      type: 'journaling',
      name: 'Guided Reflection Prompt',
      description: 'Journaling prompt tailored to your current growth areas',
      duration: 20,
      difficulty: 'moderate',
      tags: ['self-reflection', 'personal-growth', 'clarity'],
      personalizedReason: 'Addresses themes you\'ve been exploring',
      confidence: 0.7
    }
  ];

  // Personalize recommendations based on insights
  const personalizedRecommendations = baseRecommendations.map(rec => {
    let personalizedRec = { ...rec };
    
    // Adjust based on emotional patterns
    if (insight.emotionalPatterns.includes('anxiety') && rec.type === 'breathing') {
      personalizedRec.personalizedReason = 'Specifically designed for your anxiety management needs';
      personalizedRec.confidence = Math.min(0.9, personalizedRec.confidence + 0.2);
    }
    
    if (insight.emotionalPatterns.includes('depression') && rec.type === 'activity') {
      personalizedRec.personalizedReason = 'Gentle activity to support your mood during difficult times';
      personalizedRec.difficulty = 'easy';
      personalizedRec.confidence = Math.min(0.9, personalizedRec.confidence + 0.15);
    }
    
    // Adjust based on conversation themes
    if (insight.conversationThemes.includes('self-improvement') && rec.type === 'meditation') {
      personalizedRec.personalizedReason = 'Supports your personal growth journey';
      personalizedRec.confidence = Math.min(0.9, personalizedRec.confidence + 0.1);
    }
    
    // Adjust based on user preferences
    if (userPreferences) {
      if (userPreferences.responseLength === 'brief' && rec.duration > 10) {
        personalizedRec.duration = Math.max(5, rec.duration - 5);
        personalizedRec.personalizedReason += ' (shortened to match your preference)';
      }
      
      if (userPreferences.exercisePreferences.includes(rec.type)) {
        personalizedRec.confidence = Math.min(0.95, personalizedRec.confidence + 0.15);
        personalizedRec.personalizedReason = `Perfect match for your ${rec.type} preferences`;
      }
    }
    
    return personalizedRec;
  });

  // Filter out recently used activities to avoid repetition
  return personalizedRecommendations.filter(rec => 
    !recentActivities.includes(rec.id)
  ).slice(0, 3); // Return top 3 recommendations
}

// Adapt conversation response based on learned preferences
export async function adaptConversationResponse(
  originalResponse: string,
  userMessage: string,
  preferences: UserPreferences,
  conversationContext: string[]
): Promise<string> {
  
  if (preferences.adaptationLevel < 0.3) {
    return originalResponse; // Minimal adaptation
  }
  
  try {
    const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY']! });
    
    const adaptationPrompt = `Adapt the following therapeutic response to match the user's learned preferences and communication style.

Original Response: "${originalResponse}"
User Message: "${userMessage}"
Recent Context: ${conversationContext.slice(-3).join(' | ')}

User Preferences:
- Communication Style: ${preferences.communicationStyle}
- Response Length: ${preferences.responseLength}
- Emotional Support: ${preferences.emotionalSupport}
- Adaptation Level: ${preferences.adaptationLevel}

Guidelines:
1. Maintain therapeutic value and empathy
2. Adjust tone and style to match preferences
3. Keep the core message intact
4. Respect the user's emotional state
5. Make it feel natural and personalized

Please provide the adapted response that maintains therapeutic effectiveness while matching the user's preferences.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert therapeutic communication adapter. Personalize responses while maintaining therapeutic value and authenticity."
        },
        {
          role: "user",
          content: adaptationPrompt
        }
      ],
      temperature: 0.4
    });

    return response.choices[0]?.message?.content || originalResponse;
  } catch (error) {
    console.error('Error adapting conversation response:', error);
    return originalResponse;
  }
}

// Learn from user feedback to improve personalization
export function updatePersonalizationFromFeedback(
  preferences: UserPreferences,
  feedback: {
    responseQuality: number; // 1-5
    helpfulness: number; // 1-5
    personalRelevance: number; // 1-5
    communicationMatch: number; // 1-5
  }
): UserPreferences {
  
  const avgFeedback = (
    feedback.responseQuality + 
    feedback.helpfulness + 
    feedback.personalRelevance + 
    feedback.communicationMatch
  ) / 4;
  
  // Adjust adaptation level based on feedback
  if (avgFeedback >= 4) {
    preferences.adaptationLevel = Math.min(1.0, preferences.adaptationLevel + 0.1);
  } else if (avgFeedback <= 2) {
    preferences.adaptationLevel = Math.max(0.1, preferences.adaptationLevel - 0.1);
  }
  
  // Adjust communication style if communication match is low
  if (feedback.communicationMatch <= 2) {
    const styles = ['formal', 'casual', 'warm', 'direct', 'supportive'] as const;
    const currentIndex = styles.indexOf(preferences.communicationStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    preferences.communicationStyle = styles[nextIndex] || 'supportive';
  }
  
  preferences.lastUpdated = new Date();
  return preferences;
}

// Generate contextual wellness insights
export function generateWellnessInsights(
  insight: AdaptationInsight,
  preferences?: UserPreferences
): string[] {
  const insights: string[] = [];
  
  // Emotional pattern insights
  if (insight.emotionalPatterns.includes('anxiety')) {
    insights.push("I've noticed anxiety is a recurring theme. Regular breathing exercises might be particularly helpful for you.");
  }
  
  if (insight.emotionalPatterns.includes('stress')) {
    insights.push("Your stress patterns suggest you might benefit from shorter, more frequent mindfulness breaks.");
  }
  
  // Conversation theme insights
  if (insight.conversationThemes.includes('work-life-balance')) {
    insights.push("You often discuss work-life balance. Consider setting boundaries and prioritizing self-care activities.");
  }
  
  if (insight.conversationThemes.includes('relationships')) {
    insights.push("Relationship topics come up frequently. Practicing loving-kindness meditation might support your connections.");
  }
  
  // Wellness need insights
  if (insight.wellnessNeeds.includes('sleep')) {
    insights.push("Sleep appears to be a concern. Evening relaxation routines could improve your sleep quality.");
  }
  
  if (insight.wellnessNeeds.includes('energy')) {
    insights.push("You've mentioned energy levels. Morning energizing exercises might help start your day positively.");
  }
  
  // Preference-based insights
  if (preferences?.sessionTiming === 'morning') {
    insights.push("Since you prefer morning sessions, consider establishing a consistent morning wellness routine.");
  }
  
  return insights.slice(0, 2); // Return top 2 most relevant insights
}