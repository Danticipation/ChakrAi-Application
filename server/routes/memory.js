import express from 'express';
import { getMemoryDashboard } from '../semanticMemory.js';
import { conversationContinuity } from '../conversationContinuity.js';

const router = express.Router();

// Memory dashboard endpoint
router.get('/dashboard', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId) || 1;
    
    const memoryData = await getMemoryDashboard(userId);
    res.json(memoryData);
  } catch (error) {
    console.error('Memory dashboard error:', error);
    res.status(500).json({ error: 'Failed to load memory dashboard' });
  }
});

// Conversation continuity endpoint
router.get('/conversation-continuity', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId) || 1;
    
    const continuityData = await conversationContinuity.getDashboardData(userId);
    res.json(continuityData);
  } catch (error) {
    console.error('Conversation continuity error:', error);
    res.status(500).json({ 
      error: 'Failed to load conversation continuity data',
      recentSessions: [],
      activeThreads: [],
      continuityMetrics: {
        totalSessions: 0,
        averageSessionLength: 0,
        contextPreservationRate: 0,
        crossSessionReferences: 0
      }
    });
  }
});

// Memory insights endpoint  
router.get('/insights', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId) || 1;
    
    // For now, return empty insights - this should connect to the actual memory system
    res.json([]);
  } catch (error) {
    console.error('Memory insights error:', error);
    res.status(500).json({ error: 'Failed to load memory insights' });
  }
});

// Legacy endpoints
router.get('/memory-dashboard', async (req, res) => {
  req.url = '/dashboard';
  return router.handle(req, res);
});

export default router;