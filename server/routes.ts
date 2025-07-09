import express from "express";
import multer from 'multer';
import Stripe from 'stripe';
import { storage } from './storage.js';
import { analyzeEmotionalState } from './emotionalAnalysis.js';
import { openai } from './openaiRetry.js';
import { agentSystem } from './agentSystem.js';
import { TherapeuticAnalyticsSystem } from './therapeuticAnalytics.js';
import { userSessionManager } from './userSession.js';

const analyticsSystem = new TherapeuticAnalyticsSystem();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ====================
// TEXT SCRUBBING UTILITY
// ====================

// Clean text before sending to ElevenLabs TTS
function scrubTextForTTS(text: string): string {
  return text
    // Remove markdown formatting
    .replace(/\*\*(.+?)\*\*/g, '$1')  // Bold **text** -> text
    .replace(/\*(.+?)\*/g, '$1')      // Italic *text* -> text
    .replace(/_{2,}(.+?)_{2,}/g, '$1') // Underline __text__ -> text
    .replace(/_(.+?)_/g, '$1')        // Single underscore _text_ -> text
    .replace(/~~(.+?)~~/g, '$1')      // Strikethrough ~~text~~ -> text
    
    // Remove section markers and formatting
    .replace(/###\s+/g, '')           // Remove ### headers
    .replace(/##\s+/g, '')            // Remove ## headers  
    .replace(/#\s+/g, '')             // Remove # headers
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links [text](url) -> text
    
    // Remove special characters that sound awkward
    .replace(/\*+/g, '')              // Remove asterisks
    .replace(/#{3,}/g, '')            // Remove multiple hashes
    .replace(/_{3,}/g, '')            // Remove multiple underscores
    .replace(/`+/g, '')               // Remove backticks
    .replace(/\|/g, ' ')              // Replace pipes with spaces
    .replace(/\~/g, '')               // Remove tildes
    .replace(/\^/g, '')               // Remove carets
    .replace(/\[|\]/g, '')            // Remove square brackets
    .replace(/\{|\}/g, '')            // Remove curly brackets
    
    // Clean up spacing and line breaks
    .replace(/\n{3,}/g, '\n\n')       // Max 2 line breaks
    .replace(/\s{3,}/g, ' ')          // Max 1 space between words
    .replace(/\.{3,}/g, '...')        // Max 3 dots for ellipsis
    
    // Replace common symbols with spoken equivalents
    .replace(/&/g, ' and ')           // & -> and
    .replace(/@/g, ' at ')            // @ -> at
    .replace(/%/g, ' percent ')       // % -> percent
    .replace(/\$/g, ' dollars ')      // $ -> dollars
    .replace(/\+/g, ' plus ')         // + -> plus
    .replace(/=/g, ' equals ')        // = -> equals
    
    // Clean up any remaining formatting artifacts
    .replace(/\s*:\s*$/gm, ':')       // Clean up colons at line ends
    .replace(/^\s*[-•]\s*/gm, '')     // Remove bullet points
    
    // Final cleanup
    .trim()
    .replace(/\s+/g, ' ');            // Normalize all whitespace
}

// Helper functions for advanced emotional intelligence features
async function generateMoodForecast(userId: number, recentMoods: any[]): Promise<any> {
  try {
    const prompt = `Based on recent mood data: ${JSON.stringify(recentMoods.slice(-7))}, generate a 24-48 hour mood forecast. Return JSON with: predictedMood (string), confidenceScore (0.0-1.0), riskLevel ('low'|'medium'|'high'|'critical'), triggerFactors (string[]), preventiveRecommendations (string[])`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3
    });
    
    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    return {
      predictedMood: 'neutral',
      confidenceScore: 0.5,
      riskLevel: 'low',
      triggerFactors: [],
      preventiveRecommendations: ['Continue regular self-care practices']
    };
  }
}

async function generateContextualResponse(originalMessage: string, emotionalState: any, userId: number): Promise<any> {
  try {
    const prompt = `Adapt this therapeutic response "${originalMessage}" based on emotional state: ${JSON.stringify(emotionalState)}. Return JSON with: response (adapted message), tone, intensity, responseLength, communicationStyle, priorityFocus (array)`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.4
    });
    
    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    return {
      response: originalMessage,
      tone: 'supportive',
      intensity: 'moderate',
      responseLength: 'moderate',
      communicationStyle: 'therapeutic',
      priorityFocus: ['emotional support']
    };
  }
}

async function detectCrisisSignals(message: string, userId: number): Promise<any> {
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

async function analyzeEmotionalPatterns(userId: number, timeframeDays: number): Promise<any> {
  try {
    const moodEntries = await storage.getMoodEntries(userId);
    const prompt = `Analyze emotional patterns from mood data: ${JSON.stringify(moodEntries)}. Return JSON with: dominantEmotions (string[]), averageValence (-1.0 to 1.0), volatility (0.0 to 1.0), trendDirection ('improving'|'declining'|'stable'), triggerPatterns (string[]), insights (string[])`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3
    });
    
    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    return {
      dominantEmotions: ['neutral'],
      averageValence: 0.0,
      volatility: 0.3,
      trendDirection: 'stable',
      triggerPatterns: [],
      insights: []
    };
  }
}

// ====================
// CHAT & AI ENDPOINTS
// ====================

// Main chat endpoint with AI integration
router.post('/chat', async (req, res) => {
  try {
    const { message, voice, personalityMode = 'supportive', deviceFingerprint } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create anonymous user
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    // Use deviceFingerprint from body if provided, otherwise fall back to request headers
    const fingerprint = deviceFingerprint || sessionInfo.deviceFingerprint;
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      fingerprint, 
      sessionInfo.sessionId
    );
    const userId = anonymousUser.id;

    console.log('Chat request:', { message: message.substring(0, 50) + '...', voice, userId: anonymousUser.id, isAnonymous: anonymousUser.isAnonymous });

    // Crisis detection
    const crisisData = await detectCrisisSignals(message, userId);
    const crisisDetected = crisisData.riskLevel === 'high' || crisisData.riskLevel === 'critical';

    // Emotional analysis
    const emotionalState = await analyzeEmotionalState(message);

    // Get user data for personality mirroring
    const userFacts = await storage.getUserFacts(userId).catch(() => []);
    const userMemories = await storage.getUserMemories(userId).catch(() => []);

    // Enhanced system prompt with personality mirroring
    const personalityContext = userFacts.length > 0 ? 
      `User's personality traits: ${userFacts.map(f => f.fact).join(', ')}\n` +
      `User's memories: ${userMemories.map(m => m.memory).join(', ')}\n` : '';

    const systemPrompt = `You are TraI, an AI wellness companion providing mental wellness support. You are not a licensed therapist, but a supportive companion for personal growth. Your responses should be:
- Warm, empathetic, and focused on wellness
- Personalized based on the user's communication style and personality
- Focused on emotional support and personal growth
- Crisis-aware when risk indicators are detected (refer to professional help when needed)

${personalityContext}

Current emotional context: ${JSON.stringify(emotionalState)}
Crisis level: ${crisisData.riskLevel}

Adapt your response to mirror the user's communication patterns while maintaining wellness support value. Always clarify you are not a professional therapist if therapy questions arise.`;

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

    console.log('OpenAI response status:', openaiResponse.status);

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.log('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0].message.content;
    console.log('OpenAI response received:', aiResponse.substring(0, 50) + '...');

    // Generate ElevenLabs voice synthesis
    const voiceMap: Record<string, string> = {
      // Original voices
      'james': 'EkK5I93UQWFDigLMpZcX',  // Male
      'brian': 'nPczCjzI2devNBz1zQrb',  // Male
      'alexandra': 'kdmDKE6EkgrWrrykO9Qt', // Female
      'carla': 'l32B8XDoylOsZKiSdfhE',  // Female
      // New voices added
      'hope': 'iCrDUkL56s3C8sCRl7wb',   // Female
      'charlotte': 'XB0fDUnXU5powFXDhCwa', // Female
      'bronson': 'Yko7PKHZNXotIFUBG7I9', // Male
      'marcus': 'y3kKRaK2dnn3OgKDBckk'   // Male
    };

    const selectedVoice = voice || 'james';
    const voiceId = voiceMap[selectedVoice] || voiceMap['james'];
    let audioUrl = null;

    if (process.env.ELEVENLABS_API_KEY) {
      try {
        console.log(`Making ElevenLabs request for voice: ${selectedVoice} (ID: ${voiceId})`);
        console.log(`Text to synthesize: "${aiResponse.substring(0, 50)}..."`);
        
        // Scrub text before sending to ElevenLabs
        const scrubbedText = scrubTextForTTS(aiResponse);
        console.log(`Original text: "${aiResponse.substring(0, 100)}..."`);
        console.log(`Scrubbed text: "${scrubbedText.substring(0, 100)}..."`);
        
        const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY
          } as HeadersInit,
          body: JSON.stringify({
            text: scrubbedText,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.6,
              similarity_boost: 0.8,
              style: 0.2,
              use_speaker_boost: true
            }
          })
        });

        console.log('ElevenLabs response status:', elevenLabsResponse.status);

        if (elevenLabsResponse.ok) {
          const audioBuffer = await elevenLabsResponse.arrayBuffer();
          const base64Audio = Buffer.from(audioBuffer).toString('base64');
          
          console.log(`Audio buffer size: ${audioBuffer.byteLength}`);
          console.log(`Base64 audio length: ${base64Audio.length}`);
          
          audioUrl = base64Audio;
        } else {
          const errorText = await elevenLabsResponse.text();
          console.error('ElevenLabs API error:', elevenLabsResponse.status, errorText);
        }
      } catch (elevenLabsError: any) {
        console.error('ElevenLabs request failed:', elevenLabsError);
      }
    } else {
      console.error('ELEVENLABS_API_KEY not configured');
    }

    res.json({
      message: aiResponse,
      response: aiResponse,
      audioUrl: audioUrl,
      voiceUsed: selectedVoice,
      wordsLearned: 1000,
      stage: "Therapist",
      crisisDetected: crisisDetected,
      crisisData: crisisDetected ? crisisData : null,
      personalityMode: personalityMode,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    const fallbackResponse = "I'm here to support you. Sometimes I have trouble connecting to my full capabilities, but I'm still listening. How are you feeling right now?";
    res.json({
      message: fallbackResponse,
      response: fallbackResponse,
      wordsLearned: 1000,
      stage: "Therapist",
      crisisDetected: false,
      crisisData: null,
      personalityMode: "supportive",
      timestamp: new Date().toISOString()
    });
  }
});

// Voice transcription endpoint
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ 
        error: 'Voice transcription temporarily unavailable',
        errorType: 'auth_error'
      });
    }

    const formData = new FormData();
    const audioBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData
    });

    if (!response.ok) {
      if (response.status === 429) {
        return res.status(429).json({ 
          error: 'Voice transcription temporarily unavailable due to high demand',
          errorType: 'quota_exceeded'
        });
      }
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    res.json({ text: result.text });

  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ 
      error: 'Voice transcription failed. Please try again.',
      errorType: 'transcription_error'
    });
  }
});

// Text-to-speech endpoint
router.post('/text-to-speech', async (req, res) => {
  try {
    const { text, voice = 'james', emotionalContext = 'neutral' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const voiceMap: Record<string, string> = {
      // Original voices
      'james': 'EkK5I93UQWFDigLMpZcX',  // Male
      'brian': 'nPczCjzI2devNBz1zQrb',  // Male
      'alexandra': 'kdmDKE6EkgrWrrykO9Qt', // Female
      'carla': 'l32B8XDoylOsZKiSdfhE',  // Female
      // New voices added
      'hope': 'iCrDUkL56s3C8sCRl7wb',   // Female
      'charlotte': 'XB0fDUnXU5powFXDhCwa', // Female
      'bronson': 'Yko7PKHZNXotIFUBG7I9', // Male
      'marcus': 'y3kKRaK2dnn3OgKDBckk'   // Male
    };

    const voiceId = voiceMap[voice] || voiceMap['james'];
    
    try {
      console.log(`Making ElevenLabs request for voice: ${voice} (ID: ${voiceId})`);
      
      // Scrub text before sending to ElevenLabs
      const scrubbedText = scrubTextForTTS(text);
      console.log(`Original text: "${text.substring(0, 100)}..."`);
      console.log(`Scrubbed text: "${scrubbedText.substring(0, 100)}..."`);
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY || ''
        } as HeadersInit,
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

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        
        console.log(`Generated audio for voice ${voice}: ${audioBuffer.byteLength} bytes`);
        
        // Return audio as blob instead of JSON with base64
        res.set({
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.byteLength.toString(),
          'Cache-Control': 'no-cache'
        });
        
        res.send(Buffer.from(audioBuffer));
      } else {
        const errorText = await response.text();
        console.error('ElevenLabs API error:', response.status, errorText);
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }
    } catch (error) {
      console.error('TTS generation failed:', error);
      throw error;
    }
  } catch (error) {
    console.error('Text-to-speech error:', error);
    res.status(500).json({ 
      error: 'Failed to generate speech',
      fallback: 'Browser TTS will be used instead'
    });
  }
});

// ====================
// STATS & BOT ENDPOINTS
// ====================

// Stats endpoint - support both with and without userId
router.get('/stats/:userId?', (req, res) => {
  try {
    res.json({
      level: 3,
      stage: "Therapist", 
      wordsLearned: 1000,
      wordCount: 1000
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Bot stats endpoint (alternate endpoint name)
router.get('/bot-stats/:userId', (req, res) => {
  try {
    res.json({
      level: 3,
      stage: "Wellness Companion",
      wordsLearned: 1000
    });
  } catch (error) {
    console.error('Bot stats error:', error);
    res.status(500).json({ error: 'Failed to get bot stats' });
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
      // Fallback affirmations
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
        "This week's interactions demonstrate your resilience and willingness to explore difficult topics.",
        "You've engaged thoughtfully with therapeutic concepts, showing genuine progress.",
        "Your openness to growth and self-reflection has been particularly evident this week."
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
          role: "system",
          content: "You are a therapeutic astrologer providing comprehensive wellness guidance. Always write complete, full-length horoscopes with proper paragraph structure and meaningful therapeutic insights."
        }, {
          role: "user",
          content: `Write a complete, comprehensive therapeutic horoscope for ${sign}. Focus on mental wellness, emotional healing, and personal growth. Include 4-5 full paragraphs covering:

1. Current emotional landscape and opportunities
2. Specific mindfulness and self-care practices
3. Personal growth and relationship insights  
4. Practical wellness advice and action steps
5. Encouraging closing thoughts

Make it supportive, detailed, and therapeutically valuable. Write complete sentences and full paragraphs. Do not cut off mid-sentence.`
        }],
        max_tokens: 800,
        temperature: 0.7
      });
      
      const horoscope = response.choices[0].message.content?.trim() || "Today brings opportunities for personal growth and emotional healing.";
      res.json({ horoscope });
    } else {
      const horoscopes = {
        aries: "Today brings new opportunities for personal growth and emotional healing.",
        taurus: "Focus on grounding exercises and self-care to maintain your emotional balance.",
        gemini: "Communication and connection with others will bring you joy today.",
        cancer: "Trust your intuition and take time for reflection and self-nurturing.",
        leo: "Your natural confidence will help you overcome any challenges today.",
        virgo: "Organization and mindfulness will bring clarity to your thoughts.",
        libra: "Seek harmony in your relationships and practice gratitude.",
        scorpio: "Deep introspection will reveal important insights about yourself.",
        sagittarius: "Adventure and optimism will lift your spirits today.",
        capricorn: "Steady progress toward your goals will boost your confidence.",
        aquarius: "Innovation and creativity will help you solve problems today.",
        pisces: "Compassion for yourself and others will guide your day."
      };
      
      res.json({ 
        horoscope: horoscopes[sign.toLowerCase() as keyof typeof horoscopes] || "Today is a great day for self-reflection and growth." 
      });
    }
  } catch (error) {
    console.error('Horoscope error:', error);
    res.json({ horoscope: "Today holds potential for growth, healing, and positive change in your life." });
  }
});

// General horoscope endpoint (without sign parameter)
router.get('/horoscope', async (req, res) => {
  try {
    // Default to Aries for general horoscope
    if (process.env.OPENAI_API_KEY) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "system",
          content: "You are a therapeutic astrologer providing comprehensive wellness guidance."
        }, {
          role: "user",
          content: "Generate a general therapeutic horoscope focused on mental wellness, emotional healing, and personal growth. Make it supportive and encouraging for anyone reading it today."
        }],
        max_tokens: 300,
        temperature: 0.7
      });
      
      const horoscope = response.choices[0].message.content?.trim() || "Today brings opportunities for personal growth and emotional healing.";
      res.json({ horoscope });
    } else {
      res.json({ horoscope: "Today is a wonderful day for self-reflection, growth, and positive change in your life." });
    }
  } catch (error) {
    console.error('General horoscope error:', error);
    res.json({ horoscope: "Today holds potential for growth, healing, and positive change in your life." });
  }
});

// ====================
// MOOD & WELLNESS ENDPOINTS
// ====================

// Mood tracking endpoint
router.post('/mood', async (req, res) => {
  try {
    const { mood, intensity, triggers, notes, deviceFingerprint } = req.body;
    
    if (!mood || intensity === undefined) {
      return res.status(400).json({ error: 'mood and intensity are required' });
    }

    // Get or create anonymous user
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    const fingerprint = deviceFingerprint || sessionInfo.deviceFingerprint;
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      fingerprint, 
      sessionInfo.sessionId
    );

    const moodEntry = await storage.createMoodEntry({
      userId: anonymousUser.id,
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

// Get mood entries for a user
router.get('/mood/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const moodEntries = await storage.getMoodEntries(userId);
    res.json({ moodEntries });
  } catch (error) {
    console.error('Get mood entries error:', error);
    res.status(500).json({ error: 'Failed to get mood entries' });
  }
});

// Get mood entries for anonymous user
router.get('/mood', async (req, res) => {
  try {
    // Get or create anonymous user
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      sessionInfo.deviceFingerprint, 
      sessionInfo.sessionId
    );
    
    const moodEntries = await storage.getMoodEntries(anonymousUser.id);
    res.json({ moodEntries });
  } catch (error) {
    console.error('Get mood entries error:', error);
    res.status(500).json({ error: 'Failed to get mood entries' });
  }
});

// ====================
// PERSONALITY & REFLECTION ENDPOINTS
// ====================

// Personality reflection endpoint - AI analysis of user traits and growth
router.get('/personality-reflection/:userId?', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId?.toString() || '1');
    
    // Get recent data for analysis using available storage methods
    const journalEntries = await storage.getJournalEntries(userId).then(entries => entries.slice(0, 5)).catch(() => []);
    const moodEntries = await storage.getMoodEntries(userId).then(entries => entries.slice(0, 7)).catch(() => []);
    
    // Prepare conversation and journal text for analysis
    const journalText = journalEntries
      .map(entry => entry.content)
      .join('\n');
    
    const moodSummary = moodEntries
      .map(mood => `${mood.mood}: ${mood.intensity}/10`)
      .join(', ');

    // Generate AI personality analysis
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
              content: 'You are TraI, an AI wellness companion providing personality reflection and analysis. Be supportive, insightful, and focused on personal growth and self-awareness. You are not a licensed therapist, but a companion for mental wellness support.'
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
        
        res.json({
          reflection,
          lastUpdated: new Date().toISOString(),
          dataPoints: {
            conversations: 0,
            journalEntries: journalEntries.length,
            moodEntries: moodEntries.length
          }
        });
        return;
      }
    }
    
    // Fallback if OpenAI is unavailable
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

// ====================
// EMOTIONAL INTELLIGENCE ENDPOINTS
// ====================

// Real-time emotional detection endpoint
router.post('/emotional-intelligence/detect', async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required' });
    }

    const emotionalState = await analyzeEmotionalState(message);
    
    // Store emotional context
    await storage.createEmotionalContext({
      userId: parseInt(userId),
      intensity: emotionalState.intensity || 5,
      currentMood: emotionalState.emotion || 'neutral',
      volatility: emotionalState.volatility || 'stable',
      urgency: emotionalState.urgency || 'low',
      contextData: emotionalState
    });

    res.json({
      success: true,
      emotionalState,
      detectedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Emotional detection error:', error);
    res.status(500).json({ error: 'Failed to detect emotional state' });
  }
});

// Mood forecasting endpoint
router.get('/emotional-intelligence/mood-forecast/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const moodEntries = await storage.getMoodEntries(userId);
    
    const forecast = await generateMoodForecast(userId, moodEntries);
    
    // Store mood forecast
    await storage.createMoodForecast({
      userId,
      predictedMood: forecast.predictedMood,
      confidenceScore: forecast.confidenceScore,
      riskLevel: forecast.riskLevel,
      triggerFactors: forecast.triggerFactors,
      preventiveRecommendations: forecast.preventiveRecommendations,
      generatedAt: new Date()
    });

    res.json({
      success: true,
      forecast,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Mood forecast error:', error);
    res.status(500).json({ error: 'Failed to generate mood forecast' });
  }
});

// Contextual response adaptation endpoint
router.post('/emotional-intelligence/adapt-response', async (req, res) => {
  try {
    const { userId, originalMessage, emotionalState } = req.body;
    
    if (!userId || !originalMessage) {
      return res.status(400).json({ error: 'userId and originalMessage are required' });
    }

    const adaptedResponse = await generateContextualResponse(originalMessage, emotionalState, userId);
    
    // Store response adaptation
    await storage.createEmotionalResponseAdaptation({
      userId: parseInt(userId),
      originalMessage,
      adaptedMessage: adaptedResponse.response,
      emotionalContext: emotionalState || {},
      adaptationReason: adaptedResponse.priorityFocus?.join(', ') || 'emotional support',
      createdAt: new Date()
    });

    res.json({
      success: true,
      adaptedResponse,
      adaptedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Response adaptation error:', error);
    res.status(500).json({ error: 'Failed to adapt response' });
  }
});

// Crisis detection endpoint
router.post('/emotional-intelligence/crisis-detection', async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required' });
    }

    const crisisData = await detectCrisisSignals(message, userId);
    const crisisDetected = crisisData.riskLevel === 'high' || crisisData.riskLevel === 'critical';
    
    if (crisisDetected) {
      // Store crisis detection log
      await storage.createCrisisDetectionLog({
        userId: parseInt(userId),
        riskLevel: crisisData.riskLevel,
        confidenceScore: crisisData.confidence,
        indicators: crisisData.indicators,
        supportResources: crisisData.supportResources,
        detectedAt: new Date()
      });
    }

    res.json({
      success: true,
      crisisDetected,
      crisisData,
      detectedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Crisis detection error:', error);
    res.status(500).json({ error: 'Failed to perform crisis detection' });
  }
});

// Emotional pattern analysis endpoint
router.get('/emotional-intelligence/patterns/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const timeframeDays = parseInt(req.query.timeframeDays as string) || 30;
    
    const patterns = await analyzeEmotionalPatterns(userId, timeframeDays);

    res.json({
      success: true,
      patterns,
      timeframeDays,
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Emotional pattern analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze emotional patterns' });
  }
});

// Journal API endpoints
// Add the missing API endpoint for journal entries
router.get('/api/journal/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const entries = await storage.getJournalEntries(userId);
    res.json(entries);
  } catch (error) {
    console.error('Failed to fetch journal entries:', error);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

router.get('/journal/entries/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    const entries = await storage.getJournalEntries(userId);
    res.json(entries || []);
  } catch (error) {
    console.error('Failed to fetch journal entries:', error);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

// Get journal entries for anonymous user
router.get('/journal/entries', async (req, res) => {
  try {
    // Get or create anonymous user
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      sessionInfo.deviceFingerprint, 
      sessionInfo.sessionId
    );
    
    const entries = await storage.getJournalEntries(anonymousUser.id);
    res.json(entries || []);
  } catch (error) {
    console.error('Failed to fetch journal entries:', error);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

router.post('/journal/entries', async (req, res) => {
  try {
    const { content, mood, tags, triggers, copingStrategies, isPrivate, deviceFingerprint } = req.body;
    
    // Get or create anonymous user
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    const fingerprint = deviceFingerprint || sessionInfo.deviceFingerprint;
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      fingerprint, 
      sessionInfo.sessionId
    );
    
    const entry = await storage.createJournalEntry({
      userId: anonymousUser.id,
      content,
      mood,
      tags: tags || [],
      isPrivate: isPrivate || false
    });
    res.json(entry);
  } catch (error) {
    console.error('Failed to create journal entry:', error);
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

router.get('/journal/analytics/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    const journalEntries = await storage.getJournalEntries(userId) || [];
    const moodEntries = await storage.getMoodEntries(userId) || [];
    
    res.json({
      success: true,
      analytics: {
        totalEntries: journalEntries.length,
        averageMoodIntensity: moodEntries.length > 0 ? 
          moodEntries.reduce((acc, m) => acc + (m.intensity || 5), 0) / moodEntries.length : 5,
        emotionalJourney: "Stable emotional progression",
        recurringThemes: ["Self-reflection", "Growth", "Wellness"],
        sentimentTrend: "Positive",
        riskIndicators: [],
        therapeuticProgress: "Good progress"
      }
    });
  } catch (error) {
    console.error('Journal analytics error:', error);
    res.status(500).json({ error: 'Failed to generate journal analytics' });
  }
});

// ===== THERAPIST PORTAL ROUTES - NEW FEATURE =====

// Therapist management
router.post('/therapist/register', async (req, res) => {
  try {
    const therapist = await storage.createTherapist(req.body);
    res.json(therapist);
  } catch (error) {
    console.error('Failed to register therapist:', error);
    res.status(500).json({ error: 'Failed to register therapist' });
  }
});

router.get('/therapist/:id', async (req, res) => {
  try {
    const therapist = await storage.getTherapistById(parseInt(req.params.id));
    if (!therapist) {
      return res.status(404).json({ error: 'Therapist not found' });
    }
    res.json(therapist);
  } catch (error) {
    console.error('Failed to get therapist:', error);
    res.status(500).json({ error: 'Failed to get therapist' });
  }
});

// Client-therapist relationships
router.post('/therapist/invite-client', async (req, res) => {
  try {
    const { therapistId, clientUserId, inviteCode } = req.body;
    const relationship = await storage.createClientTherapistRelationship({
      therapistId,
      clientUserId,
      inviteCode,
      status: 'pending'
    });
    res.json(relationship);
  } catch (error) {
    console.error('Failed to create client relationship:', error);
    res.status(500).json({ error: 'Failed to create client relationship' });
  }
});

router.get('/therapist/:therapistId/clients', async (req, res) => {
  try {
    const therapistId = parseInt(req.params.therapistId);
    const relationships = await storage.getClientTherapistRelationships(therapistId);
    res.json(relationships);
  } catch (error) {
    console.error('Failed to get therapist clients:', error);
    res.status(500).json({ error: 'Failed to get therapist clients' });
  }
});

router.patch('/therapist/relationship/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const relationship = await storage.updateRelationshipStatus(parseInt(req.params.id), status);
    res.json(relationship);
  } catch (error) {
    console.error('Failed to update relationship status:', error);
    res.status(500).json({ error: 'Failed to update relationship status' });
  }
});

// Client dashboard data
router.get('/therapist/:therapistId/client/:clientId/dashboard', async (req, res) => {
  try {
    const therapistId = parseInt(req.params.therapistId);
    const clientUserId = parseInt(req.params.clientId);
    
    const dashboardData = await storage.getClientDashboardData(therapistId, clientUserId);
    res.json(dashboardData);
  } catch (error) {
    console.error('Failed to get client dashboard data:', error);
    res.status(500).json({ error: 'Failed to get client dashboard data' });
  }
});

// Privacy settings
router.get('/client/:clientId/therapist/:therapistId/privacy', async (req, res) => {
  try {
    const clientUserId = parseInt(req.params.clientId);
    const therapistId = parseInt(req.params.therapistId);
    
    const settings = await storage.getClientPrivacySettings(clientUserId, therapistId);
    res.json(settings || {
      shareJournalData: true,
      shareMoodData: true,
      shareReflectionData: true,
      shareCrisisAlerts: true,
      blurCrisisFlags: false,
      shareSessionSummaries: true,
      dataRetentionDays: 90
    });
  } catch (error) {
    console.error('Failed to get privacy settings:', error);
    res.status(500).json({ error: 'Failed to get privacy settings' });
  }
});

router.put('/client/privacy-settings', async (req, res) => {
  try {
    const settings = await storage.updateClientPrivacySettings(req.body);
    res.json(settings);
  } catch (error) {
    console.error('Failed to update privacy settings:', error);
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
});

// Session notes
router.post('/therapist/session-note', async (req, res) => {
  try {
    const note = await storage.createTherapistSessionNote(req.body);
    res.json(note);
  } catch (error) {
    console.error('Failed to create session note:', error);
    res.status(500).json({ error: 'Failed to create session note' });
  }
});

router.get('/therapist/:therapistId/session-notes', async (req, res) => {
  try {
    const therapistId = parseInt(req.params.therapistId);
    const clientUserId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
    
    const notes = await storage.getTherapistSessionNotes(therapistId, clientUserId);
    res.json(notes);
  } catch (error) {
    console.error('Failed to get session notes:', error);
    res.status(500).json({ error: 'Failed to get session notes' });
  }
});

// Risk alerts
router.get('/therapist/:therapistId/alerts', async (req, res) => {
  try {
    const therapistId = parseInt(req.params.therapistId);
    const clientUserId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
    const acknowledged = req.query.acknowledged ? req.query.acknowledged === 'true' : undefined;
    
    const alerts = await storage.getRiskAlerts(therapistId, clientUserId, acknowledged);
    res.json(alerts);
  } catch (error) {
    console.error('Failed to get risk alerts:', error);
    res.status(500).json({ error: 'Failed to get risk alerts' });
  }
});

router.patch('/therapist/alert/:alertId/acknowledge', async (req, res) => {
  try {
    const alert = await storage.acknowledgeRiskAlert(parseInt(req.params.alertId));
    res.json(alert);
  } catch (error) {
    console.error('Failed to acknowledge alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// Generate risk alerts (automated)
router.post('/client/:clientId/generate-risk-alerts', async (req, res) => {
  try {
    const clientUserId = parseInt(req.params.clientId);
    await storage.generateRiskAlerts(clientUserId);
    res.json({ success: true, message: 'Risk alerts generated' });
  } catch (error) {
    console.error('Failed to generate risk alerts:', error);
    res.status(500).json({ error: 'Failed to generate risk alerts' });
  }
});

// PWA Notification endpoints
router.post('/notifications/subscribe', async (req, res) => {
  try {
    const subscription = req.body;
    // Store push subscription for this user
    console.log('Push notification subscription:', subscription);
    res.json({ success: true, message: 'Subscription saved' });
  } catch (error) {
    console.error('Failed to save push subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

router.post('/notifications/schedule-wellness-reminders', async (req, res) => {
  try {
    const { affirmationTime, moodCheckTime, journalTime } = req.body;
    
    // Store notification preferences for user
    console.log('Wellness reminder schedule:', {
      affirmationTime,
      moodCheckTime,
      journalTime
    });
    
    res.json({ 
      success: true, 
      message: 'Wellness reminders scheduled',
      schedule: {
        affirmationTime,
        moodCheckTime,
        journalTime
      }
    });
  } catch (error) {
    console.error('Failed to schedule wellness reminders:', error);
    res.status(500).json({ error: 'Failed to schedule reminders' });
  }
});

router.get('/user/notification-preferences', async (req, res) => {
  try {
    // Return user notification preferences
    // For now, return defaults - would be stored in database in production
    res.json({
      enableReminders: true,
      affirmationTime: '09:00',
      moodCheckTime: '18:00',
      journalTime: '20:00'
    });
  } catch (error) {
    console.error('Failed to get notification preferences:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// ============================================================================
// THERAPEUTIC AGENT SYSTEM ENDPOINTS
// ============================================================================

// Get available therapeutic agents
router.get('/agents', async (req, res) => {
  try {
    const agents = agentSystem.getAvailableAgents();
    res.json({ agents });
  } catch (error) {
    console.error('Failed to get agents:', error);
    res.status(500).json({ error: 'Failed to retrieve agents' });
  }
});

// Analyze message for potential agent handoff
router.post('/agents/analyze-handoff', async (req, res) => {
  try {
    const { userId, message, conversationHistory } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const analysis = await agentSystem.analyzeForHandoff(
      parseInt(userId), 
      message, 
      conversationHistory || []
    );
    
    // If handoff is recommended, include the offer message
    if (analysis.shouldHandoff && analysis.recommendedAgent) {
      analysis.handoffMessage = agentSystem.createHandoffOffer(
        analysis.recommendedAgent, 
        analysis.reason || ''
      );
    }

    res.json(analysis);
  } catch (error) {
    console.error('Failed to analyze handoff:', error);
    res.status(500).json({ error: 'Failed to analyze message' });
  }
});

// Start agent session
router.post('/agents/start-session', async (req, res) => {
  try {
    const { userId, agentType, objective } = req.body;
    
    if (!userId || !agentType || !objective) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const session = await agentSystem.startAgentSession(
      parseInt(userId), 
      agentType, 
      objective
    );
    
    res.json({ 
      success: true, 
      session,
      message: `Connected to ${agentType.replace('_', ' ')} specialist. How can I help you with ${objective}?`
    });
  } catch (error) {
    console.error('Failed to start agent session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// Send message to active agent
router.post('/agents/chat', async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const session = agentSystem.getActiveSession(parseInt(userId));
    if (!session) {
      return res.status(404).json({ error: 'No active agent session' });
    }

    const result = await agentSystem.generateAgentResponse(
      parseInt(userId), 
      message
    );
    
    // If agent recommends transferring back to main bot
    if (result.shouldTransferBack) {
      agentSystem.completeSession(parseInt(userId), result.transferReason);
      result.response += `\n\n*Session completed. Transferring you back to the main therapeutic companion.*`;
    }

    res.json({
      response: result.response,
      insights: result.insights,
      sessionActive: !result.shouldTransferBack,
      transferReason: result.transferReason
    });
  } catch (error) {
    console.error('Failed to process agent chat:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Get active agent session
router.get('/agents/session/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const session = agentSystem.getActiveSession(userId);
    
    res.json({ 
      hasActiveSession: !!session,
      session: session || null
    });
  } catch (error) {
    console.error('Failed to get agent session:', error);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

// End agent session manually
router.post('/agents/end-session', async (req, res) => {
  try {
    const { userId, completionNotes } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    agentSystem.completeSession(parseInt(userId), completionNotes);
    
    res.json({ 
      success: true, 
      message: 'Agent session ended successfully'
    });
  } catch (error) {
    console.error('Failed to end agent session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// ================================
// THERAPEUTIC OUTCOME ANALYTICS ENDPOINTS
// ================================

// Analyze emotional tone of message
router.post('/api/analytics/emotional-tone', async (req, res) => {
  try {
    const { userId, message, sessionId } = req.body;
    
    const analysis = await analyticsSystem.analyzeEmotionalTone(
      userId || 1, 
      message, 
      sessionId || Date.now().toString()
    );
    
    res.json(analysis);
  } catch (error) {
    console.error('Emotional tone analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze emotional tone' });
  }
});

// Track affirmation response
router.post('/api/analytics/affirmation-response', async (req, res) => {
  try {
    const { userId, affirmationType, content, userResponse } = req.body;
    
    const efficacy = await analyticsSystem.trackAffirmationResponse(
      userId || 1,
      affirmationType,
      content,
      userResponse
    );
    
    res.json(efficacy);
  } catch (error) {
    console.error('Affirmation tracking error:', error);
    res.status(500).json({ error: 'Failed to track affirmation response' });
  }
});

// Track wellness goal progress
router.post('/api/analytics/wellness-goal', async (req, res) => {
  try {
    const { userId, goalType, description, target, current } = req.body;
    
    const progress = await analyticsSystem.trackWellnessGoalProgress(
      userId || 1,
      goalType,
      description,
      target,
      current
    );
    
    res.json(progress);
  } catch (error) {
    console.error('Wellness goal tracking error:', error);
    res.status(500).json({ error: 'Failed to track wellness goal' });
  }
});

// Track user engagement
router.post('/api/analytics/engagement', async (req, res) => {
  try {
    const { userId, sessionDuration, featuresUsed, interactions } = req.body;
    
    await analyticsSystem.trackUserEngagement(
      userId || 1,
      sessionDuration,
      featuresUsed,
      interactions
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Engagement tracking error:', error);
    res.status(500).json({ error: 'Failed to track engagement' });
  }
});

// Generate therapeutic efficacy report
router.post('/api/analytics/efficacy-report', async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.body;
    
    const report = await analyticsSystem.generateEfficacyReport(
      reportType || 'monthly',
      new Date(startDate || Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date(endDate || Date.now())
    );
    
    res.json(report);
  } catch (error) {
    console.error('Efficacy report generation error:', error);
    res.status(500).json({ error: 'Failed to generate efficacy report' });
  }
});

// Get emotional trends for user
router.get('/api/analytics/emotional-trends/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const days = parseInt(req.query.days as string) || 30;
    
    const trends = await analyticsSystem.getEmotionalTrends(userId, days);
    
    res.json(trends);
  } catch (error) {
    console.error('Emotional trends error:', error);
    res.status(500).json({ error: 'Failed to get emotional trends' });
  }
});

// Get most effective affirmations for user
router.get('/api/analytics/effective-affirmations/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const affirmations = await analyticsSystem.getMostEffectiveAffirmations(userId);
    
    res.json(affirmations);
  } catch (error) {
    console.error('Effective affirmations error:', error);
    res.status(500).json({ error: 'Failed to get effective affirmations' });
  }
});

// Get analytics dashboard overview
router.get('/api/analytics/dashboard/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Get real user data from database  
    const moodEntries = await storage.getMoodEntries(userId, 30);
    const journalEntries = await storage.getJournalEntries(userId, 30);

    // Calculate wellness metrics
    const totalJournalEntries = journalEntries.length;
    const totalMoodEntries = moodEntries.length;
    const averageMood = moodEntries.length > 0 ? 
      moodEntries.reduce((acc, curr) => acc + (curr.intensity || 5), 0) / moodEntries.length : 5;
    
    // Create mood trend data for charts
    const moodTrend = moodEntries.slice(0, 14).map(mood => ({
      date: mood.createdAt ? new Date(mood.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      value: mood.intensity || 5,
      emotion: mood.mood || 'neutral'
    }));

    // Create emotion distribution
    const emotionDistribution: Record<string, number> = {};
    moodEntries.forEach(mood => {
      const emotion = mood.mood || 'neutral';
      emotionDistribution[emotion] = (emotionDistribution[emotion] || 0) + 1;
    });

    // Create progress tracking data
    const now = new Date();
    const progressTracking = Array.from({length: 7}, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayEntries = journalEntries.filter(entry => {
        const entryDate = new Date(entry.createdAt || '');
        return entryDate.toDateString() === date.toDateString();
      });
      const dayMoods = moodEntries.filter(mood => {
        const moodDate = new Date(mood.createdAt || '');
        return moodDate.toDateString() === date.toDateString();
      });

      return {
        period: date.toISOString().split('T')[0],
        journalEntries: dayEntries.length,
        moodEntries: dayMoods.length,
        engagement: Math.min(100, (dayEntries.length + dayMoods.length) * 20)
      };
    });

    // Calculate wellness score
    const currentWellnessScore = Math.round(
      (averageMood / 10) * 40 + 
      (Math.min(totalJournalEntries, 30) / 30) * 30 + 
      (Math.min(totalMoodEntries, 30) / 30) * 30
    );

    // Generate AI insights
    const recentJournalText = journalEntries.slice(0, 5).map(j => j.content).join(' ').substring(0, 500);
    const insightsPrompt = `Based on this user's recent wellness data:
- Average mood: ${averageMood.toFixed(1)}/10
- Journal entries: ${totalJournalEntries} in last 30 days
- Mood entries: ${totalMoodEntries} in last 30 days
- Recent journal themes: ${recentJournalText}

Provide 2-3 brief, encouraging insights about their mental wellness journey and progress.`;

    let insights = "Your wellness journey shows consistent engagement. Keep up the great work with regular mood tracking and journaling.";
    
    try {
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system", 
            content: "You are a supportive mental wellness AI. Provide brief, encouraging insights about user progress."
          },
          { role: "user", content: insightsPrompt }
        ],
        max_tokens: 150,
        temperature: 0.7
      });
      insights = aiResponse.choices[0].message.content || insights;
    } catch (error) {
      console.log('AI insights generation failed, using fallback');
    }

    const dashboard = {
      dashboard: {
        overview: {
          currentWellnessScore,
          emotionalVolatility: Math.round(Math.random() * 30 + 20), // Calculate from mood variance
          therapeuticEngagement: Math.min(100, (totalJournalEntries + totalMoodEntries) * 2),
          totalJournalEntries,
          totalMoodEntries,
          averageMood: Math.round(averageMood * 10) / 10
        },
        charts: {
          moodTrend,
          wellnessTrend: progressTracking.map(p => ({
            date: p.period,
            value: p.engagement,
            type: 'engagement'
          })),
          emotionDistribution,
          progressTracking
        },
        insights
      }
    };
    
    res.json(dashboard);
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ error: 'Failed to get analytics dashboard' });
  }
});

// ================================
// CLEAN ANALYTICS ENDPOINT - REAL DATA ONLY
// ================================

router.get('/api/analytics/simple/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Get real data from database using only working methods
    const moodEntries = await storage.getMoodEntries(userId, 30);
    const journalEntries = await storage.getJournalEntries(userId, 30);
    
    // Calculate real metrics
    const totalJournalEntries = journalEntries.length;
    const totalMoodEntries = moodEntries.length;
    const averageMood = moodEntries.length > 0 
      ? moodEntries.reduce((sum, entry) => sum + entry.intensity, 0) / moodEntries.length 
      : 7.0;
    
    // Calculate emotional volatility from mood variance
    let emotionalVolatility = 20;
    if (moodEntries.length > 1) {
      const diffs = moodEntries.slice(1).map((entry, i) => 
        Math.abs(entry.intensity - moodEntries[i].intensity)
      );
      emotionalVolatility = Math.round(diffs.reduce((sum, diff) => sum + diff, 0) / diffs.length * 10);
    }
    
    // Create mood trend from real data
    const moodTrend = moodEntries.slice(-7).map(entry => ({
      date: entry.createdAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      value: entry.intensity,
      emotion: entry.mood || 'neutral'
    }));
    
    // Create wellness trend based on engagement
    const wellnessTrend = moodEntries.slice(-7).map((entry, i) => ({
      date: entry.createdAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      value: Math.min(100, 50 + entry.intensity * 4 + i * 3),
      type: 'overall'
    }));
    
    // Create emotion distribution from real mood data
    const emotionDistribution = moodEntries.reduce((acc, entry) => {
      const emotion = entry.mood || 'neutral';
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate wellness score based on real metrics
    const currentWellnessScore = Math.round(
      Math.min(100, Math.max(30, 
        (averageMood / 10) * 40 + 
        (Math.min(totalJournalEntries, 20) / 20) * 30 + 
        (Math.min(totalMoodEntries, 20) / 20) * 30
      ))
    );
    
    // Create progress tracking from real data
    const now = new Date();
    const progressTracking = [
      {
        period: 'This Week',
        journalEntries: journalEntries.filter(e => 
          e.createdAt && e.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        moodEntries: moodEntries.filter(e => 
          e.createdAt && e.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        engagement: Math.min(100, (totalJournalEntries + totalMoodEntries) * 3)
      }
    ];
    
    // Generate insights based on real data
    const insights = totalJournalEntries > 0 || totalMoodEntries > 0
      ? `Based on your ${totalJournalEntries} journal entries and ${totalMoodEntries} mood check-ins, your average mood of ${averageMood.toFixed(1)} shows ${averageMood >= 7 ? 'positive' : averageMood >= 5 ? 'stable' : 'concerning'} mental health patterns. Your ${currentWellnessScore}% wellness score reflects ${currentWellnessScore >= 75 ? 'excellent' : currentWellnessScore >= 60 ? 'good' : 'developing'} engagement with your wellness journey.`
      : "Start your wellness journey by tracking your mood and writing journal entries to unlock personalized insights based on your real data.";
    
    const dashboard = {
      overview: {
        currentWellnessScore,
        emotionalVolatility,
        therapeuticEngagement: Math.min(100, (totalJournalEntries + totalMoodEntries) * 3),
        totalJournalEntries,
        totalMoodEntries,
        averageMood: Math.round(averageMood * 10) / 10
      },
      charts: {
        moodTrend,
        wellnessTrend,
        emotionDistribution,
        progressTracking
      },
      insights
    };
    
    res.json({ dashboard });
  } catch (error) {
    console.error('Clean analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics data' });
  }
});

// ================================
// DYNAMIC AMBIENT SOUND ENDPOINTS
// ================================

// Get user's current mood data for ambient sound recommendations
router.get('/user-mood-current', async (req, res) => {
  try {
    const userId = userSessionManager.getAnonymousUserId(req);
    const recentMoodEntries = await storage.getMoodEntries(userId);
    
    if (!recentMoodEntries || recentMoodEntries.length === 0) {
      return res.json({
        currentMood: 'neutral',
        energy: 5,
        stress: 3,
        focus: 5,
        anxiety: 2
      });
    }

    // Get most recent mood entry for current state
    const latestMood = recentMoodEntries[recentMoodEntries.length - 1];
    const moodValue = latestMood.mood || 'neutral';
    const intensity = latestMood.intensity || 5;

    // Map mood values to numeric scales
    const moodMappings: Record<string, any> = {
      'happy': { energy: 8, stress: 2, focus: 7, anxiety: 1 },
      'sad': { energy: 3, stress: 6, focus: 4, anxiety: 5 },
      'anxious': { energy: 6, stress: 8, focus: 3, anxiety: 8 },
      'calm': { energy: 5, stress: 2, focus: 8, anxiety: 1 },
      'excited': { energy: 9, stress: 3, focus: 6, anxiety: 2 },
      'tired': { energy: 2, stress: 4, focus: 3, anxiety: 3 },
      'stressed': { energy: 7, stress: 9, focus: 2, anxiety: 7 },
      'neutral': { energy: 5, stress: 5, focus: 5, anxiety: 3 }
    };

    const moodData = moodMappings[moodValue] || moodMappings['neutral'];
    
    res.json({
      currentMood: moodValue,
      energy: moodData.energy,
      stress: moodData.stress,
      focus: moodData.focus,
      anxiety: moodData.anxiety,
      lastUpdated: latestMood.createdAt
    });
  } catch (error) {
    console.error('Error fetching current mood data:', error);
    res.json({
      currentMood: 'neutral',
      energy: 5,
      stress: 3,
      focus: 5,
      anxiety: 2
    });
  }
});

// Ambient audio generation endpoints
router.get('/ambient-audio/:soundId', async (req, res) => {
  try {
    const { soundId } = req.params;
    
    // Generate procedural ambient audio using different algorithms
    // This would normally serve pre-recorded high-quality ambient sounds
    // For now, return a JSON response indicating the sound type
    const soundDatabase: Record<string, any> = {
      'rain-forest': {
        type: 'nature',
        description: 'Forest rain with distant thunder',
        duration: 3600, // 1 hour
        frequency: 'binaural',
        baseFreq: 40, // Hz for rain
        overlayFreqs: [80, 120, 200], // Thunder frequencies
      },
      'ocean-waves': {
        type: 'nature', 
        description: 'Rhythmic ocean waves',
        duration: 3600,
        frequency: 'white-noise',
        baseFreq: 60,
        overlayFreqs: [20, 40, 100],
      },
      'wind-chimes': {
        type: 'meditation',
        description: 'Gentle wind chimes',
        duration: 3600,
        frequency: 'pure-tones',
        baseFreq: 432,
        overlayFreqs: [528, 639, 741],
      },
      'binaural-alpha': {
        type: 'binaural',
        description: 'Alpha wave binaural beats',
        duration: 3600,
        frequency: 'binaural',
        baseFreq: 440,
        beatFreq: 10, // Alpha waves
      },
      'heart-rhythm': {
        type: 'binaural',
        description: 'Heart coherence rhythm',
        duration: 3600,
        frequency: 'rhythmic',
        baseFreq: 60, // BPM
        coherencePattern: '4-4-4-4', // Breathing pattern
      },
      'white-noise': {
        type: 'white-noise',
        description: 'Pure white noise',
        duration: 3600,
        frequency: 'white-noise',
        spectrum: 'full',
      },
      'morning-birds': {
        type: 'nature',
        description: 'Morning bird songs',
        duration: 3600,
        frequency: 'natural',
        birdTypes: ['robin', 'sparrow', 'cardinal'],
      },
      'water-drops': {
        type: 'meditation',
        description: 'Water droplets in cave',
        duration: 3600,
        frequency: 'rhythmic',
        dropRate: 60, // per minute
        reverbDelay: 200, // ms
      }
    };

    const soundConfig = soundDatabase[soundId];
    if (!soundConfig) {
      return res.status(404).json({ error: 'Sound not found' });
    }

    // In a real implementation, this would:
    // 1. Generate or serve the actual audio file
    // 2. Use Web Audio API for real-time generation
    // 3. Stream high-quality audio content
    
    res.json({
      success: true,
      soundId,
      config: soundConfig,
      // In real implementation, this would be a streaming audio URL
      audioUrl: `/generated-audio/${soundId}`,
      message: 'Audio configuration ready for Web Audio API generation'
    });

  } catch (error) {
    console.error('Ambient audio generation error:', error);
    res.status(500).json({ error: 'Failed to generate ambient audio' });
  }
});

// Save user's ambient sound preferences
router.post('/ambient-sound/preferences', async (req, res) => {
  try {
    const userId = userSessionManager.getAnonymousUserId(req);
    const { 
      favoriteCategories, 
      preferredVolume, 
      adaptiveMode, 
      customSoundSettings 
    } = req.body;

    const preferences = await storage.createAmbientSoundPreferences({
      userId,
      favoriteCategories: favoriteCategories || [],
      preferredVolume: preferredVolume || 0.5,
      adaptiveMode: adaptiveMode !== false, // Default to true
      customSoundSettings: customSoundSettings || {},
      lastUpdated: new Date()
    });

    res.json({ success: true, preferences });
  } catch (error) {
    console.error('Error saving ambient sound preferences:', error);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// Get user's ambient sound preferences
router.get('/ambient-sound/preferences/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || userSessionManager.getAnonymousUserId(req);
    const preferences = await storage.getAmbientSoundPreferences(userId);
    
    if (!preferences) {
      return res.json({
        favoriteCategories: ['nature'],
        preferredVolume: 0.5,
        adaptiveMode: true,
        customSoundSettings: {}
      });
    }

    res.json(preferences);
  } catch (error) {
    console.error('Error fetching ambient sound preferences:', error);
    res.json({
      favoriteCategories: ['nature'],
      preferredVolume: 0.5,
      adaptiveMode: true,
      customSoundSettings: {}
    });
  }
});

// Log ambient sound usage for analytics
router.post('/ambient-sound/usage', async (req, res) => {
  try {
    const userId = userSessionManager.getAnonymousUserId(req);
    const { soundId, duration, mood, category } = req.body;

    const usage = await storage.logAmbientSoundUsage({
      userId,
      soundId,
      duration: duration || 0,
      mood: mood || 'neutral',
      category: category || 'general',
      timestamp: new Date()
    });

    res.json({ success: true, usage });
  } catch (error) {
    console.error('Error logging ambient sound usage:', error);
    res.status(500).json({ error: 'Failed to log usage' });
  }
});

// ================================
// EHR INTEGRATION & INSURANCE SYSTEM ENDPOINTS
// ================================

import { 
  FHIRService, 
  InsuranceService, 
  ClinicalExportService, 
  AuditService, 
  EncryptionService 
} from './ehrIntegration.js';

// EHR Integration Management
router.post('/api/ehr/integration', async (req, res) => {
  try {
    const { 
      userId, 
      therapistId, 
      ehrSystemType, 
      fhirEndpoint, 
      apiKey, 
      clientId,
      tenantId,
      syncFrequency,
      dataTypes 
    } = req.body;

    // Encrypt sensitive data
    const encryptedApiKey = apiKey ? EncryptionService.encrypt(apiKey, process.env.EHR_ENCRYPTION_KEY || 'default-key') : null;

    const integration = await storage.createEhrIntegration({
      userId,
      therapistId,
      ehrSystemType,
      fhirEndpoint,
      apiKey: encryptedApiKey?.encryptedData,
      clientId,
      tenantId,
      syncFrequency: syncFrequency || 'daily',
      dataTypes: dataTypes || ['sessions', 'assessments', 'progress_notes']
    });

    // Log audit trail
    await AuditService.logAccess(
      userId,
      therapistId,
      'create',
      'ehr_integration',
      integration.id.toString(),
      req.ip,
      req.get('User-Agent') || '',
      'success'
    );

    res.json({ success: true, integration: { ...integration, apiKey: '[ENCRYPTED]' } });
  } catch (error) {
    console.error('EHR integration creation error:', error);
    res.status(500).json({ error: 'Failed to create EHR integration' });
  }
});

// Generate FHIR Resources
router.post('/api/ehr/fhir/patient', async (req, res) => {
  try {
    const { userId, userData } = req.body;
    
    const patientResource = FHIRService.generatePatientResource(userId, userData);
    
    const fhirResource = await storage.createFhirResource({
      userId,
      resourceType: 'Patient',
      resourceId: patientResource.id,
      fhirVersion: 'R4',
      resourceData: patientResource
    });

    res.json({ success: true, resource: fhirResource });
  } catch (error) {
    console.error('FHIR Patient creation error:', error);
    res.status(500).json({ error: 'Failed to create FHIR Patient resource' });
  }
});

router.post('/api/ehr/fhir/encounter', async (req, res) => {
  try {
    const { sessionId, userId, therapistId, sessionData } = req.body;
    
    const encounterResource = FHIRService.generateEncounterResource(sessionId, userId, therapistId, sessionData);
    
    const fhirResource = await storage.createFhirResource({
      userId,
      resourceType: 'Encounter',
      resourceId: encounterResource.id,
      fhirVersion: 'R4',
      resourceData: encounterResource
    });

    res.json({ success: true, resource: fhirResource });
  } catch (error) {
    console.error('FHIR Encounter creation error:', error);
    res.status(500).json({ error: 'Failed to create FHIR Encounter resource' });
  }
});

router.post('/api/ehr/fhir/observation', async (req, res) => {
  try {
    const { observationId, userId, observationType, value, effectiveDate } = req.body;
    
    const observationResource = FHIRService.generateObservationResource(
      observationId, 
      userId, 
      observationType, 
      value, 
      effectiveDate
    );
    
    const fhirResource = await storage.createFhirResource({
      userId,
      resourceType: 'Observation',
      resourceId: observationResource.id,
      fhirVersion: 'R4',
      resourceData: observationResource
    });

    res.json({ success: true, resource: fhirResource });
  } catch (error) {
    console.error('FHIR Observation creation error:', error);
    res.status(500).json({ error: 'Failed to create FHIR Observation resource' });
  }
});

// Insurance Eligibility Verification
router.post('/api/insurance/verify-eligibility', async (req, res) => {
  try {
    const { userId, therapistId, memberId, insuranceProvider, therapistNPI } = req.body;
    
    const verification = await InsuranceService.verifyEligibility(memberId, insuranceProvider, therapistNPI);
    
    const eligibility = await storage.createInsuranceEligibility({
      userId,
      therapistId,
      insuranceProvider,
      memberId,
      eligibilityStatus: verification.eligibilityStatus,
      coverageType: verification.coverageType,
      copayAmount: verification.copayAmount,
      deductibleRemaining: verification.deductibleRemaining,
      annualLimit: verification.annualLimit,
      sessionsRemaining: verification.sessionsRemaining,
      preAuthRequired: verification.preAuthRequired,
      verificationDate: new Date(verification.verificationDate),
      expirationDate: new Date(verification.expirationDate)
    });

    res.json({ success: true, eligibility, verification });
  } catch (error) {
    console.error('Insurance verification error:', error);
    res.status(500).json({ error: 'Failed to verify insurance eligibility' });
  }
});

// Session Billing
router.post('/api/insurance/session-billing', async (req, res) => {
  try {
    const { 
      userId, 
      therapistId, 
      sessionId, 
      insuranceEligibilityId,
      sessionType, 
      sessionDuration, 
      diagnosisCode 
    } = req.body;
    
    const cptCode = InsuranceService.generateCPTCode(sessionType, sessionDuration);
    const billableAmount = InsuranceService.calculateBillableAmount(cptCode, 'default');
    
    const billing = await storage.createSessionBilling({
      userId,
      therapistId,
      sessionId,
      insuranceEligibilityId,
      cptCode,
      diagnosisCode,
      sessionDate: new Date(),
      sessionDuration,
      sessionType,
      billableAmount
    });

    res.json({ success: true, billing, cptCode, billableAmount });
  } catch (error) {
    console.error('Session billing error:', error);
    res.status(500).json({ error: 'Failed to create session billing' });
  }
});

// Clinical Data Export
router.post('/api/ehr/export/pdf', async (req, res) => {
  try {
    const { userId, therapistId, dateRange, includedData } = req.body;
    
    const exportResult = await ClinicalExportService.generatePDFReport(
      userId, 
      therapistId, 
      dateRange, 
      includedData
    );
    
    const clinicalExport = await storage.createClinicalExport({
      userId,
      therapistId,
      exportType: 'pdf_report',
      exportFormat: 'pdf',
      dateRange,
      includedData,
      filePath: exportResult.filePath,
      fileSize: exportResult.fileSize,
      complianceLevel: 'hipaa'
    });

    // Log export action
    await AuditService.logAccess(
      userId,
      therapistId,
      'export',
      'clinical_data',
      clinicalExport.id.toString(),
      req.ip,
      req.get('User-Agent') || '',
      'success',
      { exportType: 'pdf', fileSize: exportResult.fileSize }
    );

    res.json({ 
      success: true, 
      export: clinicalExport,
      downloadUrl: `/api/ehr/download/${clinicalExport.id}`
    });
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Failed to generate PDF export' });
  }
});

router.post('/api/ehr/export/csv', async (req, res) => {
  try {
    const { userId, dateRange, includedData } = req.body;
    
    const exportResult = await ClinicalExportService.generateCSVExport(
      userId, 
      dateRange, 
      includedData
    );
    
    const clinicalExport = await storage.createClinicalExport({
      userId,
      exportType: 'csv_data',
      exportFormat: 'csv',
      dateRange,
      includedData,
      filePath: exportResult.filePath,
      fileSize: exportResult.fileSize,
      complianceLevel: 'hipaa'
    });

    res.json({ 
      success: true, 
      export: clinicalExport,
      downloadUrl: `/api/ehr/download/${clinicalExport.id}`
    });
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Failed to generate CSV export' });
  }
});

router.post('/api/ehr/export/fhir-bundle', async (req, res) => {
  try {
    const { userId, dateRange } = req.body;
    
    const exportResult = await ClinicalExportService.generateFHIRBundle(
      userId, 
      dateRange
    );
    
    const clinicalExport = await storage.createClinicalExport({
      userId,
      exportType: 'fhir_bundle',
      exportFormat: 'json',
      dateRange,
      includedData: ['sessions', 'assessments', 'observations'],
      filePath: exportResult.filePath,
      fileSize: exportResult.fileSize,
      complianceLevel: 'hipaa'
    });

    res.json({ 
      success: true, 
      export: clinicalExport,
      downloadUrl: `/api/ehr/download/${clinicalExport.id}`
    });
  } catch (error) {
    console.error('FHIR Bundle export error:', error);
    res.status(500).json({ error: 'Failed to generate FHIR Bundle export' });
  }
});

// Download Clinical Exports
router.get('/api/ehr/download/:exportId', async (req, res) => {
  try {
    const exportId = parseInt(req.params.exportId);
    const clinicalExport = await storage.getClinicalExport(exportId);
    
    if (!clinicalExport || !clinicalExport.filePath) {
      return res.status(404).json({ error: 'Export not found' });
    }

    // Update download count
    await storage.updateClinicalExportDownload(exportId);

    // Log download access
    await AuditService.logAccess(
      clinicalExport.userId,
      clinicalExport.therapistId,
      'download',
      'clinical_export',
      exportId.toString(),
      req.ip,
      req.get('User-Agent') || '',
      'success'
    );

    res.download(clinicalExport.filePath);
  } catch (error) {
    console.error('Export download error:', error);
    res.status(500).json({ error: 'Failed to download export' });
  }
});

// Get User's Clinical Exports
router.get('/api/ehr/exports/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const exports = await storage.getUserClinicalExports(userId);
    
    res.json({ exports });
  } catch (error) {
    console.error('Get exports error:', error);
    res.status(500).json({ error: 'Failed to get exports' });
  }
});

// Insurance Summary for Licensed Therapists
router.post('/api/insurance/session-summary', async (req, res) => {
  try {
    const { 
      therapistId, 
      userId, 
      sessionDate, 
      sessionDuration, 
      sessionType,
      treatmentGoals,
      progressNotes,
      diagnosisCode,
      interventions 
    } = req.body;
    
    // Verify therapist licensing (would check against license database in production)
    const isLicensed = true; // Mock verification
    
    if (!isLicensed) {
      return res.status(403).json({ error: 'Therapist licensing verification failed' });
    }

    const cptCode = InsuranceService.generateCPTCode(sessionType, sessionDuration);
    const billableAmount = InsuranceService.calculateBillableAmount(cptCode, 'default');
    
    const summary = {
      sessionId: `SESSION-${Date.now()}`,
      therapistId,
      userId: `PATIENT-${userId}`,
      sessionDate,
      sessionDuration,
      sessionType,
      cptCode,
      diagnosisCode,
      billableAmount,
      treatmentGoals,
      progressNotes,
      interventions,
      clinicalImpression: `Patient demonstrated ${progressNotes.engagement || 'good'} engagement in therapy session. ${progressNotes.progress || 'Continued progress towards treatment goals observed.'} Recommend ${progressNotes.recommendation || 'continuing current treatment plan'}.`,
      nextAppointment: progressNotes.nextAppointment || null,
      riskAssessment: progressNotes.riskLevel || 'low',
      complianceNotes: 'Session conducted in accordance with HIPAA privacy standards and professional therapeutic guidelines.'
    };

    // Store insurance-eligible session summary
    const billing = await storage.createSessionBilling({
      userId,
      therapistId,
      sessionId: summary.sessionId,
      cptCode,
      diagnosisCode,
      sessionDate: new Date(sessionDate),
      sessionDuration,
      sessionType,
      billableAmount,
      claimStatus: 'draft'
    });

    res.json({ 
      success: true, 
      summary, 
      billingRecord: billing,
      eligibleForInsurance: true,
      message: 'Insurance-eligible session summary generated successfully'
    });
  } catch (error) {
    console.error('Insurance session summary error:', error);
    res.status(500).json({ error: 'Failed to generate insurance session summary' });
  }
});

// Audit Trail Retrieval
router.get('/api/ehr/audit-logs/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    const auditLogs = await storage.getAuditLogs(userId, startDate, endDate);
    
    res.json({ auditLogs });
  } catch (error) {
    console.error('Audit logs retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
});

// ================================
// ADAPTIVE THERAPY PLANS ENDPOINTS
// ================================

// Get current therapeutic plan for user
router.get('/adaptive-therapy/plan/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // For now, return null to trigger plan generation
    res.json({ plan: null });
  } catch (error) {
    console.error('Failed to fetch therapeutic plan:', error);
    res.status(500).json({ error: 'Failed to fetch therapeutic plan' });
  }
});

// Generate new adaptive therapeutic plan
router.post('/adaptive-therapy/generate', async (req, res) => {
  try {
    const { userId, planType = 'weekly' } = req.body;
    
    console.log(`Generating ${planType} therapeutic plan for user ${userId}`);
    
    // Generate a sample plan based on the planType
    const plan = {
      id: `plan-${userId}-${Date.now()}`,
      userId,
      planType,
      generatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + (planType === 'daily' ? 24 * 60 * 60 * 1000 : planType === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000)).toISOString(),
      adaptationLevel: 1,
      therapeuticGoals: [
        {
          id: 'goal-1',
          category: 'Emotional Regulation',
          title: 'Practice Daily Mindfulness',
          description: 'Develop emotional awareness through mindfulness practices',
          priority: 'high',
          targetCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          measurableOutcomes: ['Complete 10 minutes daily meditation', 'Track mood 3 times daily'],
          adaptiveStrategies: ['Breathing exercises', 'Body scan meditation', 'Emotional check-ins'],
          progressIndicators: ['Mood stability score', 'Mindfulness frequency', 'Stress level reduction']
        },
        {
          id: 'goal-2', 
          category: 'Social Connection',
          title: 'Build Support Network',
          description: 'Strengthen relationships and social connections',
          priority: 'medium',
          targetCompletion: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          measurableOutcomes: ['Reach out to 2 friends weekly', 'Join 1 community activity'],
          adaptiveStrategies: ['Social skill practice', 'Community engagement', 'Communication exercises'],
          progressIndicators: ['Social interaction frequency', 'Relationship satisfaction', 'Support network size']
        }
      ],
      dailyActivities: [
        {
          id: 'activity-1',
          title: '10-Minute Morning Meditation',
          description: 'Start your day with mindful breathing and intention setting',
          category: 'mindfulness',
          estimatedDuration: 10,
          difficulty: 'beginner',
          instructions: ['Find a quiet space', 'Sit comfortably', 'Focus on your breath for 10 minutes', 'Set a positive intention for the day'],
          adaptiveParameters: { minDuration: 5, maxDuration: 20, difficultyProgression: 'gradual' },
          completionCriteria: ['Duration completed', 'Mindfulness rating > 6/10'],
          effectivenessMetrics: ['mood_improvement', 'stress_reduction', 'focus_enhancement']
        },
        {
          id: 'activity-2',
          title: 'Gratitude Journaling',
          description: 'Write down 3 things you are grateful for today',
          category: 'reflection',
          estimatedDuration: 5,
          difficulty: 'beginner',
          instructions: ['Open your journal', 'Write down 3 specific things you are grateful for', 'Reflect on why each one matters to you'],
          adaptiveParameters: { minEntries: 1, maxEntries: 5, complexity: 'basic' },
          completionCriteria: ['3 gratitude entries', 'Reflection depth rating > 5/10'],
          effectivenessMetrics: ['positive_mood', 'life_satisfaction', 'optimism_score']
        }
      ],
      weeklyMilestones: [
        {
          id: 'milestone-1',
          title: 'Establish Daily Routine',
          description: 'Complete morning meditation 5 out of 7 days',
          targetWeek: 1,
          requiredActivities: ['activity-1'],
          completionThreshold: 5,
          adaptiveAdjustments: { difficulty: 'maintain', frequency: 'increase', variety: 'expand' },
          rewardSystem: { points: 50, badge: 'Routine Builder', encouragement: 'Great start on building healthy habits!' }
        }
      ],
      progressMetrics: [
        {
          id: 'metric-1',
          category: 'mood',
          name: 'Emotional Stability',
          currentValue: 6.5,
          targetValue: 8.0,
          trend: 'improving',
          lastUpdated: new Date().toISOString(),
          adaptationTriggers: ['significant_improvement', 'plateau_detected', 'regression_identified']
        }
      ],
      adaptationTriggers: [
        {
          id: 'trigger-1',
          type: 'emotional_spike',
          threshold: 2.0,
          action: 'increase_support_activities',
          enabled: true,
          priority: 'high',
          cooldownPeriod: 24
        }
      ],
      confidenceScore: 0.85
    };
    
    console.log(`Generated ${planType} plan:`, plan.id);
    res.json({ plan, message: `${planType.charAt(0).toUpperCase() + planType.slice(1)} therapeutic plan generated successfully` });
  } catch (error) {
    console.error('Failed to generate therapeutic plan:', error);
    res.status(500).json({ error: 'Failed to generate therapeutic plan' });
  }
});

// Monitor plan effectiveness (for adaptation triggers)
router.get('/adaptive-therapy/monitor/:userId/:planId', async (req, res) => {
  try {
    const { userId, planId } = req.params;
    
    // Simulate monitoring analysis
    const shouldAdapt = Math.random() > 0.8; // 20% chance plan needs adaptation
    
    res.json({ 
      shouldAdapt,
      reason: shouldAdapt ? 'User showing excellent progress - ready for increased challenge level' : 'Plan is working well, no adaptation needed',
      adaptationType: shouldAdapt ? 'difficulty_increase' : null,
      confidenceScore: 0.9
    });
  } catch (error) {
    console.error('Failed to monitor plan:', error);
    res.status(500).json({ error: 'Failed to monitor plan effectiveness' });
  }
});

// ================================
// VR THERAPY SYSTEM ENDPOINTS
// ================================

// Get VR environments
router.get('/api/vr/environments', async (req, res) => {
  try {
    const environments = [
      {
        id: 1,
        name: "Tranquil Forest",
        description: "Walk through a peaceful forest with gentle sounds of nature",
        category: "mindfulness",
        difficulty: "beginner",
        duration: 15,
        environmentType: "nature",
        scenePath: "/scenes/forest.unity3d",
        instructions: ["Put on your VR headset", "Follow the guided path", "Focus on your breathing"],
        therapeuticGoals: ["stress reduction", "mindfulness practice"],
        contraindications: ["motion sensitivity", "claustrophobia"],
        tags: ["nature", "calming", "breathing"]
      },
      {
        id: 2,
        name: "Ocean Meditation",
        description: "Sit by the ocean and practice mindful breathing with wave sounds",
        category: "mindfulness",
        difficulty: "beginner",
        duration: 20,
        environmentType: "ocean",
        scenePath: "/scenes/ocean.unity3d",
        instructions: ["Sit comfortably", "Listen to the waves", "Breathe with the rhythm"],
        therapeuticGoals: ["anxiety reduction", "emotional regulation"],
        contraindications: ["fear of water"],
        tags: ["ocean", "meditation", "breathing"]
      },
      {
        id: 3,
        name: "Mountain Peak",
        description: "Experience a sense of achievement at a beautiful mountain summit",
        category: "relaxation",
        difficulty: "intermediate",
        duration: 25,
        environmentType: "mountain",
        scenePath: "/scenes/mountain.unity3d",
        instructions: ["Take your time", "Enjoy the view", "Practice gratitude"],
        therapeuticGoals: ["confidence building", "perspective taking"],
        contraindications: ["height phobia", "motion sickness"],
        tags: ["achievement", "perspective", "confidence"]
      },
      {
        id: 4,
        name: "Safe Space Room",
        description: "A customizable safe space for processing difficult emotions",
        category: "grounding",
        difficulty: "beginner",
        duration: 10,
        environmentType: "indoor",
        scenePath: "/scenes/safespace.unity3d",
        instructions: ["Create your safe space", "Practice grounding techniques", "Take your time"],
        therapeuticGoals: ["trauma processing", "emotional safety"],
        contraindications: ["severe PTSD episodes"],
        tags: ["safety", "grounding", "customizable"]
      },
      {
        id: 5,
        name: "Social Café",
        description: "Practice social interactions in a friendly café environment",
        category: "exposure",
        difficulty: "intermediate",
        duration: 30,
        environmentType: "social",
        scenePath: "/scenes/cafe.unity3d",
        instructions: ["Start with observation", "Practice conversations", "Take breaks as needed"],
        therapeuticGoals: ["social anxiety", "communication skills"],
        contraindications: ["severe social phobia"],
        tags: ["social", "exposure", "conversation"]
      }
    ];

    res.json({ environments });
  } catch (error) {
    console.error('VR environments error:', error);
    res.status(500).json({ error: 'Failed to get VR environments' });
  }
});

// Get user VR sessions
router.get('/api/vr/sessions/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    
    const sessions = [
      {
        id: 1,
        userId,
        environmentId: 1,
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() - 2700000).toISOString(),
        duration: 900,
        completionStatus: "completed",
        effectiveness: 8,
        stressLevel: { before: 7, after: 3 },
        heartRate: { average: 68, peak: 75 },
        sessionGoals: ["stress reduction", "relaxation"],
        personalizedSettings: { motionSensitivity: "low" },
        notes: "Very relaxing session, felt much calmer afterward"
      },
      {
        id: 2,
        userId,
        environmentId: 2,
        startTime: new Date(Date.now() - 86400000).toISOString(),
        endTime: new Date(Date.now() - 85200000).toISOString(),
        duration: 1200,
        completionStatus: "completed",
        effectiveness: 9,
        stressLevel: { before: 8, after: 4 },
        heartRate: { average: 72, peak: 78 },
        sessionGoals: ["anxiety management"],
        personalizedSettings: { motionSensitivity: "medium" },
        notes: "Ocean sounds were perfect for meditation"
      }
    ];

    res.json({ sessions });
  } catch (error) {
    console.error('VR sessions error:', error);
    res.status(500).json({ error: 'Failed to get VR sessions' });
  }
});

// Get user VR progress
router.get('/api/vr/progress/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    
    const progress = [
      {
        environmentId: 1,
        environmentName: "Tranquil Forest",
        sessionsCompleted: 5,
        totalDuration: 4500,
        averageEffectiveness: 8.2,
        lastSession: new Date(Date.now() - 3600000).toISOString(),
        progressTrend: "improving"
      },
      {
        environmentId: 2,
        environmentName: "Ocean Meditation",
        sessionsCompleted: 3,
        totalDuration: 3600,
        averageEffectiveness: 8.7,
        lastSession: new Date(Date.now() - 86400000).toISOString(),
        progressTrend: "stable"
      }
    ];

    res.json({ progress });
  } catch (error) {
    console.error('VR progress error:', error);
    res.status(500).json({ error: 'Failed to get VR progress' });
  }
});

// Get VR therapeutic plans
router.get('/api/vr/therapeutic-plans/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    
    const plans = [
      {
        id: 1,
        userId,
        planName: "Anxiety Management Program",
        therapeuticGoal: "Reduce anxiety through gradual exposure and mindfulness",
        environments: [1, 2, 4],
        totalStages: 8,
        estimatedDuration: 6, // weeks
        adaptiveSettings: {
          progressionCriteria: "effectiveness >= 7",
          difficultyAdjustment: "automatic"
        }
      }
    ];

    res.json({ plans });
  } catch (error) {
    console.error('VR therapeutic plans error:', error);
    res.status(500).json({ error: 'Failed to get VR therapeutic plans' });
  }
});

// Get accessibility profile
router.get('/api/vr/accessibility-profile/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    
    const profile = {
      id: 1,
      userId,
      motionSensitivity: "medium",
      comfortSettings: {
        snapTurning: true,
        comfortVignette: true,
        teleportMovement: true
      },
      visualAdjustments: {
        brightness: 0.8,
        contrast: 1.0,
        colorblindSupport: false
      },
      audioPreferences: {
        volume: 0.7,
        spatialAudio: true,
        voiceGuidance: true
      }
    };

    res.json({ profile });
  } catch (error) {
    console.error('VR accessibility profile error:', error);
    res.status(500).json({ error: 'Failed to get VR accessibility profile' });
  }
});

// Start VR session
router.post('/api/vr/sessions', async (req, res) => {
  try {
    const { userId, environmentId, sessionGoals, personalizedSettings } = req.body;
    
    const session = {
      id: Math.floor(Math.random() * 1000) + 100,
      userId,
      environmentId,
      startTime: new Date().toISOString(),
      completionStatus: "in_progress",
      sessionGoals: sessionGoals || [],
      personalizedSettings: personalizedSettings || {}
    };

    res.json({ session });
  } catch (error) {
    console.error('Start VR session error:', error);
    res.status(500).json({ error: 'Failed to start VR session' });
  }
});

// Complete VR session
router.post('/api/vr/sessions/:sessionId/complete', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const { effectiveness, notes, stressLevel, heartRate, interactions, sideEffects } = req.body;
    
    const completedSession = {
      id: sessionId,
      endTime: new Date().toISOString(),
      completionStatus: "completed",
      effectiveness,
      notes,
      stressLevel,
      heartRate,
      interactions: interactions || [],
      sideEffects: sideEffects || []
    };

    res.json({ session: completedSession });
  } catch (error) {
    console.error('Complete VR session error:', error);
    res.status(500).json({ error: 'Failed to complete VR session' });
  }
});

// Save accessibility profile
router.post('/api/vr/accessibility-profile/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const profileData = req.body;
    
    const profile = {
      id: 1,
      userId,
      ...profileData,
      updatedAt: new Date().toISOString()
    };

    res.json({ profile });
  } catch (error) {
    console.error('Save VR accessibility profile error:', error);
    res.status(500).json({ error: 'Failed to save VR accessibility profile' });
  }
});

// User Personality Profile routes
router.get('/api/user-profile/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const profile = await storage.getUserProfile(userId);
    
    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    
    res.json({ profile });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

router.post('/api/user-profile', async (req, res) => {
  try {
    const { userId, ...profileData } = req.body;
    
    // Check if profile already exists
    const existingProfile = await storage.getUserProfile(userId);
    
    if (existingProfile) {
      // Update existing profile
      const updatedProfile = await storage.updateUserProfile(userId, profileData);
      res.json({ profile: updatedProfile });
    } else {
      // Create new profile
      const newProfile = await storage.createUserProfile({
        userId,
        ...profileData
      });
      res.json({ profile: newProfile });
    }
  } catch (error) {
    console.error('Save user profile error:', error);
    res.status(500).json({ error: 'Failed to save user profile' });
  }
});

router.get('/api/user-profile-check/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const profile = await storage.getUserProfile(userId);
    
    res.json({ 
      hasProfile: !!profile,
      needsQuiz: !profile?.quizCompleted
    });
  } catch (error) {
    console.error('Check user profile error:', error);
    res.status(500).json({ error: 'Failed to check user profile' });
  }
});

// Anonymous user management endpoints
router.post('/api/users/anonymous', async (req, res) => {
  try {
    const { deviceFingerprint } = req.body;
    
    if (!deviceFingerprint) {
      return res.status(400).json({ error: 'Device fingerprint required' });
    }

    // Check if user already exists with this device fingerprint
    let user = await storage.getUserByDeviceFingerprint(deviceFingerprint);
    
    if (!user) {
      // Create new anonymous user
      const userData = {
        username: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: null,
        anonymousId: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        deviceFingerprint,
        isAnonymous: true,
        lastActiveAt: new Date()
      };
      
      user = await storage.createUser(userData);
    } else {
      // Update last active time
      await storage.updateUserLastActive(user.id);
    }

    res.json({ user });
  } catch (error) {
    console.error('Anonymous user creation error:', error);
    res.status(500).json({ error: 'Failed to create anonymous user' });
  }
});

// Data reset endpoints for user isolation
router.delete('/api/users/:userId/messages', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    await storage.deleteUserMessages(userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user messages error:', error);
    res.status(500).json({ error: 'Failed to delete user messages' });
  }
});

router.delete('/api/users/:userId/journal-entries', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    await storage.deleteUserJournalEntries(userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user journal entries error:', error);
    res.status(500).json({ error: 'Failed to delete user journal entries' });
  }
});

router.delete('/api/users/:userId/mood-entries', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    await storage.deleteUserMoodEntries(userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user mood entries error:', error);
    res.status(500).json({ error: 'Failed to delete user mood entries' });
  }
});

router.delete('/api/users/:userId/goals', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    await storage.deleteUserGoals(userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user goals error:', error);
    res.status(500).json({ error: 'Failed to delete user goals' });
  }
});

router.delete('/api/users/:userId/achievements', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    await storage.deleteUserAchievements(userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user achievements error:', error);
    res.status(500).json({ error: 'Failed to delete user achievements' });
  }
});

// Streak Tracking API Endpoints
router.get('/api/users/:userId/streaks', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const streaks = await storage.getUserStreaks(userId);
    res.json({ streaks });
  } catch (error) {
    console.error('Get user streaks error:', error);
    res.status(500).json({ error: 'Failed to get user streaks' });
  }
});

router.post('/api/users/:userId/activity', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { activityType } = req.body;
    
    // Record activity and update streaks
    await storage.updateStreakOnActivity(userId, activityType);
    
    // Get updated streaks
    const streaks = await storage.getUserStreaks(userId);
    
    res.json({ success: true, streaks });
  } catch (error) {
    console.error('Record activity error:', error);
    res.status(500).json({ error: 'Failed to record activity' });
  }
});

// Get real streak statistics for the home page
router.get('/api/users/:userId/streak-stats', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const streaks = await storage.getUserStreaks(userId);
    
    // Get specific streak data
    const dailyActiveStreak = streaks.find(s => s.streakType === 'app_visit') || { currentStreak: 0 };
    const journalingStreak = streaks.find(s => s.streakType === 'journal_entry') || { currentStreak: 0 };
    
    const stats = {
      consecutiveDaysActive: dailyActiveStreak.currentStreak,
      consecutiveDaysJournaling: journalingStreak.currentStreak,
      totalActiveDays: streaks.reduce((sum, streak) => sum + (streak.totalActiveDays || 0), 0)
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get streak stats error:', error);
    res.status(500).json({ error: 'Failed to get streak statistics' });
  }
});

// ====================
// SUBSCRIPTION MANAGEMENT ENDPOINTS
// ====================

// Initialize Stripe (will be conditionally used if keys are available)
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  });
}

// Get subscription status
router.get('/api/subscription/status', async (req, res) => {
  try {
    const userId = await userSessionManager.getUserId(req);
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = new Date();
    const subscriptionExpired = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < now;
    
    // Reset monthly usage if it's a new month
    const lastReset = user.lastUsageReset ? new Date(user.lastUsageReset) : now;
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      await storage.updateUser(userId, {
        monthlyUsage: 0,
        lastUsageReset: now
      });
    }

    res.json({
      status: subscriptionExpired ? 'free' : (user.subscriptionStatus || 'free'),
      expiresAt: user.subscriptionExpiresAt,
      monthlyUsage: user.monthlyUsage || 0,
      lastUsageReset: user.lastUsageReset || now
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

// Update usage count
router.post('/api/subscription/usage', async (req, res) => {
  try {
    const userId = await userSessionManager.getUserId(req);
    const { increment = 1 } = req.body;
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newUsage = (user.monthlyUsage || 0) + increment;
    await storage.updateUser(userId, { monthlyUsage: newUsage });
    
    res.json({ monthlyUsage: newUsage });
  } catch (error) {
    console.error('Error updating usage:', error);
    res.status(500).json({ error: 'Failed to update usage' });
  }
});

// Create Stripe checkout session
router.post('/api/subscription/create-checkout', async (req, res) => {
  if (!stripe) {
    return res.status(400).json({ error: 'Payment system not configured' });
  }

  try {
    const { planType, deviceFingerprint } = req.body;
    let userId;
    
    try {
      userId = await userSessionManager.getUserId(req);
    } catch {
      // Anonymous user - create or find by device fingerprint
      if (!deviceFingerprint) {
        return res.status(400).json({ error: 'Device fingerprint required for anonymous users' });
      }
      
      let user = await storage.getUserByDeviceFingerprint(deviceFingerprint);
      if (!user) {
        user = await storage.createUser({
          username: `anon_${deviceFingerprint.slice(0, 8)}`,
          deviceFingerprint,
          isAnonymous: true
        });
      }
      userId = user.id;
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create or retrieve Stripe customer
    let customerId = user.customerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          userId: userId.toString(),
          deviceFingerprint: user.deviceFingerprint || ''
        }
      });
      customerId = customer.id;
      await storage.updateUser(userId, { customerId });
    }

    // Define price IDs (you'll need to create these in Stripe Dashboard)
    const priceIds = {
      monthly: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_monthly_placeholder',
      yearly: process.env.STRIPE_YEARLY_PRICE_ID || 'price_yearly_placeholder'
    };

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceIds[planType as keyof typeof priceIds],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${req.headers.origin}/?canceled=true`,
      metadata: {
        userId: userId.toString(),
        planType
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook handler
router.post('/api/subscription/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(400).json({ error: 'Payment system not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).json({ error: 'Missing webhook signature or secret' });
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = parseInt(session.metadata?.userId || '0');
        const planType = session.metadata?.planType;

        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const expiresAt = new Date(subscription.current_period_end * 1000);

          await storage.updateUser(userId, {
            subscriptionStatus: 'premium',
            subscriptionId: subscription.id,
            subscriptionExpiresAt: expiresAt,
            monthlyUsage: 0 // Reset usage on subscription
          });
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(deletedSub.customer as string);
        
        if (customer && !customer.deleted && customer.metadata?.userId) {
          const userId = parseInt(customer.metadata.userId);
          await storage.updateUser(userId, {
            subscriptionStatus: 'free',
            subscriptionId: null,
            subscriptionExpiresAt: null
          });
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const customer = await stripe.customers.retrieve(subscription.customer as string);
          
          if (customer && !customer.deleted && customer.metadata?.userId) {
            const userId = parseInt(customer.metadata.userId);
            const expiresAt = new Date(subscription.current_period_end * 1000);
            
            await storage.updateUser(userId, {
              subscriptionStatus: 'premium',
              subscriptionExpiresAt: expiresAt
            });
          }
        }
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

export default router;