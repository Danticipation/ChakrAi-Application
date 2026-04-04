import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Ambient sounds configuration - therapeutic sound library
const therapeuticSounds = [
  {
    id: 'ocean',
    name: 'Ocean Waves',
    category: 'nature',
    moodTags: ['peaceful', 'sad', 'contemplative', 'tired'],
    description: 'Realistic ocean waves with foam and deep water sounds',
    audioUrl: '/ambient-sounds/ocean',
    recommendedFor: ['meditation', 'deep breathing', 'relaxation'],
    volume: 0.6
  },
  {
    id: 'rain',
    name: 'Forest Rain',
    category: 'nature',
    moodTags: ['calm', 'stressed', 'anxious', 'overwhelmed'],
    description: 'Layered rain sounds with gentle forest ambiance',
    audioUrl: '/ambient-sounds/rain',
    recommendedFor: ['anxiety', 'stress relief', 'sleep'],
    volume: 0.7
  },
  {
    id: 'forest',
    name: 'Forest Sounds',
    category: 'nature',
    moodTags: ['nature', 'calm', 'grounded'],
    description: 'Birds chirping and gentle forest ambiance',
    audioUrl: '/ambient-sounds/forest',
    recommendedFor: ['morning meditation', 'focus', 'grounding'],
    volume: 0.5
  },
  {
    id: 'birds',
    name: 'Morning Birds',
    category: 'nature',
    moodTags: ['energetic', 'morning', 'positive'],
    description: 'Peaceful bird songs for morning meditation',
    audioUrl: '/ambient-sounds/birds',
    recommendedFor: ['morning practice', 'energy', 'positivity'],
    volume: 0.6
  },
  {
    id: 'nature',
    name: 'Nature Mix',
    category: 'nature',
    moodTags: ['balanced', 'peaceful', 'natural'],
    description: 'Combination of natural sounds',
    audioUrl: '/ambient-sounds/nature',
    recommendedFor: ['general meditation', 'relaxation', 'balance'],
    volume: 0.5
  },
  {
    id: 'soft_music',
    name: 'Soft Music',
    category: 'music',
    moodTags: ['loving', 'compassionate', 'gentle'],
    description: 'Gentle instrumental music for loving kindness',
    audioUrl: '/ambient-sounds/soft-music',
    recommendedFor: ['loving kindness', 'self-compassion', 'heart-opening'],
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

// Test route to verify ambient sounds routing
router.get('/test', (req, res) => {
  console.log('🎵 AMBIENT SOUNDS TEST ROUTE HIT');
  res.json({ message: 'Ambient sounds route is working!', timestamp: new Date().toISOString() });
});

// Serve ambient sound files
router.get('/:soundId', async (req, res) => {
  try {
    const { soundId } = req.params;
    console.log(`🎵 MODULAR ROUTE: Serving ambient sound: ${soundId}`);
    console.log(`🔍 Full request URL: ${req.originalUrl}`);
    console.log(`🔍 Route params:`, req.params);
    
    // Map sound IDs to actual test files
    const soundFiles = {
      'ocean': 'test-ocean.wav',
      'rain': 'test-rain.wav', 
      'forest': 'test-rain.wav', // Use rain as forest substitute
      'birds': 'test-ocean.wav', // Use ocean as birds substitute
      'nature': 'test-rain.wav', // Use rain as nature substitute
      'soft-music': 'test-ocean.wav', // Use ocean instead of empty voice file
      'soft_music': 'test-ocean.wav' // Use ocean instead of empty voice file
    };
    
    const fileName = soundFiles[soundId];
    if (!fileName) {
      return res.status(404).json({ error: 'Sound not found' });
    }
    
    // Serve the audio file from project root
    const audioPath = path.join(path.dirname(__dirname), '..', fileName);
    
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    res.sendFile(audioPath, (err) => {
      if (err) {
        console.error(`Error serving audio file ${fileName}:`, err);
        res.status(404).json({ error: 'Audio file not found' });
      } else {
        console.log(`✅ Successfully served ambient sound: ${soundId}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error serving ambient sound:', error);
    res.status(500).json({ error: 'Failed to serve ambient sound' });
  }
});

export default router;