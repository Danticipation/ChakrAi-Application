import express from 'express';
import multer from 'multer';
import { storage, enhancedStorage } from '../storage.js';
import { analyzeEmotionalState } from '../emotionalAnalysis.js';
import { openai } from '../openaiRetry.js';
import { userSessionManager } from '../userSession.js';
import { 
  analyzeConversationForMemory, 
  getSemanticContext, 
  generateContextualReferences,
  extractAndStoreFacts
} from '../semanticMemory.js';
import { conversationContinuity } from '../conversationContinuity.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper function for crisis detection
async function detectCrisisSignals(message, userId) {
  try {
    const prompt = `Analyze this message for crisis indicators: "${message}". Return JSON with: riskLevel ('low'|'medium'|'high'|'critical'), confidence (0.0-1.0), indicators (string[] of specific signals), supportResources (string[] of crisis resources)`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2
    });
    
    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    return {
      riskLevel: 'low',
      confidence: 0.5,
      indicators: [],
      supportResources: []
    };
  }
}

// Main chat endpoint with AI integration and semantic memory recall
router.post('/chat', async (req, res) => {
  try {
    const { message, voice = 'carla', personalityMode = 'friend' } = req.body;
    
    // Get or create anonymous user
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      sessionInfo.deviceFingerprint, 
      sessionInfo.sessionId
    );
    const userId = anonymousUser.id;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Making OpenAI API call with conversation continuity...');
    
    // Initialize/resume conversation session for cross-session continuity
    const currentSession = await conversationContinuity.initializeSession(userId);
    
    // Get session opening context for continuity
    const sessionContext = await conversationContinuity.generateSessionOpening(userId);
    
    // Get extensive conversation history for context - CRITICAL FOR MEMORY
    const recentMessages = await storage.getUserMessages(userId, 50); // Get last 50 messages for extensive context
    console.log(`Fetching messages for userId: ${userId} with limit: 50`);
    console.log(`Found ${recentMessages.length} messages for user ${userId}`);
    
    // 🧠 COMPREHENSIVE MEMORY SYSTEM - Get personalized therapeutic context
    console.log('🧠 Loading comprehensive memory context for deeply personalized response...');
    
    // Get comprehensive memory context using the modular memory system
    const comprehensiveContext = await enhancedStorage.getConversationContext(userId, message);
    console.log('🧠 Comprehensive memory context loaded:', {
      recentMemories: comprehensiveContext.recentMemories?.length || 0,
      relevantInsights: comprehensiveContext.relevantInsights?.length || 0,
      sessionActive: !!comprehensiveContext.sessionContext,
      emotionalTrends: !!comprehensiveContext.emotionalContext?.emotionalTrends
    });

    // Get semantic context for intelligent recall (legacy support)
    const semanticContext = await getSemanticContext(userId, message);
    
    // Generate contextual references for past conversations
    const contextualReferences = await generateContextualReferences(userId, message, semanticContext);
    
    // Get user's personality data for mirroring
    let personalityContext = '';
    try {
      const memories = await storage.getUserMemories(userId);
      const facts = await storage.getUserFacts(userId);
      console.log('Loaded personality data:', { memoriesCount: memories.length, factsCount: facts.length });
      
      if (memories.length > 0 || facts.length > 0) {
        const memoryText = memories.slice(-5).map(m => m.memory).join('\n');
        const factText = facts.slice(-5).map(f => f.fact).join('\n');
        
        personalityContext = `
PERSONALITY MIRRORING CONTEXT:
User Memories: ${memoryText}
User Facts: ${factText}
`;
      }
    } catch (error) {
      console.log('Could not load personality data:', error);
    }

    // 🧠 BUILD COMPREHENSIVE THERAPEUTIC MEMORY CONTEXT
    let comprehensiveMemoryContext = '';
    let therapeuticInsightsContext = '';
    let emotionalJourneyContext = '';
    let personalPatternContext = '';

    // Recent semantic memories with rich context
    if (comprehensiveContext.recentMemories?.length > 0) {
      comprehensiveMemoryContext = `
PERSONALIZED MEMORY CONTEXT:
Recent Therapeutic Conversations:
${comprehensiveContext.recentMemories.slice(0, 10).map(m => 
  `• ${m.temporalContext || 'Recently'}: ${m.content} [Emotional: ${m.emotionalContext}, Type: ${m.memoryType}, Confidence: ${m.confidence}]`
).join('\n')}
`;
    }

    // Therapeutic insights for personalized responses
    if (comprehensiveContext.relevantInsights?.length > 0) {
      therapeuticInsightsContext = `
THERAPEUTIC INSIGHTS (Your specific patterns and progress):
${comprehensiveContext.relevantInsights.map(insight => 
  `• ${insight.insightType.toUpperCase()}: ${insight.content} (Confidence: ${insight.confidence})`
).join('\n')}
Action Suggestions: ${comprehensiveContext.relevantInsights.flatMap(i => i.actionSuggestions || []).slice(0, 3).join(', ')}
`;
    }

    // Current session emotional context
    if (comprehensiveContext.sessionContext) {
      const session = comprehensiveContext.sessionContext;
      emotionalJourneyContext = `
CURRENT SESSION CONTEXT:
Session Focus: ${session.title}
Key Topics: ${session.keyTopics?.join(', ') || 'General wellness discussion'}
Emotional Tone: ${session.emotionalTone}
Message Count: ${session.messageCount}
Unresolved Threads: ${Object.keys(session.unresolvedThreads || {}).join(', ') || 'None'}
`;
    }

    // Emotional trends and patterns
    if (comprehensiveContext.emotionalContext?.emotionalTrends) {
      const trends = comprehensiveContext.emotionalContext.emotionalTrends;
      personalPatternContext = `
PERSONAL EMOTIONAL PATTERNS:
Current Emotional State: ${comprehensiveContext.emotionalContext.currentTone || 'Assessing...'}
Recent Emotional Memories: ${comprehensiveContext.emotionalContext.recentEmotionalMemories?.length || 0} emotional touchpoints identified
Emotional Journey Insights: ${trends.insights?.length || 0} trend patterns detected
`;
    }

    // Add contextual references if available
    let contextualReferenceText = '';
    if (contextualReferences.hasReferences && contextualReferences.references.length > 0) {
      contextualReferenceText = `
CONTEXTUAL REFERENCES:
Related Past Conversations: ${contextualReferences.references.map(ref => 
  `${ref.timeReference}: "${ref.content}" (${ref.emotionalTone})`
).join('\n')}
`;
    }

    // Add session continuity context
    let sessionContinuityText = '';
    if (sessionContext.hasContext) {
      sessionContinuityText = `
SESSION CONTINUITY:
Previous Session Summary: ${sessionContext.lastSessionSummary}
Unresolved Topics: ${sessionContext.unresolvedTopics.join(', ')}
Emotional State Transition: ${sessionContext.emotionalTransition}
Key Discussion Points: ${sessionContext.keyPoints.join(', ')}
`;
    }

    // Analyze emotional state for adaptive responses - ensure message is a string
    const messageText = typeof message === 'string' ? message : String(message || '');
    const emotionalAnalysis = await analyzeEmotionalState(messageText, userId);
    console.log('Emotional analysis:', emotionalAnalysis);

    // Detect crisis signals in user message
    const crisisData = await detectCrisisSignals(message, userId);
    const crisisDetected = crisisData.riskLevel && ['high', 'critical'].includes(crisisData.riskLevel);
    
    console.log('Crisis detection result:', { detected: crisisDetected, data: crisisData });

    // Store user message with proper device attribution
    await storage.createMessage({
      userId: userId,
      content: message,
      isBot: false,
      metadata: {
        voice: voice,
        personalityMode: personalityMode,
        emotionalState: emotionalAnalysis.currentState,
        crisisLevel: crisisData.riskLevel,
        hasContextualReferences: contextualReferences.hasReferences
      }
    });

    // Build conversation history for OpenAI - ENHANCED FOR CONTEXT RETENTION
    const conversationHistory = recentMessages.map(msg => ({
      role: msg.isBot ? "assistant" : "user",
      content: msg.content
    }));

    // MEMORY ENHANCEMENT: Build explicit conversation memory summary
    let conversationMemorySummary = '';
    if (recentMessages.length > 10) {
      const recentConversation = recentMessages.slice(-10).map(msg => 
        `${msg.isBot ? 'AI' : 'User'}: ${msg.content}`
      ).join('\n');
      
      conversationMemorySummary = `
RECENT CONVERSATION CONTEXT (Last 10 messages):
${recentConversation}

ONGOING CONVERSATION: We've been talking about ${message.split(' ').slice(0, 5).join(' ')}. Remember our previous discussion and maintain continuity.
`;
    }

    // 🎯 BUILD HIGHLY PERSONALIZED THERAPEUTIC SYSTEM MESSAGE
    const systemMessage = `You are Chakrai, a professional AI wellness companion with access to this user's therapeutic conversation history. You specialize in personalized mental health support through conversation continuity and pattern recognition.

🧠 CRITICAL INSTRUCTION: ONLY reference information that is explicitly provided in the context below. NEVER make assumptions about the user's background, profession, education, or personal details that are not specifically mentioned in their conversation history.

THERAPEUTIC MANDATE:
- Provide personalized responses based ONLY on the conversation history and context provided below
- Reference specific memories, insights, and patterns ONLY from the documented history
- If you don't have specific information about something, say so directly rather than making assumptions
- Make connections between current statements and previous conversations/insights that are actually documented
- Be honest about what you do and don't know about this user's journey

ANTI-HALLUCINATION RULES:
🚫 NEVER assume professional background, education, family details, or personal circumstances not explicitly mentioned
🚫 NEVER invent facts about the user's life, work, relationships, or experiences
🚫 NEVER reference conversations or events that aren't in the provided context
✅ ONLY use information that is explicitly documented in the conversation history below
✅ If asked about something not in your memory, acknowledge that you don't have that information

USER'S CURRENT STATE:
Personality Mode: ${personalityMode}
Voice Preference: ${voice}
Current Emotional Analysis: ${emotionalAnalysis.currentState}
Crisis Assessment: ${crisisData.riskLevel}

${conversationMemorySummary}
${personalityContext}
${comprehensiveMemoryContext}
${therapeuticInsightsContext}
${emotionalJourneyContext}
${personalPatternContext}
${contextualReferenceText}
${sessionContinuityText}

🎯 PERSONALIZATION REQUIREMENTS:
1. DOCUMENTED MEMORY REFERENCES: Reference only conversations and insights explicitly shown above
2. VERIFIED PROGRESS TRACKING: Connect current message only to documented therapeutic progress
3. FACTUAL PATTERN RECOGNITION: Point out only patterns that are evident in the documented history
4. HONEST INSIGHTS: Provide observations based only on what's actually documented
5. AUTHENTIC CONTINUITY: Build only on conversations that are explicitly recorded above

RESPONSE STYLE:
- Professional yet warm, adapted to communication patterns evident in the documented history
- Include specific references only to documented memories/insights
- Ask follow-up questions based only on documented patterns
- Provide insights that connect current state only to documented journey
- When you don't have specific information, be honest about it
- Crisis protocol: ${crisisDetected ? 'IMMEDIATE SAFETY FOCUS - Priority override' : 'Standard therapeutic support'}

Based only on the documented context above, respond authentically to: "${message}"`;

    // Generate AI response with enhanced context and timeout protection
    const completionPromise = openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        ...conversationHistory.slice(-12), // Reduced for faster response
        { role: "user", content: message }
      ],
      max_tokens: 500, // Reduced for faster response
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI request timeout')), 20000); // 20 second timeout
    });

    const completion = await Promise.race([completionPromise, timeoutPromise]);

    const aiResponse = completion.choices[0].message.content;
    console.log('AI response generated:', { length: aiResponse?.length, crisisDetected });

    // Store AI response with full metadata
    await storage.createMessage({
      userId: userId,
      content: aiResponse,
      isBot: true,
      metadata: {
        personalityMode: personalityMode,
        emotionalState: emotionalAnalysis.currentState,
        crisisLevel: crisisData.riskLevel,
        usedSemanticContext: semanticContext.relevantMemories.length > 0,
        usedContextualReferences: contextualReferences.hasReferences,
        usedSessionContinuity: sessionContext.hasContext,
        usedComprehensiveMemory: comprehensiveContext.recentMemories?.length > 0,
        usedTherapeuticInsights: comprehensiveContext.relevantInsights?.length > 0,
        memoryPersonalizationLevel: 'comprehensive'
      }
    });

    // 🧠 LIGHTWEIGHT MEMORY PROCESSING - Background processing to avoid timeouts
    setImmediate(async () => {
      try {
        // Process through the comprehensive memory system in background
        await enhancedStorage.createMessage({
          userId,
          content: message,
          isFromUser: true,
          emotionalState: emotionalAnalysis.currentState,
          therapeuticGoals: comprehensiveContext.sessionContext?.keyTopics || [],
          currentTopics: message.split(' ').slice(0, 3), // Reduced to prevent timeout
          metadata: {
            hasMemoryContext: comprehensiveContext.recentMemories?.length > 0,
            hasInsights: comprehensiveContext.relevantInsights?.length > 0,
            sessionActive: !!comprehensiveContext.sessionContext
          }
        });
        
        console.log('🧠 Message processed through comprehensive memory system');
      } catch (memoryError) {
        console.error('🚨 Background memory processing failed:', memoryError);
      }
    });

    // Update conversation continuity tracking (with proper error handling)
    try {
      if (conversationContinuity && typeof conversationContinuity.trackConversation === 'function') {
        await conversationContinuity.trackConversation(userId, currentSession.id, {
          userMessage: message,
          botResponse: aiResponse,
          emotionalTone: emotionalAnalysis.currentState,
          topics: [message.split(' ').slice(0, 3).join(' ')], // Simple topic extraction
          crisisLevel: crisisData.riskLevel
        });
      }
    } catch (error) {
      console.log('Conversation continuity tracking failed (non-critical):', error.message);
    }

    // Generate audio for the response
    let audioUrl = null;
    try {
      const voiceMap = {
        'james': 'EkK5I93UQWFDigLMpZcX',     // James - Professional and calming
        'brian': 'nPczCjzI2devNBz1zQrb',     // Brian - Deep and resonant
        'alexandra': 'kdmDKE6EkgrWrrykO9Qt', // Alexandra - Clear and articulate
        'carla': 'l32B8XDoylOsZKiSdfhE',     // Carla - Warm and empathetic
        'hope': 's3WpFb3KxhwHdqCNjxE1',     // Hope - Warm and encouraging
        'charlotte': 'XB0fDUnXU5powFXDhCwa', // Charlotte - Gentle and empathetic
        'bronson': 'Yko7PKHZNXotIFUBG7I9',  // Bronson - Confident and reassuring
        'marcus': 'y3kKRaK2dnn3OgKDBckk',   // Marcus - Smooth and supportive
      };
      
      const selectedVoice = voice || 'james';
      const voiceId = voiceMap[selectedVoice] || voiceMap['james'];
      
      console.log(`🎵 Voice selection - Selected: ${selectedVoice}, Voice ID: ${voiceId}`);
      
      // Scrub text for TTS
      const scrubbedText = aiResponse
        .replace(/\*\*(.+?)\*\*/g, '$1')  // Bold **text** -> text
        .replace(/\*(.+?)\*/g, '$1')      // Italic *text* -> text
        .replace(/\n{3,}/g, '\n\n')       // Max 2 line breaks
        .replace(/\s{3,}/g, ' ')          // Max 1 space between words
        .trim();
      
      const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY || ''
        },
        body: JSON.stringify({
          text: scrubbedText,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.3,
            use_speaker_boost: true
          }
        })
      });

      if (ttsResponse.ok) {
        const audioBuffer = await ttsResponse.arrayBuffer();
        audioUrl = Buffer.from(audioBuffer).toString('base64');
        console.log(`🔊 Generated audio for chat response: ${audioBuffer.byteLength} bytes`);
      } else {
        const errorText = await ttsResponse.text().catch(() => 'No error details');
        console.log(`⚠️ TTS failed with status: ${ttsResponse.status} - ${errorText}`);
        
        // If rate limited, wait and retry once
        if (ttsResponse.status === 429) {
          console.log('⏳ Rate limited, waiting 2 seconds and retrying...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          try {
            const retryResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
              method: 'POST',
              headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': process.env.ELEVENLABS_API_KEY || ''
              },
              body: JSON.stringify({
                text: scrubbedText,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                  stability: 0.5,
                  similarity_boost: 0.8,
                  style: 0.3,
                  use_speaker_boost: true
                }
              })
            });
            
            if (retryResponse.ok) {
              const audioBuffer = await retryResponse.arrayBuffer();
              audioUrl = Buffer.from(audioBuffer).toString('base64');
              console.log(`🔊 Retry successful - Generated audio: ${audioBuffer.byteLength} bytes`);
            } else {
              console.log(`⚠️ Retry also failed with status: ${retryResponse.status}`);
            }
          } catch (retryError) {
            console.log('⚠️ Retry attempt failed:', retryError.message);
          }
        }
      }
    } catch (error) {
      console.log('🔇 Audio generation failed (non-critical):', error.message);
    }

    res.json({
      message: aiResponse,
      response: aiResponse,
      stage: "Wellness Companion",
      crisisDetected: crisisDetected,
      crisisData: crisisDetected ? crisisData : null,
      personalityMode: personalityMode,
      timestamp: new Date().toISOString(),
      semanticContextUsed: semanticContext.relevantMemories.length > 0,
      contextualReferences: contextualReferences.hasReferences,
      audioUrl: audioUrl
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    const fallbackResponse = "I'm here to support you. Sometimes I have trouble connecting to my full capabilities, but I'm still listening. How are you feeling right now?";
    res.json({
      message: fallbackResponse,
      response: fallbackResponse,
      stage: "Wellness Companion",
      crisisDetected: false,
      crisisData: null,
      personalityMode: "supportive",
      timestamp: new Date().toISOString()
    });
  }
});

// Legacy chat endpoint
router.post('/', async (req, res) => {
  req.url = '/chat';
  return router.handle(req, res);
});

// Chat history endpoint - get stored conversation messages for anonymous users
router.get('/history/:userId?', async (req, res) => {
  try {
    // Get or create anonymous user
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      sessionInfo.deviceFingerprint, 
      sessionInfo.sessionId
    );
    
    console.log(`Fetching chat history for userId: ${anonymousUser.id}`);
    
    const limit = parseInt(req.query.limit) || 50;
    const messages = await storage.getMessagesByUserId(anonymousUser.id, limit);
    
    console.log(`Found ${messages.length} messages for user ${anonymousUser.id}`);
    
    // Format messages for frontend
    const formattedMessages = messages.map(msg => ({
      sender: msg.isBot ? 'bot' : 'user',
      text: msg.content || msg.text, // Use content if available, fallback to text
      time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: msg.timestamp
    }));
    
    console.log(`Returning ${formattedMessages.length} formatted messages`);
    res.json({ messages: formattedMessages, count: formattedMessages.length });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Voice transcription endpoint
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    console.log('🎯 Transcribe endpoint called');
    console.log('📁 File received:', !!req.file);
    
    if (!req.file) {
      console.error('❌ No audio file in request');
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('📊 Audio file details:');
    console.log('  - Size:', req.file.size, 'bytes');
    console.log('  - Type:', req.file.mimetype);
    console.log('  - Buffer length:', req.file.buffer.length);

    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ No OpenAI API key found');
      return res.status(503).json({ 
        error: 'Voice transcription temporarily unavailable',
        errorType: 'auth_error'
      });
    }

    console.log('🔑 OpenAI API key exists:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');

    const formData = new FormData();
    const audioBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    console.log('🚀 Sending request to OpenAI Whisper API...');
    console.log('📡 Request URL: https://api.openai.com/v1/audio/transcriptions');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData
    });

    console.log('📥 OpenAI response status:', response.status);
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Transcription failed: ${response.status}`,
        details: errorText,
        errorType: 'api_error'
      });
    }

    const result = await response.json();
    console.log('✅ Transcription successful:', result.text);

    res.json({ 
      text: result.text,
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Transcription error:', error);
    res.status(500).json({ 
      error: 'Transcription failed',
      details: error.message,
      errorType: 'server_error'
    });
  }
});

// Messages endpoint for backward compatibility
router.get('/messages', async (req, res) => {
  try {
    const { UserSessionManager } = await import('../userSession.js');
    const userSessionManager = UserSessionManager.getInstance();
    
    // Get user from device fingerprint
    const deviceFingerprint = req.headers['x-device-fingerprint'] || 
                              userSessionManager.generateDeviceFingerprint(req);
    const sessionId = req.headers['x-session-id'] || undefined;
    
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      (Array.isArray(deviceFingerprint) ? deviceFingerprint[0] : deviceFingerprint) || 'unknown', 
      Array.isArray(sessionId) ? sessionId[0] : sessionId
    );
    
    console.log('Chat messages endpoint hit for user:', anonymousUser.id);
    const messages = await storage.getMessagesByUserId(anonymousUser.id);
    console.log('Retrieved messages via generic endpoint:', messages ? messages.length : 0);
    res.json(messages || []);
  } catch (error) {
    console.error('Failed to fetch messages via generic endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

export default router;