import { openai, retryOpenAIRequest } from "./openaiRetry";

export interface EmotionalState {
  primaryEmotion: string;
  intensity: number; // 0.0 to 1.0
  valence: number; // -1.0 (negative) to 1.0 (positive)
  arousal: number; // 0.0 (calm) to 1.0 (excited)
  confidence: number; // 0.0 to 1.0
  supportiveResponse?: string;
  recommendedActions?: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface MoodEntry {
  id: number;
  userId: number;
  emotion: string;
  intensity: number;
  valence: number;
  arousal: number;
  context: string;
  timestamp: Date;
  sessionId?: string;
}

export interface EmotionalPattern {
  dominantEmotions: string[];
  averageValence: number;
  averageArousal: number;
  emotionalVolatility: number;
  trendDirection: 'improving' | 'declining' | 'stable';
  triggerPatterns: string[];
  copingStrategies: string[];
}

const EMOTION_KEYWORDS = {
  anxiety: ['anxious', 'worried', 'nervous', 'panic', 'stress', 'overwhelmed', 'scared', 'fear'],
  depression: ['sad', 'down', 'empty', 'hopeless', 'worthless', 'numb', 'tired', 'exhausted'],
  anger: ['angry', 'frustrated', 'irritated', 'mad', 'furious', 'annoyed', 'rage'],
  joy: ['happy', 'excited', 'joyful', 'great', 'amazing', 'wonderful', 'fantastic', 'love'],
  grief: ['loss', 'grief', 'mourning', 'miss', 'gone', 'died', 'death'],
  confusion: ['confused', 'lost', 'uncertain', 'unclear', 'mixed up', 'puzzled'],
  guilt: ['guilty', 'shame', 'regret', 'sorry', 'fault', 'blame'],
  pride: ['proud', 'accomplished', 'achieved', 'success', 'win', 'victory']
};

export async function analyzeEmotionalState(
  message: string,
  conversationHistory: string[] = [],
  userId: number
): Promise<EmotionalState> {
  try {
    // Quick keyword-based analysis for immediate response
    const quickAnalysis = performQuickEmotionalAnalysis(message);
    
    // Enhanced analysis with OpenAI for deeper understanding
    const prompt = constructEmotionalAnalysisPrompt(message, conversationHistory);
    
    const response = await retryOpenAIRequest(() =>
      openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a mental health AI assistant specializing in emotional analysis. Provide detailed emotional assessment with therapeutic insights. Respond with JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      })
    );

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      primaryEmotion: analysis.primaryEmotion || quickAnalysis.primaryEmotion || 'neutral',
      intensity: Math.max(0, Math.min(1, analysis.intensity || quickAnalysis.intensity || 0.5)),
      valence: Math.max(-1, Math.min(1, analysis.valence || quickAnalysis.valence || 0)),
      arousal: Math.max(0, Math.min(1, analysis.arousal || quickAnalysis.arousal || 0.5)),
      confidence: Math.max(0, Math.min(1, analysis.confidence || 0.7)),
      supportiveResponse: analysis.supportiveResponse,
      recommendedActions: analysis.recommendedActions || generateRecommendedActions(quickAnalysis.primaryEmotion || 'neutral'),
      riskLevel: determineRiskLevel(analysis, message)
    };
  } catch (error) {
    console.error('Error in emotional analysis:', error);
    // Fallback to quick analysis
    const quickAnalysis = performQuickEmotionalAnalysis(message);
    return {
      primaryEmotion: quickAnalysis.primaryEmotion || 'neutral',
      intensity: quickAnalysis.intensity || 0.5,
      valence: quickAnalysis.valence || 0,
      arousal: quickAnalysis.arousal || 0.5,
      confidence: 0.5,
      recommendedActions: generateRecommendedActions(quickAnalysis.primaryEmotion || 'neutral'),
      riskLevel: determineRiskLevel(quickAnalysis, message)
    };
  }
}

function performQuickEmotionalAnalysis(message: string): Partial<EmotionalState> {
  // Handle case where message might not be a string
  const messageStr = typeof message === 'string' ? message : String(message || '');
  const lowerMessage = messageStr.toLowerCase();
  let scores: { [emotion: string]: number } = {};
  
  // Score each emotion based on keyword matches
  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    scores[emotion] = keywords.reduce((score, keyword) => {
      const matches = (lowerMessage.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
      return score + matches;
    }, 0);
  }
  
  // Find dominant emotion
  const primaryEmotion = Object.keys(scores).reduce((a, b) => 
    scores[a] > scores[b] ? a : b
  ) || 'neutral';
  
  // Calculate intensity based on keyword density and intensity words
  const intensityWords = ['very', 'extremely', 'really', 'so', 'incredibly', 'absolutely'];
  const intensityBoost = intensityWords.some(word => lowerMessage.includes(word)) ? 0.3 : 0;
  const intensity = Math.min(1, (scores[primaryEmotion] * 0.2) + intensityBoost + 0.3);
  
  // Calculate valence (positive/negative)
  const positiveEmotions = ['joy', 'pride'];
  const negativeEmotions = ['anxiety', 'depression', 'anger', 'grief', 'guilt'];
  let valence = 0;
  
  if (positiveEmotions.includes(primaryEmotion)) {
    valence = intensity;
  } else if (negativeEmotions.includes(primaryEmotion)) {
    valence = -intensity;
  }
  
  // Calculate arousal (energy level)
  const highArousalEmotions = ['anxiety', 'anger', 'joy'];
  const arousal = highArousalEmotions.includes(primaryEmotion) ? intensity : intensity * 0.5;
  
  return {
    primaryEmotion,
    intensity,
    valence,
    arousal
  };
}

function constructEmotionalAnalysisPrompt(message: string, history: string[]): string {
  const context = history.length > 0 ? `Recent conversation context:\n${history.join('\n')}\n\n` : '';
  
  return `${context}Current message to analyze: "${message}"

Analyze the emotional state and provide a JSON response with:
{
  "primaryEmotion": "string (anxiety, depression, anger, joy, grief, confusion, guilt, pride, neutral)",
  "intensity": number (0.0-1.0),
  "valence": number (-1.0 to 1.0, negative to positive),
  "arousal": number (0.0-1.0, calm to excited),
  "confidence": number (0.0-1.0),
  "supportiveResponse": "empathetic response addressing the emotion",
  "recommendedActions": ["array", "of", "therapeutic", "suggestions"]
}

Consider:
- Explicit emotional language
- Implicit emotional indicators
- Context from conversation history
- Therapeutic appropriateness of responses
- Crisis indicators requiring immediate support`;
}

function generateRecommendedActions(emotion: string): string[] {
  const actionMap: { [key: string]: string[] } = {
    anxiety: [
      "Practice deep breathing exercises",
      "Try grounding techniques (5-4-3-2-1 method)",
      "Consider progressive muscle relaxation",
      "Take a short walk in nature"
    ],
    depression: [
      "Engage in a small, achievable activity",
      "Reach out to a supportive friend or family member",
      "Practice self-compassion",
      "Consider journaling your thoughts"
    ],
    anger: [
      "Take several deep breaths before responding",
      "Use physical exercise to release tension",
      "Practice assertive communication",
      "Take a brief timeout to cool down"
    ],
    joy: [
      "Share this positive moment with someone you care about",
      "Take time to savor and appreciate this feeling",
      "Consider what contributed to this positive state",
      "Use this energy for creative or meaningful activities"
    ],
    grief: [
      "Allow yourself to feel and process these emotions",
      "Reach out to supportive friends or family",
      "Consider professional grief counseling",
      "Practice gentle self-care activities"
    ],
    confusion: [
      "Break down complex thoughts into smaller parts",
      "Talk through your thoughts with someone you trust",
      "Write down your thoughts to organize them",
      "Take time to reflect before making decisions"
    ],
    guilt: [
      "Practice self-forgiveness and compassion",
      "Consider if amends need to be made",
      "Focus on learning from the experience",
      "Talk to someone about these feelings"
    ],
    neutral: [
      "Check in with your emotional state regularly",
      "Practice mindfulness and present-moment awareness",
      "Engage in activities that bring you joy",
      "Maintain healthy routines and self-care"
    ]
  };
  
  return actionMap[emotion] || actionMap.neutral;
}

function determineRiskLevel(analysis: any, message: string): 'low' | 'medium' | 'high' | 'critical' {
  const lowerMessage = message.toLowerCase();
  
  // Critical risk indicators
  const criticalKeywords = ['suicide', 'kill myself', 'end it all', 'not worth living', 'hurt myself'];
  if (criticalKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'critical';
  }
  
  // High risk indicators
  const highRiskKeywords = ['hopeless', 'can\'t go on', 'nothing matters', 'give up'];
  if (highRiskKeywords.some(keyword => lowerMessage.includes(keyword)) || 
      (analysis.intensity > 0.8 && analysis.valence < -0.7)) {
    return 'high';
  }
  
  // Medium risk indicators
  if ((analysis.intensity > 0.6 && analysis.valence < -0.5) || 
      (analysis.primaryEmotion === 'depression' && analysis.intensity > 0.7)) {
    return 'medium';
  }
  
  return 'low';
}

export async function generateSupportiveResponse(emotionalState: EmotionalState): Promise<string> {
  if (emotionalState.supportiveResponse) {
    return emotionalState.supportiveResponse;
  }
  
  // Fallback supportive responses based on emotion
  const responses: { [key: string]: string[] } = {
    anxiety: [
      "I hear that you're feeling anxious right now. That's a very human response, and it's okay to feel this way.",
      "Anxiety can feel overwhelming, but remember that this feeling will pass. You're stronger than you know.",
      "Thank you for sharing what you're experiencing. Let's work through this together."
    ],
    depression: [
      "I recognize the heaviness you're carrying right now. Your feelings are valid and you're not alone.",
      "Depression can make everything feel harder, but reaching out shows incredible strength.",
      "These difficult feelings don't define you. You have value and worth, even when it's hard to see."
    ],
    anger: [
      "I can sense your frustration. Anger often signals that something important to you has been affected.",
      "It's natural to feel angry sometimes. Let's explore what's behind these feelings.",
      "Your anger is telling us something important. Let's work together to understand it."
    ],
    joy: [
      "It's wonderful to hear the happiness in your words. These positive moments are so important.",
      "I'm glad you're experiencing joy right now. These feelings deserve to be celebrated.",
      "Thank you for sharing this positive energy with me. It's beautiful to witness."
    ]
  };
  
  const emotionResponses = responses[emotionalState.primaryEmotion] || responses.anxiety;
  return emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
}

export function analyzeEmotionalPatterns(moodEntries: MoodEntry[]): EmotionalPattern {
  if (moodEntries.length === 0) {
    return {
      dominantEmotions: ['neutral'],
      averageValence: 0,
      averageArousal: 0.5,
      emotionalVolatility: 0,
      trendDirection: 'stable',
      triggerPatterns: [],
      copingStrategies: []
    };
  }
  
  // Calculate dominant emotions
  const emotionCounts: { [key: string]: number } = {};
  moodEntries.forEach(entry => {
    emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
  });
  
  const dominantEmotions = Object.entries(emotionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([emotion]) => emotion);
  
  // Calculate averages
  const averageValence = moodEntries.reduce((sum, entry) => sum + entry.valence, 0) / moodEntries.length;
  const averageArousal = moodEntries.reduce((sum, entry) => sum + entry.arousal, 0) / moodEntries.length;
  
  // Calculate emotional volatility (standard deviation of valence)
  const valenceVariance = moodEntries.reduce((sum, entry) => {
    return sum + Math.pow(entry.valence - averageValence, 2);
  }, 0) / moodEntries.length;
  const emotionalVolatility = Math.sqrt(valenceVariance);
  
  // Determine trend direction (recent vs older entries)
  const recentEntries = moodEntries.slice(-Math.min(7, Math.floor(moodEntries.length / 3)));
  const olderEntries = moodEntries.slice(0, Math.min(7, Math.floor(moodEntries.length / 3)));
  
  const recentAvgValence = recentEntries.reduce((sum, entry) => sum + entry.valence, 0) / recentEntries.length;
  const olderAvgValence = olderEntries.reduce((sum, entry) => sum + entry.valence, 0) / olderEntries.length;
  
  let trendDirection: 'improving' | 'declining' | 'stable' = 'stable';
  const trendThreshold = 0.2;
  
  if (recentAvgValence - olderAvgValence > trendThreshold) {
    trendDirection = 'improving';
  } else if (olderAvgValence - recentAvgValence > trendThreshold) {
    trendDirection = 'declining';
  }
  
  return {
    dominantEmotions,
    averageValence,
    averageArousal,
    emotionalVolatility,
    trendDirection,
    triggerPatterns: extractTriggerPatterns(moodEntries),
    copingStrategies: generateCopingStrategies(dominantEmotions, averageValence)
  };
}

function extractTriggerPatterns(moodEntries: MoodEntry[]): string[] {
  // Analyze context for common triggers
  const contexts = moodEntries.map(entry => entry.context.toLowerCase());
  const triggerWords = ['work', 'family', 'money', 'health', 'relationship', 'social', 'stress'];
  
  return triggerWords.filter(trigger => {
    const mentions = contexts.filter(context => context.includes(trigger)).length;
    return mentions > moodEntries.length * 0.2; // Appears in >20% of entries
  });
}

function generateCopingStrategies(dominantEmotions: string[], averageValence: number): string[] {
  const strategies: string[] = [];
  
  if (dominantEmotions.includes('anxiety')) {
    strategies.push('Regular mindfulness and breathing exercises', 'Structured daily routines');
  }
  
  if (dominantEmotions.includes('depression')) {
    strategies.push('Social connection and support', 'Physical activity and movement');
  }
  
  if (dominantEmotions.includes('anger')) {
    strategies.push('Healthy expression of emotions', 'Conflict resolution skills');
  }
  
  if (averageValence < -0.3) {
    strategies.push('Professional therapy support', 'Medication evaluation if appropriate');
  }
  
  // Always include general wellness strategies
  strategies.push('Regular sleep schedule', 'Balanced nutrition', 'Creative expression');
  
  return strategies;
}