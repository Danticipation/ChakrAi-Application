import { Router } from 'express';
import { requireUserId } from '../lib/auth.js';
import { storage } from '../storage.js';
import { auditMiddleware, logAudit } from '../middleware/auditLogger.js';
import { db } from '../../db.js';
import { 
  journalEntries, 
  messages, 
  moodEntries, 
  semanticMemories,
  memoryConnections,
  memoryInsights,
  learningMilestones,
  progressMetrics,
  adaptiveLearningInsights,
  wellnessJourneyEvents,
  users
} from '../../../shared/schema.js';
import { eq, and } from 'drizzle-orm';

const router = Router();

// ============== EXPORT USER DATA ==============
// HIPAA COMPLIANCE: Users have the right to export their health data
router.get('/export', requireUserId, auditMiddleware('user_data', 'export'), async (req, res) => {
  try {
    const userId = req.userId!;
    
    console.log(`📦 Exporting all data for user ${userId}`);
    
    // Gather all user data
    const [
      user,
      journals,
      chats,
      moods,
      memories,
      insights,
      milestones,
      metrics,
      learningInsights,
      journeyEvents
    ] = await Promise.all([
      storage.getUser(userId),
      storage.getJournalEntries(userId, 1000),
      storage.getUserMessages(userId, 1000),
      storage.getMoodEntries(userId),
      storage.getUserMemories(userId),
      storage.getMemoryInsights(userId),
      storage.getLearningMilestones(userId),
      storage.getProgressMetrics(userId),
      storage.getAdaptiveLearningInsights(userId),
      storage.getWellnessJourneyEvents(userId)
    ]);
    
    // Create comprehensive export package
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user?.id,
        email: user?.email,
        name: user?.name,
        createdAt: user?.createdAt,
        subscriptionStatus: user?.subscriptionStatus
      },
      journalEntries: journals.map(entry => ({
        id: entry.id,
        title: entry.title,
        content: entry.content,
        mood: entry.mood,
        tags: entry.tags,
        createdAt: entry.createdAt
      })),
      chatHistory: chats.map(msg => ({
        id: msg.id,
        content: msg.content || msg.text,
        isBot: msg.isBot,
        timestamp: msg.timestamp
      })),
      moodEntries: moods.map(mood => ({
        id: mood.id,
        mood: mood.mood,
        intensity: mood.intensity,
        triggers: mood.triggers,
        notes: mood.notes,
        date: mood.date
      })),
      memories: memories.map(mem => ({
        id: mem.id,
        content: mem.content,
        memoryType: mem.memoryType,
        emotionalContext: mem.emotionalContext,
        createdAt: mem.createdAt
      })),
      insights: insights,
      learningProgress: {
        milestones: milestones,
        metrics: metrics,
        insights: learningInsights
      },
      wellnessJourney: journeyEvents,
      statistics: {
        totalJournalEntries: journals.length,
        totalChatMessages: chats.length,
        totalMoodEntries: moods.length,
        totalMemories: memories.length
      }
    };
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="chakrai-data-export-${userId}-${Date.now()}.json"`);
    
    console.log(`✅ Data export completed for user ${userId}`);
    res.json(exportData);
    
  } catch (error) {
    console.error('Failed to export user data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// ============== CLEAR JOURNAL ENTRIES ==============
// HIPAA AUDIT: Log deletion of all journal entries
router.delete('/clear-journals', requireUserId, auditMiddleware('journal_entry', 'delete_all'), async (req, res) => {
  try {
    const userId = req.userId!;
    
    console.log(`🗑️ Clearing all journal entries for user ${userId}`);
    
    // Delete all journal entries for this user
    await db.delete(journalEntries)
      .where(eq(journalEntries.userId, userId));
    
    // Log the mass deletion
    await logAudit(req, {
      userId,
      actorUserId: userId,
      actorType: 'user',
      action: 'delete',
      resourceType: 'journal_entries_bulk',
      resourceId: undefined,
      success: true,
      complianceFlags: ['user_initiated_deletion', 'data_privacy_request']
    });
    
    console.log(`✅ All journal entries cleared for user ${userId}`);
    res.json({ 
      success: true, 
      message: 'All journal entries have been permanently deleted' 
    });
    
  } catch (error) {
    console.error('Failed to clear journal entries:', error);
    res.status(500).json({ error: 'Failed to clear journal entries' });
  }
});

// ============== CLEAR CHAT HISTORY ==============
// HIPAA AUDIT: Log deletion of all chat messages
router.delete('/clear-chats', requireUserId, auditMiddleware('message', 'delete_all'), async (req, res) => {
  try {
    const userId = req.userId!;
    
    console.log(`🗑️ Clearing all chat history for user ${userId}`);
    
    // Delete all messages for this user
    await db.delete(messages)
      .where(eq(messages.userId, userId));
    
    // Log the mass deletion
    await logAudit(req, {
      userId,
      actorUserId: userId,
      actorType: 'user',
      action: 'delete',
      resourceType: 'messages_bulk',
      resourceId: undefined,
      success: true,
      complianceFlags: ['user_initiated_deletion', 'data_privacy_request']
    });
    
    console.log(`✅ All chat history cleared for user ${userId}`);
    res.json({ 
      success: true, 
      message: 'All chat history has been permanently deleted' 
    });
    
  } catch (error) {
    console.error('Failed to clear chat history:', error);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

// ============== FACTORY RESET (DELETE EVERYTHING) ==============
// HIPAA AUDIT: Log complete account data deletion
router.delete('/factory-reset', requireUserId, auditMiddleware('user_account', 'factory_reset'), async (req, res) => {
  try {
    const userId = req.userId!;
    
    console.log(`🚨 FACTORY RESET initiated for user ${userId}`);
    
    // Delete all user data in correct order (respecting foreign key constraints)
    await Promise.all([
      // Delete all journal entries
      db.delete(journalEntries).where(eq(journalEntries.userId, userId)),
      
      // Delete all messages
      db.delete(messages).where(eq(messages.userId, userId)),
      
      // Delete all mood entries
      db.delete(moodEntries).where(eq(moodEntries.userId, userId)),
      
      // Delete all memory-related data
      db.delete(memoryConnections).where(eq(memoryConnections.userId, userId)),
      db.delete(semanticMemories).where(eq(semanticMemories.userId, userId)),
      db.delete(memoryInsights).where(eq(memoryInsights.userId, userId)),
      
      // Delete all learning/progress data
      db.delete(learningMilestones).where(eq(learningMilestones.userId, userId)),
      db.delete(progressMetrics).where(eq(progressMetrics.userId, userId)),
      db.delete(adaptiveLearningInsights).where(eq(adaptiveLearningInsights.userId, userId)),
      db.delete(wellnessJourneyEvents).where(eq(wellnessJourneyEvents.userId, userId))
    ]);
    
    // Reset user subscription and usage data (keep account but clear data)
    await db.update(users)
      .set({
        monthlyUsage: 0,
        lastUsageReset: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    // Log the factory reset
    await logAudit(req, {
      userId,
      actorUserId: userId,
      actorType: 'user',
      action: 'delete',
      resourceType: 'user_data_complete',
      resourceId: undefined,
      success: true,
      complianceFlags: ['factory_reset', 'complete_data_deletion', 'user_initiated']
    });
    
    console.log(`✅ FACTORY RESET completed for user ${userId}`);
    res.json({ 
      success: true, 
      message: 'All data has been permanently deleted. Your account has been reset to factory settings.' 
    });
    
  } catch (error) {
    console.error('Failed to perform factory reset:', error);
    res.status(500).json({ error: 'Failed to reset account data' });
  }
});

// ============== CLEAR MOOD ENTRIES ==============
router.delete('/clear-moods', requireUserId, auditMiddleware('mood_entry', 'delete_all'), async (req, res) => {
  try {
    const userId = req.userId!;
    
    console.log(`🗑️ Clearing all mood entries for user ${userId}`);
    
    await db.delete(moodEntries)
      .where(eq(moodEntries.userId, userId));
    
    await logAudit(req, {
      userId,
      actorUserId: userId,
      actorType: 'user',
      action: 'delete',
      resourceType: 'mood_entries_bulk',
      resourceId: undefined,
      success: true,
      complianceFlags: ['user_initiated_deletion', 'data_privacy_request']
    });
    
    console.log(`✅ All mood entries cleared for user ${userId}`);
    res.json({ 
      success: true, 
      message: 'All mood entries have been permanently deleted' 
    });
    
  } catch (error) {
    console.error('Failed to clear mood entries:', error);
    res.status(500).json({ error: 'Failed to clear mood entries' });
  }
});

export default router;
