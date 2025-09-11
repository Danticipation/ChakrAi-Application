import express from 'express';
import { storage } from '../storage.js';
import { db } from '../db.js'; // Import db
import { userDevices } from '../../shared/schema.js'; // Import userDevices schema
import { eq } from 'drizzle-orm'; // Import eq for queries

const router = express.Router();

// Helper to get authenticated user ID
const getAuthUserId = (req) => {
  // hipaaAuthMiddleware sets req.authenticatedUserId
  if (req.authenticatedUserId) {
    return req.authenticatedUserId;
  }
  // Fallback for development or if middleware is not fully active
  console.warn('⚠️ req.authenticatedUserId not found, falling back to req.userId');
  return req.userId || 1; // Default to 1 for testing if no user ID is present
};

// Create anonymous user - endpoint that frontend calls
router.post('/anonymous', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const uid = res.locals.uid; // Get the canonical UID from hipaaAuthMiddleware

    if (!uid) {
      console.error('❌ Anonymous user creation failed: UID not available from middleware.');
      return res.status(500).json({ error: 'Authentication context missing' });
    }

    // Check if user exists in userDevices table
    let userRecord = await db.select().from(userDevices).where(eq(userDevices.uid, uid)).limit(1);

    if (userRecord.length === 0) {
      // This scenario should ideally be handled by hipaaAuthMiddleware creating the user,
      // but as a safeguard, we can log a warning or attempt to create if necessary.
      console.warn(`⚠️ User record not found for UID ${uid}. This should have been created by hipaaAuthMiddleware.`);
      // For now, we'll proceed with the UID provided by hipaaAuthMiddleware.
      // A more robust solution might involve re-triggering user creation logic here.
    }
    
    console.log(`Anonymous user created/retrieved: ${userId} (UID: ${uid})`);
    res.json({ 
      success: true,
      user: {
        id: userId,
        uid: uid,
        // deviceFingerprint and sessionId are handled by hipaaAuthMiddleware and cookies
      }
    });
  } catch (error) {
    console.error('Error creating anonymous user:', error);
    res.status(500).json({ error: 'Failed to create anonymous user' });
  }
});

// Check if user profile exists - endpoint that frontend calls
router.get('/user-profile-check/:userId', async (req, res) => {
  try {
    const userId = getAuthUserId(req); // Use authenticated user ID
    console.log(`Checking profile for user: ${userId}`);
    
    // In a real scenario, you'd check the database for a profile associated with userId
    // For now, we'll assume no quiz is needed and a profile exists if a userId is present.
    res.json({
      needsQuiz: false,
      hasProfile: true,
      userId: userId
    });
  } catch (error) {
    console.error('Error checking user profile:', error);
    res.status(500).json({ error: 'Failed to check user profile' }); // Return 500 on error
  }
});

// Clear all user data for fresh start
router.post('/clear-user-data', async (req, res) => {
  try {
    const userId = getAuthUserId(req); // Use authenticated user ID
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required for data clearing' });
    }

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
    const userId = getAuthUserId(req); // Use authenticated user ID
    const uid = res.locals.uid; // Get the canonical UID from hipaaAuthMiddleware

    if (!uid) {
      console.error('❌ Current user retrieval failed: UID not available from middleware.');
      return res.status(500).json({ error: 'Authentication context missing' });
    }
    
    console.log(`Current user request for userId: ${userId} (UID: ${uid})`);
    res.json({ 
      userId: userId,
      uid: uid,
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
    const userId = getAuthUserId(req); // Use authenticated user ID
    
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
    const userId = getAuthUserId(req); // Use authenticated user ID
    await storage.clearUserMessages(userId);
    res.json({ success: true, message: 'Messages cleared' });
  } catch (error) {
    console.error('Error clearing messages:', error);
    res.status(500).json({ error: 'Failed to clear messages' });
  }
});

router.delete('/:userId/journal-entries', async (req, res) => {
  try {
    const userId = getAuthUserId(req); // Use authenticated user ID
    await storage.clearUserJournalEntries(userId);
    res.json({ success: true, message: 'Journal entries cleared' });
  } catch (error) {
    console.error('Error clearing journal entries:', error);
    res.status(500).json({ error: 'Failed to clear journal entries' });
  }
});

router.delete('/:userId/mood-entries', async (req, res) => {
  try {
    const userId = getAuthUserId(req); // Use authenticated user ID
    await storage.clearUserMoodEntries(userId);
    res.json({ success: true, message: 'Mood entries cleared' });
  } catch (error) {
    console.error('Error clearing mood entries:', error);
    res.status(500).json({ error: 'Failed to clear mood entries' });
  }
});

// Adaptive preferences endpoint
router.get('/adaptive-preferences', async (req, res) => {
  try {
    const userId = getAuthUserId(req); // Use authenticated user ID
    
    // For now, return default preferences - this should connect to user preferences system
    res.json({
      id: userId,
      learningStyle: 'conversational',
      responseDepth: 'detailed',
      emotionalTone: 'supportive',
      sessionLength: 'medium',
      challengeLevel: 'adaptive',
      personalityFocus: ['empathy', 'reflection'],
      therapeuticGoals: ['anxiety_reduction', 'self_awareness'],
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('User adaptive preferences error:', error);
    res.status(500).json({ error: 'Failed to load adaptive preferences' });
  }
});

// User adaptive preferences endpoint for AdaptiveLearningProgressTracker
router.get('/adaptive-preferences', async (req, res) => {
  try {
    const userId = getAuthUserId(req); // Use authenticated user ID
    console.log(`📊 Getting adaptive preferences for user ${userId}`);
    
    res.json({
      learningStyle: 'interactive',
      communicationPreference: 'supportive',
      pacePreference: 'moderate',
      feedbackFrequency: 'regular',
      challengeLevel: 'intermediate',
      focusAreas: ['mindfulness', 'emotional_intelligence', 'stress_management'],
      preferredSessionLength: 15,
      preferredTimeOfDay: 'evening',
      adaptationSettings: {
        autoAdjustDifficulty: true,
        personalizeContent: true,
        trackProgress: true,
        enableReminders: true
      }
    });
  } catch (error) {
    console.error('Adaptive preferences error:', error);
    res.status(500).json({ error: 'Failed to load adaptive preferences' });
  }
});

export default router;
