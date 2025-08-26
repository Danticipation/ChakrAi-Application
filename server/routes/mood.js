import express from 'express';
import { uidStore as store } from '../storage/uidFirstStore.js';

const router = express.Router();

// Note: Authentication is handled by hipaaAuthMiddleware in main server

// Mood tracking endpoint - UID-first
router.post('/', async (req, res) => {
  try {
    const { uid } = req.ctx;
    if (!uid) return res.status(401).json({ error: 'auth_ctx_missing' });
    
    const { mood, intensity, triggers, notes } = req.body;
    
    if (!mood || intensity === undefined) {
      return res.status(400).json({ error: 'mood and intensity are required' });
    }

    console.log(`🎭 Creating mood entry for uid: ${uid}`);
    const moodEntry = await store.createMoodEntryByUid(uid, {
      mood,
      intensity: parseInt(intensity),
      triggers: triggers || [],
      notes: notes || ''
    });
    
    res.json({ 
      success: true, 
      message: `Mood "${mood}" recorded with intensity ${intensity}`,
      moodEntry
    });
  } catch (error) {
    console.error('Mood tracking error:', error);
    res.status(500).json({ error: 'Failed to track mood' });
  }
});

// Today's mood endpoint - UID-first
router.get('/today', async (req, res) => {
  try {
    const { uid } = req.ctx;
    if (!uid) return res.status(401).json({ error: 'auth_ctx_missing' });
    
    console.log(`📊 Getting today's mood for uid: ${uid}`);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const moodEntries = await store.getMoodEntriesByUid(uid, { limit: 10 });
    
    // Find mood entries from today
    const todaysMoods = moodEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt || entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });
    
    if (todaysMoods.length > 0) {
      const latestMood = todaysMoods[0];
      res.json({
        hasMoodToday: true,
        mood: latestMood.mood,
        intensity: latestMood.intensity || 5,
        notes: latestMood.notes || '',
        timestamp: latestMood.createdAt || latestMood.date
      });
    } else {
      res.json({
        hasMoodToday: false,
        message: 'No mood logged today yet'
      });
    }
  } catch (error) {
    console.error('Error fetching today\'s mood:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s mood' });
  }
});

// Get mood history - UID-first
router.get('/history', async (req, res) => {
  try {
    const { uid } = req.ctx;
    if (!uid) return res.status(401).json({ error: 'auth_ctx_missing' });
    
    const limit = parseInt(req.query.limit) || 30;
    console.log(`📈 Getting mood history for uid: ${uid}, limit: ${limit}`);
    
    const moodEntries = await store.getMoodEntriesByUid(uid, { limit });
    res.json({ moodEntries, count: moodEntries.length });
  } catch (error) {
    console.error('Error fetching mood history:', error);
    res.status(500).json({ error: 'Failed to fetch mood history' });
  }
});

// Get mood analytics - UID-first
router.get('/analytics', async (req, res) => {
  try {
    const { uid } = req.ctx;
    if (!uid) return res.status(401).json({ error: 'auth_ctx_missing' });
    
    console.log(`📊 Getting mood analytics for uid: ${uid}`);
    
    const moodEntries = await store.getMoodEntriesByUid(uid, { limit: 100 });
    
    // Calculate mood analytics
    const analytics = {
      averageIntensity: 0,
      dominantMood: '',
      moodFrequency: {},
      recentTrend: 'stable'
    };
    
    if (moodEntries.length > 0) {
      // Calculate average intensity
      analytics.averageIntensity = moodEntries.reduce((sum, entry) => sum + (entry.intensity || 5), 0) / moodEntries.length;
      
      // Calculate mood frequency
      moodEntries.forEach(entry => {
        analytics.moodFrequency[entry.mood] = (analytics.moodFrequency[entry.mood] || 0) + 1;
      });
      
      // Find dominant mood
      if (Object.keys(analytics.moodFrequency).length > 0) {
        analytics.dominantMood = Object.keys(analytics.moodFrequency).reduce((a, b) => 
          analytics.moodFrequency[a] > analytics.moodFrequency[b] ? a : b
        );
      }
      
      // Simple trend analysis (last 7 vs previous 7 entries)
      if (moodEntries.length >= 14) {
        const recent = moodEntries.slice(0, 7).reduce((sum, entry) => sum + (entry.intensity || 5), 0) / 7;
        const previous = moodEntries.slice(7, 14).reduce((sum, entry) => sum + (entry.intensity || 5), 0) / 7;
        
        if (recent > previous + 0.5) analytics.recentTrend = 'improving';
        else if (recent < previous - 0.5) analytics.recentTrend = 'declining';
      }
    }
    
    res.json(analytics);
  } catch (error) {
    console.error('Error calculating mood analytics:', error);
    res.status(500).json({ error: 'Failed to calculate mood analytics' });
  }
});

// Get mood entries for backward compatibility
router.get('/entries', async (req, res) => {
  try {
    const { uid } = req.ctx;
    if (!uid) return res.status(401).json({ error: 'auth_ctx_missing' });
    
    console.log(`📂 Getting mood entries for uid: ${uid}`);
    const entries = await store.getMoodEntriesByUid(uid, { limit: 50 });
    res.json(entries || []);
  } catch (error) {
    console.error('Failed to fetch mood entries:', error);
    res.status(500).json({ error: 'Failed to fetch mood entries' });
  }
});

export default router;
