import { Router } from 'express';
import { requireUserId } from '../lib/auth.ts';

const r = Router();

// Chat analytics (protected)
r.get('/chat/analytics', requireUserId, async (_req, res) => {
  res.json({
    totalMessages: 0,
    totalSessions: 0,
    averageResponseTime: 1.2,
    userSatisfaction: 4.5,
    topTopics: [],
    engagementTrend: 'steady',
    memoryStatus: 'OK',
    lastUpdated: new Date().toISOString(),
  });
});

// Journal analytics (protected)
r.get('/journal/analytics', requireUserId, async (_req, res) => {
  res.json({
    entries: 0,
    streakDays: 0,
    tags: [],
    lastUpdated: new Date().toISOString(),
  });
});

// Mood analytics (protected)
r.get('/mood/analytics', requireUserId, async (_req, res) => {
  res.json({
    averageMood: null,
    trend: 'flat',
    lastUpdated: new Date().toISOString(),
  });
});

// Journal entries (protected)
r.get('/journal/user-entries', requireUserId, async (_req, res) => {
  res.json({ entries: [] });
});

export default r;
