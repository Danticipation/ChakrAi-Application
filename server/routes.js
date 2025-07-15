import express from 'express';
import multer from 'multer';
import { storage } from './storage.js';
import { analyzeEmotionalState } from './emotionalAnalysis.js';
import { openai } from './openaiRetry.js';
import { userSessionManager } from './userSession.js';
import { pool } from './db.js';
import { 
  analyzeConversationForMemory, 
  getSemanticContext, 
  generateContextualReferences,
  getMemoryDashboard 
} from './semanticMemory.js';

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

// ====================
// USER DATA MANAGEMENT  
// ====================

// Test endpoint to verify routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Routes are working!', timestamp: new Date().toISOString() });
});

// Clear all user data for fresh start
router.post('/clear-user-data', async (req, res) => {
  try {
    const { deviceFingerprint } = req.body;
    
    if (!deviceFingerprint) {
      return res.status(400).json({ error: 'Device fingerprint is required' });
    }

    // Get user ID by device fingerprint
    const user = await storage.getUserByDeviceFingerprint(deviceFingerprint);
    if (!user) {
      return res.json({ success: true, message: 'No data found for this device' });
    }

    const userId = user.id;

    // Clear all user-related data INCLUDING CHALLENGE PROGRESS - with error resilience
    const clearOperations = [
      () => storage.clearUserMessages(userId),
      () => storage.clearUserJournalEntries(userId),
      () => storage.clearUserMoodEntries(userId),
      () => storage.clearUserMemories(userId).catch(e => console.log('clearUserMemories failed:', e.message)),
      () => storage.clearUserGoals(userId),
      () => storage.clearUserAchievements(userId),
      () => storage.clearUserAnalytics(userId).catch(e => console.log('clearUserAnalytics failed:', e.message)),
      // CRITICAL: Clear challenge progress that was missing
      () => storage.clearUserChallengeProgress(userId),
      () => storage.clearUserWellnessPoints(userId),
      () => storage.clearUserStreaks(userId),
      () => storage.clearUserCommunityParticipation(userId).catch(e => console.log('clearUserCommunityParticipation failed:', e.message))
    ];
    
    await Promise.all(clearOperations.map(op => op()));

    res.json({ success: true, message: 'All user data cleared successfully' });
  } catch (error) {
    console.error('Error clearing user data:', error);
    res.status(500).json({ error: 'Failed to clear user data' });
  }
});

// ====================
// CHAT & AI ENDPOINTS
// ====================



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

    console.log('Making OpenAI API call with semantic memory...');
    
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
CONTEXTUAL REFERENCES TO INCLUDE:
${contextualReferences.references.map(ref => 
  `"${ref.text} — ${ref.followUp}" (confidence: ${ref.confidence})`
).join('\n')}
`;
    }

    // Crisis detection
    const crisisData = await detectCrisisSignals(message, userId);
    const crisisDetected = crisisData.riskLevel === 'high' || crisisData.riskLevel === 'critical';

    // Enhanced system prompt with semantic memory recall
    const systemPrompt = `You are Chakrai, an AI wellness companion with intelligent memory recall. Your core purpose is personality mirroring while making contextual references to past conversations for deeper wellness support.

${personalityContext}${semanticMemoryContext}${contextualReferenceText}

SEMANTIC MEMORY INSTRUCTIONS:
- Use the semantic memory context to reference past conversations naturally
- Make contextual connections like "Last week, you mentioned feeling overwhelmed at work — has anything improved since then?"
- Reference emotional patterns and progress from previous sessions
- Connect current topics to past discussions for continuity

PERSONALITY MIRRORING INSTRUCTIONS:
- Mirror the user's communication style from their personality data
- Reference their memories and facts to create authentic, personalized responses
- Reflect their identity, values, and interests back to them
- Use their preferred language patterns and terminology
- Be supportive but maintain their authentic voice

Current conversation mode: ${personalityMode}
Crisis level detected: ${crisisData.riskLevel}

Respond with semantic awareness, making natural references to past conversations while providing therapeutic value.`;

    // Generate OpenAI response
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.log('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0].message.content;

    // Generate ElevenLabs voice synthesis
    const voiceMap = {
      'james': 'EkK5I93UQWFDigLMpZcX',
      'brian': 'nPczCjzI2devNBz1zQrb', 
      'alexandra': 'kdmDKE6EkgrWrrykO9Qt',
      'carla': 'l32B8XDoylOsZKiSdfhE'
    };

    const selectedVoice = voice || 'carla';
    const voiceId = voiceMap[selectedVoice] || voiceMap['carla'];
    let audioUrl = null;

    if (process.env.ELEVENLABS_API_KEY) {
      try {
        const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY
          },
          body: JSON.stringify({
            text: aiResponse,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.6,
              similarity_boost: 0.8,
              style: 0.2,
              use_speaker_boost: true
            }
          })
        });

        if (elevenLabsResponse.ok) {
          const audioBuffer = await elevenLabsResponse.arrayBuffer();
          const base64Audio = Buffer.from(audioBuffer).toString('base64');
          audioUrl = base64Audio;
        }
      } catch (elevenLabsError) {
        console.error('ElevenLabs request failed:', elevenLabsError);
      }
    }

    // Store individual messages for chat history persistence
    try {
      console.log(`Storing messages for userId: ${userId}`);
      
      // Store user message
      const userMessage = await storage.createMessage({
        userId: userId,
        content: message,
        isBot: false
      });
      console.log('User message stored:', userMessage.id);
      
      // Store bot response
      const botMessage = await storage.createMessage({
        userId: userId,
        content: aiResponse,
        isBot: true
      });
      console.log('Bot message stored:', botMessage.id);
      
      console.log(`Chat messages stored successfully for user ${userId}`);
    } catch (error) {
      console.error('Error storing chat messages:', error);
    }

    // Analyze conversation for semantic memory storage
    try {
      const sessionId = req.headers['x-session-id'] || `session_${Date.now()}`;
      await analyzeConversationForMemory(userId, message, aiResponse, sessionId);
      console.log('Conversation analyzed and stored in semantic memory');
    } catch (error) {
      console.error('Error storing semantic memory:', error);
    }

    res.json({
      message: aiResponse,
      response: aiResponse,
      audioUrl: audioUrl,
      voiceUsed: selectedVoice,
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

// Chat history endpoint - get stored conversation messages for anonymous users
router.get('/chat/history/:userId?', async (req, res) => {
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
      console.error('❌ OpenAI API error response');
      const errorText = await response.text();
      console.error('🔍 Error details:', errorText);
      
      if (response.status === 429) {
        return res.status(429).json({ 
          error: 'Voice transcription temporarily unavailable due to high demand',
          errorType: 'quota_exceeded'
        });
      }
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Transcription successful!');
    console.log('📝 Transcribed text:', result.text);
    console.log('🎉 Sending response back to client');
    
    res.json({ text: result.text });

  } catch (error) {
    console.error('🚨 Transcription error:', error);
    console.error('🔍 Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Voice transcription failed. Please try again.',
      errorType: 'transcription_error',
      details: error.message
    });
  }
});

// ====================
// CONTENT ENDPOINTS
// ====================

// Daily affirmation endpoint
router.get('/daily-affirmation', async (req, res) => {
  try {
    if (process.env.OPENAI_API_KEY) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: "Generate a therapeutic daily affirmation for mental wellness. Be supportive, empowering, and focused on self-care and emotional growth. Return just the affirmation text."
        }],
        max_tokens: 100,
        temperature: 0.8
      });
      
      const affirmation = response.choices[0].message.content?.trim() || "You are capable of amazing things and deserve support on your wellness journey.";
      res.json({ affirmation });
    } else {
      const affirmations = [
        "You are capable of amazing things.",
        "Your mental health matters and you deserve support.",
        "Every small step forward is progress worth celebrating.",
        "You have the strength to overcome today's challenges.",
        "Your feelings are valid and you are not alone."
      ];
      
      const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
      res.json({ affirmation: randomAffirmation });
    }
  } catch (error) {
    console.error('Daily affirmation error:', error);
    res.json({ affirmation: "You are worthy of love, support, and all the good things life has to offer." });
  }
});

// Weekly summary endpoint
router.get('/weekly-summary', async (req, res) => {
  try {
    if (process.env.OPENAI_API_KEY) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: "Generate a weekly therapeutic summary message focusing on growth, progress, and encouragement for someone on their mental wellness journey. Be supportive and motivating."
        }],
        max_tokens: 150,
        temperature: 0.7
      });
      
      const summary = response.choices[0].message.content?.trim() || "This week has been a journey of growth and self-discovery.";
      res.json({ summary });
    } else {
      const summaries = [
        "This week, you've shown remarkable growth in self-awareness and emotional intelligence.",
        "Your conversations reflect deep introspection and a commitment to personal wellness.",
        "This week's interactions demonstrate your resilience and willingness to explore difficult topics."
      ];
      
      const randomSummary = summaries[Math.floor(Math.random() * summaries.length)];
      res.json({ summary: randomSummary });
    }
  } catch (error) {
    console.error('Weekly summary error:', error);
    res.json({ summary: "Your therapeutic journey continues to unfold with courage and determination." });
  }
});

// Horoscope endpoint
router.get('/horoscope/:sign', async (req, res) => {
  try {
    const { sign } = req.params;
    
    if (process.env.OPENAI_API_KEY) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: `Generate a therapeutic horoscope for ${sign} focused on mental wellness, self-care, and emotional growth. Be supportive and encouraging.`
        }],
        max_tokens: 100,
        temperature: 0.8
      });
      
      const horoscope = response.choices[0].message.content?.trim() || "Today brings opportunities for personal growth and emotional healing.";
      res.json({ horoscope });
    } else {
      const horoscopes = {
        aries: "Today brings new opportunities for personal growth and emotional healing.",
        taurus: "Focus on grounding exercises and self-care to maintain your emotional balance.",
        gemini: "Communication and connection with others will bring you joy today."
      };
      
      res.json({ 
        horoscope: horoscopes[sign.toLowerCase()] || "Today is a great day for self-reflection and growth." 
      });
    }
  } catch (error) {
    console.error('Horoscope error:', error);
    res.json({ horoscope: "Today holds potential for growth, healing, and positive change in your life." });
  }
});

// ====================
// MOOD & STATS ENDPOINTS
// ====================

// Mood tracking endpoint
router.post('/mood', async (req, res) => {
  try {
    const { userId, mood, intensity, triggers, notes } = req.body;
    
    if (!userId || !mood || intensity === undefined) {
      return res.status(400).json({ error: 'userId, mood, and intensity are required' });
    }

    const moodEntry = await storage.createMoodEntry({
      userId: parseInt(userId),
      mood,
      intensity: parseInt(intensity),
      triggers: triggers || [],
      notes: notes || ''
    });
    
    res.json({ 
      success: true, 
      message: `Mood "${mood}" recorded with intensity ${intensity}`,
      moodEntry
    });
  } catch (error) {
    console.error('Mood tracking error:', error);
    res.status(500).json({ error: 'Failed to track mood' });
  }
});

// Stats endpoints
router.get('/stats/:userId?', (req, res) => {
  try {
    res.json({
      level: 3,
      stage: "Wellness Companion"
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

router.get('/bot-stats/:userId', (req, res) => {
  try {
    res.json({
      level: 3,
      stage: "Wellness Companion"
    });
  } catch (error) {
    console.error('Bot stats error:', error);
    res.status(500).json({ error: 'Failed to get bot stats' });
  }
});

// Personality reflection endpoint
router.get('/personality-reflection/:userId?', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId?.toString() || '1');
    
    const journalEntries = await storage.getJournalEntries(userId).then(entries => entries.slice(0, 5)).catch(() => []);
    const moodEntries = await storage.getMoodEntries(userId).then(entries => entries.slice(0, 7)).catch(() => []);
    
    const journalText = journalEntries.map(entry => entry.content).join('\n');
    const moodSummary = moodEntries.map(mood => `${mood.mood}: ${mood.intensity}/10`).join(', ');

    const analysisPrompt = `Analyze this user's personality, communication style, and emotional patterns based on their recent interactions:

JOURNAL ENTRIES:
${journalText || 'No journal entries available'}

MOOD PATTERNS:
${moodSummary || 'No mood data available'}

Provide a comprehensive personality reflection including:
1. PERSONALITY TRAITS: Key characteristics and communication style
2. POSITIVE ATTRIBUTES: Strengths and admirable qualities 
3. AREAS FOR GROWTH: Gentle suggestions for improvement
4. EMOTIONAL PATTERNS: How they process and express emotions
5. THERAPEUTIC INSIGHTS: Professional observations for their wellness journey

Be supportive, encouraging, and therapeutic in tone. Focus on growth and self-awareness.`;

    if (process.env.OPENAI_API_KEY) {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are Chakrai, an AI wellness companion providing personality reflection and analysis. Be supportive, insightful, and focused on personal growth and self-awareness. Provide meaningful wellness support and guidance.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          max_tokens: 800,
          temperature: 0.7
        })
      });

      if (openaiResponse.ok) {
        const data = await openaiResponse.json();
        const reflection = data.choices[0].message.content;
        
        // Get conversation count from stored messages
        const conversations = await storage.getMessagesByUserId(userId).then(messages => {
          // Count unique conversation sessions (group by date or time gaps)
          const uniqueDays = new Set();
          messages.forEach(msg => {
            const date = new Date(msg.timestamp).toDateString();
            uniqueDays.add(date);
          });
          return uniqueDays.size;
        }).catch(() => 0);

        res.json({
          reflection,
          lastUpdated: new Date().toISOString(),
          dataPoints: {
            conversations: conversations,
            journalEntries: journalEntries.length,
            moodEntries: moodEntries.length
          }
        });
        return;
      }
    }
    
    res.json({
      reflection: "Your therapeutic journey shows dedication to self-improvement and emotional awareness. Continue engaging with the platform to develop deeper insights about your personality and growth patterns.",
      lastUpdated: new Date().toISOString(),
      dataPoints: {
        conversations: 0,
        journalEntries: journalEntries.length,
        moodEntries: moodEntries.length
      }
    });
  } catch (error) {
    console.error('Personality reflection error:', error);
    res.status(500).json({ 
      error: 'Failed to generate personality reflection',
      reflection: "Continue your therapeutic journey by engaging in conversations and journaling to develop deeper self-awareness and emotional insights.",
      lastUpdated: new Date().toISOString(),
      dataPoints: {
        conversations: 0,
        journalEntries: 0,
        moodEntries: 0
      }
    });
  }
});

// Memory Dashboard API endpoint
router.get('/memory-dashboard', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId) || 1;
    const dashboard = await getMemoryDashboard(userId);
    res.json(dashboard);
  } catch (error) {
    console.error('Error getting memory dashboard:', error);
    res.status(500).json({ error: 'Failed to get memory dashboard' });
  }
});

// Bot stats endpoint
router.get('/bot-stats', async (req, res) => {
  try {
    res.json({ 
      level: 3,
      stage: "Wellness Companion"
    });
  } catch (error) {
    console.error('Bot stats error:', error);
    res.status(500).json({ error: 'Failed to get bot stats' });
  }
});

// Daily affirmation endpoint
router.get('/daily-affirmation', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.json({ affirmation: 'Today is a beautiful day to practice self-compassion and growth.' });
    }

    // Generate daily affirmation using OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: 'system',
          content: 'You are a therapeutic wellness coach providing daily affirmations. Create positive, supportive daily affirmations that promote mental wellness and self-compassion.'
        },
        {
          role: 'user',
          content: 'Generate a therapeutic daily affirmation focused on personal growth, self-compassion, and mental wellness. Keep it 1-2 sentences and inspiring.'
        }
      ],
      max_tokens: 100,
      temperature: 0.8
    });

    const affirmation = response.choices[0].message.content;
    res.json({ affirmation });
  } catch (error) {
    console.error('Daily affirmation error:', error);
    res.json({ affirmation: 'Today is a beautiful day to practice self-compassion and growth.' });
  }
});

// Weekly summary endpoint
router.get('/weekly-summary', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.json({ summary: 'Your therapeutic journey continues to evolve positively. Focus on your mental wellness and personal growth this week.' });
    }

    // Generate weekly summary using OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: 'system',
          content: 'You are a therapeutic wellness coach providing weekly summaries and reflections for mental health progress.'
        },
        {
          role: 'user',
          content: 'Generate a supportive weekly summary focused on therapeutic progress, emotional wellness, and personal growth encouragement. Keep it 2-3 sentences and motivational.'
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    });

    const summary = response.choices[0].message.content;
    res.json({ summary });
  } catch (error) {
    console.error('Weekly summary error:', error);
    res.json({ summary: 'Your therapeutic journey continues to evolve positively. Focus on your mental wellness and personal growth this week.' });
  }
});

// ====================
// USER ENDPOINTS
// ====================

// Get current user endpoint that frontend expects
router.get('/user/current', async (req, res) => {
  try {
    // For now, return a mock user since we don't have proper authentication
    // In production, this would authenticate and return actual user data
    const user = {
      id: 1,
      username: 'user',
      displayName: 'User',
      hasCompletedOnboarding: true, // Set to true to skip onboarding
      createdAt: new Date().toISOString()
    };
    
    res.json(user);
  } catch (error) {
    console.error('User current error:', error);
    res.status(500).json({ error: 'Failed to get current user' });
  }
});

export default router;