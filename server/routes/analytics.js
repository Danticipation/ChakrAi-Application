import express from 'express';
import { storage } from '../storage.js';
import { analyzeEmotionalState } from '../emotionalAnalysis.js';

const router = express.Router();

// Stats endpoints
router.get('/stats/:userId?', (req, res) => {
  try {
    res.json({
      level: 3,
      stage: "Wellness Companion"
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

router.get('/bot-stats/:userId', (req, res) => {
  try {
    res.json({
      level: 3,
      stage: "Wellness Companion"
    });
  } catch (error) {
    console.error('Bot stats error:', error);
    res.status(500).json({ error: 'Failed to get bot stats' });
  }
});

router.get('/bot-stats', async (req, res) => {
  try {
    res.json({
      level: 3,
      stage: "Wellness Companion",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Bot stats error:', error);
    res.status(500).json({ error: 'Failed to get bot stats' });
  }
});

// Personality reflection endpoint
router.get('/personality-reflection/:userId?', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId?.toString() || '1');
    
    const journalEntries = await storage.getJournalEntries(userId).then(entries => entries.slice(0, 5)).catch(() => []);
    const messages = await storage.getUserMessages(userId, 10).catch(() => []);
    const moodEntries = await storage.getUserMoodEntries(userId, 10).catch(() => []);
    
    // Analyze emotional patterns
    const emotionalAnalysis = await analyzeEmotionalState(userId, 'reflection analysis');
    
    const reflection = {
      communicationStyle: "thoughtful and introspective",
      emotionalPatterns: emotionalAnalysis.patterns || [],
      strengths: ["self-awareness", "emotional intelligence", "growth mindset"],
      growthOpportunities: ["mindfulness practice", "stress management", "emotional regulation"],
      personalityInsights: {
        dominantTraits: ["empathetic", "analytical", "curious"],
        communicationPreference: "deep, meaningful conversations",
        emotionalProcessing: "reflective and contemplative"
      },
      wellnessRecommendations: [
        "Continue regular self-reflection practices",
        "Explore mindfulness meditation",
        "Consider journaling for emotional processing"
      ],
      dataPoints: {
        journalEntries: journalEntries.length,
        conversationMessages: messages.length,
        moodDataPoints: moodEntries.length
      }
    };
    
    res.json(reflection);
  } catch (error) {
    console.error('Personality reflection error:', error);
    res.status(500).json({ error: 'Failed to generate personality reflection' });
  }
});

// User engagement analytics
router.get('/engagement/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const days = parseInt(req.query.days) || 30;
    
    const messages = await storage.getUserMessages(userId, 100);
    const journalEntries = await storage.getJournalEntries(userId);
    const moodEntries = await storage.getUserMoodEntries(userId, 50);
    
    const analytics = {
      totalInteractions: messages.length + journalEntries.length + moodEntries.length,
      averageSessionLength: 0,
      engagementTrend: 'stable',
      preferredInteractionType: 'chat',
      activityDistribution: {
        chat: messages.length,
        journal: journalEntries.length,
        mood: moodEntries.length
      }
    };
    
    // Calculate preferred interaction type
    const maxInteractions = Math.max(analytics.activityDistribution.chat, analytics.activityDistribution.journal, analytics.activityDistribution.mood);
    if (maxInteractions === analytics.activityDistribution.journal) analytics.preferredInteractionType = 'journal';
    else if (maxInteractions === analytics.activityDistribution.mood) analytics.preferredInteractionType = 'mood';
    
    res.json(analytics);
  } catch (error) {
    console.error('Engagement analytics error:', error);
    res.status(500).json({ error: 'Failed to calculate engagement analytics' });
  }
});

export default router;