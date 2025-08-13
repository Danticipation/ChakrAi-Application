import express from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for TTS
const ttsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 TTS requests per windowMs
  message: 'Too many text-to-speech requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Voice ID mapping for ElevenLabs - Updated to match VoiceSelector
const VOICE_MAPPING = {
  // Original voices
  'james': 'EkK5I93UQWFDigLMpZcX',     // James - Professional and calming
  'brian': 'nPczCjzI2devNBz1zQrb',     // Brian - Deep and resonant
  'alexandra': 'kdmDKE6EkgrWrrykO9Qt', // Alexandra - Clear and articulate
  'carla': 'l32B8XDoylOsZKiSdfhE',     // Carla - Warm and empathetic
  // New voices
  'hope': 's3WpFb3KxhwHdqCNjxE1',     // Hope - Warm and encouraging
  'charlotte': 'XB0fDUnXU5powFXDhCwa', // Charlotte - Gentle and empathetic
  'bronson': 'Yko7PKHZNXotIFUBG7I9',  // Bronson - Confident and reassuring
  'marcus': 'y3kKRaK2dnn3OgKDBckk',   // Marcus - Smooth and supportive
  // Meditation voices
  'natasha': 'Atp5cNFg1Wj5gyKD7HWV',  // Natasha - Meditation female voice
  'natasha_husband': 'HgyIHe81F3nXywNwkraY', // Natasha's Husband - Meditation male voice
  // Legacy compatibility
  'Rachel': 'AZnzlk1XvdvUeBnXmlld',   // Rachel - Calm & Professional
  'Bella': 'EXAVITQu4vr4xnSDxMaL',    // Bella - Warm & Caring  
  'Josh': 'TxGEqnHWrfWFMLpK4Npl',     // Josh - Confident & Clear
  'Arnold': 'VR6AewLTigWG4xSOukaG'    // Arnold - Deep & Reassuring
};

const ttsValidation = [
  body('text')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Text must be between 1 and 5000 characters'),
  body('voice')
    .isIn(['james', 'brian', 'alexandra', 'carla', 'hope', 'charlotte', 'bronson', 'marcus', 'natasha', 'natasha_husband', 'Rachel', 'Bella', 'Josh', 'Arnold'])
    .withMessage('Invalid voice selection'),
  body('stability')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Stability must be between 0 and 1'),
  body('similarity_boost')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Similarity boost must be between 0 and 1')
];

// Simple validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post('/text-to-speech', ttsRateLimit, ttsValidation, validateRequest, async (req, res) => {
  try {
    const { text, voice, stability = 0.5, similarity_boost = 0.75 } = req.body;
    
    console.log(`🎤 TTS Request - Voice: ${voice}, Text length: ${text.length} characters`);

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsApiKey) {
      console.error('❌ ElevenLabs API key not found');
      return res.status(500).json({ 
        error: 'Text-to-speech service not configured. Please contact support.' 
      });
    }

    const voiceId = VOICE_MAPPING[voice];
    if (!voiceId) {
      console.error(`❌ Invalid voice ID for voice: ${voice}`);
      return res.status(400).json({ error: 'Invalid voice selection' });
    }

    // Make request to ElevenLabs API
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsApiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: stability,
            similarity_boost: similarity_boost,
            style: 0.0,
            use_speaker_boost: true
          }
        }),
      }
    );

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error(`❌ ElevenLabs API error: ${elevenLabsResponse.status} - ${errorText}`);
      return res.status(500).json({ 
        error: 'Failed to generate speech audio. Please try again.' 
      });
    }

    console.log(`✅ TTS generated successfully for voice: ${voice}`);

    // Stream the audio response back to client
    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength.toString(),
      'Cache-Control': 'no-cache'
    });

    res.send(Buffer.from(audioBuffer));

  } catch (error) {
    console.error('❌ Text-to-speech error:', error);
    res.status(500).json({ 
      error: 'Internal server error during speech generation' 
    });
  }
});

export default router;