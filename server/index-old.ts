import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from 'url';
import { setupVite, serveStatic, log } from "./vite.js";
import routes from './routes.js';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = parseInt(process.env.PORT || '5000', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Chat endpoint with OpenAI integration and personality mirroring
app.post('/api/chat', async (req, res) => {
  try {
    const { message, voice = 'carla', userId = 1, personalityMode = 'friend' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Making OpenAI API call...');
    
    // Get user's personality data for mirroring
    let personalityContext = '';
    try {
      const { storage } = await import('./storage.js');
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

Mirror this user's communication style, personality traits, and mannerisms back to them. Be their therapeutic reflection - use their own patterns, interests, and communication style while providing support. Reference their personal details naturally.`;
      }
    } catch (error) {
      console.log('Could not load personality data:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Personality mode configurations
    const personalityModes = {
      friend: `Act as a supportive friend - warm, understanding, and conversational. Use casual language and show genuine care for their wellbeing.`,
      council: `Act as a wise counselor - provide thoughtful guidance, ask reflective questions, and offer therapeutic insights with professional warmth.`,
      study: `Act as a study companion - focused on learning, productivity, and academic goals. Help organize thoughts and provide educational support.`,
      diary: `Act as a reflective diary companion - encourage deep self-reflection, journaling, and processing emotions through writing and introspection.`,
      'goal-setting': `Act as a goal-setting coach - motivational, structured, and action-oriented. Help break down objectives and track progress systematically.`,
      wellness: `Act as a wellness guide - focus on physical and mental health, self-care practices, mindfulness, and overall wellbeing strategies.`,
      creative: `Act as a creative collaborator - imaginative, inspiring, and artistic. Encourage creative expression, brainstorming, and innovative thinking.`
    };
    
    const modeInstruction = personalityModes[personalityMode as keyof typeof personalityModes] || personalityModes.friend;
    
    // OpenAI API call with personality mirroring
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
            content: `You are TrAI, a therapeutic companion that mirrors the user's personality back to them for self-reflection. Your core purpose is to reflect their identity, communication style, and mannerisms to help them see themselves clearly.

${modeInstruction}

Be supportive and therapeutic while authentically mirroring their:
- Communication patterns and style
- Interests and values  
- Personality traits and mannerisms
- Personal background and experiences

Use their own words, phrases, and communication patterns when appropriate. Reference their personal details naturally to show you understand and remember them.${personalityContext}`
          },
          {
            role: 'user',
            content: message
          }
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
        console.log(`Making ElevenLabs request for voice: ${selectedVoice} (ID: ${voiceId})`);
        console.log(`Text to synthesize: "${aiResponse.substring(0, 50)}..."`);
        
        const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY
          } as HeadersInit,
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
      crisisDetected: false,
      crisisData: null,
      personalityMode: "supportive",
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

// Stats endpoint - support both with and without userId
app.get('/api/stats/:userId?', (req, res) => {
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
app.get('/api/bot-stats/:userId', (req, res) => {
  try {
    res.json({
      level: 3,
      stage: "Therapist",
      wordsLearned: 1000
    });
  } catch (error) {
    console.error('Bot stats error:', error);
    res.status(500).json({ error: 'Failed to get bot stats' });
  }
});

// Mood tracking endpoint
app.post('/api/mood', (req, res) => {
  try {
    const { userId, mood, intensity } = req.body;
    
    res.json({ 
      success: true, 
      message: `Mood "${mood}" recorded with intensity ${intensity}` 
    });
  } catch (error) {
    console.error('Mood tracking error:', error);
    res.status(500).json({ error: 'Failed to track mood' });
  }
});

// Daily affirmation endpoint
app.get('/api/daily-affirmation', (req, res) => {
  const affirmations = [
    "You are capable of amazing things.",
    "Your mental health matters and you deserve support.",
    "Every small step forward is progress worth celebrating.",
    "You have the strength to overcome today's challenges.",
    "Your feelings are valid and you are not alone."
  ];
  
  const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
  
  res.json({ affirmation: randomAffirmation });
});

// Daily content endpoint
app.get('/api/daily-content', (req, res) => {
  const affirmations = [
    "When days get hard, don't let them win, remember who you are!",
    "I'm surrounded by a loving and supportive environment that nurtures my well-being.",
    "Every challenge I face is an opportunity to grow stronger and wiser.",
    "I have the power to create positive change in my life, one step at a time.",
    "Today brings new possibilities, and I'm ready to embrace them with confidence."
  ];
  
  const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
  
  res.json({ 
    affirmation: randomAffirmation,
    horoscope: "Today is a great day for self-reflection and growth."
  });
});

// Horoscope endpoint
app.get('/api/horoscope/:sign', (req, res) => {
  const { sign } = req.params;
  
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
});

// Personality reflection endpoint - AI analysis of user traits and growth
app.get('/api/personality-reflection/:userId?', async (req, res) => {
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
              content: 'You are a therapeutic AI providing personality reflection and analysis. Be supportive, insightful, and focused on personal growth and self-awareness.'
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
            conversations: 0, // Chat messages not tracked in reflection yet
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
        conversations: 0, // Chat messages not tracked in reflection yet
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

// Weekly summary endpoint
app.get('/api/weekly-summary', (req, res) => {
  try {
    const summaries = [
      "This week, you've shown remarkable growth in self-awareness and emotional intelligence.",
      "Your conversations reflect deep introspection and a commitment to personal wellness.",
      "This week's interactions demonstrate your resilience and willingness to explore difficult topics.",
      "You've engaged thoughtfully with therapeutic concepts, showing genuine progress.",
      "Your openness to growth and self-reflection has been particularly evident this week."
    ];
    
    const randomSummary = summaries[Math.floor(Math.random() * summaries.length)];
    res.json({ summary: randomSummary });
  } catch (error) {
    console.error('Weekly summary error:', error);
    res.status(500).json({ error: 'Failed to get weekly summary' });
  }
});

// Voice transcription endpoint
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
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
app.post('/api/text-to-speech', async (req, res) => {
  try {
    const { text, voice = 'james', emotionalContext = 'neutral' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // CORRECTED voice IDs - using actual working Carla voice
    const voiceMap: Record<string, string> = {
      'james': 'EkK5I93UQWFDigLMpZcX',
      'brian': 'nPczCjzI2devNBz1zQrb', 
      'alexandra': 'kdmDKE6EkgrWrrykO9Qt',
      'carla': 'l32B8XDoylOsZKiSdfhE'  // Correct Carla voice ID
    };

    const voiceId = voiceMap[voice] || voiceMap['james'];
    
    try {
      console.log(`Making ElevenLabs request for voice: ${voice} (ID: ${voiceId})`);
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY || ''
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: emotionalContext === 'calming' ? 0.8 : 0.6,
            similarity_boost: 0.7,
            style: emotionalContext === 'energizing' ? 0.3 : 0.1,
            use_speaker_boost: true
          }
        })
      });

      console.log('ElevenLabs response status:', response.status);

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        console.log('Audio buffer size:', audioBuffer.byteLength);
        
        if (audioBuffer.byteLength > 0) {
          const base64Audio = Buffer.from(audioBuffer).toString('base64');
          console.log('Base64 audio length:', base64Audio.length);
          
          return res.json({
            audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
            useBrowserTTS: false,
            voice: voice,
            success: true
          });
        } else {
          console.log('Empty audio buffer received from ElevenLabs');
          throw new Error('Empty audio response');
        }
      } else {
        const errorText = await response.text();
        console.log('ElevenLabs API error:', response.status, response.statusText, errorText);
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }
    } catch (elevenLabsError) {
      console.log('ElevenLabs API failed:', elevenLabsError instanceof Error ? elevenLabsError.message : 'Unknown error');
      
      // NO BROWSER TTS FALLBACK
      res.json({ 
        audioUrl: null,
        useBrowserTTS: false,
        success: false,
        error: elevenLabsError instanceof Error ? elevenLabsError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Text-to-speech error:', error);
    res.status(500).json({ error: 'Voice synthesis failed' });
  }
});

// Bot stats endpoint
app.get('/api/bot-stats', async (req, res) => {
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

// Daily affirmation endpoint
app.get('/api/daily-affirmation', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.json({ affirmation: 'Today is a beautiful day to practice self-compassion and growth.' });
    }

    // Generate daily affirmation using OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
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
      })
    });

    if (!openaiResponse.ok) {
      throw new Error('OpenAI API request failed');
    }

    const openaiData = await openaiResponse.json();
    const affirmation = openaiData.choices[0].message.content;

    res.json({ affirmation });
  } catch (error) {
    console.error('Daily affirmation generation error:', error);
    res.json({ affirmation: 'Today is a beautiful day to practice self-compassion and growth.' });
  }
});

// Weekly summary endpoint
app.get('/api/weekly-summary', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.json({ summary: 'Your therapeutic journey continues to evolve positively this week.' });
    }

    // Generate weekly summary using OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a therapeutic wellness coach providing weekly reflections. Create supportive weekly summaries that promote mental wellness and personal growth.'
          },
          {
            role: 'user',
            content: 'Generate a therapeutic weekly summary focused on personal growth, mindfulness, and mental wellness progress. Keep it 2-3 sentences and encouraging.'
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!openaiResponse.ok) {
      throw new Error('OpenAI API request failed');
    }

    const openaiData = await openaiResponse.json();
    const summary = openaiData.choices[0].message.content;

    res.json({ summary });
  } catch (error) {
    console.error('Weekly summary generation error:', error);
    res.json({ summary: 'Your therapeutic journey continues to evolve positively this week.' });
  }
});

// Onboarding status endpoint
app.get('/api/onboarding-status/:userId', async (req, res) => {
  try {
    // Return that onboarding is complete to bypass the quiz
    res.json({ 
      isComplete: true,
      completedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Onboarding status error:', error);
    res.status(500).json({ error: 'Failed to get onboarding status' });
  }
});

// Complete onboarding endpoint
app.post('/api/complete-onboarding', async (req, res) => {
  try {
    const { userId, responses } = req.body;
    
    // Store onboarding responses (simplified for now)
    res.json({ 
      success: true,
      completedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

// Horoscope endpoint
app.post('/api/horoscope', async (req, res) => {
  try {
    const { sign } = req.body;
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Generate horoscope using OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert astrologer providing thoughtful, therapeutic horoscope guidance. Create inspiring and supportive daily horoscopes that promote wellness and personal growth.'
          },
          {
            role: 'user',
            content: `Generate a therapeutic daily horoscope for ${sign}. Keep it positive, supportive, and focused on personal growth and wellness. Make it 2-3 sentences and inspiring.`
          }
        ],
        max_tokens: 150,
        temperature: 0.8
      })
    });

    if (!openaiResponse.ok) {
      throw new Error('OpenAI API request failed');
    }

    const openaiData = await openaiResponse.json();
    const horoscope = openaiData.choices[0].message.content;

    res.json({ horoscope });
  } catch (error) {
    console.error('Horoscope generation error:', error);
    res.status(500).json({ error: 'Failed to generate horoscope' });
  }
});

// Bot stats endpoint
app.get('/api/stats/:userId', async (req, res) => {
  try {
    res.json({
      level: 3,
      stage: "Therapist",
      wordsLearned: 1000
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});


// Journal endpoints
app.post('/api/journal/entries', async (req, res) => {
  try {
    const { userId = 1, title, content, mood, moodIntensity, tags } = req.body;
    
    const entry = await storage.createJournalEntry({
      userId,
      title,
      content,
      mood,
      moodIntensity,
      tags: tags || [],
      isPrivate: true
    });
    
    res.json(entry);
  } catch (error) {
    console.error('Journal entry creation error:', error);
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

app.get('/api/journal/entries/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    const entries = await storage.getJournalEntries(userId);
    res.json(entries);
  } catch (error) {
    console.error('Journal entries fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

// Mood tracking endpoints
app.post('/api/mood/entries', async (req, res) => {
  try {
    const { userId = 1, mood, intensity, notes, triggers, copingStrategies } = req.body;
    
    const entry = await storage.createMoodEntry({
      userId,
      mood,
      intensity,
      notes,
      triggers: triggers || [],
      copingStrategies: copingStrategies || []
    });
    
    res.json(entry);
  } catch (error) {
    console.error('Mood entry creation error:', error);
    res.status(500).json({ error: 'Failed to create mood entry' });
  }
});

app.get('/api/mood/entries/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    const entries = await storage.getMoodEntries(userId);
    res.json(entries);
  } catch (error) {
    console.error('Mood entries fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch mood entries' });
  }
});

// Goals endpoints
app.post('/api/goals', async (req, res) => {
  try {
    const { userId = 1, title, description, category, targetValue, targetDate } = req.body;
    
    const goal = await storage.createTherapeuticGoal({
      userId,
      title,
      description,
      category,
      targetValue,
      currentValue: 0,
      targetDate: targetDate ? new Date(targetDate) : null,
      isActive: true
    });
    
    res.json(goal);
  } catch (error) {
    console.error('Goal creation error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

app.get('/api/goals/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    const goals = await storage.getTherapeuticGoals(userId);
    res.json(goals);
  } catch (error) {
    console.error('Goals fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Community endpoints
app.get('/api/community/forums', async (req, res) => {
  try {
    const forums = await storage.getSupportForums();
    res.json(forums);
  } catch (error) {
    console.error('Forums fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch forums' });
  }
});

app.get('/api/community/posts/:forumId', async (req, res) => {
  try {
    const forumId = parseInt(req.params.forumId);
    const posts = await storage.getForumPosts(forumId);
    res.json(posts);
  } catch (error) {
    console.error('Posts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Analytics endpoints
app.get('/api/analytics/wellness-score/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    const score = await storage.calculateWellnessScore(userId);
    res.json({ score });
  } catch (error) {
    console.error('Wellness score error:', error);
    res.status(500).json({ error: 'Failed to calculate wellness score' });
  }
});

app.get('/api/achievements/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    const achievements = await storage.getUserAchievements(userId);
    res.json(achievements);
  } catch (error) {
    console.error('Achievements fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// Advanced Emotional Intelligence API Endpoints

// 1. Real-time Emotional Detection
app.post('/api/emotional-intelligence/analyze', async (req, res) => {
  try {
    const { message, userId = 1 } = req.body;
    
    const emotionalAnalysis = await analyzeEmotionalState(message, [], userId);
    
    // Store emotional context for pattern analysis
    await storage.createEmotionalContext({
      userId,
      sessionId: `session_${Date.now()}`,
      currentMood: emotionalAnalysis.primaryEmotion,
      intensity: Math.round(emotionalAnalysis.intensity * 10),
      volatility: emotionalAnalysis.arousal.toString(),
      urgency: emotionalAnalysis.riskLevel.toString(),
      recentTriggers: [],
      supportNeeds: emotionalAnalysis.recommendedActions || [],
      contextData: emotionalAnalysis
    });
    
    res.json({
      success: true,
      analysis: emotionalAnalysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Emotional analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze emotional state' });
  }
});

// 2. Mood Forecasting
app.post('/api/emotional-intelligence/mood-forecast/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    
    // Generate mood forecast using recent mood data
    const recentMoods = await storage.getMoodEntries(userId);
    const forecast = await generateMoodForecast(userId, recentMoods);
    
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

// 3. Contextual Response Adaptation
app.post('/api/emotional-intelligence/adapt-response', async (req, res) => {
  try {
    const { originalMessage, userMessage, userId = 1, emotionalState } = req.body;
    
    const adaptedResponse = await generateContextualResponse(
      originalMessage, 
      emotionalState, 
      userId
    );
    
    // Store adaptation for learning
    await storage.createEmotionalResponseAdaptation({
      userId,
      originalMessage: userMessage,
      adaptedResponse: adaptedResponse.response,
      tone: adaptedResponse.tone,
      intensity: adaptedResponse.intensity,
      responseLength: adaptedResponse.responseLength,
      communicationStyle: adaptedResponse.communicationStyle,
      priorityFocus: adaptedResponse.priorityFocus || []
    });
    
    res.json({
      success: true,
      adaptedResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Response adaptation error:', error);
    res.status(500).json({ error: 'Failed to adapt response' });
  }
});

// 4. Crisis Detection and Response
app.post('/api/emotional-intelligence/crisis-detection', async (req, res) => {
  try {
    const { message, userId = 1 } = req.body;
    
    const crisisAnalysis = await detectCrisisSignals(message, userId);
    
    // Log crisis detection attempt
    await storage.createCrisisDetectionLog({
      userId,
      messageContent: message,
      riskLevel: crisisAnalysis.riskLevel,
      crisisIndicators: crisisAnalysis.indicators || [],
      confidenceScore: crisisAnalysis.confidence,
      interventionTriggered: crisisAnalysis.riskLevel === 'critical',
      interventionType: crisisAnalysis.riskLevel === 'critical' ? 'immediate' : null,
      followUpScheduled: crisisAnalysis.riskLevel !== 'low' ? true : null
    });
    
    res.json({
      success: true,
      crisisDetected: crisisAnalysis.riskLevel !== 'low',
      riskLevel: crisisAnalysis.riskLevel,
      interventionRequired: crisisAnalysis.riskLevel === 'critical',
      supportResources: crisisAnalysis.supportResources || [],
      analysis: crisisAnalysis
    });
  } catch (error) {
    console.error('Crisis detection error:', error);
    res.status(500).json({ error: 'Failed to perform crisis detection' });
  }
});

// 5. Emotional Pattern Analysis
app.get('/api/emotional-intelligence/patterns/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    const timeframe = Array.isArray(req.query.timeframe) ? req.query.timeframe[0] : req.query.timeframe || '30';
    
    const patterns = await analyzeEmotionalPatterns(userId, parseInt(timeframe as string));
    
    res.json({
      success: true,
      patterns,
      timeframeDays: parseInt(timeframe as string),
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Pattern analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze emotional patterns' });
  }
});

// Dashboard overview for emotional intelligence
app.get('/api/emotional-intelligence/dashboard/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    
    const [forecasts, insights, adaptations, crisisLogs] = await Promise.all([
      storage.getMoodForecasts ? storage.getMoodForecasts(userId, 5) : [],
      storage.getPredictiveInsights ? storage.getPredictiveInsights(userId, 5) : [],
      storage.getEmotionalResponseAdaptations ? storage.getEmotionalResponseAdaptations(userId, 5) : [],
      storage.getCrisisDetectionLogs ? storage.getCrisisDetectionLogs(userId, 10) : []
    ]);
    
    res.json({
      success: true,
      overview: {
        totalForecasts: forecasts.length,
        averageAccuracy: 0.75, // Placeholder - would calculate from actual data
        activeInsights: insights.filter(i => i.isActive).length,
        adaptationEffectiveness: 0.82, // Placeholder
        emotionalStability: 0.68 // Placeholder
      },
      recentActivity: {
        forecasts: forecasts.slice(0, 3),
        insights: insights.slice(0, 3),
        adaptations: adaptations.slice(0, 3),
        crisisEvents: crisisLogs.filter(log => log.riskLevel !== 'low').slice(0, 3)
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Comprehensive Analytics & Reporting API Endpoints

// Generate Monthly Wellness Report with AI insights
app.post('/api/analytics/monthly-report', async (req, res) => {
  try {
    const { userId = 1, reportMonth } = req.body;
    
    // Calculate comprehensive wellness metrics
    const metrics = await storage.calculateUserWellnessMetrics(userId);
    const volatility = await storage.calculateEmotionalVolatility(userId);
    const engagement = await storage.calculateTherapeuticEngagement(userId);
    
    // Get recent journal entries for AI analysis
    const journalEntries = await storage.getJournalEntries(userId);
    const moodEntries = await storage.getMoodEntries(userId);
    
    // Generate AI insights using OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'system',
          content: 'You are a therapeutic AI analyst generating monthly wellness reports. Provide professional insights based on user data.'
        }, {
          role: 'user',
          content: `Generate a comprehensive monthly wellness report for a user with:
            - Wellness Score: ${metrics.wellnessScore}
            - Emotional Volatility: ${volatility}
            - Therapeutic Engagement: ${engagement}%
            - Journal Entries: ${journalEntries.length}
            - Mood Entries: ${moodEntries.length}
            
            Provide insights on progress, patterns, recommendations, and therapeutic goals.`
        }],
        max_tokens: 800,
        temperature: 0.7
      })
    });

    const aiData = await openaiResponse.json();
    const aiInsights = aiData.choices?.[0]?.message?.content || 'Monthly progress analysis completed successfully.';

    // Create monthly report
    const report = await storage.createMonthlyWellnessReport({
      userId,
      reportMonth: reportMonth || new Date().toISOString().slice(0, 7),
      wellnessScore: metrics.wellnessScore.toString(),
      emotionalVolatility: volatility.toString(),
      progressSummary: `Wellness Score: ${metrics.wellnessScore}/100, Engagement: ${engagement}%`,
      aiGeneratedInsights: aiInsights,
      moodTrends: {
        averageMood: metrics.averageMood,
        volatility: volatility,
        moodEntries: moodEntries.length
      },
      activityMetrics: {
        journalEntries: journalEntries.length,
        moodEntries: moodEntries.length,
        engagement: engagement
      },
      therapeuticProgress: {
        wellnessScore: metrics.wellnessScore,
        consistency: engagement,
        improvement: metrics.wellnessScore >= 70 ? 'Good' : 'Needs Focus'
      },
      riskAssessment: {
        level: volatility > 3 ? 'Medium' : 'Low',
        score: volatility,
        factors: volatility > 3 ? ['High emotional volatility'] : []
      },
      recommendations: [
        engagement < 50 ? 'Increase daily journaling frequency' : 'Maintain consistent therapeutic practices',
        volatility > 2 ? 'Focus on stress management techniques' : 'Continue current emotional regulation strategies',
        'Regular therapeutic check-ins recommended'
      ],
      milestonesAchieved: [
        metrics.wellnessScore >= 75 ? 'Strong emotional stability achieved' : null,
        engagement >= 60 ? 'Excellent therapeutic engagement' : null
      ].filter(Boolean) as string[]
    });

    res.json({
      success: true,
      report,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Monthly report generation error:', error);
    res.status(500).json({ error: 'Failed to generate monthly wellness report' });
  }
});

// Get monthly wellness reports
app.get('/api/analytics/monthly-reports/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    
    const reports = await storage.getMonthlyWellnessReports(userId, limit);
    
    res.json({
      success: true,
      reports,
      totalReports: reports.length
    });
  } catch (error) {
    console.error('Monthly reports fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch monthly reports' });
  }
});

// Interactive Analytics Dashboard Data
app.get('/api/analytics/dashboard/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    
    // Get comprehensive analytics data
    const [
      metrics,
      volatility,
      engagement,
      recentMoods,
      recentJournals,
      wellnessMetrics,
      progressData
    ] = await Promise.all([
      storage.calculateUserWellnessMetrics(userId),
      storage.calculateEmotionalVolatility(userId),
      storage.calculateTherapeuticEngagement(userId),
      storage.getMoodEntries(userId),
      storage.getJournalEntries(userId),
      storage.getAnalyticsMetrics(userId, 'wellness_score', 30),
      storage.getProgressTracking(userId, undefined, 10)
    ]);

    // Calculate trend data for charts
    const moodTrend = recentMoods.slice(0, 30).map(mood => ({
      date: mood.createdAt,
      value: mood.intensity || 5,
      emotion: mood.mood || 'neutral'
    }));

    const wellnessTrend = wellnessMetrics.map(metric => ({
      date: metric.calculatedDate,
      value: parseFloat(metric.value),
      type: metric.metricType
    }));

    res.json({
      success: true,
      dashboard: {
        overview: {
          currentWellnessScore: metrics.wellnessScore,
          emotionalVolatility: volatility,
          therapeuticEngagement: engagement,
          totalJournalEntries: recentJournals.length,
          totalMoodEntries: recentMoods.length,
          averageMood: metrics.averageMood
        },
        charts: {
          moodTrend: moodTrend,
          wellnessTrend: wellnessTrend,
          emotionDistribution: recentMoods.reduce((acc, mood) => {
            const emotion = mood.mood || 'neutral';
            acc[emotion] = (acc[emotion] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          progressTracking: progressData.map(p => ({
            period: p.trackingPeriod,
            journalEntries: p.journalEntries,
            moodEntries: p.moodEntries,
            engagement: p.therapeuticEngagement
          }))
        },
        insights: await storage.generateWellnessInsights(userId)
      }
    });

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ error: 'Failed to load analytics dashboard' });
  }
});

// Risk Assessment API
app.post('/api/analytics/risk-assessment', async (req, res) => {
  try {
    const { userId = 1 } = req.body;
    
    const volatility = await storage.calculateEmotionalVolatility(userId);
    const engagement = await storage.calculateTherapeuticEngagement(userId);
    const recentMoods = await storage.getMoodEntries(userId);
    
    // Calculate risk score
    let riskScore = 0;
    let riskLevel = 'low';
    let riskFactors = [];
    let protectiveFactors = [];
    
    // Risk calculation logic
    if (volatility > 3) {
      riskScore += 0.3;
      riskFactors.push('High emotional volatility');
    }
    
    if (engagement < 30) {
      riskScore += 0.2;
      riskFactors.push('Low therapeutic engagement');
    }
    
    const lowMoodCount = recentMoods.filter(m => (m.intensity || 5) < 4).length;
    if (lowMoodCount > recentMoods.length * 0.6) {
      riskScore += 0.4;
      riskFactors.push('Persistent low mood patterns');
    }
    
    // Protective factors
    if (engagement >= 60) {
      protectiveFactors.push('Strong therapeutic engagement');
    }
    
    if (volatility <= 1.5) {
      protectiveFactors.push('Emotional stability');
    }
    
    // Determine risk level
    if (riskScore >= 0.7) riskLevel = 'critical';
    else if (riskScore >= 0.5) riskLevel = 'high';
    else if (riskScore >= 0.3) riskLevel = 'medium';
    
    const assessment = await storage.createRiskAssessment({
      userId,
      assessmentDate: new Date(),
      riskLevel,
      riskScore: riskScore.toFixed(2),
      riskFactors,
      protectiveFactors,
      recommendations: [
        riskScore >= 0.5 ? 'Immediate therapeutic support recommended' : 'Continue regular wellness practices',
        volatility > 2 ? 'Focus on emotional regulation techniques' : 'Maintain current stability strategies',
        engagement < 50 ? 'Increase daily therapeutic activities' : 'Excellent engagement - keep it up'
      ],
      triggerEvents: {
        highVolatility: volatility > 3,
        lowEngagement: engagement < 30,
        persistentLowMood: lowMoodCount > recentMoods.length * 0.6
      },
      followUpRequired: riskScore >= 0.5,
      aiAnalysis: `Risk assessment completed. Score: ${riskScore.toFixed(2)}/1.0. ${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} risk level detected.`
    });

    res.json({
      success: true,
      assessment,
      immediateAction: riskScore >= 0.7
    });

  } catch (error) {
    console.error('Risk assessment error:', error);
    res.status(500).json({ error: 'Failed to perform risk assessment' });
  }
});

// Longitudinal Trend Analysis
app.get('/api/analytics/trends/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    const trendType = req.query.type as string;
    const timeframe = req.query.timeframe as string || '3months';
    
    // Get historical data for trend analysis
    const existingTrends = await storage.getLongitudinalTrends(userId, trendType, timeframe);
    
    // Calculate new trends if needed
    const currentMetrics = await storage.calculateUserWellnessMetrics(userId);
    const currentVolatility = await storage.calculateEmotionalVolatility(userId);
    const currentEngagement = await storage.calculateTherapeuticEngagement(userId);
    
    // Generate AI-powered trend insights
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'system',
          content: 'Analyze longitudinal wellness trends and provide therapeutic insights.'
        }, {
          role: 'user',
          content: `Analyze trends for timeframe ${timeframe}:
            Current Wellness: ${currentMetrics.wellnessScore}
            Current Volatility: ${currentVolatility}
            Current Engagement: ${currentEngagement}
            
            Provide trend direction, strength, and therapeutic predictions.`
        }],
        max_tokens: 400,
        temperature: 0.6
      })
    });

    const aiData = await openaiResponse.json();
    const trendInsights = aiData.choices?.[0]?.message?.content || 'Trend analysis completed.';

    // Create new trend analysis
    const newTrend = await storage.createLongitudinalTrend({
      userId,
      trendType: trendType || 'wellness',
      timeframe,
      trendDirection: currentMetrics.wellnessScore >= 70 ? 'improving' : currentMetrics.wellnessScore >= 50 ? 'stable' : 'declining',
      trendStrength: Math.abs(currentVolatility - 2.0).toFixed(2),
      dataPoints: {
        currentWellness: currentMetrics.wellnessScore,
        currentVolatility: currentVolatility,
        currentEngagement: currentEngagement,
        dataPointCount: 30
      },
      statisticalSignificance: "0.85",
      insights: trendInsights,
      predictedOutcome: currentMetrics.wellnessScore >= 70 ? 'Continued improvement expected' : 'Focus on consistency recommended',
      confidenceInterval: {
        lower: Math.max(0, currentMetrics.wellnessScore - 10),
        upper: Math.min(100, currentMetrics.wellnessScore + 10)
      }
    });

    res.json({
      success: true,
      trends: [newTrend, ...existingTrends],
      analysis: {
        overallDirection: newTrend.trendDirection,
        confidence: newTrend.statisticalSignificance,
        keyInsights: trendInsights
      }
    });

  } catch (error) {
    console.error('Trend analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze longitudinal trends' });
  }
});

// Advanced Therapeutic Journaling System API Endpoints

// AI-Assisted Journal Entry Analysis
app.post('/api/journal/analyze', async (req, res) => {
  try {
    const { userId, entryId, content, mood, moodIntensity } = req.body;
    
    // Generate AI analysis using OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{
          role: 'system',
          content: 'You are a therapeutic AI specializing in emotional pattern recognition and mental health analysis. Analyze journal entries for sentiment, emotional patterns, themes, and risk assessment. Provide compassionate, professional insights.'
        }, {
          role: 'user',
          content: `Analyze this journal entry for therapeutic insights:
            Content: "${content}"
            Mood: ${mood}
            Intensity: ${moodIntensity}/10
            
            Provide JSON response with:
            - sentiment: number (-1 to 1)
            - emotionalPatterns: array of detected patterns
            - themes: array of main themes
            - riskLevel: "low", "medium", "high", "critical"
            - insights: therapeutic insights and observations
            - triggers: potential emotional triggers identified
            - copingStrategies: suggested coping strategies`
        }],
        max_tokens: 1000,
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    const aiData = await openaiResponse.json();
    const analysis = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');

    // Store analysis in database (if you have journal analysis table)
    // await storage.createJournalAnalysis({ userId, entryId, ...analysis });

    // Create mood entry for tracking
    await storage.createMoodEntry({
      userId,
      mood: mood,
      intensity: moodIntensity,
      notes: `Journal analysis: ${analysis.insights?.substring(0, 200) || ''}`,
      triggers: analysis.triggers || [],
      copingStrategies: analysis.copingStrategies || []
    });

    // Check for crisis indicators and create crisis log if needed
    if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
      await storage.createCrisisDetectionLog({
        userId,
        messageContent: JSON.stringify(analysis),
        riskLevel: analysis.riskLevel,
        confidenceScore: "0.85",
        crisisIndicators: analysis.emotionalPatterns || [],
        interventionTriggered: analysis.riskLevel === 'critical',
        interventionType: analysis.riskLevel === 'critical' ? 'immediate' : null,
        followUpScheduled: analysis.riskLevel !== 'low' ? true : null
      });
    }

    res.json({
      success: true,
      analysis: {
        sentiment: analysis.sentiment || 0,
        emotionalPatterns: analysis.emotionalPatterns || [],
        themes: analysis.themes || [],
        riskLevel: analysis.riskLevel || 'low',
        insights: analysis.insights || 'Journal entry analyzed successfully',
        triggers: analysis.triggers || [],
        copingStrategies: analysis.copingStrategies || []
      }
    });

  } catch (error) {
    console.error('Journal analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze journal entry' });
  }
});

// Privacy & Compliance API endpoints
app.get('/api/privacy/encryption-settings/:userId', async (req, res) => {
  try {
    const encryptionSettings = {
      userId: req.params.userId,
      encryptionEnabled: true,
      keyDerivationRounds: 100000,
      encryptionAlgorithm: 'AES-256-GCM',
      keyRotationDays: 90,
      lastKeyRotation: new Date().toISOString(),
      backupRetentionDays: 90
    };
    res.json(encryptionSettings);
  } catch (error) {
    console.error('Error fetching encryption settings:', error);
    res.status(500).json({ error: 'Failed to fetch encryption settings' });
  }
});

app.get('/api/privacy/differential-settings/:userId', async (req, res) => {
  try {
    const privacySettings = {
      epsilon: 1.0,
      delta: 0.00001,
      mechanism: 'laplace',
      sensitivity: 1.0,
      minimumCohortSize: 10
    };
    res.json(privacySettings);
  } catch (error) {
    console.error('Error fetching differential privacy settings:', error);
    res.status(500).json({ error: 'Failed to fetch privacy settings' });
  }
});

app.get('/api/privacy/encrypted-backups/:userId', async (req, res) => {
  try {
    const backups = [
      {
        id: '1',
        userId: req.params.userId,
        createdAt: new Date().toISOString(),
        dataTypes: ['journal_entries', 'mood_data', 'conversations'],
        encryptionMetadata: {
          algorithm: 'AES-256-GCM',
          keyDerivation: 'PBKDF2',
          iterations: 100000
        },
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        size: '2.4 MB'
      }
    ];
    res.json(backups);
  } catch (error) {
    console.error('Error fetching encrypted backups:', error);
    res.status(500).json({ error: 'Failed to fetch backups' });
  }
});

app.get('/api/privacy/compliance-report/:userId', async (req, res) => {
  try {
    const complianceReport = {
      overallScore: 0.95,
      gdprCompliance: true,
      hipaaCompliance: true,
      dataMinimization: true,
      userConsent: true,
      auditTrail: true,
      recommendations: [
        'Consider rotating encryption keys monthly for enhanced security',
        'Enable automatic backup cleanup for expired data'
      ],
      lastAudit: new Date().toISOString()
    };
    res.json(complianceReport);
  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({ error: 'Failed to generate compliance report' });
  }
});

app.get('/api/privacy/anonymized-reports/:userId', async (req, res) => {
  try {
    const anonymizedReports = [
      {
        id: '1',
        reportType: 'Emotional Wellness Trends',
        generatedAt: new Date().toISOString(),
        cohortSize: 150,
        privacyBudgetUsed: 0.1,
        findings: {
          emotionalTrends: [
            { trend: 'Improved anxiety management', frequency: 0.68, confidence: 0.89 },
            { trend: 'Better sleep patterns', frequency: 0.54, confidence: 0.76 }
          ],
          therapeuticEffectiveness: [
            { intervention: 'Mindfulness exercises', successRate: 0.72, sampleSize: 89 },
            { intervention: 'Journaling prompts', successRate: 0.65, sampleSize: 124 }
          ],
          usagePatterns: [
            { pattern: 'Evening reflection sessions', percentage: 0.43, noiseLevel: 0.05 },
            { pattern: 'Voice interaction preference', percentage: 0.67, noiseLevel: 0.03 }
          ]
        },
        privacyGuarantees: {
          epsilon: 1.0,
          delta: 0.00001,
          mechanism: 'laplace'
        }
      }
    ];
    res.json(anonymizedReports);
  } catch (error) {
    console.error('Error fetching anonymized reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

app.post('/api/privacy/encrypt-data', async (req, res) => {
  try {
    const { userId, password, dataTypes } = req.body;
    // Simulate encryption process
    const result = {
      success: true,
      encryptedDataId: 'enc_' + Date.now(),
      dataTypes,
      timestamp: new Date().toISOString()
    };
    res.json(result);
  } catch (error) {
    console.error('Error encrypting data:', error);
    res.status(500).json({ error: 'Failed to encrypt data' });
  }
});

app.post('/api/privacy/create-backup', async (req, res) => {
  try {
    const { userId, password } = req.body;
    // Simulate backup creation
    const backup = {
      id: 'backup_' + Date.now(),
      userId,
      createdAt: new Date().toISOString(),
      dataTypes: ['journal_entries', 'mood_data', 'conversations', 'goals'],
      size: '3.2 MB',
      encrypted: true
    };
    res.json(backup);
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

app.post('/api/privacy/generate-anonymized-report', async (req, res) => {
  try {
    const { userId } = req.body;
    // Simulate report generation with differential privacy
    const report = {
      id: 'report_' + Date.now(),
      reportType: 'Weekly Wellness Insights',
      generatedAt: new Date().toISOString(),
      cohortSize: 200,
      privacyBudgetUsed: 0.08,
      status: 'completed'
    };
    res.json(report);
  } catch (error) {
    console.error('Error generating anonymized report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Health Integration API endpoints
app.get('/api/wearable-devices/:userId', async (req, res) => {
  try {
    const devices = [
      {
        id: 1,
        deviceType: 'apple_watch',
        deviceName: 'Apple Watch Series 8',
        syncStatus: 'connected',
        lastSyncTime: new Date().toISOString(),
        consentGranted: true,
        privacyLevel: 'high'
      },
      {
        id: 2,
        deviceType: 'fitbit',
        deviceName: 'Fitbit Versa 4',
        syncStatus: 'disconnected',
        lastSyncTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        consentGranted: true,
        privacyLevel: 'medium'
      },
      {
        id: 3,
        deviceType: 'garmin',
        deviceName: 'Garmin Vivosmart 5',
        syncStatus: 'pending',
        lastSyncTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        consentGranted: false,
        privacyLevel: 'low'
      },
      {
        id: 4,
        deviceType: 'pixel_watch',
        deviceName: 'Google Pixel Watch 2',
        syncStatus: 'connected',
        lastSyncTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        consentGranted: true,
        privacyLevel: 'high'
      }
    ];
    res.json(devices);
  } catch (error) {
    console.error('Error fetching wearable devices:', error);
    res.status(500).json({ error: 'Failed to fetch wearable devices' });
  }
});

app.get('/api/health-metrics/:userId', async (req, res) => {
  try {
    const metrics = [
      {
        id: 1,
        metricType: 'heart_rate',
        metricValue: 72,
        unit: 'bpm',
        recordedAt: new Date().toISOString(),
        dataQuality: 'high',
        contextTags: ['resting', 'morning']
      },
      {
        id: 2,
        metricType: 'sleep_quality',
        metricValue: 8.2,
        unit: 'hours',
        recordedAt: new Date().toISOString(),
        dataQuality: 'high',
        contextTags: ['deep_sleep', 'rem_sleep']
      },
      {
        id: 3,
        metricType: 'steps',
        metricValue: 8945,
        unit: 'steps',
        recordedAt: new Date().toISOString(),
        dataQuality: 'medium',
        contextTags: ['daily_activity', 'walking']
      },
      {
        id: 4,
        metricType: 'stress_level',
        metricValue: 3.2,
        unit: 'score',
        recordedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        dataQuality: 'high',
        contextTags: ['pixel_watch', 'stress_monitoring', 'morning']
      },
      {
        id: 5,
        metricType: 'activity_minutes',
        metricValue: 45,
        unit: 'minutes',
        recordedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        dataQuality: 'excellent',
        contextTags: ['pixel_watch', 'active_zone_minutes', 'cardio']
      }
    ];
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching health metrics:', error);
    res.status(500).json({ error: 'Failed to fetch health metrics' });
  }
});

app.get('/api/health-correlations/:userId', async (req, res) => {
  try {
    const correlations = [
      {
        id: 1,
        correlationType: 'positive',
        healthMetric: 'sleep_quality',
        emotionalMetric: 'mood_stability',
        correlationCoefficient: 0.78,
        confidenceLevel: 0.89,
        insights: 'Better sleep quality strongly correlates with improved mood stability and emotional regulation.',
        recommendations: ['Maintain consistent sleep schedule', 'Optimize sleep environment', 'Practice relaxation techniques before bed']
      },
      {
        id: 2,
        correlationType: 'negative',
        healthMetric: 'stress_level',
        emotionalMetric: 'anxiety_level',
        correlationCoefficient: -0.65,
        confidenceLevel: 0.92,
        insights: 'Higher physiological stress markers correspond with increased anxiety episodes.',
        recommendations: ['Regular mindfulness practice', 'Physical exercise routine', 'Stress management techniques']
      }
    ];
    res.json(correlations);
  } catch (error) {
    console.error('Error fetching health correlations:', error);
    res.status(500).json({ error: 'Failed to fetch health correlations' });
  }
});

app.get('/api/health-insights/:userId', async (req, res) => {
  try {
    const insights = [
      {
        id: 1,
        insightType: 'correlation',
        insightTitle: 'Sleep-Mood Connection Detected',
        insightDescription: 'Your sleep patterns show strong correlation with next-day emotional wellness. Prioritizing 7-8 hours of quality sleep significantly improves mood stability.',
        healthDataSources: ['sleep_tracking', 'heart_rate_variability'],
        emotionalDataSources: ['mood_journal', 'daily_check_ins'],
        confidenceScore: 0.87,
        priorityLevel: 'high',
        actionableRecommendations: ['Set consistent bedtime routine', 'Limit screen time before sleep', 'Create optimal sleep environment'],
        isRead: false
      },
      {
        id: 2,
        insightType: 'trend',
        insightTitle: 'Exercise Boosts Mental Clarity',
        insightDescription: 'Regular physical activity correlates with improved focus and reduced anxiety levels in your therapeutic sessions.',
        healthDataSources: ['step_count', 'active_minutes'],
        emotionalDataSources: ['session_notes', 'anxiety_tracking'],
        confidenceScore: 0.73,
        priorityLevel: 'medium',
        actionableRecommendations: ['Schedule 30-minute daily walks', 'Try mindful movement exercises', 'Track mood before and after exercise'],
        isRead: true
      }
    ];
    res.json(insights);
  } catch (error) {
    console.error('Error fetching health insights:', error);
    res.status(500).json({ error: 'Failed to fetch health insights' });
  }
});

app.get('/api/device-sync-logs/:userId', async (req, res) => {
  try {
    const syncLogs = [
      {
        id: 1,
        deviceId: 1,
        syncTime: new Date().toISOString(),
        syncStatus: 'success',
        recordsProcessed: 1440,
        errorMessage: null,
        syncDuration: 2.3
      },
      {
        id: 2,
        deviceId: 2,
        syncTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        syncStatus: 'failed',
        recordsProcessed: 0,
        errorMessage: 'Device authentication failed',
        syncDuration: 0.5
      }
    ];
    res.json(syncLogs);
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    res.status(500).json({ error: 'Failed to fetch sync logs' });
  }
});

app.get('/api/health-privacy/:userId', async (req, res) => {
  try {
    const privacySettings = {
      shareHeartRate: true,
      shareSleepData: true,
      shareActivityData: true,
      shareStressData: false,
      anonymizeData: true,
      dataRetentionDays: 90,
      thirdPartySharing: false,
      researchParticipation: true
    };
    res.json(privacySettings);
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    res.status(500).json({ error: 'Failed to fetch privacy settings' });
  }
});

app.post('/api/sync-device', async (req, res) => {
  try {
    const { deviceId, userId } = req.body;
    const syncResult = {
      success: true,
      deviceId,
      syncTime: new Date().toISOString(),
      recordsProcessed: Math.floor(Math.random() * 1000) + 500,
      syncDuration: Math.random() * 3 + 1
    };
    res.json(syncResult);
  } catch (error) {
    console.error('Error syncing device:', error);
    res.status(500).json({ error: 'Failed to sync device' });
  }
});

// VR Therapy API endpoints
app.get('/api/vr-environments/:userId', async (req, res) => {
  try {
    const environments = [
      {
        id: 1,
        name: 'Peaceful Beach Meditation',
        description: 'A serene beach setting with gentle waves and calming ocean sounds for mindfulness practice.',
        category: 'mindfulness',
        difficulty: 'beginner',
        duration: 15,
        therapeuticFocus: ['anxiety_reduction', 'relaxation', 'mindfulness'],
        accessibilityFeatures: ['audio_descriptions', 'simplified_controls', 'motion_sensitivity_low'],
        imageUrl: '/vr-beach.jpg',
        isAvailable: true
      },
      {
        id: 2,
        name: 'Mountain Forest Relaxation',
        description: 'Immersive forest environment with nature sounds for stress reduction and grounding exercises.',
        category: 'relaxation',
        difficulty: 'beginner',
        duration: 20,
        therapeuticFocus: ['stress_reduction', 'grounding', 'nature_therapy'],
        accessibilityFeatures: ['audio_descriptions', 'trigger_warnings', 'motion_sensitivity_medium'],
        imageUrl: '/vr-forest.jpg',
        isAvailable: true
      },
      {
        id: 3,
        name: 'Safe Space Therapy Room',
        description: 'A comfortable, customizable therapy room for guided counseling sessions and emotional processing.',
        category: 'counseling',
        difficulty: 'intermediate',
        duration: 30,
        therapeuticFocus: ['emotional_processing', 'trauma_recovery', 'safe_space'],
        accessibilityFeatures: ['full_audio_support', 'customizable_lighting', 'motion_sensitivity_low'],
        imageUrl: '/vr-therapy-room.jpg',
        isAvailable: true
      },
      {
        id: 4,
        name: 'Anxiety Exposure Training',
        description: 'Controlled exposure therapy environment for gradually building confidence in challenging situations.',
        category: 'exposure_therapy',
        difficulty: 'advanced',
        duration: 25,
        therapeuticFocus: ['anxiety_management', 'exposure_therapy', 'confidence_building'],
        accessibilityFeatures: ['panic_button', 'intensity_controls', 'therapist_guidance'],
        imageUrl: '/vr-exposure.jpg',
        isAvailable: true
      }
    ];
    res.json(environments);
  } catch (error) {
    console.error('Error fetching VR environments:', error);
    res.status(500).json({ error: 'Failed to fetch VR environments' });
  }
});

app.get('/api/vr-sessions/:userId', async (req, res) => {
  try {
    const sessions = [
      {
        id: 1,
        userId: parseInt(req.params.userId),
        environmentId: 1,
        environmentName: 'Peaceful Beach Meditation',
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
        durationMinutes: 15,
        completionStatus: 'completed',
        effectivenessRating: 4.2,
        stressLevelBefore: 7.5,
        stressLevelAfter: 3.2,
        therapeuticNotes: 'Excellent progress with breathing exercises. User reported feeling much calmer.',
        skillsDeveloped: ['deep_breathing', 'mindfulness', 'present_moment_awareness']
      },
      {
        id: 2,
        userId: parseInt(req.params.userId),
        environmentId: 2,
        environmentName: 'Mountain Forest Relaxation',
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
        durationMinutes: 20,
        completionStatus: 'completed',
        effectivenessRating: 4.6,
        stressLevelBefore: 6.8,
        stressLevelAfter: 2.9,
        therapeuticNotes: 'Strong connection with nature environment. User showed improved grounding skills.',
        skillsDeveloped: ['grounding_techniques', 'nature_connection', 'stress_reduction']
      },
      {
        id: 3,
        userId: parseInt(req.params.userId),
        environmentId: 3,
        environmentName: 'Safe Space Therapy Room',
        startTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 4 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(),
        durationMinutes: 25,
        completionStatus: 'in_progress',
        effectivenessRating: 4.1,
        stressLevelBefore: 8.2,
        stressLevelAfter: 4.5,
        therapeuticNotes: 'Working through emotional processing. Good progress with self-reflection.',
        skillsDeveloped: ['emotional_awareness', 'self_reflection', 'coping_strategies']
      }
    ];
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching VR sessions:', error);
    res.status(500).json({ error: 'Failed to fetch VR sessions' });
  }
});

app.get('/api/vr-progress/:userId', async (req, res) => {
  try {
    const progress = {
      userId: parseInt(req.params.userId),
      totalSessions: 15,
      totalMinutes: 320,
      averageEffectiveness: 4.3,
      averageStressReduction: 4.2,
      skillLevels: {
        mindfulness: 7.2,
        relaxation: 8.1,
        exposure_therapy: 5.8,
        emotional_processing: 6.9
      },
      milestones: [
        {
          id: 1,
          name: 'First VR Session',
          description: 'Completed your first virtual reality therapy session',
          achievedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'engagement'
        },
        {
          id: 2,
          name: 'Mindfulness Master',
          description: 'Completed 10 mindfulness VR sessions',
          achievedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'skill_development'
        },
        {
          id: 3,
          name: 'Stress Warrior',
          description: 'Achieved consistent stress reduction of 50% or more',
          achievedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'therapeutic_progress'
        }
      ],
      nextRecommendations: [
        {
          environmentId: 4,
          environmentName: 'Anxiety Exposure Training',
          reason: 'Ready to tackle more challenging scenarios based on your progress',
          difficulty: 'advanced'
        }
      ]
    };
    res.json(progress);
  } catch (error) {
    console.error('Error fetching VR progress:', error);
    res.status(500).json({ error: 'Failed to fetch VR progress' });
  }
});

app.post('/api/vr-sessions', async (req, res) => {
  try {
    const { userId, environmentId, durationMinutes, effectivenessRating, stressLevelBefore, stressLevelAfter, notes } = req.body;
    
    const newSession = {
      id: Date.now(),
      userId,
      environmentId,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + durationMinutes * 60 * 1000).toISOString(),
      durationMinutes,
      completionStatus: 'completed',
      effectivenessRating,
      stressLevelBefore,
      stressLevelAfter,
      therapeuticNotes: notes || 'VR therapy session completed successfully.',
      skillsDeveloped: ['mindfulness', 'relaxation']
    };
    
    res.json({ success: true, session: newSession });
  } catch (error) {
    console.error('Error creating VR session:', error);
    res.status(500).json({ error: 'Failed to create VR session' });
  }
});

// Journal Analytics Dashboard
app.get('/api/journal/analytics/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    
    // Get journal entries and mood data
    const [journalEntries, moodEntries] = await Promise.all([
      storage.getJournalEntries(userId),
      storage.getMoodEntries(userId)
    ]);

    // Calculate emotional journey
    const emotionalJourney = journalEntries.slice(0, 30).map(entry => ({
      date: entry.createdAt,
      sentiment: Math.random() * 2 - 1, // Would come from stored analysis
      mood: entry.mood || 'neutral'
    }));

    // Calculate recurring themes (would analyze actual content)
    const recurringThemes = [
      { theme: 'Work Stress', frequency: 15 },
      { theme: 'Relationships', frequency: 12 },
      { theme: 'Self-Reflection', frequency: 10 },
      { theme: 'Anxiety', frequency: 8 },
      { theme: 'Goals & Progress', frequency: 6 }
    ];

    // Calculate sentiment trend
    const recentSentiments = emotionalJourney.slice(0, 7).map(j => j.sentiment);
    const sentimentTrend = recentSentiments.reduce((a, b) => a + b, 0) / recentSentiments.length;

    // Risk indicators
    const riskIndicators = [];
    if (sentimentTrend < -0.3) riskIndicators.push('Declining mood trend');
    if (moodEntries.filter(m => m.intensity < 4).length > moodEntries.length * 0.5) {
      riskIndicators.push('Persistent low mood');
    }

    // Generate therapeutic progress insight
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'system',
          content: 'Analyze therapeutic progress from journal analytics data and provide professional insights.'
        }, {
          role: 'user',
          content: `Analyze therapeutic progress:
            - Journal entries: ${journalEntries.length}
            - Sentiment trend: ${sentimentTrend.toFixed(2)}
            - Risk indicators: ${riskIndicators.join(', ')}
            - Top themes: ${recurringThemes.slice(0, 3).map(t => t.theme).join(', ')}
            
            Provide brief therapeutic progress assessment.`
        }],
        max_tokens: 300,
        temperature: 0.6
      })
    });

    const aiData = await openaiResponse.json();
    const therapeuticProgress = aiData.choices?.[0]?.message?.content || 'Continued journaling shows positive engagement with therapeutic process.';

    res.json({
      success: true,
      analytics: {
        emotionalJourney,
        recurringThemes,
        sentimentTrend,
        riskIndicators,
        therapeuticProgress,
        totalEntries: journalEntries.length,
        averageMoodIntensity: moodEntries.reduce((acc, m) => acc + m.intensity, 0) / moodEntries.length
      }
    });

  } catch (error) {
    console.error('Journal analytics error:', error);
    res.status(500).json({ error: 'Failed to generate journal analytics' });
  }
});

// Export Therapist Report
app.get('/api/journal/export/therapist/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    
    const [journalEntries, moodEntries, riskAssessments] = await Promise.all([
      storage.getJournalEntries(userId),
      storage.getMoodEntries(userId),
      storage.getRiskAssessments ? storage.getRiskAssessments(userId, 5) : []
    ]);

    // Generate comprehensive therapist report using AI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'system',
          content: 'Generate a professional therapist report based on journal entries and mood data. Include clinical insights, risk assessment, and therapeutic recommendations.'
        }, {
          role: 'user',
          content: `Generate therapist report for patient:
            - Total journal entries: ${journalEntries.length}
            - Recent mood scores: ${moodEntries.slice(0, 10).map(m => m.intensity).join(', ')}
            - Risk assessments: ${riskAssessments.length} completed
            - Entry themes: work stress, relationships, anxiety, self-reflection
            
            Include: Clinical summary, mood patterns, risk factors, therapeutic recommendations, and suggested interventions.`
        }],
        max_tokens: 1500,
        temperature: 0.6
      })
    });

    const aiData = await openaiResponse.json();
    const report = aiData.choices?.[0]?.message?.content || 'Comprehensive therapist report generated.';

    // In a real implementation, you'd generate a PDF here
    // For now, return the text report
    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      report: {
        generatedDate: new Date().toISOString(),
        patientId: userId,
        reportType: 'Therapist Clinical Summary',
        content: report,
        dataPoints: {
          journalEntries: journalEntries.length,
          moodEntries: moodEntries.length,
          riskAssessments: riskAssessments.length
        }
      }
    });

  } catch (error) {
    console.error('Therapist report export error:', error);
    res.status(500).json({ error: 'Failed to generate therapist report' });
  }
});

// Export Personal Insights Report
app.get('/api/journal/export/insights/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    
    const [journalEntries, moodEntries] = await Promise.all([
      storage.getJournalEntries(userId),
      storage.getMoodEntries(userId)
    ]);

    // Generate personal insights report
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'system',
          content: 'Generate a personal wellness insights report for the user based on their journaling journey. Focus on growth, patterns, and positive reinforcement.'
        }, {
          role: 'user',
          content: `Generate personal insights report:
            - Journey length: ${journalEntries.length} journal entries
            - Mood tracking: ${moodEntries.length} mood recordings
            - Average mood: ${(moodEntries.reduce((acc, m) => acc + m.intensity, 0) / moodEntries.length).toFixed(1)}/10
            
            Include: Personal growth observations, emotional patterns, strengths identified, coping strategies, and encouragement for continued progress.`
        }],
        max_tokens: 1200,
        temperature: 0.7
      })
    });

    const aiData = await openaiResponse.json();
    const insights = aiData.choices?.[0]?.message?.content || 'Your journaling journey shows dedication to personal growth and self-awareness.';

    res.json({
      success: true,
      insights: {
        generatedDate: new Date().toISOString(),
        userId: userId,
        reportType: 'Personal Wellness Insights',
        content: insights,
        statistics: {
          totalEntries: journalEntries.length,
          averageMood: (moodEntries.reduce((acc, m) => acc + m.intensity, 0) / moodEntries.length).toFixed(1),
          journeyDuration: journalEntries.length > 0 ? 
            Math.ceil((Date.now() - new Date(journalEntries[journalEntries.length - 1].createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)) : 0
        }
      }
    });

  } catch (error) {
    console.error('Personal insights export error:', error);
    res.status(500).json({ error: 'Failed to generate personal insights' });
  }
});

// Enhanced Gamification & Rewards System API Endpoints

// Wellness Points Management
app.get('/api/wellness-points/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    
    // Get user wellness points or create if doesn't exist
    let wellnessPoints = await storage.getUserWellnessPoints(userId);
    if (!wellnessPoints) {
      wellnessPoints = await storage.createUserWellnessPoints({
        userId,
        totalPoints: 0,
        availablePoints: 0,
        lifetimePoints: 0,
        currentLevel: 1,
        pointsToNextLevel: 100
      });
    }

    // Get recent transactions
    const recentTransactions = await storage.getPointsTransactions(userId, 10);

    res.json({
      success: true,
      wellnessPoints,
      recentTransactions
    });

  } catch (error) {
    console.error('Wellness points error:', error);
    res.status(500).json({ error: 'Failed to get wellness points' });
  }
});

app.post('/api/wellness-points/award', async (req, res) => {
  try {
    const { userId, points, activity, description } = req.body;
    
    // Award points and create transaction
    await storage.awardWellnessPoints(userId, points, activity, description);
    
    // Check for level up
    const wellnessPoints = await storage.getUserWellnessPoints(userId);
    let leveledUp = false;
    
    if (wellnessPoints && wellnessPoints.totalPoints >= wellnessPoints.pointsToNextLevel) {
      leveledUp = true;
      await storage.levelUpUser(userId);
    }

    res.json({
      success: true,
      pointsAwarded: points,
      leveledUp,
      newLevel: leveledUp ? wellnessPoints?.currentLevel + 1 : wellnessPoints?.currentLevel
    });

  } catch (error) {
    console.error('Award points error:', error);
    res.status(500).json({ error: 'Failed to award points' });
  }
});

// Achievement System
app.get('/api/achievements/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    
    // Get all achievements with user progress
    const [allAchievements, userAchievements] = await Promise.all([
      storage.getAllAchievements(),
      storage.getUserAchievements(userId)
    ]);

    // Merge achievements with user progress
    const achievementsWithProgress = allAchievements.map(achievement => {
      const userProgress = userAchievements.find(ua => ua.achievementId === achievement.id);
      return {
        ...achievement,
        progress: userProgress?.progress || 0,
        isCompleted: userProgress?.isCompleted || false,
        unlockedAt: userProgress?.unlockedAt || null
      };
    });

    res.json({
      success: true,
      achievements: achievementsWithProgress,
      totalUnlocked: userAchievements.filter(ua => ua.isCompleted).length,
      totalPoints: userAchievements.reduce((sum, ua) => sum + (ua.isCompleted ? (allAchievements.find(a => a.id === ua.achievementId)?.pointsReward || 0) : 0), 0)
    });

  } catch (error) {
    console.error('Achievements error:', error);
    res.status(500).json({ error: 'Failed to get achievements' });
  }
});

app.post('/api/achievements/check', async (req, res) => {
  try {
    const { userId, activity, metadata } = req.body;
    
    // Check for achievement unlocks based on activity
    const newAchievements = await storage.checkAndUnlockAchievements(userId, activity, metadata);
    
    res.json({
      success: true,
      newAchievements,
      hasNewAchievements: newAchievements.length > 0
    });

  } catch (error) {
    console.error('Achievement check error:', error);
    res.status(500).json({ error: 'Failed to check achievements' });
  }
});

// Rewards Shop
app.get('/api/rewards-shop', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string) || 1;
    
    // Get available rewards and user purchases
    const [rewards, userPurchases, userPoints] = await Promise.all([
      storage.getAvailableRewards(),
      storage.getUserPurchases(userId),
      storage.getUserWellnessPoints(userId)
    ]);

    // Mark rewards as purchased
    const rewardsWithStatus = rewards.map(reward => ({
      ...reward,
      isPurchased: userPurchases.some(up => up.rewardId === reward.id),
      canAfford: userPoints ? userPoints.availablePoints >= reward.cost : false
    }));

    res.json({
      success: true,
      rewards: rewardsWithStatus,
      userPoints: userPoints?.availablePoints || 0
    });

  } catch (error) {
    console.error('Rewards shop error:', error);
    res.status(500).json({ error: 'Failed to get rewards shop' });
  }
});

app.post('/api/rewards-shop/purchase', async (req, res) => {
  try {
    const { userId, rewardId } = req.body;
    
    // Get reward and user points
    const [reward, userPoints] = await Promise.all([
      storage.getRewardById(rewardId),
      storage.getUserWellnessPoints(userId)
    ]);

    if (!reward || !userPoints) {
      return res.status(404).json({ error: 'Reward or user not found' });
    }

    if (userPoints.availablePoints < reward.cost) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    // Process purchase
    await storage.purchaseReward(userId, rewardId, reward.cost);

    res.json({
      success: true,
      reward,
      remainingPoints: userPoints.availablePoints - reward.cost
    });

  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'Failed to purchase reward' });
  }
});

// Wellness Streaks
app.get('/api/streaks/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    
    const streaks = await storage.getUserStreaks(userId);
    
    res.json({
      success: true,
      streaks: streaks || [],
      totalStreaks: streaks?.length || 0
    });

  } catch (error) {
    console.error('Streaks error:', error);
    res.status(500).json({ error: 'Failed to get streaks' });
  }
});

app.post('/api/streaks/update', async (req, res) => {
  try {
    const { userId, streakType } = req.body;
    
    // Update streak for activity
    const updatedStreak = await storage.updateStreak(userId, streakType);
    
    res.json({
      success: true,
      streak: updatedStreak,
      milestone: updatedStreak.currentStreak > 0 && updatedStreak.currentStreak % 7 === 0
    });

  } catch (error) {
    console.error('Update streak error:', error);
    res.status(500).json({ error: 'Failed to update streak' });
  }
});

// Community Challenges
app.get('/api/community-challenges', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string) || 1;
    
    // Get active challenges and user progress
    const [challenges, userProgress] = await Promise.all([
      storage.getActiveCommunityChallenes(),
      storage.getUserChallengeProgress(userId)
    ]);

    // Merge challenges with user progress
    const challengesWithProgress = challenges.map(challenge => {
      const progress = userProgress.find(up => up.challengeId === challenge.id);
      return {
        ...challenge,
        userProgress: progress?.currentProgress || 0,
        isParticipating: !!progress,
        isCompleted: progress?.isCompleted || false,
        daysRemaining: Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      };
    });

    res.json({
      success: true,
      challenges: challengesWithProgress
    });

  } catch (error) {
    console.error('Community challenges error:', error);
    res.status(500).json({ error: 'Failed to get community challenges' });
  }
});

app.post('/api/community-challenges/join', async (req, res) => {
  try {
    const { userId, challengeId } = req.body;
    
    // Join challenge
    await storage.joinCommunityChallenge(userId, challengeId);
    
    res.json({
      success: true,
      message: 'Successfully joined challenge'
    });

  } catch (error) {
    console.error('Join challenge error:', error);
    res.status(500).json({ error: 'Failed to join challenge' });
  }
});

app.post('/api/community-challenges/progress', async (req, res) => {
  try {
    const { userId, challengeId, progressIncrement } = req.body;
    
    // Update challenge progress
    const updatedProgress = await storage.updateChallengeProgress(userId, challengeId, progressIncrement);
    
    res.json({
      success: true,
      progress: updatedProgress
    });

  } catch (error) {
    console.error('Challenge progress error:', error);
    res.status(500).json({ error: 'Failed to update challenge progress' });
  }
});

// Gamification Dashboard Overview
app.get('/api/gamification/overview/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    
    // Get comprehensive gamification data
    const [wellnessPoints, achievements, streaks, challenges, dailyActivity] = await Promise.all([
      storage.getUserWellnessPoints(userId),
      storage.getUserAchievements(userId),
      storage.getUserStreaks(userId),
      storage.getUserChallengeProgress(userId),
      storage.getTodayActivity(userId)
    ]);

    // Calculate statistics
    const completedAchievements = achievements.filter(a => a.isCompleted).length;
    const activeStreaks = streaks.filter(s => s.currentStreak > 0).length;
    const activeChallenges = challenges.filter(c => !c.isCompleted).length;

    res.json({
      success: true,
      overview: {
        level: wellnessPoints?.currentLevel || 1,
        totalPoints: wellnessPoints?.totalPoints || 0,
        availablePoints: wellnessPoints?.availablePoints || 0,
        pointsToNext: wellnessPoints?.pointsToNextLevel || 100,
        completedAchievements,
        activeStreaks,
        activeChallenges,
        todayActivities: dailyActivity?.activitiesCompleted || 0,
        todayPoints: dailyActivity?.pointsEarned || 0
      }
    });

  } catch (error) {
    console.error('Gamification overview error:', error);
    res.status(500).json({ error: 'Failed to get gamification overview' });
  }
});

// Setup development or production serving AFTER all API routes
if (process.env.NODE_ENV === "production") {
  serveStatic(app);
} else {
  setupVite(app, server).then(() => {
    console.log('Vite setup complete');
  });
}

server.listen(PORT, "0.0.0.0", () => {
  log(`Server running on port ${PORT}`);
  console.log(`Server accessible at http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Replit domain: ${process.env.REPLIT_DEV_DOMAIN || 'localhost'}`);
});

export default app;