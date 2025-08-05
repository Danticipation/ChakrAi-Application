import { storage } from './storage.js';
import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Conversation Continuity Enhancer
 * Smart context-preservation mechanism for cross-session therapeutic conversation continuity
 */
export class ConversationContinuityManager {
  
  /**
   * Start or resume a conversation session
   */
  async initializeSession(userId) {
    try {
      // Check for existing active session
      let activeSession = await storage.getActiveConversationSession(userId);
      
      if (!activeSession) {
        // Create new session
        const sessionKey = uuidv4();
        activeSession = await storage.createConversationSession({
          userId,
          sessionKey,
          title: "New Conversation",
          keyTopics: [],
          emotionalTone: "neutral",
          unresolvedThreads: {},
          contextCarryover: {},
          messageCount: 0
        });
        
        console.log(`🌟 New conversation session created: ${sessionKey}`);
      } else {
        // Update last activity
        await storage.updateConversationSession(activeSession.id, {
          lastActivity: new Date()
        });
        
        console.log(`🔄 Resumed conversation session: ${activeSession.sessionKey}`);
      }
      
      return activeSession;
    } catch (error) {
      console.error('Error initializing conversation session:', error);
      throw error;
    }
  }

  /**
   * Analyze and extract conversation context at the end of a chat session
   */
  async processSessionEnd(userId, sessionId, messages) {
    try {
      const session = await storage.getActiveConversationSession(userId);
      if (!session) return;

      // Get message content for analysis
      const conversationText = messages
        .map(msg => `${msg.isBot ? 'AI' : 'User'}: ${msg.content}`)
        .join('\n');

      // Generate session summary and context
      const analysisPrompt = `Analyze this therapeutic conversation session and extract key information for future session continuity:

CONVERSATION:
${conversationText}

Please analyze and return JSON with the following structure:
{
  "title": "Brief descriptive title for this session",
  "summary": "Concise summary of what was discussed",
  "keyTopics": ["topic1", "topic2", "topic3"],
  "emotionalTone": "overall emotional tone (hopeful/struggling/neutral/breakthrough/concerned)",
  "unresolvedThreads": {
    "topic": "Brief description of what needs follow-up"
  },
  "contextCarryover": {
    "importantFacts": ["key facts to remember"],
    "emotionalState": "user's ending emotional state",
    "nextSessionSuggestions": ["what to check on next time"]
  },
  "conversationThreads": [
    {
      "topic": "specific topic discussed",
      "status": "active/resolved/needs_follow_up",
      "priority": "high/medium/low",
      "contextSummary": "brief context",
      "nextSessionPrompt": "suggestion for next session"
    }
  ]
}

Focus on therapeutic continuity - what would be important for the AI to remember when the user returns?`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: analysisPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      // Update session with analysis
      await storage.updateConversationSession(session.id, {
        title: analysis.title || session.title,
        summary: analysis.summary,
        keyTopics: analysis.keyTopics || [],
        emotionalTone: analysis.emotionalTone || 'neutral',
        unresolvedThreads: analysis.unresolvedThreads || {},
        contextCarryover: analysis.contextCarryover || {},
        messageCount: messages.length,
        isActive: false
      });

      // Create conversation threads
      if (analysis.conversationThreads) {
        for (const thread of analysis.conversationThreads) {
          await storage.createConversationThread({
            userId,
            sessionId: session.id,
            threadKey: uuidv4(),
            topic: thread.topic,
            status: thread.status || 'active',
            priority: thread.priority || 'medium',
            contextSummary: thread.contextSummary,
            nextSessionPrompt: thread.nextSessionPrompt,
            relatedFacts: [],
            emotionalContext: {},
            progressNotes: ''
          });
        }
      }

      console.log(`📋 Session analysis completed for session: ${session.sessionKey}`);
      return analysis;
      
    } catch (error) {
      console.error('Error processing session end:', error);
      throw error;
    }
  }

  /**
   * Generate session opening context for new conversations
   */
  async generateSessionOpening(userId) {
    try {
      // Get recent session history
      const recentSessions = await storage.getConversationSessionHistory(userId, 3);
      
      // Get unaddressed continuity items
      const continuityItems = await storage.getUnaddressedContinuity(userId);
      
      // Get active conversation threads
      const activeThreads = await storage.getActiveConversationThreads(userId);

      if (recentSessions.length === 0) {
        return {
          openingContext: "",
          continuityPrompts: [],
          activeTopics: []
        };
      }

      // Build opening context
      let openingContext = `CROSS-SESSION CONTINUITY CONTEXT:\n\n`;
      
      // Recent session context
      if (recentSessions[0] && recentSessions[0].summary) {
        openingContext += `LAST SESSION (${this.formatTimeAgo(recentSessions[0].lastActivity)}):\n`;
        openingContext += `- ${recentSessions[0].summary}\n`;
        openingContext += `- Emotional tone: ${recentSessions[0].emotionalTone}\n`;
        if (recentSessions[0].keyTopics?.length > 0) {
          openingContext += `- Topics discussed: ${recentSessions[0].keyTopics.join(', ')}\n`;
        }
        openingContext += `\n`;
      }

      // Unresolved threads
      if (activeThreads.length > 0) {
        openingContext += `ONGOING TOPICS TO FOLLOW UP ON:\n`;
        for (const thread of activeThreads.slice(0, 3)) {
          openingContext += `- ${thread.topic}: ${thread.contextSummary}\n`;
          if (thread.nextSessionPrompt) {
            openingContext += `  → Suggested follow-up: ${thread.nextSessionPrompt}\n`;
          }
        }
        openingContext += `\n`;
      }

      // Generate conversation continuity prompts
      const continuityPrompts = activeThreads
        .filter(thread => thread.nextSessionPrompt)
        .map(thread => thread.nextSessionPrompt)
        .slice(0, 2);

      const activeTopics = activeThreads.map(thread => thread.topic).slice(0, 5);

      return {
        openingContext,
        continuityPrompts,
        activeTopics,
        recentSessions: recentSessions.slice(0, 2),
        continuityItems
      };
      
    } catch (error) {
      console.error('Error generating session opening:', error);
      return {
        openingContext: "",
        continuityPrompts: [],
        activeTopics: []
      };
    }
  }

  /**
   * Update conversation thread as topics are discussed
   */
  async updateThreadActivity(userId, topic, emotionalContext = {}) {
    try {
      // Find existing thread
      const existingThreads = await storage.getConversationThreadsByTopic(userId, topic);
      
      if (existingThreads.length > 0) {
        // Update existing thread
        const thread = existingThreads[0];
        await storage.updateConversationThread(thread.id, {
          lastMentioned: new Date(),
          emotionalContext: {
            ...thread.emotionalContext,
            ...emotionalContext
          }
        });
        
        console.log(`🧵 Updated conversation thread: ${topic}`);
        return thread;
      } else {
        // Create new thread
        const newThread = await storage.createConversationThread({
          userId,
          sessionId: null, // Will be updated when session ends
          threadKey: uuidv4(),
          topic,
          status: 'active',
          priority: 'medium',
          contextSummary: `Discussing ${topic}`,
          nextSessionPrompt: null,
          relatedFacts: [],
          emotionalContext,
          progressNotes: ''
        });
        
        console.log(`🆕 Created new conversation thread: ${topic}`);
        return newThread;
      }
    } catch (error) {
      console.error('Error updating thread activity:', error);
      throw error;
    }
  }

  /**
   * Create session-to-session continuity bridge
   */
  async createSessionBridge(userId, fromSessionId, toSessionId, continuityData) {
    try {
      await storage.createSessionContinuity({
        userId,
        fromSessionId,
        toSessionId,
        continuityType: continuityData.type || 'topic_continuation',
        carryoverData: continuityData,
        priority: continuityData.priority || 1
      });
      
      console.log(`🌉 Created session continuity bridge: ${fromSessionId} → ${toSessionId}`);
    } catch (error) {
      console.error('Error creating session bridge:', error);
      throw error;
    }
  }

  /**
   * Mark continuity items as addressed
   */
  async markContinuityAddressed(continuityIds) {
    try {
      for (const id of continuityIds) {
        await storage.markContinuityAddressed(id);
      }
      console.log(`✅ Marked ${continuityIds.length} continuity items as addressed`);
    } catch (error) {
      console.error('Error marking continuity addressed:', error);
      throw error;
    }
  }

  // Helper methods
  formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return `yesterday`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} weeks ago`;
  }
}

export const conversationContinuity = new ConversationContinuityManager();