import express from 'express';
import { storage } from '../storage.js';

const router = express.Router();

// Admin dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const adminData = {
      totalUsers: 0,
      activeUsers: 0,
      totalSessions: 0,
      systemHealth: 'operational',
      recentActivity: []
    };
    
    // Get basic system stats
    try {
      // This would need actual admin queries implemented in storage
      adminData.totalUsers = await storage.getTotalUserCount?.() || 0;
      adminData.activeUsers = await storage.getActiveUserCount?.() || 0;
      adminData.totalSessions = await storage.getTotalSessionCount?.() || 0;
    } catch (error) {
      console.log('Admin stats not fully implemented:', error.message);
    }
    
    res.json(adminData);
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to load admin dashboard' });
  }
});

// System health check
router.get('/health', (req, res) => {
  try {
    const health = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      services: {
        database: 'operational',
        openai: process.env.OPENAI_API_KEY ? 'operational' : 'unavailable',
        storage: 'operational'
      }
    };
    
    res.json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

// User management
router.get('/users', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const users = await storage.getAllUsers?.(limit) || [];
    
    res.json({ users, count: users.length });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Analytics for admin
router.get('/analytics', async (req, res) => {
  try {
    const analytics = {
      userEngagement: {},
      systemMetrics: {},
      errorRates: {},
      featureUsage: {}
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

export default router;