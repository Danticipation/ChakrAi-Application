import express from 'express';
import { storage } from '../storage-minimal.ts';

const router = express.Router();

// Get recent activities for dashboard
router.get('/recent-activities/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);

    console.log(`📈 Fetching recent activities for user ${userId}`);

    // Get recent journal entries
    const recentJournalEntries = await storage.getJournalEntries(userIdInt, 5);
    
    // Get recent messages (conversations)
    const recentMessages = await storage.getUserMessages(userIdInt, 10);
    const userMessages = recentMessages.filter(msg => msg.sender === 'user' || !msg.isBot);
    
    // Get recent mood entries
    const recentMoods = await storage.getUserMoodEntries(userIdInt, 5);

    // Format activities
    const activities = [];

    // Add journal activities
    recentJournalEntries.forEach(entry => {
      activities.push({
        id: `journal-${entry.id}`,
        type: 'journal',
        label: entry.title || 'Journal Entry',
        description: entry.title || 'Journal Entry',
        timeAgo: getTimeAgo(entry.createdAt || entry.created_at),
        timestamp: entry.createdAt || entry.created_at
      });
    });

    // Add conversation activities (group by recent sessions)
    const sessionGroups = {};
    userMessages.forEach(msg => {
      const sessionId = msg.sessionId || msg.session_id || 'default';
      if (!sessionGroups[sessionId]) {
        sessionGroups[sessionId] = {
          id: `chat-${sessionId}`,
          type: 'chat',
          label: 'AI Conversation',
          description: 'AI Conversation',
          timeAgo: getTimeAgo(msg.createdAt || msg.created_at || msg.timestamp),
          timestamp: msg.createdAt || msg.created_at || msg.timestamp
        };
      }
    });
    
    activities.push(...Object.values(sessionGroups));

    // Add mood activities
    recentMoods.forEach(mood => {
      activities.push({
        id: `mood-${mood.id}`,
        type: 'meditation',
        label: `Mood Check: ${mood.mood || 'Reflected'}`,
        description: `Mood Check: ${mood.mood || 'Reflected'}`,
        timeAgo: getTimeAgo(mood.createdAt || mood.created_at),
        timestamp: mood.createdAt || mood.created_at
      });
    });

    // Sort by timestamp (most recent first) and limit to 6 items
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, 6);

    console.log(`✅ Found ${limitedActivities.length} recent activities for user ${userId}`);
    res.json(limitedActivities);

  } catch (error) {
    console.error('❌ Error fetching recent activities:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
});

function getTimeAgo(timestamp) {
  if (!timestamp) return 'Recently';
  
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMs = now - time;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  return time.toLocaleDateString();
}

export default router;