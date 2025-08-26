/**
 * AUTHENTICATION RESET ENDPOINT
 * Fixes the multiple user ID chaos
 */

import express from 'express';
import { clearAllSessions } from '../auth/unifiedAuth.js';

const router = express.Router();

// Emergency reset endpoint
router.post('/reset-auth-chaos', async (req, res) => {
  try {
    console.log('🚨 EMERGENCY: Resetting authentication chaos');
    
    // Clear all cached sessions
    clearAllSessions();
    
    res.json({
      success: true,
      message: 'Authentication cache cleared. Users will get consistent IDs now.',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
