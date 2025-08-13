import express from 'express';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

const router = express.Router();

// Daily affirmation endpoint
router.get('/daily-affirmation', async (req, res) => {
  try {
    const today = new Date().toDateString();
    
    console.log('🔑 Checking OpenAI API key:', process.env.OPENAI_API_KEY ? 'EXISTS' : 'MISSING');
    
    if (process.env.OPENAI_API_KEY) {
      console.log('🎯 Generating fresh daily affirmation with OpenAI...');
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{
            role: "user",
            content: "Generate a unique, thoughtful daily affirmation focused on mental wellness, self-compassion, and personal growth. Make it inspiring and meaningful - avoid generic phrases. Be specific and personal. Keep it concise but powerful."
          }],
          max_tokens: 120,
          temperature: 0.9
        });
        
        const affirmation = response.choices[0]?.message?.content?.trim() || "Today I choose to embrace my journey with compassion and openness.";
        console.log('✅ Generated affirmation:', affirmation);
        res.json({ affirmation, date: today, source: 'openai' });
      } catch (openaiError) {
        console.error('❌ OpenAI API Error:', openaiError.message);
        const fallbackAffirmation = "I trust in my ability to navigate today with wisdom and kindness toward myself.";
        res.json({ affirmation: fallbackAffirmation, date: today, source: 'openai_error' });
      }
    } else {
      const affirmations = [
        "Today I choose to embrace my journey with compassion and openness.",
        "I am worthy of love, kindness, and all the good things life has to offer.",
        "My thoughts and feelings are valid, and I honor them with gentle awareness.",
        "I have the strength to face today's challenges with grace and resilience.",
        "Each breath I take fills me with peace and centers my mind."
      ];
      
      const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
      console.log('⚠️ Using fallback affirmation (no OpenAI key):', randomAffirmation);
      res.json({ affirmation: randomAffirmation, date: today, source: 'fallback' });
    }
  } catch (error) {
    console.error('❌ Daily affirmation error:', error);
    res.json({ 
      affirmation: "Today I choose to be gentle with myself and embrace growth with patience.", 
      date: today,
      source: 'error_fallback'
    });
  }
});

// Weekly summary endpoint
router.get('/weekly-summary', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId) || 1;
    
    if (process.env.OPENAI_API_KEY) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: "Generate a supportive weekly wellness summary focusing on personal growth, mindfulness practices, and emotional awareness. Be encouraging and therapeutic in tone."
        }],
        max_tokens: 200,
        temperature: 0.7
      });
      
      const summary = response.choices[0].message.content?.trim() || "This week has been a journey of growth and self-discovery.";
      res.json({ summary, week: new Date().toISOString().slice(0, 10) });
    } else {
      const summary = "This week has been a journey of growth and self-discovery. Remember to celebrate small wins and be gentle with yourself through challenges.";
      res.json({ summary, week: new Date().toISOString().slice(0, 10) });
    }
  } catch (error) {
    console.error('Weekly summary error:', error);
    res.json({ 
      summary: "Take time this week to reflect on your progress and practice self-compassion.", 
      week: new Date().toISOString().slice(0, 10) 
    });
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
        gemini: "Communication and connection with others will bring you joy today.",
        cancer: "Trust your intuition and honor your emotional needs with gentle care.",
        leo: "Shine your light while maintaining healthy boundaries and self-compassion.",
        virgo: "Find balance between productivity and rest, honoring both aspects of wellness.",
        libra: "Seek harmony in relationships while maintaining your authentic self.",
        scorpio: "Embrace transformation with courage and trust in your inner strength.",
        sagittarius: "Explore new perspectives while staying grounded in your values.",
        capricorn: "Build upon your achievements with patience and sustainable practices.",
        aquarius: "Connect with your community while honoring your unique perspective.",
        pisces: "Trust your emotional wisdom and create space for creative expression."
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

export default router;