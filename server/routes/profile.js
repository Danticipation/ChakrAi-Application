import express from 'express';
import { uidStore } from '../storage/uidFirstStore.js';
import { getDashboard } from '../services/dashboard.ts';

const router = express.Router();

// Test endpoint for UID-first operations
router.get('/me', async (req, res) => {
  try {
    const { uid } = req.ctx;
    if (!uid) return res.status(401).json({ error: 'auth_ctx_missing' });
    
    console.log(`🧪 Profile check for uid: ${uid}`);
    
    const stats = await uidStore.getDashboardStatsForUid(uid);
    
    res.json({
      uid,
      profile: {
        isAnonymous: true,
        stats,
        lastAccess: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Profile check failed:', error);
    res.status(500).json({ error: 'Profile check failed' });
  }
});

// NEW: Clean dashboard endpoint using UID system
router.get('/dashboard', async (req, res) => {
  try {
    const { uid } = req.ctx;
    if (!uid) return res.status(401).json({ error: 'auth_ctx_missing' });
    
    console.log(`📊 Clean dashboard for uid: ${uid}`);
    console.log(`🕰️ Request at: ${new Date().toISOString()}`);
    
    const timeframe = String(req.query.timeframe || 'month');
    console.log(`📅 Timeframe: ${timeframe}`);
    
    const data = await getDashboard(uid, timeframe);
    
    console.log(`✅ Dashboard data generated:`, JSON.stringify(data, null, 2));
    res.json(data);
  } catch (error) {
    console.error('❌ Dashboard failed:', error);
    res.status(500).json({ error: 'dashboard_failed' });
  }
});

// NEW: Summary of all UID-based endpoints (simplified)
router.get('/summary', async (req, res) => {
  try {
    const { uid } = req.ctx;
    if (!uid) return res.status(401).json({ error: 'auth_ctx_missing' });
    
    console.log(`📋 API summary for uid: ${uid}`);
    
    // Simple test without complex imports
    const summary = {
      uid,
      timestamp: new Date().toISOString(),
      status: 'UID system working',
      availableEndpoints: [
        'GET /api/user-profile-check/me - Profile info',
        'GET /api/user-profile-check/dashboard?timeframe=month - UID-based dashboard',
        'GET /api/user-profile-check/summary - This summary',
        'GET /api/user-entries - Journal entries (UID-based)',
        'GET /api/mood/today - Today\'s mood (UID-based)',
        'GET /api/mood/history - Mood history (UID-based)',
        'GET /api/mood/analytics - Mood analytics (UID-based)',
        'POST /api/mood - Create mood entry (UID-based)',
        'GET /api/personality-insights - Personality insights (UID-based)'
      ],
      testResults: {
        authentication: 'Working - UID available',
        routing: 'Working - Summary endpoint accessible'
      }
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Summary failed:', error);
    res.status(500).json({ error: 'Summary failed', details: error.message });
  }
});

export default router;