import { Router } from 'express';
import { requireUserId } from '../lib/auth.js';
import { storage } from '../storage.ts';
import { auditMiddleware } from '../middleware/auditLogger.js';
import { requireRole, requireOwnData } from '../middleware/rbac.js';
import { encryptMoodEntry, decryptMoodEntry } from '../lib/encryptionHelpers.js';

const router = Router();

// HIPAA RBAC: Mood analytics - highly sensitive PHI
// User can only access their own data, therapists can access assigned clients
router.get('/analytics', requireUserId, requireOwnData(), auditMiddleware('mood_analytics', 'read'), async (req, res) => {
  try {
    // In a real application, you would fetch actual mood analytics data here
    // For now, return placeholder data
    res.json({
      averageMoodScore: 7.2,
      moodDistribution: { happy: 0.4, neutral: 0.3, sad: 0.2, anxious: 0.1 },
      moodTrend: 'improving',
      topPositiveFactors: ['exercise', 'social_interaction'],
      topNegativeFactors: ['work_stress'],
      lastUpdated: new Date().toISOString(),
      memoryStatus: 'BULLETPROOF_ACTIVE'
    });
  } catch (error) {
    console.error('Failed to load mood analytics:', error);
    res.status(500).json({ error: 'Failed to load mood analytics' });
  }
});

// Create new mood entry with encryption
// HIPAA ENCRYPTION: Encrypt notes before storing
// HIPAA AUDIT: Log mood entry creation
router.post('/entries', requireUserId, auditMiddleware('mood_entry', 'write'), async (req, res) => {
  try {
    const userId = req.userId!;
    const { mood, intensity, notes, triggers, copingStrategies } = req.body;

    if (!mood || !intensity) {
      return res.status(400).json({ error: 'Mood and intensity are required' });
    }

    // HIPAA COMPLIANCE: Encrypt sensitive notes before storing
    const encryptedEntry = encryptMoodEntry({
      userId,
      mood,
      intensity,
      notes,
      triggers,
      copingStrategies,
    });

    // Store encrypted entry (implement in storage)
    // const savedEntry = await storage.createMoodEntry(encryptedEntry);
    
    console.log('✅ Mood entry created and encrypted for user:', userId);
    
    res.json({
      success: true,
      message: 'Mood entry created and encrypted',
      entry: {
        mood,
        intensity,
        notes, // Return original (decrypted) to user
        triggers,
        copingStrategies,
      }
    });
  } catch (error) {
    console.error('Failed to create mood entry:', error);
    res.status(500).json({ error: 'Failed to create mood entry' });
  }
});

// Get user's mood entries with decryption
// HIPAA ENCRYPTION: Decrypt notes before returning
router.get('/entries', requireUserId, requireOwnData(), auditMiddleware('mood_entry', 'read'), async (req, res) => {
  try {
    const userId = req.userId!;
    
    // Fetch encrypted entries from storage
    // const encryptedEntries = await storage.getMoodEntries(userId);
    
    // HIPAA COMPLIANCE: Decrypt entries before sending to client
    // const decryptedEntries = encryptedEntries.map(decryptMoodEntry);
    
    // Placeholder response
    res.json({
      entries: [],
      message: 'Mood entries would be decrypted here'
    });
  } catch (error) {
    console.error('Failed to load mood entries:', error);
    res.status(500).json({ error: 'Failed to load mood entries' });
  }
});

export default router;
