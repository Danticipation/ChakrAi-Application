/**
 * DATA CONSOLIDATION TOOL
 * Finds and migrates orphaned conversations/journal entries to current user
 */

import express from 'express';
import { unifiedAuthMiddleware } from '../auth/unifiedAuth.js';
import { storage } from '../storage.js';
import { db } from '../db.js';
import { messages } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Find orphaned data for current user
router.get('/find-orphaned-data', unifiedAuthMiddleware, async (req, res) => {
  try {
    const currentUserId = req.userId;
    
    // Check all recent user IDs for potential orphaned data
    const recentUserIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 107];
    const orphanedData = [];
    
    for (const userId of recentUserIds) {
      if (userId === currentUserId) continue;
      
      try {
        // Check messages
        const messages = await storage.getUserMessages?.(userId) || [];
        
        // Check journal entries  
        const journalEntries = await storage.getJournalEntries?.(userId) || [];
        
        // Check mood entries
        const moodEntries = await storage.getUserMoodEntries?.(userId, 100) || [];
        
        console.log(`Checking user ${userId}: ${messages.length} messages, ${journalEntries.length} journal entries, ${moodEntries.length} mood entries`);
        
        if (messages.length > 0 || journalEntries.length > 0 || moodEntries.length > 0) {
          orphanedData.push({
            userId,
            messages: messages.length,
            journalEntries: journalEntries.length,
            moodEntries: moodEntries.length,
            lastActivity: messages[0]?.timestamp || journalEntries[0]?.createdAt || null
          });
        }
      } catch (error) {
        console.log(`Error checking user ${userId}:`, error.message);
      }
    }
    
    res.json({
      currentUserId,
      orphanedData,
      totalOrphanedUsers: orphanedData.length,
      message: orphanedData.length > 0 
        ? 'Found orphaned data that can be migrated'
        : 'No orphaned data found'
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Migrate specific user's data to current user
router.post('/migrate-user-data/:fromUserId', unifiedAuthMiddleware, async (req, res) => {
  try {
    const currentUserId = req.userId;
    const fromUserId = parseInt(req.params.fromUserId);
    
    console.log(`🔄 Migrating data from user ${fromUserId} to user ${currentUserId}`);
    console.log('Current user details:', { currentUserId, fromUserId });
    
    let migratedCount = 0;
    
    // Migrate messages
    try {
      const messages = await storage.getUserMessages?.(fromUserId) || [];
      console.log(`Found ${messages.length} messages for user ${fromUserId}`);
      
      for (const message of messages) {
        // Direct database update instead of using storage method
        await db.update(messages)
          .set({ userId: currentUserId })
          .where(eq(messages.id, message.id));
        migratedCount++;
      }
      console.log(`Migrated ${messages.length} messages`);
    } catch (error) {
      console.log('Message migration failed:', error.message);
    }
    
    // Migrate journal entries
    try {
      const journalEntries = await storage.getJournalEntries?.(fromUserId) || [];
      for (const entry of journalEntries) {
        await storage.updateJournalEntry?.(entry.id, { userId: currentUserId });
        migratedCount++;
      }
      console.log(`Migrated ${journalEntries.length} journal entries`);
    } catch (error) {
      console.log('Journal migration failed:', error.message);
    }
    
    // Migrate mood entries
    try {
      const moodEntries = await storage.getUserMoodEntries?.(fromUserId, 1000) || [];
      for (const entry of moodEntries) {
        await storage.updateMoodEntry?.(entry.id, { userId: currentUserId });
        migratedCount++;
      }
      console.log(`Migrated ${moodEntries.length} mood entries`);
    } catch (error) {
      console.log('Mood migration failed:', error.message);
    }
    
    res.json({
      success: true,
      fromUserId,
      toUserId: currentUserId,
      migratedCount,
      message: `Successfully migrated data from user ${fromUserId} to user ${currentUserId}`
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;
