import express from 'express';
import { storage } from '../storage.js';

const router = express.Router();

// Mood tracking endpoint
router.post('/', async (req, res) => {
  try {
    const { userId, mood, intensity, triggers, notes } = req.body;
    
    if (!userId || !mood || intensity === undefined) {
      return res.status(400).json({ error: 'userId, mood, and intensity are required' });
    }

    const moodEntry = await storage.createMoodEntry({
      userId: parseInt(userId),
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

// Get mood history for a user
router.get('/history/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit) || 30;
    
    const moodEntries = await storage.getUserMoodEntries(userId, limit);
    res.json({ moodEntries, count: moodEntries.length });
  } catch (error) {
    console.error('Error fetching mood history:', error);
    res.status(500).json({ error: 'Failed to fetch mood history' });
  }
});

// Get mood analytics for a user
router.get('/analytics/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const days = parseInt(req.query.days) || 30;
    
    const moodEntries = await storage.getUserMoodEntries(userId, 100);
    
    // Calculate mood analytics
    const analytics = {
      averageIntensity: 0,
      dominantMood: '',
      moodFrequency: {},
      recentTrend: 'stable'
    };
    
    if (moodEntries.length > 0) {
      // Calculate average intensity
      analytics.averageIntensity = moodEntries.reduce((sum, entry) => sum + entry.intensity, 0) / moodEntries.length;
      
      // Calculate mood frequency
      moodEntries.forEach(entry => {
        analytics.moodFrequency[entry.mood] = (analytics.moodFrequency[entry.mood] || 0) + 1;
      });
      
      // Find dominant mood
      analytics.dominantMood = Object.keys(analytics.moodFrequency).reduce((a, b) => 
        analytics.moodFrequency[a] > analytics.moodFrequency[b] ? a : b
      );
      
      // Simple trend analysis (last 7 vs previous 7 entries)
      if (moodEntries.length >= 14) {
        const recent = moodEntries.slice(0, 7).reduce((sum, entry) => sum + entry.intensity, 0) / 7;
        const previous = moodEntries.slice(7, 14).reduce((sum, entry) => sum + entry.intensity, 0) / 7;
        
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

// Legacy endpoint
router.post('/mood', async (req, res) => {
  req.url = '/';
  return router.handle(req, res);
});

// Generic entries endpoint for backward compatibility  
router.get('/entries', async (req, res) => {
  try {
    const { UserSessionManager } = await import('../userSession.js');
    const userSessionManager = UserSessionManager.getInstance();
    
    // Get user from device fingerprint
    const deviceFingerprint = req.headers['x-device-fingerprint'] || 
                              userSessionManager.generateDeviceFingerprint(req);
    const sessionId = req.headers['x-session-id'] || undefined;
    
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      (Array.isArray(deviceFingerprint) ? deviceFingerprint[0] : deviceFingerprint) || 'unknown', 
      Array.isArray(sessionId) ? sessionId[0] : sessionId
    );
    
    console.log('Generic mood entries endpoint hit for user:', anonymousUser.id);
    const entries = await storage.getMoodEntries(anonymousUser.id);
    console.log('Retrieved mood entries via generic endpoint:', entries ? entries.length : 0);
    res.json(entries || []);
  } catch (error) {
    console.error('Failed to fetch mood entries via generic endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch mood entries' });
  }
});

export default router;