// 🆓 BASIC PERSONALITY ANALYSIS FOR FREE TIER USERS
// Provides valuable but limited insights to encourage premium upgrade

import { storage } from '../src/storage.js';
import { openai } from '../openaiRetry.js';
import { SubscriptionManager } from '../subscription/SubscriptionManager.js';

export interface BasicPersonalityAnalysis {
  basicProfile: {
    personalityType: string;
    topTraits: string[];
    communicationStyle: string;
    strengthsOverview: string[];
    oneInsight: string;
  };
  limitedInsights: {
    cognitiveStyle: string;
    emotionalTendency: string;
    behavioralPattern: string;
    socialStyle: string;
  };
  premiumPreview: {
    availableInPremium: {
      totalDimensions: number;
      domains: number;
      additionalFeatures: string[];
      sampleInsights: string[];
    };
    upgradeValue: {
      clinicalWorth: string;
      uniqueFeatures: string[];
      monthlyPrice: number;
    };
  };
  recommendations: {
    immediate: string[];
    growthAreas: string[];
    upgradePrompt: string;
  };
  dataPoints: {
    analysisConfidence: number;
    dataUsed: number;
    needsMoreData: boolean;
  };
}

export class BasicPersonalityAnalyzer {
  
  /**
   * Generate basic personality analysis for free tier users
   */
  async generateBasicAnalysis(userId: number): Promise<BasicPersonalityAnalysis> {
    console.log(`🆓 Generating basic personality analysis for free user ${userId}`);
    
    try {
      // Gather limited user data
      const userData = await this.gatherBasicUserData(userId);
      
      // Generate basic insights using simplified analysis
      const basicInsights = await this.generateBasicInsights(userData);
      
      // Create premium preview to encourage upgrade
      const premiumPreview = this.generatePremiumPreview();
      
      // Generate basic recommendations
      const recommendations = this.generateBasicRecommendations(basicInsights);
      
      // Calculate data quality
      const dataPoints = this.calculateBasicDataMetrics(userData);
      
      const analysis: BasicPersonalityAnalysis = {
        basicProfile: basicInsights.profile,
        limitedInsights: basicInsights.insights,
        premiumPreview,
        recommendations,
        dataPoints
      };
      
      console.log(`✅ Basic analysis complete for user ${userId}`);
      
      return analysis;
      
    } catch (error) {
      console.error('🚨 Basic analysis failed:', error);
      return this.generateFallbackBasicAnalysis(userId);
    }
  }

  /**
   * Gather limited user data for basic analysis
   */
  private async gatherBasicUserData(userId: number): Promise<any> {
    const [journalEntries, messages, moodEntries] = await Promise.all([
      storage.getJournalEntries(userId, 10).catch(() => []),
      storage.getUserMessages(userId, 20).catch(() => []),
      storage.getUserMoodEntries(userId, 10).catch(() => [])
    ]);

    return {
      journalEntries,
      messages,
      moodEntries,
      totalDataPoints: journalEntries.length + messages.length + moodEntries.length
    };
  }

  /**
   * Generate basic insights using simplified AI analysis
   */
  private async generateBasicInsights(userData: any): Promise<any> {
    console.log(`🤖 Generating basic AI insights...`);
    
    try {
      const journalContent = userData.journalEntries.slice(0, 5).map((entry: any) => entry.content).join('\n');
      const conversationContent = userData.messages.slice(0, 10).map((msg: any) => `${msg.isBot ? 'AI' : 'User'}: ${msg.content}`).join('\n');
      
      const analysisPrompt = `Based on this limited user data, provide a BASIC personality analysis with exactly 10 key traits and simple insights.

USER DATA (LIMITED SAMPLE):
Journal Entries: ${journalContent}
Recent Conversations: ${conversationContent}

Provide a JSON response with basic personality insights. Focus on being encouraging and accurate, but keep it simple:

{
  "profile": {
    "personalityType": "Simple 2-3 word type like 'Thoughtful Communicator'",
    "topTraits": ["trait1", "trait2", "trait3", "trait4", "trait5", "trait6", "trait7", "trait8", "trait9", "trait10"],
    "communicationStyle": "Brief description of communication style",
    "strengthsOverview": ["strength1", "strength2", "strength3"],
    "oneInsight": "One meaningful insight about their personality"
  },
  "insights": {
    "cognitiveStyle": "Brief description of thinking style",
    "emotionalTendency": "Brief description of emotional patterns", 
    "behavioralPattern": "Brief description of behavioral style",
    "socialStyle": "Brief description of social preferences"
  }
}

Keep insights positive, general but meaningful, and appropriate for a basic analysis.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful personality analyst providing basic but meaningful insights. Keep analysis simple but valuable."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 800
      });

      const analysis = JSON.parse(response.choices[0]?.message?.content || '{}');
      console.log(`✅ Basic AI insights generated successfully`);
      
      return analysis;
      
    } catch (error) {
      console.error('AI analysis failed, using fallback:', error);
      return this.generateFallbackInsights(userData);
    }
  }

  /**
   * Generate premium preview to encourage upgrade
   */
  private generatePremiumPreview(): any {
    return {
      availableInPremium: {
        totalDimensions: 190,
        domains: 9,
        additionalFeatures: [
          'Complete psychological domains analysis',
          'Therapeutic recommendations',
          'Progress tracking over time',
          'Domain-specific deep dives',
          'Clinical-grade insights',
          'Unlimited analyses'
        ],
        sampleInsights: [
          'Detailed cognitive architecture analysis revealing abstract reasoning patterns',
          'Comprehensive emotional regulation strategies based on your unique profile',
          'Advanced interpersonal dynamics assessment for relationship improvement',
          'Therapeutic recommendations tailored to your specific psychological patterns'
        ]
      },
      upgradeValue: {
        clinicalWorth: 'Professional psychological assessment typically costs $200-500',
        uniqueFeatures: [
          '190+ psychological dimensions (vs 10 in basic)',
          'Professional therapeutic insights',
          'Comparable to clinical assessment tools',
          'Unlimited detailed analyses'
        ],
        monthlyPrice: 9.99
      }
    };
  }

  /**
   * Generate basic recommendations
   */
  private generateBasicRecommendations(insights: any): any {
    return {
      immediate: [
        'Continue journaling to build self-awareness',
        'Track your mood patterns regularly',
        'Practice mindfulness or meditation'
      ],
      growthAreas: [
        'Develop deeper emotional understanding',
        'Explore communication patterns',
        'Build on identified strengths'
      ],
      upgradePrompt: 'Unlock 190+ detailed insights and professional therapeutic recommendations with Premium'
    };
  }

  /**
   * Calculate data quality metrics
   */
  private calculateBasicDataMetrics(userData: any): any {
    const totalDataPoints = userData.totalDataPoints;
    const confidence = Math.min(75, 30 + (totalDataPoints / 20 * 45)); // Max 75% for basic
    
    return {
      analysisConfidence: Math.round(confidence),
      dataUsed: totalDataPoints,
      needsMoreData: totalDataPoints < 10
    };
  }

  /**
   * Generate fallback insights when AI analysis fails
   */
  private generateFallbackInsights(userData: any): any {
    return {
      profile: {
        personalityType: "Thoughtful Individual",
        topTraits: [
          "Self-reflective", "Growth-oriented", "Emotionally aware", "Communicative", "Curious",
          "Resilient", "Empathetic", "Analytical", "Creative", "Authentic"
        ],
        communicationStyle: "Open and thoughtful in expression",
        strengthsOverview: [
          "Shows commitment to personal growth",
          "Engages in self-reflection",
          "Values emotional awareness"
        ],
        oneInsight: "You demonstrate a strong commitment to understanding yourself and growing as a person."
      },
      insights: {
        cognitiveStyle: "Approaches problems thoughtfully and systematically",
        emotionalTendency: "Shows emotional awareness and seeks understanding",
        behavioralPattern: "Consistent in self-improvement activities",
        socialStyle: "Open to meaningful connections and support"
      }
    };
  }

  /**
   * Generate complete fallback analysis
   */
  private generateFallbackBasicAnalysis(userId: number): BasicPersonalityAnalysis {
    return {
      basicProfile: {
        personalityType: "Emerging Self-Discoverer",
        topTraits: ["Curious", "Growth-oriented", "Self-aware", "Open-minded", "Thoughtful"],
        communicationStyle: "Beginning to explore authentic self-expression",
        strengthsOverview: ["Willingness to explore", "Openness to growth", "Values self-understanding"],
        oneInsight: "You're taking meaningful steps toward self-discovery and personal growth."
      },
      limitedInsights: {
        cognitiveStyle: "Developing analytical and reflective thinking patterns",
        emotionalTendency: "Building emotional awareness through mindful observation",
        behavioralPattern: "Establishing habits that support personal development",
        socialStyle: "Open to forming connections that support growth"
      },
      premiumPreview: this.generatePremiumPreview(),
      recommendations: {
        immediate: [
          "Continue engaging with self-reflection tools",
          "Start or maintain a regular journaling practice",
          "Pay attention to your emotional responses"
        ],
        growthAreas: [
          "Develop deeper self-awareness",
          "Explore your communication patterns",
          "Build emotional regulation skills"
        ],
        upgradePrompt: "Unlock comprehensive 190-point analysis for deep psychological insights"
      },
      dataPoints: {
        analysisConfidence: 45,
        dataUsed: 0,
        needsMoreData: true
      }
    };
  }
}

// Export singleton instance
export const basicAnalyzer = new BasicPersonalityAnalyzer();