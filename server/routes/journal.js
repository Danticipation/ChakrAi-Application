import express from 'express';
import { storage } from '../storage.js';

const router = express.Router();

// Create journal entry endpoint - USES HIPAA AUTH CONTEXT
router.post('/', async (req, res) => {
  try {
    console.log('Creating journal entry:', req.body);
    
    // CRITICAL: Use the user ID from HIPAA auth middleware
    // This is set by hipaaAuthMiddleware in server/index.ts
    const userId = req.userId;
    
    if (!userId) {
      console.error('❌ HIPAA Auth failed - no userId found');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    console.log('🔐 Using HIPAA authenticated user:', userId);
    
    const newEntry = await storage.createJournalEntry({
      userId: userId,
      title: req.body.title || null,
      content: req.body.content,
      mood: req.body.mood,
      moodIntensity: req.body.moodIntensity || 5,
      tags: req.body.tags || [],
      isPrivate: req.body.isPrivate || false
    });
    
    console.log('✅ Created journal entry:', newEntry.id, 'for HIPAA user:', userId);
    res.json(newEntry);
  } catch (error) {
    console.error('Error creating journal entry:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get journal entries endpoint - USES HIPAA AUTH CONTEXT
router.get('/user-entries', async (req, res) => {
  try {
    console.log('📔 Fetching journal entries');
    
    // CRITICAL: Use the user ID from HIPAA auth middleware
    const userId = req.userId;
    
    if (!userId) {
      console.error('❌ HIPAA Auth failed - no userId found');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    console.log('🔐 Fetching entries for HIPAA user:', userId);
    
    const entries = await storage.getJournalEntries(userId, 50);
    console.log(`Retrieved ${entries.length} journal entries for HIPAA user ${userId}`);
    
    res.json(entries);
  } catch (error) {
    console.error('Failed to fetch journal entries:', error);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

// Analytics endpoint - USES HIPAA AUTH CONTEXT
router.get('/analytics', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'month';
    
    // CRITICAL: Use the user ID from HIPAA auth middleware
    const userId = req.userId;
    
    if (!userId) {
      console.error('❌ HIPAA Auth failed - no userId found');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const entries = await storage.getJournalEntries(userId, 1000);
    
    // Calculate recent entries based on timeframe
    const now = new Date();
    const since = new Date(now);
    if (timeframe === 'week') since.setDate(now.getDate() - 7);
    else if (timeframe === 'quarter') since.setMonth(now.getMonth() - 3);
    else since.setMonth(now.getMonth() - 1); // default month
    
    const recent = entries.filter(e => new Date(e.createdAt) >= since);
    
    res.json({
      total: entries.length,
      recent: recent.length,
      timeframe: timeframe,
    });
  } catch (error) {
    console.error('Failed to fetch journal analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch journal analytics',
      total: 0,
      recent: 0,
      timeframe: req.query.timeframe || 'month'
    });
  }
});

// Debug endpoint - USES HIPAA AUTH CONTEXT  
router.get('/debug', async (req, res) => {
  try {
    const userId = req.userId;
    const uid = req.ctx?.uid;
    
    if (!userId) {
      return res.status(401).json({ error: 'HIPAA Authentication required' });
    }
    
    const entries = await storage.getJournalEntries(userId, 10);
    
    res.json({
      message: 'Debug endpoint - HIPAA AUTH SYSTEM',
      hipaaUserId: userId,
      hipaaUid: uid,
      isAnonymous: req.isAnonymous,
      entryCount: entries.length,
      authSystemStatus: 'HIPAA_COMPLIANT',
      entries: entries.map(e => ({
        id: e.id,
        title: e.title,
        content: e.content?.substring(0, 50) + '...',
        createdAt: e.createdAt
      }))
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
