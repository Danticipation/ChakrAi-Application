import express from 'express';
import multer from 'multer';
import { openai } from '../openaiRetry.js';
import { getVoiceIdFromFrontend, defaultVoiceId } from '../voiceConfig.ts';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Clean text before sending to ElevenLabs TTS
function scrubTextForTTS(text) {
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

// Text-to-speech endpoint with ElevenLabs
router.post('/text-to-speech', async (req, res) => {
  try {
    const { text, voice = 'james', emotionalContext = 'neutral' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('❌ ElevenLabs API key not found');
      return res.status(500).json({ 
        error: 'ElevenLabs API key not configured',
        fallback: 'Check your .env file for ELEVENLABS_API_KEY'
      });
    }

    // Get the ElevenLabs voice ID from the frontend voice name
    const voiceId = getVoiceIdFromFrontend(voice);
    console.log(`🎤 Generating speech with ElevenLabs for voice: ${voice} (ID: ${voiceId})`);
    
    // Scrub text before sending to ElevenLabs
    const scrubbedText = scrubTextForTTS(text);
    console.log(`Original text: "${text.substring(0, 100)}..."`);
    console.log(`Scrubbed text: "${scrubbedText.substring(0, 100)}..."`);
    
    try {
      // Call ElevenLabs API
      const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: scrubbedText,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (elevenLabsResponse.ok) {
        const audioBuffer = await elevenLabsResponse.arrayBuffer();
        
        console.log(`✅ Generated audio with ElevenLabs: ${audioBuffer.byteLength} bytes`);
        
        // Return audio as MP3 from ElevenLabs
        res.set({
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.byteLength.toString(),
          'Cache-Control': 'no-cache'
        });
        
        res.send(Buffer.from(audioBuffer));
      } else {
        const errorText = await elevenLabsResponse.text();
        console.error('❌ ElevenLabs API error:', elevenLabsResponse.status, errorText);
        throw new Error(`ElevenLabs API error: ${elevenLabsResponse.status}`);
      }
    } catch (error) {
      console.error('❌ ElevenLabs TTS generation failed:', error);
      throw error;
    }
  } catch (error) {
    console.error('❌ Text-to-speech error:', error);
    res.status(500).json({ 
      error: 'Failed to generate speech with ElevenLabs',
      details: error.message
    });
  }
});

// Enhanced transcription endpoint with local Whisper fallback
router.post('/transcribe-enhanced', upload.single('audio'), async (req, res) => {
  try {
    console.log('🎯 Enhanced transcribe endpoint called');
    console.log('📁 File received:', !!req.file);
    
    if (!req.file) {
      console.error('❌ No audio file in request');
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('📊 Audio file details:');
    console.log('  - Size:', req.file.size, 'bytes');
    console.log('  - Type:', req.file.mimetype);
    console.log('  - Buffer length:', req.file.buffer.length);

    // Use OpenAI Whisper API for transcription
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ No OpenAI API key found');
      return res.status(503).json({ 
        error: 'Voice transcription unavailable. OpenAI API key required.',
        errorType: 'auth_error'
      });
    }

    const formData = new FormData();
    const audioBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    console.log('🚀 Sending request to OpenAI Whisper API...');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData
    });

    console.log('📥 OpenAI response status:', response.status);

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
    const transcription = result.text;
    console.log('✅ OpenAI transcription successful:', transcription);

    // Enhanced response with audio quality assessment
    const audioQualityScore = req.file.size > 10000 ? 'good' : 'fair';
    const hasLowQuality = transcription.length < 10 && req.file.size < 5000;

    res.json({ 
      success: true, 
      transcription: transcription,
      text: transcription,
      source: 'openai_whisper',
      warning: hasLowQuality ? 'Speech may have been unclear. Try speaking louder and more clearly.' : undefined,
      audioDetails: {
        size: req.file.buffer.length,
        qualityScore: audioQualityScore,
        mimeType: req.file.mimetype
      }
    });

  } catch (error) {
    console.error('❌ Enhanced transcription error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Voice transcription failed. Please try again.',
      errorType: 'transcription_error'
    });
  }
});

// Get available voices
router.get('/voices', (req, res) => {
  const voices = [
    { id: 'james', name: 'James', gender: 'male', description: 'Warm, professional male voice' },
    { id: 'brian', name: 'Brian', gender: 'male', description: 'Clear, confident male voice' },
    { id: 'alexandra', name: 'Alexandra', gender: 'female', description: 'Gentle, caring female voice' },
    { id: 'carla', name: 'Carla', gender: 'female', description: 'Friendly, supportive female voice' },
    { id: 'hope', name: 'Hope', gender: 'female', description: 'Optimistic, encouraging female voice' },
    { id: 'charlotte', name: 'Charlotte', gender: 'female', description: 'Professional, articulate female voice' },
    { id: 'bronson', name: 'Bronson', gender: 'male', description: 'Deep, reassuring male voice' },
    { id: 'marcus', name: 'Marcus', gender: 'male', description: 'Calm, therapeutic male voice' }
  ];
  
  res.json({ voices });
});

export default router;