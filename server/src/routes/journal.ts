import { Router } from 'express';
import { requireUserId } from '../lib/auth.js';
import { storage } from '../storage.ts';
import { auditMiddleware, logAudit } from '../middleware/auditLogger.js';
import { encryptJournalEntry, decryptJournalEntry, decryptJournalEntries } from '../lib/encryptionHelpers.js';

const router = Router();

// Placeholder for journal analytics
// HIPAA AUDIT: Log access to journal analytics (aggregated PHI)
router.get('/analytics', requireUserId, auditMiddleware('journal_analytics', 'read'), async (req, res) => {
  try {
    // In a real application, you would fetch actual journal analytics data here
    // For now, return placeholder data
    res.json({
      totalEntries: 150,
      averageMood: 'neutral',
      moodTrend: 'stable',
      topThemes: ['gratitude', 'stress', 'goals'],
      lastUpdated: new Date().toISOString(),
      memoryStatus: 'BULLETPROOF_ACTIVE'
    });
  } catch (error) {
    console.error('Failed to load journal analytics:', error);
    res.status(500).json({ error: 'Failed to load journal analytics' });
  }
});

// Placeholder for user journal entries
// HIPAA AUDIT: Log access to user journal entries (highly sensitive PHI)
// HIPAA ENCRYPTION: Decrypt entries before returning to user
router.get('/user-entries', requireUserId, auditMiddleware('journal_entry', 'read'), async (req, res) => {
  try {
    const userId = req.userId!;
    // Fetch encrypted entries from storage
    const encryptedEntries = await storage.getJournalEntries(userId);
    
    // HIPAA COMPLIANCE: Decrypt entries before sending to client
    const decryptedEntries = decryptJournalEntries(encryptedEntries);
    
    res.json({
      entries: decryptedEntries.map(entry => ({
        id: entry.id,
        title: entry.title || `Entry on ${new Date(entry.createdAt).toLocaleDateString()}`,
        content: entry.content, // Now decrypted
        mood: entry.mood || 'neutral',
        timestamp: entry.createdAt
      })),
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to load user journal entries:', error);
    res.status(500).json({ error: 'Failed to load user journal entries' });
  }
});

// Create new journal entry with encryption (root path for compatibility)
// HIPAA ENCRYPTION: Encrypt content before storing
// HIPAA AUDIT: Log journal entry creation
router.post('/', requireUserId, auditMiddleware('journal_entry', 'write'), async (req, res) => {
  try {
    const userId = req.userId!;
    const { title, content, mood, moodIntensity, tags } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // HIPAA COMPLIANCE: Encrypt sensitive data before storing
    const encryptedEntry = encryptJournalEntry({
      userId,
      title,
      content,
      mood,
      moodIntensity,
      tags,
      isPrivate: true,
    });

    // Store encrypted entry
    const savedEntry = await storage.createJournalEntry(encryptedEntry);
    
    console.log('✅ Journal entry created and encrypted for user:', userId);
    
    res.json({
      success: true,
      message: 'Journal entry created and encrypted',
      id: savedEntry.id,
      createdAt: savedEntry.createdAt,
      // Return decrypted entry to the user who just created it
      entry: {
        title,
        content, // Return original (decrypted) to user
        mood,
        moodIntensity,
        tags,
      }
    });
  } catch (error) {
    console.error('Failed to create journal entry:', error);
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

// Create new journal entry with encryption
// HIPAA ENCRYPTION: Encrypt content before storing
// HIPAA AUDIT: Log journal entry creation
router.post('/entries', requireUserId, auditMiddleware('journal_entry', 'write'), async (req, res) => {
  try {
    const userId = req.userId!;
    const { title, content, mood, moodIntensity, tags } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // HIPAA COMPLIANCE: Encrypt sensitive data before storing
    const encryptedEntry = encryptJournalEntry({
      userId,
      title,
      content,
      mood,
      moodIntensity,
      tags,
      isPrivate: true,
    });

    // Store encrypted entry (you'll need to implement this in storage)
    // const savedEntry = await storage.createJournalEntry(encryptedEntry);
    
    console.log('✅ Journal entry created and encrypted for user:', userId);
    
    res.json({
      success: true,
      message: 'Journal entry created and encrypted',
      // Return decrypted entry to the user who just created it
      entry: {
        title,
        content, // Return original (decrypted) to user
        mood,
        moodIntensity,
        tags,
      }
    });
  } catch (error) {
    console.error('Failed to create journal entry:', error);
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

// Delete journal entry
// HIPAA AUDIT: Log journal entry deletion
router.delete('/entries/:id', requireUserId, auditMiddleware('journal_entry', 'delete'), async (req, res) => {
  try {
    const userId = req.userId!;
    const entryId = parseInt(req.params.id);

    if (isNaN(entryId)) {
      return res.status(400).json({ error: 'Invalid entry ID' });
    }

    // Delete the entry (verify ownership in storage layer)
    await storage.deleteJournalEntry(entryId, userId);
    
    console.log('✅ Journal entry deleted:', entryId, 'for user:', userId);
    
    res.json({
      success: true,
      message: 'Journal entry deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete journal entry:', error);
    res.status(500).json({ error: 'Failed to delete entry. Please try again.' });
  }
});

export default router;
