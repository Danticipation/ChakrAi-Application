import express from 'express';
import OpenAI from 'openai';

const router = express.Router();

// Get detailed horoscope for a specific zodiac sign
router.get('/horoscope/:sign', async (req, res) => {
  try {
    const { sign } = req.params;
    const validSigns = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
    
    if (!validSigns.includes(sign.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid zodiac sign' });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional astrologer with deep knowledge of zodiac signs, planetary movements, and cosmic influences. Create detailed, personalized daily horoscopes that are insightful, encouraging, and specific to each sign's characteristics. Include guidance on love, career, health, and personal growth. Make each horoscope 3-4 paragraphs long and genuinely helpful."
        },
        {
          role: "user",
          content: `Create a detailed daily horoscope for ${sign.charAt(0).toUpperCase() + sign.slice(1)} for ${new Date().toLocaleDateString()}. Include specific guidance for:
          
          1. Overall energy and mood for the day
          2. Love and relationships 
          3. Career and finances
          4. Health and wellness
          5. Personal growth opportunities
          
          Make it personal, insightful, and encouraging while staying true to ${sign}'s characteristics. Include specific planetary influences if relevant.`
        }
      ],
      temperature: 0.8,
      max_tokens: 500
    });

    const horoscope = response.choices[0]?.message?.content || generateFallbackHoroscope(sign);

    res.json({
      sign: sign.charAt(0).toUpperCase() + sign.slice(1),
      horoscope,
      date: new Date().toLocaleDateString(),
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating horoscope:', error);
    
    // Fallback horoscope
    const fallbackHoroscope = generateFallbackHoroscope(req.params.sign);
    res.json({
      sign: req.params.sign.charAt(0).toUpperCase() + req.params.sign.slice(1),
      horoscope: fallbackHoroscope,
      date: new Date().toLocaleDateString(),
      generated_at: new Date().toISOString()
    });
  }
});

function generateFallbackHoroscope(sign) {
  const signTraits = {
    aries: "Your natural leadership and pioneering spirit are highlighted today. Mars energizes your ambitions, making this an excellent time to start new projects. In relationships, your passionate nature draws others to you. Focus on channeling your energy constructively and avoid impulsive decisions. Your health benefits from physical activity - consider a challenging workout to balance your fiery energy.",
    
    taurus: "Venus blesses you with harmony and stability today. Your practical nature serves you well in financial matters - trust your instincts about investments or purchases. In love, your loyal and sensual nature creates deep connections. Take time to enjoy life's pleasures, but maintain your disciplined approach to goals. Your steady energy attracts abundance.",
    
    gemini: "Mercury enhances your communication skills and intellectual curiosity today. Your adaptable nature helps you navigate changing circumstances with ease. Networking and learning new skills are favored. In relationships, your wit and charm open new doors. Stay focused on one task at a time to maximize your versatile energy. Mental stimulation feeds your soul.",
    
    cancer: "The Moon illuminates your intuitive powers and emotional depth today. Your nurturing nature brings comfort to those around you. Family and home matters take priority, bringing satisfaction and security. In love, your empathetic heart creates meaningful bonds. Trust your instincts in all decisions. Self-care and emotional wellness are essential now.",
    
    leo: "The Sun radiates through your confident and creative spirit today. Your natural charisma and leadership abilities shine brightly, attracting recognition and opportunities. In relationships, your generous heart and playful nature bring joy to others. Express your creativity boldly - the universe supports your artistic endeavors. Your vitality and enthusiasm inspire everyone around you.",
    
    virgo: "Your analytical mind and attention to detail serve you exceptionally well today. Mercury supports your practical approach to problem-solving and organization. In career matters, your reliability and perfectionism lead to success. Health and wellness routines bring particular satisfaction. Your helpful nature strengthens relationships and builds trust with others.",
    
    libra: "Venus brings beauty, balance, and harmony to your day. Your diplomatic nature helps resolve conflicts and create peaceful solutions. Relationships flourish under your charming and fair-minded approach. Aesthetic pursuits and social activities bring joy and fulfillment. Seek balance in all areas of life - your natural sense of justice guides you toward the right choices.",
    
    scorpio: "Pluto intensifies your transformative power and deep intuition today. Your passionate and determined nature helps you uncover hidden truths and opportunities. In relationships, your magnetic presence and emotional depth create profound connections. Trust your instincts about people and situations. This is a powerful time for personal transformation and healing.",
    
    sagittarius: "Jupiter expands your horizons and adventurous spirit today. Your optimistic nature and love of learning open new possibilities for growth. Travel, education, or philosophical discussions bring inspiration and joy. In relationships, your honest and enthusiastic approach attracts like-minded souls. Your freedom-loving nature requires space to explore and discover.",
    
    capricorn: "Saturn rewards your disciplined approach and long-term planning today. Your ambitious nature and practical wisdom lead to steady progress toward your goals. In career matters, your reliability and leadership skills gain recognition. Structure and tradition provide comfort and stability. Your patient persistence pays off in meaningful ways.",
    
    aquarius: "Uranus awakens your innovative spirit and humanitarian ideals today. Your unique perspective and progressive thinking inspire others and create positive change. Friendships and group activities bring fulfillment and new opportunities. In relationships, your independent nature requires understanding and freedom. Your visionary ideas have the power to transform the world around you.",
    
    pisces: "Neptune enhances your intuitive gifts and compassionate nature today. Your empathetic heart and artistic soul bring healing and beauty to the world. Dreams and meditation provide important insights and guidance. In relationships, your romantic and understanding nature creates deep emotional bonds. Trust your psychic abilities and creative inspirations - they guide you toward your highest path."
  };

  return signTraits[sign.toLowerCase()] || "Today brings opportunities for growth, healing, and positive change in your life. Trust your instincts and embrace the cosmic energy surrounding you.";
}

export default router;