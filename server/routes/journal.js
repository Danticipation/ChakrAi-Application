import express from 'express';
import { storage } from '../storage.js';

const router = express.Router();

// Journal entries endpoint using device fingerprint
router.get('/user-entries', async (req, res) => {
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
    
    console.log('Journal user-entries endpoint hit for user:', anonymousUser.id);
    const entries = await storage.getJournalEntries(anonymousUser.id);
    console.log('Retrieved entries:', entries ? entries.length : 0);
    res.json(entries || []);
  } catch (error) {
    console.error('Failed to fetch journal entries:', error);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

// Create journal entry endpoint with AI analysis
router.post('/', async (req, res) => {
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
    
    const userId = anonymousUser.id;
    console.log('Create journal entry for user:', userId, req.body);
    
    // Create the journal entry
    const newEntry = await storage.createJournalEntry({
      userId,
      title: req.body.title || null,
      content: req.body.content,
      mood: req.body.mood,
      moodIntensity: req.body.moodIntensity || 5,
      tags: req.body.tags || [],
      isPrivate: req.body.isPrivate || false
    });
    console.log('Created entry:', newEntry);
    
    // Trigger AI analysis in background (don't wait for it to complete)
    setImmediate(async () => {
      try {
        console.log('🧠 Starting AI analysis for journal entry:', newEntry.id);
        
        // Import journal analysis module
        const { analyzeJournalEntry } = await import('../journalAnalysis.js');
        
        // Get previous entries for context
        const previousEntries = await storage.getJournalEntries(userId, 5);
        
        // Analyze the journal entry
        const analysis = await analyzeJournalEntry(newEntry, previousEntries);
        console.log('✅ Journal analysis completed:', {
          sentimentScore: analysis.sentimentScore,
          emotionalIntensity: analysis.emotionalIntensity,
          keyInsights: analysis.keyInsights.length,
          confidenceScore: analysis.confidenceScore
        });
        
        // Store the analysis results
        await storage.createJournalAnalytics({
          userId,
          entryId: newEntry.id,
          emotionDistribution: analysis.emotionalThemes,
          sentimentScore: analysis.sentimentScore,
          emotionalIntensity: analysis.emotionalIntensity,
          keyInsights: analysis.keyInsights,
          copingStrategies: analysis.copingStrategies,
          growthIndicators: analysis.growthIndicators,
          concernAreas: analysis.concernAreas,
          recommendedActions: analysis.recommendedActions,
          therapistNotes: analysis.therapistNotes,
          patternConnections: analysis.patternConnections,
          confidenceScore: analysis.confidenceScore,
          riskLevel: analysis.emotionalIntensity > 80 ? 'high' : analysis.emotionalIntensity > 60 ? 'medium' : 'low'
        });
        
        console.log('📊 Journal analytics stored successfully');
      } catch (analysisError) {
        console.error('❌ Journal analysis failed:', analysisError);
      }
    });
    
    res.json(newEntry);
  } catch (error) {
    console.error('Failed to create journal entry:', error);
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

// Alternative create endpoint
router.post('/create', async (req, res) => {
  try {
    console.log('Alternative journal create endpoint:', req.body);
    
    // Get user from device fingerprint instead of hardcoding
    const { UserSessionManager } = await import('../userSession.js');
    const userSessionManager = UserSessionManager.getInstance();
    
    const deviceFingerprint = req.headers['x-device-fingerprint'] || 
                              userSessionManager.generateDeviceFingerprint(req);
    const sessionId = req.headers['x-session-id'] || undefined;
    
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      (Array.isArray(deviceFingerprint) ? deviceFingerprint[0] : deviceFingerprint) || 'unknown', 
      Array.isArray(sessionId) ? sessionId[0] : sessionId
    );
    
    const entryData = {
      ...req.body,
      userId: anonymousUser.id // Use actual user ID from session
    };
    
    const newEntry = await storage.createJournalEntry(entryData);
    res.json(newEntry);
  } catch (error) {
    console.error('Failed to create journal entry via /create:', error);
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

// Journal analytics endpoint
router.get('/analytics/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { timeframe = 'month' } = req.query;
    
    console.log(`Fetching journal analytics for user ${userId}, timeframe: ${timeframe}`);
    
    // Get journal entries for the timeframe
    const entries = await storage.getJournalEntries(userId);
    if (!entries || entries.length === 0) {
      return res.json({
        totalEntries: 0,
        averageMoodIntensity: 0,
        moodTrends: [],
        commonThemes: [],
        timeframe: timeframe
      });
    }

    // Calculate basic analytics
    const totalEntries = entries.length;
    const averageMoodIntensity = entries.reduce((sum, entry) => 
      sum + (entry.moodIntensity || 5), 0) / totalEntries;

    // Get mood distribution
    const moodCounts = {};
    entries.forEach(entry => {
      if (entry.mood) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      }
    });

    // Convert to trends format
    const moodTrends = Object.entries(moodCounts).map(([mood, count]) => ({
      mood,
      count,
      percentage: Math.round((count / totalEntries) * 100)
    }));

    // Extract common themes from tags
    const allTags = entries.flatMap(entry => entry.tags || []);
    const tagCounts = {};
    allTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });

    const commonThemes = Object.entries(tagCounts)
      .map(([tag, count]) => ({ theme: tag, frequency: count }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    const analytics = {
      totalEntries,
      averageMoodIntensity: Math.round(averageMoodIntensity * 10) / 10,
      moodTrends,
      commonThemes,
      timeframe: timeframe,
      generatedAt: new Date().toISOString()
    };

    console.log('Journal analytics:', analytics);
    res.json(analytics);
  } catch (error) {
    console.error('Failed to fetch journal analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch journal analytics',
      totalEntries: 0,
      averageMoodIntensity: 0,
      moodTrends: [],
      commonThemes: []
    });
  }
});

// General journal analytics endpoint (backward compatibility)
router.get('/analytics', async (req, res) => {
  try {
    // Default to user ID 1 for backward compatibility
    const userId = 1;
    const analytics = await storage.getJournalAnalytics(userId);
    res.json(analytics || {
      totalEntries: 0,
      averageMoodIntensity: 0,
      moodTrends: [],
      commonThemes: []
    });
  } catch (error) {
    console.error('Failed to fetch general journal analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch journal analytics',
      totalEntries: 0,
      averageMoodIntensity: 0,
      moodTrends: [],
      commonThemes: []
    });
  }
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
    
    console.log('Generic journal entries endpoint hit for user:', anonymousUser.id);
    const entries = await storage.getJournalEntries(anonymousUser.id);
    console.log('Retrieved entries via generic endpoint:', entries ? entries.length : 0);
    res.json(entries || []);
  } catch (error) {
    console.error('Failed to fetch journal entries via generic endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

// Delete journal entry endpoint
router.delete('/:entryId', async (req, res) => {
  try {
    const entryId = parseInt(req.params.entryId);
    
    // Get user from device fingerprint to verify ownership
    const { UserSessionManager } = await import('../userSession.js');
    const userSessionManager = UserSessionManager.getInstance();
    
    const deviceFingerprint = req.headers['x-device-fingerprint'] || 
                              userSessionManager.generateDeviceFingerprint(req);
    const sessionId = req.headers['x-session-id'] || undefined;
    
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      (Array.isArray(deviceFingerprint) ? deviceFingerprint[0] : deviceFingerprint) || 'unknown', 
      Array.isArray(sessionId) ? sessionId[0] : sessionId
    );
    
    console.log(`Deleting journal entry ${entryId} for user ${anonymousUser.id}`);
    
    // Verify the entry exists and belongs to this user
    const entry = await storage.getJournalEntry(entryId);
    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    
    if (entry.userId !== anonymousUser.id) {
      return res.status(403).json({ error: 'Not authorized to delete this entry' });
    }
    
    // Delete the journal entry
    await storage.deleteJournalEntry(entryId);
    
    console.log(`✅ Journal entry ${entryId} deleted successfully`);
    res.json({ success: true, message: 'Journal entry deleted successfully' });
  } catch (error) {
    console.error('Failed to delete journal entry:', error);
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
});

// Update journal entry endpoint
router.put('/:entryId', async (req, res) => {
  try {
    const entryId = parseInt(req.params.entryId);
    
    // Get user from device fingerprint to verify ownership
    const { UserSessionManager } = await import('../userSession.js');
    const userSessionManager = UserSessionManager.getInstance();
    
    const deviceFingerprint = req.headers['x-device-fingerprint'] || 
                              userSessionManager.generateDeviceFingerprint(req);
    const sessionId = req.headers['x-session-id'] || undefined;
    
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      (Array.isArray(deviceFingerprint) ? deviceFingerprint[0] : deviceFingerprint) || 'unknown', 
      Array.isArray(sessionId) ? sessionId[0] : sessionId
    );
    
    console.log(`Updating journal entry ${entryId} for user ${anonymousUser.id}`);
    
    // Verify the entry exists and belongs to this user
    const existingEntry = await storage.getJournalEntry(entryId);
    if (!existingEntry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    
    if (existingEntry.userId !== anonymousUser.id) {
      return res.status(403).json({ error: 'Not authorized to update this entry' });
    }
    
    // Update the journal entry
    const updatedEntry = await storage.updateJournalEntry(entryId, {
      title: req.body.title,
      content: req.body.content,
      mood: req.body.mood,
      moodIntensity: req.body.moodIntensity,
      tags: req.body.tags,
      isPrivate: req.body.isPrivate
    });
    
    console.log(`✅ Journal entry ${entryId} updated successfully`);
    res.json(updatedEntry);
  } catch (error) {
    console.error('Failed to update journal entry:', error);
    res.status(500).json({ error: 'Failed to update journal entry' });
  }
});

export default router;