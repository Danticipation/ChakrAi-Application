import express from 'express';
import multer from 'multer';
import { openai } from '../openaiRetry.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Simple working chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('💬 Chat message received:', message);

    // Simple AI response without complex memory system
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are Chakrai, a professional AI wellness companion. Provide thoughtful, supportive responses to help users with their mental wellness journey. Be warm but professional, and offer practical guidance when appropriate.`
        },
        { role: "user", content: message }
      ],
      max_tokens: 600,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content;
    
    console.log('✅ AI response generated');
    
    res.json({
      message: aiResponse,
      response: aiResponse,
      stage: "Wellness Companion",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Chat error:', error);
    
    res.json({
      message: "I'm here to support your wellness journey. How are you feeling today?",
      response: "I'm here to support your wellness journey. How are you feeling today?",
      stage: "Wellness Companion",
      timestamp: new Date().toISOString()
    });
  }
});

// Voice transcription endpoint
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    console.log('🎯 Transcribe endpoint called');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('📊 Audio file details:');
    console.log('  - Size:', req.file.size, 'bytes');
    console.log('  - Type:', req.file.mimetype);

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ 
        error: 'Voice transcription temporarily unavailable'
      });
    }

    console.log('🔑 OpenAI API key exists: Yes');

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
        error: `Transcription failed: ${response.status}`
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
      details: error.message
    });
  }
});

export default router;
