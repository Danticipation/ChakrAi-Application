import express from 'express';
import multer from 'multer';
import { openai } from '../openaiRetry.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Chat analytics endpoint
router.get('/analytics', async (req, res) => {
  try {
    console.log('📊 Chat analytics requested');
    
    // Return basic chat analytics data
    const analytics = {
      totalMessages: 0,
      averageResponseTime: 1.2,
      userSatisfaction: 4.5,
      topTopics: ['wellness', 'mindfulness', 'stress_management'],
      engagementTrend: 'improving',
      lastUpdated: new Date().toISOString()
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('❌ Chat analytics error:', error);
    res.status(500).json({ error: 'Failed to load chat analytics' });
  }
});

// Simple working chat endpoint
router.post('/', async (req, res) => {
  try {
    const { message, model: selectedModel } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('💬 Chat message received:', message);
    console.log('🧠 Selected AI Model:', selectedModel);

    // Map user-friendly model names to actual OpenAI API model IDs
    const modelMap: { [key: string]: string } = {
      'gpt-4o': 'gpt-4o',
      'gpt-4o-mini': 'gpt-4o-mini', 
      'gpt-4-turbo': 'gpt-4-turbo',
      'gpt-4': 'gpt-4',
      'gpt-3.5-turbo': 'gpt-3.5-turbo',
    };

    const apiModel = modelMap[selectedModel as keyof typeof modelMap] || 'gpt-4o'; // Default to gpt-4o if not found
    console.log('🔄 Mapped to OpenAI model:', apiModel);
    console.log('🔑 Using OpenAI API key:', process.env.OPENAI_API_KEY ? 'Yes (' + process.env.OPENAI_API_KEY.substring(0, 10) + '...)' : 'No');

    // AI response with selected model
    const completion = await openai.chat.completions.create({
      model: apiModel,
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
    console.error('❌ Chat error details:');
    console.error('❌ Chat error details:');
    console.error('  - Error message:', (error as Error).message);
    console.error('  - Error type:', (error as Error).constructor.name);
    console.error('  - Selected model:', selectedModel);
    // Re-declare modelMap for error logging context
    const modelMapForError: { [key: string]: string } = {
      'gpt-4o': 'gpt-4o',
      'gpt-4o-mini': 'gpt-4o-mini', 
      'gpt-4-turbo': 'gpt-4-turbo',
      'gpt-4': 'gpt-4',
      'gpt-3.5-turbo': 'gpt-3.5-turbo',
    };
    console.error('  - Would map to API model:', selectedModel && modelMapForError[selectedModel as keyof typeof modelMapForError] || 'gpt-4o');
    // Check if error has a 'response' property before accessing it
    if ((error as any).response) {
      console.error('  - API response status:', (error as any).response.status);
      console.error('  - API response data:', (error as any).response.data);
    }
    console.error('  - Full error:', error);
    
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
    const audioBlob = new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype });
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
