import express from 'express';
import { storage } from '../storage.js';

const router = express.Router();

// MIGRATE DATA TO SINGLE USER
router.post('/migrate-to-107', async (req, res) => {
  try {
    // Find user with most journal entries
    const users = await storage.query('SELECT user_id, COUNT(*) as count FROM journal_entries GROUP BY user_id ORDER BY count DESC LIMIT 5');
    
    if (!users.length) {
      return res.json({ message: 'No data to migrate' });
    }
    
    const sourceUserId = users[0].user_id;
    const targetUserId = 107;
    
    // Migrate all data types
    await storage.query('UPDATE journal_entries SET user_id = ? WHERE user_id = ?', [targetUserId, sourceUserId]);
    await storage.query('UPDATE mood_entries SET user_id = ? WHERE user_id = ?', [targetUserId, sourceUserId]);
    await storage.query('UPDATE messages SET user_id = ? WHERE user_id = ?', [targetUserId, sourceUserId]);
    await storage.query('UPDATE semantic_memories SET user_id = ? WHERE user_id = ?', [targetUserId, sourceUserId]);
    
    res.json({ 
      success: true, 
      message: `Migrated data from user ${sourceUserId} to user 107`,
      sourceUserId,
      targetUserId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;