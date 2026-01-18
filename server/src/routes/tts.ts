// server/src/routes/tts.ts
import { Router } from 'express';
import { requireUserId } from '../lib/auth.js';
import axios from 'axios';

const router = Router();

// Text-to-Speech using ElevenLabs (alternative path for compatibility)
router.post('/text-to-speech', requireUserId, async (req, res) => {
  try {
    const { text, voice } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!elevenLabsApiKey) {
      console.error('❌ ElevenLabs API key not configured');
      return res.status(500).json({ error: 'Text-to-speech service not configured' });
    }

    // Default to a calm, soothing voice if none specified or invalid
    // Rachel voice - clear and friendly
    const voiceId = voice || '21m00Tcm4TlvDq8ikWAM';
    
    // Map common voice names to ElevenLabs IDs
    const voiceMap: Record<string, string> = {
      'rachel': '21m00Tcm4TlvDq8ikWAM',
      'james': '21m00Tcm4TlvDq8ikWAM', // fallback to rachel
      'default': '21m00Tcm4TlvDq8ikWAM'
    };
    
    const finalVoiceId = voiceMap[voiceId.toLowerCase()] || voiceId;

    console.log(`🎙️ Generating TTS for user ${req.userId} with voice ${finalVoiceId}`);

    // Call ElevenLabs API
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`,
      {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer'
      }
    );

    // Set headers and send audio
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(response.data));
    
    console.log('✅ TTS audio sent successfully');
  } catch (error: any) {
    console.error('❌ TTS Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to generate speech',
      details: error.message 
    });
  }
});

// Text-to-Speech using ElevenLabs
router.post('/', requireUserId, async (req, res) => {
  try {
    const { text, voice } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!elevenLabsApiKey) {
      console.error('❌ ElevenLabs API key not configured');
      return res.status(500).json({ error: 'Text-to-speech service not configured' });
    }

    // Default to a calm, soothing voice if none specified or invalid
    // Rachel voice - clear and friendly
    const voiceId = voice || '21m00Tcm4TlvDq8ikWAM';
    
    // Map common voice names to ElevenLabs IDs
    const voiceMap: Record<string, string> = {
      'rachel': '21m00Tcm4TlvDq8ikWAM',
      'james': '21m00Tcm4TlvDq8ikWAM', // fallback to rachel
      'default': '21m00Tcm4TlvDq8ikWAM'
    };
    
    const finalVoiceId = voiceMap[voiceId.toLowerCase()] || voiceId;

    console.log(`🎙️ Generating TTS for user ${req.userId} with voice ${finalVoiceId}`);

    // Call ElevenLabs API
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`,
      {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer'
      }
    );

    // Set headers and send audio
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(response.data));
    
    console.log('✅ TTS audio sent successfully');
  } catch (error: any) {
    console.error('❌ TTS Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to generate speech',
      details: error.message 
    });
  }
});

export default router;
