import express from 'express';
import { storage } from '../storage.js';
import { userSessionManager } from '../userSession.js';

const router = express.Router();

// Get user's meditation sessions history
router.get('/sessions', async (req, res) => {
  try {
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      sessionInfo.deviceFingerprint, 
      sessionInfo.sessionId
    );
    
    const sessions = await storage.getUserMeditationSessions(anonymousUser.id);
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching meditation sessions:', error);
    res.status(500).json({ error: 'Failed to fetch meditation sessions' });
  }
});

// Create a new meditation session
router.post('/sessions', async (req, res) => {
  try {
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      sessionInfo.deviceFingerprint, 
      sessionInfo.sessionId
    );
    
    const sessionData = {
      userId: anonymousUser.id,
      ...req.body
    };
    
    const session = await storage.createMeditationSession(sessionData);
    console.log('Meditation session created:', session.id);
    res.json(session);
  } catch (error) {
    console.error('Error creating meditation session:', error);
    res.status(500).json({ error: 'Failed to create meditation session' });
  }
});

// Update meditation session (for progress tracking)
router.patch('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await storage.updateMeditationSession(parseInt(id), req.body);
    res.json(session);
  } catch (error) {
    console.error('Error updating meditation session:', error);
    res.status(500).json({ error: 'Failed to update meditation session' });
  }
});

// Get meditation templates (predefined meditations)
router.get('/templates', async (req, res) => {
  try {
    const templates = await storage.getMeditationTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Error fetching meditation templates:', error);
    res.status(500).json({ error: 'Failed to fetch meditation templates' });
  }
});

// Get user's meditation statistics
router.get('/stats', async (req, res) => {
  try {
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      sessionInfo.deviceFingerprint, 
      sessionInfo.sessionId
    );
    
    const stats = await storage.getMeditationStats(anonymousUser.id);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching meditation stats:', error);
    res.status(500).json({ error: 'Failed to fetch meditation stats' });
  }
});

export default router;