import express from 'express';
import { storage } from '../storage.js';
import { userSessionManager } from '../userSession.js';

const router = express.Router();

// Clear all user data for fresh start
router.post('/clear-user-data', async (req, res) => {
  try {
    const { deviceFingerprint } = req.body;
    
    if (!deviceFingerprint) {
      return res.status(400).json({ error: 'Device fingerprint is required' });
    }

    // Get user ID by device fingerprint
    const user = await storage.getUserByDeviceFingerprint(deviceFingerprint);
    if (!user) {
      return res.json({ success: true, message: 'No data found for this device' });
    }

    const userId = user.id;

    // Clear all user-related data INCLUDING CHALLENGE PROGRESS - with error resilience
    const clearOperations = [
      () => storage.clearUserMessages(userId),
      () => storage.clearUserJournalEntries(userId),
      () => storage.clearUserMoodEntries(userId),
      () => storage.clearUserMemories(userId).catch(e => console.log('clearUserMemories failed:', e.message)),
      () => storage.clearUserGoals(userId),
      () => storage.clearUserAchievements(userId),
      () => storage.clearUserAnalytics(userId).catch(e => console.log('clearUserAnalytics failed:', e.message)),
      // CRITICAL: Clear challenge progress that was missing
      () => storage.clearUserChallengeProgress(userId),
      () => storage.clearUserWellnessPoints(userId),
      () => storage.clearUserStreaks(userId),
      () => storage.clearUserCommunityParticipation(userId).catch(e => console.log('clearUserCommunityParticipation failed:', e.message))
    ];
    
    await Promise.all(clearOperations.map(op => op()));

    res.json({ success: true, message: 'All user data cleared successfully' });
  } catch (error) {
    console.error('Error clearing user data:', error);
    res.status(500).json({ error: 'Failed to clear user data' });
  }
});

// Get current user info
router.get('/current', async (req, res) => {
  try {
    // Get or create anonymous user
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      sessionInfo.deviceFingerprint, 
      sessionInfo.sessionId
    );
    
    console.log(`Current user request for userId: ${anonymousUser.id}`);
    res.json({ 
      userId: anonymousUser.id,
      deviceFingerprint: sessionInfo.deviceFingerprint,
      sessionId: sessionInfo.sessionId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Failed to get current user' });
  }
});

// User profile endpoints
router.get('/profile/:userId?', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId) || 1;
    
    const profile = await storage.getUserProfile(userId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.post('/user-profile', async (req, res) => {
  try {
    const profileData = req.body;
    
    if (!profileData.userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const profile = await storage.createOrUpdateUserProfile(profileData);
    res.json({ success: true, profile });
  } catch (error) {
    console.error('Error saving user profile:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// Delete user data endpoints
router.delete('/:userId/messages', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    await storage.clearUserMessages(userId);
    res.json({ success: true, message: 'Messages cleared' });
  } catch (error) {
    console.error('Error clearing messages:', error);
    res.status(500).json({ error: 'Failed to clear messages' });
  }
});

router.delete('/:userId/journal-entries', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    await storage.clearUserJournalEntries(userId);
    res.json({ success: true, message: 'Journal entries cleared' });
  } catch (error) {
    console.error('Error clearing journal entries:', error);
    res.status(500).json({ error: 'Failed to clear journal entries' });
  }
});

router.delete('/:userId/mood-entries', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    await storage.clearUserMoodEntries(userId);
    res.json({ success: true, message: 'Mood entries cleared' });
  } catch (error) {
    console.error('Error clearing mood entries:', error);
    res.status(500).json({ error: 'Failed to clear mood entries' });
  }
});

export default router;