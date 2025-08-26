import express from 'express';
import { uidStore as store } from '../storage/uidFirstStore.js';

const router = express.Router();

// Note: Authentication is handled by hipaaAuthMiddleware in main server

// Debug endpoint to check auth context
router.get('/debug-auth', (req, res) => {
  console.log('🔍 Debug auth context:');
  console.log('  req.ctx:', req.ctx);
  console.log('  req.userId:', req.userId);
  console.log('  req.user:', req.user);
  res.json({
    hasCtx: !!req.ctx,
    ctx: req.ctx,
    userId: req.userId,
    user: req.user
  });
});

// Journal entries endpoint - now uses UID
router.get('/user-entries', async (req, res) => {
  try {
    const { uid } = req.ctx;
    if (!uid) return res.status(401).json({ error: 'auth_ctx_missing' });
    
    console.log('UID-based journal entries request for:', uid);
    const rows = await store.getJournalEntriesByUid(uid);
    console.log(`Retrieved entries: ${rows?.length ?? 0}`);
    
    res.json(rows ?? []);
  } catch (error) {
    console.error('Failed to fetch journal entries:', error);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

// Create journal entry endpoint
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    
    console.log('Journal entry creation for user:', userId, req.body);
    
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
    
    // Trigger AI analysis in background
    setImmediate(async () => {
      try {
        console.log('🧠 Starting AI analysis for journal entry:', newEntry.id);
        
        const { analyzeJournalEntry } = await import('../journalAnalysis.js');
        const previousEntries = await storage.getJournalEntries(userId, 5);
        const analysis = await analyzeJournalEntry(newEntry, previousEntries);
        
        console.log('✅ Journal analysis completed:', {
          sentimentScore: analysis.sentimentScore,
          emotionalIntensity: analysis.emotionalIntensity,
          keyInsights: analysis.keyInsights.length,
          confidenceScore: analysis.confidenceScore
        });
        
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

// --- tiny helper for time windows ---
function rangeFromTimeframe(timeframe = 'month') {
  const now = new Date()
  const since = new Date(now)
  if (timeframe === 'week') since.setDate(now.getDate() - 7)
  else if (timeframe === 'quarter') since.setMonth(now.getMonth() - 3)
  else since.setMonth(now.getMonth() - 1) // default month
  return { since, now }
}

// --- analytics (UID-first, no ints) ---
router.get('/analytics', async (req, res) => {
  try {
    const { uid } = req.ctx
    const timeframe = String(req.query.timeframe || 'month')
    console.log(`Fetching journal analytics for uid ${uid}, timeframe: ${timeframe}`)
    const { since } = rangeFromTimeframe(timeframe)
    const entries = await store.getJournalEntriesByUid(uid, { limit: 1000 })
    const recent = entries.filter(e => new Date(e.createdAt) >= since)
    res.json({
      total: entries.length,
      recent: recent.length,
      timeframe,
    })
  } catch (error) {
    console.error('Failed to fetch journal analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch journal analytics',
      total: 0,
      recent: 0,
      timeframe: req.query.timeframe || 'month'
    });
  }
})

router.get('/analytics/comprehensive', async (req, res) => {
  try {
    const { uid } = req.ctx
    const timeframe = String(req.query.timeframe || 'month')
    const { since } = rangeFromTimeframe(timeframe)
    const [entries, moods] = await Promise.all([
      store.getJournalEntriesByUid(uid, { limit: 2000 }),
      store.getMoodEntriesByUid(uid, { since }),
    ])
    res.json({
      timeframe,
      journal: { total: entries.length },
      moods: { total: moods.length },
      conversations: { total: 0 }, // Not implemented yet
    })
  } catch (error) {
    console.error('Failed to fetch comprehensive analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch comprehensive analytics',
      timeframe: req.query.timeframe || 'month',
      journal: { total: 0 },
      moods: { total: 0 },
      conversations: { total: 0 }
    });
  }
})

// Delete journal entry endpoint
router.delete('/:entryId', async (req, res) => {
  try {
    const userId = req.userId;
    const entryId = parseInt(req.params.entryId);
    
    console.log(`Deleting entry ${entryId} for user ${userId}`);
    
    // Verify the entry exists and belongs to this user
    const entry = await storage.getJournalEntry(entryId);
    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    
    if (entry.userId !== userId) {
      console.error(`[SECURITY] User ${userId} attempted to delete entry ${entryId} belonging to user ${entry.userId}`);
      return res.status(403).json({ 
        error: 'Unauthorized: Cannot delete another user\'s entry'
      });
    }
    
    await storage.deleteJournalEntry(entryId);
    
    console.log(`✅ Deletion successful: entry ${entryId} for user ${userId}`);
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
    const userId = req.userId;
    
    console.log(`Updating entry ${entryId} for user ${userId}`);
    
    // Verify the entry exists and belongs to this user
    const existingEntry = await storage.getJournalEntry(entryId);
    if (!existingEntry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    
    if (existingEntry.userId !== userId) {
      console.error(`[SECURITY] User ${userId} attempted to update entry ${entryId} belonging to user ${existingEntry.userId}`);
      return res.status(403).json({ 
        error: 'Unauthorized: Cannot update another user\'s entry'
      });
    }
    
    const updatedEntry = await storage.updateJournalEntry(entryId, {
      title: req.body.title,
      content: req.body.content,
      mood: req.body.mood,
      moodIntensity: req.body.moodIntensity,
      tags: req.body.tags,
      isPrivate: req.body.isPrivate
    });
    
    console.log(`✅ Update successful: entry ${entryId} for user ${userId}`);
    res.json(updatedEntry);
  } catch (error) {
    console.error('Failed to update journal entry:', error);
    res.status(500).json({ error: 'Failed to update journal entry' });
  }
});

export default router;
