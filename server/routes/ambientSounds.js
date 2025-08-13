import express from 'express';

const router = express.Router();

// Ambient sounds configuration - therapeutic sound library
const therapeuticSounds = [
  {
    id: 'rain-forest',
    name: 'Forest Rain',
    category: 'nature',
    moodTags: ['calm', 'stressed', 'anxious', 'overwhelmed'],
    description: 'Layered rain sounds with gentle forest ambiance',
    audioUrl: '/api/ambient-audio/rain-forest',
    recommendedFor: ['anxiety', 'stress relief', 'sleep'],
    volume: 0.7
  },
  {
    id: 'ocean-waves',
    name: 'Ocean Waves',
    category: 'nature',
    moodTags: ['peaceful', 'sad', 'contemplative', 'tired'],
    description: 'Realistic ocean waves with foam and deep water sounds',
    audioUrl: '/api/ambient-audio/ocean-waves',
    recommendedFor: ['meditation', 'deep breathing', 'relaxation'],
    volume: 0.6
  },
  {
    id: 'white-noise',
    name: 'Pure White Noise',
    category: 'white-noise',
    moodTags: ['distracted', 'noisy-environment', 'sleep-issues'],
    description: 'Clean white noise for masking distractions',
    audioUrl: '/api/ambient-audio/white-noise',
    recommendedFor: ['sleep', 'concentration', 'noise masking'],
    volume: 0.4
  }
];

// Get available ambient sounds
router.get('/available', async (req, res) => {
  try {
    console.log('🎵 Fetching therapeutic ambient sounds');
    res.json(therapeuticSounds);
  } catch (error) {
    console.error('❌ Error fetching ambient sounds:', error);
    res.status(500).json({ error: 'Failed to fetch ambient sounds' });
  }
});

export default router;