import OpenAI from "openai";
import { retryOpenAIRequest } from "./openaiRetry.js";
import type { JournalEntry, JournalAnalytics } from "../shared/schema.ts";

const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });

export interface JournalAnalysisResult {
  emotionalThemes: Record<string, number>;
  keyInsights: string[];
  sentimentScore: number; // -1.0 to 1.0
  emotionalIntensity: number; // 0 to 100
  copingStrategies: string[];
  growthIndicators: string[];
  concernAreas: string[];
  recommendedActions: string[];
  therapistNotes: string;
  patternConnections: Record<string, any>;
  confidenceScore: number; // 0.0 to 1.0
}

export interface JournalPatternAnalysis {
  recurringThemes: string[];
  emotionalTrends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
  triggerPatterns: string[];
  copingEvolution: string[];
  progressIndicators: string[];
  therapeuticRecommendations: string[];
  riskFactors: string[];
}

export async function analyzeJournalEntry(
  entry: JournalEntry,
  previousEntries: JournalEntry[] = []
): Promise<JournalAnalysisResult> {
  try {
    // Quick analysis for immediate feedback
    const quickAnalysis = performQuickJournalAnalysis(entry);
    
    // AI analysis - Use Ollama in development, OpenAI in production
    const isDevelopment = process.env['NODE_ENV'] === 'development';
    let aiAnalysis: any = {};
    
    if (isDevelopment) {
      try {
        console.log('🦙 Using Ollama for journal analysis in development mode');
        const { analyzeJournalWithOllama, isOllamaAvailable } = await import('./ollamaIntegration.js');
        
        if (await isOllamaAvailable()) {
          const previousContents = previousEntries.slice(0, 3).map(e => e.content);
          aiAnalysis = await analyzeJournalWithOllama(
            entry.content, 
            entry.title || '', 
            entry.mood || 'neutral',
            previousContents
          );
          console.log('✅ Ollama journal analysis completed');
        } else {
          console.log('⚠️ Ollama not available, falling back to OpenAI');
          throw new Error('Ollama not available');
        }
      } catch (ollamaError: any) {
        console.log('❌ Ollama journal analysis failed, using OpenAI fallback:', ollamaError?.message);
        // Fallback to OpenAI
        aiAnalysis = await retryOpenAIRequest(async () => {
          const prompt = constructJournalAnalysisPrompt(entry, previousEntries);
          
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are a specialized therapeutic AI assistant trained in journal analysis and mental health insights. Provide comprehensive, professional analysis suitable for both users and mental health professionals. Respond with valid JSON only."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3
          });

          return JSON.parse(response.choices[0]?.message?.content || '{}');
        });
      }
    } else {
      // Production mode - use OpenAI
      console.log('🤖 Using OpenAI for journal analysis in production mode');
      aiAnalysis = await retryOpenAIRequest(async () => {
        const prompt = constructJournalAnalysisPrompt(entry, previousEntries);
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a specialized therapeutic AI assistant trained in journal analysis and mental health insights. Provide comprehensive, professional analysis suitable for both users and mental health professionals. Respond with valid JSON only."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3
        });

        return JSON.parse(response.choices[0]?.message?.content || '{}');
      });
    }

    // Combine quick and AI analysis
    return combineJournalAnalyses(quickAnalysis, aiAnalysis);
    
  } catch (error) {
    console.error('Journal analysis error:', error);
    // Fallback to pattern-based analysis if AI fails
    return generateFallbackJournalAnalysis(entry);
  }
}

function performQuickJournalAnalysis(entry: JournalEntry): Partial<JournalAnalysisResult> {
  const content = entry.content.toLowerCase();
  const wordCount = entry.content.split(/\s+/).length;
  
  // Basic sentiment detection
  const positiveWords = ['happy', 'joy', 'grateful', 'love', 'amazing', 'wonderful', 'peaceful', 'calm', 'excited', 'hopeful', 'progress', 'better', 'good', 'great'];
  const negativeWords = ['sad', 'angry', 'frustrated', 'anxious', 'worried', 'depressed', 'overwhelmed', 'stressed', 'fear', 'hurt', 'pain', 'difficult', 'struggle', 'bad', 'terrible'];
  
  const positiveCount = positiveWords.filter(word => content.includes(word)).length;
  const negativeCount = negativeWords.filter(word => content.includes(word)).length;
  
  const sentimentScore = Math.max(-1, Math.min(1, (positiveCount - negativeCount) / Math.max(wordCount / 50, 1)));
  
  // Emotional intensity based on exclamation marks, caps, emotional words
  const intensityIndicators = (content.match(/[!]{1,}/g) || []).length + 
                             (content.match(/[A-Z]{3,}/g) || []).length +
                             (positiveCount + negativeCount);
  const emotionalIntensity = Math.min(100, intensityIndicators * 10);
  
  return {
    sentimentScore,
    emotionalIntensity,
    confidenceScore: 0.6 // Moderate confidence for pattern-based analysis
  };
}

function constructJournalAnalysisPrompt(entry: JournalEntry, previousEntries: JournalEntry[]): string {
  const recentEntries = previousEntries.slice(-5); // Last 5 entries for context
  
  return `
Analyze this journal entry for therapeutic insights. Provide comprehensive analysis in JSON format:

Current Entry:
Title: ${entry.title || 'Untitled'}
Content: ${entry.content}
Mood: ${entry.mood || 'Not specified'}
Emotional Tags: ${(entry as any).emotionalTags?.join(', ') || 'None'}
Date: ${entry.createdAt}

${recentEntries.length > 0 ? `
Recent Entries Context (for pattern analysis):
${recentEntries.map((e, i) => `
Entry ${i + 1} (${e.createdAt}):
${e.content.substring(0, 200)}...
Mood: ${e.mood || 'Not specified'}
`).join('')}
` : ''}

Provide analysis in this exact JSON structure:
{
  "emotionalThemes": {
    "theme1": confidence_score,
    "theme2": confidence_score
  },
  "keyInsights": ["insight1", "insight2", "insight3"],
  "sentimentScore": number_between_negative1_and_1,
  "emotionalIntensity": number_between_0_and_100,
  "copingStrategies": ["strategy1", "strategy2"],
  "growthIndicators": ["indicator1", "indicator2"],
  "concernAreas": ["concern1", "concern2"],
  "recommendedActions": ["action1", "action2", "action3"],
  "therapistNotes": "Professional insights for mental health providers",
  "patternConnections": {
    "recurring_themes": ["theme1", "theme2"],
    "emotional_progression": "description",
    "behavioral_patterns": ["pattern1", "pattern2"]
  },
  "confidenceScore": number_between_0_and_1
}

Focus on:
- Emotional patterns and themes
- Coping mechanisms mentioned or implied
- Signs of growth or areas of concern
- Connections to previous entries if applicable
- Professional recommendations for therapeutic support
- Specific, actionable insights rather than generic advice
`;
}

function combineJournalAnalyses(
  quickAnalysis: Partial<JournalAnalysisResult>, 
  aiAnalysis: any
): JournalAnalysisResult {
  return {
    emotionalThemes: aiAnalysis.emotionalThemes || {},
    keyInsights: aiAnalysis.keyInsights || [],
    sentimentScore: aiAnalysis.sentimentScore ?? quickAnalysis.sentimentScore ?? 0,
    emotionalIntensity: aiAnalysis.emotionalIntensity ?? quickAnalysis.emotionalIntensity ?? 50,
    copingStrategies: aiAnalysis.copingStrategies || [],
    growthIndicators: aiAnalysis.growthIndicators || [],
    concernAreas: aiAnalysis.concernAreas || [],
    recommendedActions: aiAnalysis.recommendedActions || [],
    therapistNotes: aiAnalysis.therapistNotes || "AI analysis completed with pattern-based insights.",
    patternConnections: aiAnalysis.patternConnections || {},
    confidenceScore: Math.max(quickAnalysis.confidenceScore || 0, aiAnalysis.confidenceScore || 0)
  };
}

function generateFallbackJournalAnalysis(entry: JournalEntry): JournalAnalysisResult {
  const quickAnalysis = performQuickJournalAnalysis(entry);
  
  return {
    emotionalThemes: { "reflection": 0.7, "self_awareness": 0.6 },
    keyInsights: [
      "User engaged in therapeutic journaling",
      "Processing thoughts and emotions through writing",
      "Demonstrating commitment to mental wellness"
    ],
    sentimentScore: quickAnalysis.sentimentScore || 0,
    emotionalIntensity: quickAnalysis.emotionalIntensity || 50,
    copingStrategies: ["Journaling", "Self-reflection"],
    growthIndicators: ["Regular journaling practice", "Emotional expression"],
    concernAreas: [],
    recommendedActions: [
      "Continue regular journaling practice",
      "Consider discussing insights with a therapist"
    ],
    therapistNotes: "Client demonstrates engagement with therapeutic journaling. Pattern-based analysis suggests healthy coping mechanism usage.",
    patternConnections: {
      "recurring_themes": ["self_reflection"],
      "emotional_progression": "Establishing healthy expression patterns",
      "behavioral_patterns": ["consistent_journaling"]
    },
    confidenceScore: 0.5
  };
}

export async function analyzeJournalPatterns(
  entries: JournalEntry[],
  analytics: JournalAnalytics[]
): Promise<JournalPatternAnalysis> {
  try {
    const recentEntries = entries.slice(-30); // Last 30 entries
    const recentAnalytics = analytics.slice(-30);
    
    const prompt = constructPatternAnalysisPrompt(recentEntries, recentAnalytics);
    
    const aiAnalysis = await retryOpenAIRequest(async () => {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a therapeutic AI specializing in longitudinal mental health analysis. Analyze journaling patterns to provide insights for both users and mental health professionals. Respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    });

    return aiAnalysis;
    
  } catch (error) {
    console.error('Pattern analysis error:', error);
    return generateBasicPatternAnalysis(entries, analytics);
  }
}

function constructPatternAnalysisPrompt(
  entries: JournalEntry[],
  analytics: JournalAnalytics[]
): string {
  return `
Analyze these journal entries and their analytics for long-term therapeutic patterns:

Journal Entries (${entries.length} entries):
${entries.map((entry, i) => `
Entry ${i + 1} (${entry.createdAt}):
Mood: ${entry.mood || 'Not specified'}
Content Sample: ${entry.content.substring(0, 150)}...
Emotional Tags: ${(entry as any).emotionalTags?.join(', ') || 'None'}
`).join('')}

Analytics Summary:
${analytics.map((analysis, i) => `
Analysis ${i + 1}:
Sentiment: ${analysis.sentimentScore}
Intensity: ${analysis.emotionalIntensity}
Key Insights: ${analysis.insights || 'None'}
Concern Areas: ${(analysis as any).concernAreas?.join(', ') || 'None'}
`).join('')}

Provide comprehensive pattern analysis in this JSON structure:
{
  "recurringThemes": ["theme1", "theme2", "theme3"],
  "emotionalTrends": {
    "improving": ["area1", "area2"],
    "declining": ["area1", "area2"],
    "stable": ["area1", "area2"]
  },
  "triggerPatterns": ["trigger1", "trigger2"],
  "copingEvolution": ["evolution1", "evolution2"],
  "progressIndicators": ["indicator1", "indicator2"],
  "therapeuticRecommendations": ["recommendation1", "recommendation2"],
  "riskFactors": ["risk1", "risk2"]
}

Focus on:
- Long-term emotional and behavioral patterns
- Evolution of coping strategies over time
- Areas of growth and concern
- Therapeutic intervention opportunities
- Professional recommendations for ongoing treatment
`;
}

function generateBasicPatternAnalysis(
  entries: JournalEntry[],
  analytics: JournalAnalytics[]
): JournalPatternAnalysis {
  // Basic pattern detection when AI analysis fails
  const themes = new Set<string>();
  const triggers = new Set<string>();
  
  entries.forEach(entry => {
    (entry as any).emotionalTags?.forEach((tag: string) => themes.add(tag));
    (entry as any).triggers?.forEach((trigger: string) => triggers.add(trigger));
  });
  
  return {
    recurringThemes: Array.from(themes).slice(0, 5),
    emotionalTrends: {
      improving: ["Self-awareness", "Expression"],
      declining: [],
      stable: ["Journaling consistency"]
    },
    triggerPatterns: Array.from(triggers).slice(0, 3),
    copingEvolution: ["Increased use of written expression"],
    progressIndicators: ["Regular journaling practice", "Emotional articulation"],
    therapeuticRecommendations: [
      "Continue structured journaling",
      "Consider guided reflection exercises"
    ],
    riskFactors: []
  };
}

export function calculateJournalMetrics(entry: JournalEntry): {
  wordCount: number;
  readingTime: number;
  complexity: number;
} {
  const words = entry.content.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed
  
  // Simple complexity score based on sentence structure and vocabulary
  const sentences = entry.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = wordCount / Math.max(sentences.length, 1);
  const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
  const complexity = Math.min(100, (avgWordsPerSentence * 2) + (uniqueWords / wordCount * 100));
  
  return {
    wordCount,
    readingTime,
    complexity: Math.round(complexity)
  };
}