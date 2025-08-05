import express from 'express';
import multer from 'multer';
import { storage } from '../storage.js';
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
    
    // Get recent conversation history for context
    const recentMessages = await storage.getUserMessages(userId, 20); // Get last 20 messages for better context
    console.log(`Fetching messages for userId: ${userId} with limit: 20`);
    console.log(`Found ${recentMessages.length} messages for user ${userId}`);
    
    // Get semantic context for intelligent recall
    const semanticContext = await getSemanticContext(userId, message);
    console.log('Semantic context loaded:', { 
      relevantMemories: semanticContext.relevantMemories.length,
      connectedMemories: semanticContext.connectedMemories.length 
    });

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

    // Build semantic memory context for the AI
    let semanticMemoryContext = '';
    if (semanticContext.relevantMemories.length > 0) {
      semanticMemoryContext = `
SEMANTIC MEMORY CONTEXT:
Past Conversations: ${semanticContext.relevantMemories.map(m => 
  `${m.temporalContext}: ${m.content} [${m.emotionalContext}]`
).join('\n')}
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

    // Build conversation history for OpenAI
    const conversationHistory = recentMessages.map(msg => ({
      role: msg.isBot ? "assistant" : "user",
      content: msg.content
    }));

    // Build comprehensive system message with all context
    const systemMessage = `You are Chakrai, a professional AI wellness companion specializing in mental health support, therapeutic conversations, and personality mirroring. You help users reflect on their thoughts, feelings, and experiences while maintaining strict therapeutic boundaries.

CORE PRINCIPLES:
- Provide therapeutic support through active listening and thoughtful questioning
- Mirror the user's communication style and personality traits learned over time
- Maintain professional therapeutic boundaries while being warm and empathetic
- Focus on self-reflection, emotional processing, and personal growth
- Detect crisis situations and provide appropriate resources when needed

PERSONALITY MODE: ${personalityMode}
VOICE: ${voice}
EMOTIONAL STATE: ${emotionalAnalysis.currentState}
CRISIS LEVEL: ${crisisData.riskLevel}

${personalityContext}
${semanticMemoryContext}
${contextualReferenceText}
${sessionContinuityText}

CONVERSATION GUIDELINES:
- Be conversational, warm, and professionally supportive
- Ask thoughtful follow-up questions to encourage deeper reflection
- Reference past conversations when relevant (shown above)
- Adapt your communication style to mirror the user's personality
- Provide gentle insights and observations about patterns you notice
- If crisis signals detected (${crisisDetected ? 'YES - HIGH RISK' : 'no'}), prioritize safety and provide crisis resources

Respond naturally and therapeutically to: "${message}"`;

    // Generate AI response with enhanced context
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        ...conversationHistory.slice(-10), // Last 10 messages for context
        { role: "user", content: message }
      ],
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

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
        usedSessionContinuity: sessionContext.hasContext
      }
    });

    // Store conversation for semantic memory analysis (async)
    analyzeConversationForMemory(userId, message, aiResponse).catch(error => {
      console.log('Background semantic memory analysis failed:', error);
    });

    // Extract and store facts from the conversation (async)
    extractAndStoreFacts(userId, message, aiResponse).catch(error => {
      console.log('Background fact extraction failed:', error);
    });

    // Update conversation continuity tracking
    await conversationContinuity.trackConversation(userId, currentSession.id, {
      userMessage: message,
      botResponse: aiResponse,
      emotionalTone: emotionalAnalysis.currentState,
      topics: [message.split(' ').slice(0, 3).join(' ')], // Simple topic extraction
      crisisLevel: crisisData.riskLevel
    });

    res.json({
      message: aiResponse,
      response: aiResponse,
      stage: "Wellness Companion",
      crisisDetected: crisisDetected,
      crisisData: crisisDetected ? crisisData : null,
      personalityMode: personalityMode,
      timestamp: new Date().toISOString(),
      semanticContextUsed: semanticContext.relevantMemories.length > 0,
      contextualReferences: contextualReferences.hasReferences
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