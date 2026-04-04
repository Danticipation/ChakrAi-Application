import { Router } from 'express';
import { unifiedAuthMiddleware } from '../auth/unifiedAuth.js';

const router = Router();

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// Voice ID mappings (ElevenLabs pre-made voices)
// All 11 voices available (9 for chat + 2 for meditation)
const VOICE_IDS: Record<string, string> = {
  // Chat voices
  'Brandy': 'Wc8btLAGKaR6QpF0V4ID',       // Brandy
  'Bella': 'I6EWcAhSCGleOdoUc6sy',        // Bella
  'Caleb': '2bXFawoMVGbyfX22XDMM',        // Caleb
  'Caprice': '9taonIMp5AW60jveEjwF',      // Caprice
  'Damian G.': 'GXWj7G6MHT57ZJMsK5BM',    // Damian G.
  'Jarnathan': 'c6SfcYrb2t09NHXiT80T',   // Jarnathan
  'Ollie': 'jRAAK67SEFE9m7ci5DhD',        // Ollie
  'Jon': 'Cz0K1kOv9tD8l0b5Qu53',         // Jon
  'Alexandra': 'kdmDKE6EkgrWrrykO9Qt',     // Alexandra
  // Meditation voices
  'natasha': 'Atp5cNFg1Wj5gyKD7HWV',       // Natasha (calming female)
  'natasha_husband': 'HgyIHe81F3nXywNwkraY' // Natasha's Husband (deep male)
};

// Voice metadata for UI
export const AVAILABLE_VOICES = [
  { id: 'Brandy', name: 'Brandy', description: 'Warm & Caring' },
  { id: 'Bella', name: 'Bella', description: 'Friendly & Gentle' },
  { id: 'Caleb', name: 'Caleb', description: 'Strong & Confident' },
  { id: 'Caprice', name: 'Caprice', description: 'Energetic & Upbeat' },
  { id: 'Damian G.', name: 'Damian G.', description: 'Confident & Professional' },
  { id: 'Jarnathan', name: 'Jarnathan', description: 'Friendly & Approachable' },
  { id: 'Ollie', name: 'Ollie', description: 'Calm & Reassuring' },
  { id: 'Jon', name: 'Jon', description: 'Clear & Articulate' },
  { id: 'Alexandra', name: 'Alexandra', description: 'British & Articulate' }
];

interface TTSRequest {
  text: string;
  voice?: string;
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

// Get available voices (PUBLIC - no auth required)
router.get('/voices', (_req, res) => {
  res.json({
    voices: AVAILABLE_VOICES,
    default: 'Brandy'
  });
});

// Text-to-speech endpoint (PROTECTED - requires auth)
router.post('/text-to-speech', unifiedAuthMiddleware, async (req, res) => {
  try {
    const { 
      text, 
      voice = 'Brandy', 
      stability = 0.5, 
      similarity_boost = 0.75,
      style = 0,
      use_speaker_boost = false
    } = req.body as TTSRequest;

    // Validate required fields
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Text is required and must be a non-empty string' 
      });
    }

    // Clean text for TTS: remove markdown formatting
    let cleanText = text
      // Remove bold/italic asterisks
      .replace(/\*\*\*(.*?)\*\*\*/g, '$1')  // ***bold italic***
      .replace(/\*\*(.*?)\*\*/g, '$1')      // **bold**
      .replace(/\*(.*?)\*/g, '$1')          // *italic*
      // Remove underscores for bold/italic
      .replace(/___(.+?)___/g, '$1')        // ___bold italic___
      .replace(/__(.+?)__/g, '$1')          // __bold__
      .replace(/_(.+?)_/g, '$1')            // _italic_
      // Remove strikethrough
      .replace(/~~(.+?)~~/g, '$1')          // ~~strikethrough~~
      // Remove code blocks and inline code
      .replace(/```[\s\S]*?```/g, '')       // ```code blocks```
      .replace(/`(.+?)`/g, '$1')            // `inline code`
      // Remove links but keep text
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')  // [text](url)
      // Remove headers
      .replace(/^#{1,6}\s+/gm, '')          // # headers
      // Remove bullet points
      .replace(/^[\*\-\+]\s+/gm, '')        // * - + bullets
      // Remove numbered lists
      .replace(/^\d+\.\s+/gm, '')           // 1. numbered
      // Remove blockquotes
      .replace(/^>\s+/gm, '')               // > blockquote
      // Remove horizontal rules
      .replace(/^[-*_]{3,}$/gm, '')         // --- *** ___
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      return res.status(400).json({ 
        error: 'Text contains only formatting characters' 
      });
    }

    // Check if ElevenLabs API key is configured
    if (!ELEVENLABS_API_KEY) {
      console.error('❌ ELEVENLABS_API_KEY not configured in environment');
      return res.status(500).json({ 
        error: 'Text-to-speech service not configured. Please set ELEVENLABS_API_KEY.' 
      });
    }

    // Get voice ID
    const voiceId = VOICE_IDS[voice] || VOICE_IDS['Brandy'];
    const elevenLabsUrl = `${ELEVENLABS_API_URL}/${voiceId}`;

    // Determine which model to use based on voice
    // Meditation voices need slower, more natural pacing
    const isMeditationVoice = voice === 'natasha' || voice === 'natasha_husband';
    const modelId = isMeditationVoice ? 'eleven_multilingual_v2' : 'eleven_monolingual_v1';

    console.log('🎤 Text-to-Speech Request:', {
      userId: req.user?.id,
      voice,
      voiceId,
      originalLength: text.length,
      cleanedLength: cleanText.length,
      stability,
      similarity_boost,
      style,
      use_speaker_boost,
      modelId
    });

    // Call ElevenLabs API with cleaned text
    const elevenLabsResponse = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: cleanText,  // Use cleaned text instead of original
        model_id: modelId,
        voice_settings: {
          stability,
          similarity_boost,
          style,
          use_speaker_boost
        }
      })
    });

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error('❌ ElevenLabs API Error:', {
        status: elevenLabsResponse.status,
        statusText: elevenLabsResponse.statusText,
        error: errorText
      });
      
      return res.status(elevenLabsResponse.status).json({ 
        error: 'Text-to-speech generation failed',
        details: errorText 
      });
    }

    // Get audio data as buffer
    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    const audioData = Buffer.from(audioBuffer);

    console.log('✅ Text-to-Speech Success:', {
      userId: req.user?.id,
      audioSizeKB: (audioData.length / 1024).toFixed(2)
    });

    // Return audio as MP3
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioData.length.toString());
    res.send(audioData);

  } catch (error) {
    console.error('❌ Text-to-Speech Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate speech',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
