// Temporary simple mood route for testing unified UID
import express from 'express';

const router = express.Router();

// Simple mood entry test with unified UID
router.post('/', async (req, res) => {
  try {
    const uid = req.ctx?.uid;
    console.log('🎭 MOOD ROUTE - UID from unified system:', uid);
    
    if (!uid) {
      return res.status(400).json({ 
        success: false, 
        error: 'No UID found - identity middleware may not be working' 
      });
    }
    
    const { mood, intensity, notes = '' } = req.body;
    
    if (!mood || intensity === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'mood and intensity are required' 
      });
    }
    
    // For now, just return the UID to test the unified system
    res.json({
      success: true,
      message: `Mood "${mood}" recorded with intensity ${intensity}`,
      moodEntry: {
        id: Math.floor(Math.random() * 1000),
        uid: uid,
        userId: null, // Will implement proper storage later
        mood,
        intensity: parseInt(intensity),
        notes,
        triggers: [],
        copingStrategies: null,
        createdAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Mood route error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to track mood' 
    });
  }
});

export default router;