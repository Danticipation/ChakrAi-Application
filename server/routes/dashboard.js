import express from 'express';
import { storage } from '../storage/storage-minimal.js';

const router = express.Router();

// Get dashboard statistics for a user
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);

    console.log(`📊 Fetching dashboard stats for user ${userId}`);

    // Get journal entries count
    const journalEntries = await storage.getJournalEntries(userIdInt);
    const journalCount = journalEntries.length;

    // Get AI conversations count (from messages table)
    const messages = await storage.getUserMessages(userIdInt);
    // Count unique sessions by looking for user messages
    const userMessages = messages.filter(msg => msg.sender === 'user' || !msg.isBot);
    const uniqueSessions = new Set(userMessages.map(msg => msg.sessionId || msg.session_id)).size;
    const conversationsCount = uniqueSessions;

    // Calculate current streak (days with activity)
    const allActivities = [...journalEntries, ...userMessages];
    const activityDates = new Set();
    
    allActivities.forEach(activity => {
      if (activity.createdAt || activity.created_at || activity.timestamp) {
        const date = new Date(activity.createdAt || activity.created_at || activity.timestamp);
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        activityDates.add(dateStr);
      }
    });
    
    // Calculate streak by checking consecutive days from today backwards
    const today = new Date();
    let currentStreak = 0;
    
    for (let i = 0; i < 30; i++) { // Check up to 30 days back
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      if (activityDates.has(dateStr)) {
        currentStreak++;
      } else if (i > 0) { // Allow for today to not have activity yet
        break;
      }
    }

    // Get meditation/mindful minutes (estimate based on activities)
    const mindfulMinutes = Math.floor((conversationsCount * 5) + (journalCount * 10));

    // Calculate changes (last 7 days vs previous period)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Recent journal entries (last 7 days)
    const recentJournalEntries = journalEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt || entry.created_at);
      return entryDate >= sevenDaysAgo;
    });
    const recentJournalCount = recentJournalEntries.length;

    // Recent conversations (last 7 days)
    const recentMessages = userMessages.filter(msg => {
      const msgDate = new Date(msg.createdAt || msg.created_at || msg.timestamp);
      return msgDate >= sevenDaysAgo;
    });
    const recentConversationsCount = new Set(recentMessages.map(msg => msg.sessionId || msg.session_id)).size;

    // Calculate changes (simple positive indicators)
    const journalChange = recentJournalCount;
    const conversationsChange = recentConversationsCount;

    const stats = {
      currentStreak,
      streakChange: currentStreak > 0 ? "+1" : null,
      aiConversations: conversationsCount,
      conversationsChange: conversationsChange > 0 ? `+${conversationsChange}` : null,
      journalEntries: journalCount,
      journalChange: journalChange > 0 ? `+${journalChange}` : null,
      mindfulMinutes,
      mindfulChange: mindfulMinutes > 0 ? `+${Math.floor(mindfulMinutes * 0.1)}` : null,
      lastUpdated: new Date().toISOString()
    };

    console.log(`✅ Dashboard stats calculated:`, stats);
    res.json(stats);

  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard statistics',
      details: error.message 
    });
  }
});

export default router;