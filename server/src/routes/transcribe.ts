import { Router } from 'express';
import { unifiedAuthMiddleware } from '../auth/unifiedAuth.js';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size
  },
});

// OpenAI Whisper transcription endpoint
router.post('/transcribe', unifiedAuthMiddleware, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not configured');
      return res.status(500).json({ error: 'Transcription service not configured' });
    }

    console.log('🎤 Transcription Request:', {
      userId: req.user?.id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    // Create FormData for OpenAI Whisper API
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('file', blob, req.file.originalname);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // Optional: specify English for better accuracy
    formData.append('response_format', 'json');

    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI Whisper API Error:', {
        status: response.status,
        error: errorText
      });
      return res.status(response.status).json({ 
        error: 'Transcription failed',
        details: errorText 
      });
    }

    const data = await response.json() as { text: string };
    
    console.log('✅ Transcription Success:', {
      userId: req.user?.id,
      transcription: data.text
    });

    res.json({ text: data.text });

  } catch (error) {
    console.error('❌ Transcription Error:', error);
    res.status(500).json({ 
      error: 'Failed to transcribe audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
