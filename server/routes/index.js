import express from 'express';
import chatRoutes from './chat.js';
import userRoutes from './user.js';
import moodRoutes from './mood.js';
import memoryRoutes from './memory.js';
import contentRoutes from './content.js';
import adminRoutes from './admin.js';
import communityRoutes from './community.js';
import analyticsRoutes from './analytics.js';

const router = express.Router();

// Test endpoint to verify routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Modular routes are working!', timestamp: new Date().toISOString() });
});

// Mount route modules
router.use('/chat', chatRoutes);
router.use('/user', userRoutes);
router.use('/mood', moodRoutes);
router.use('/memory', memoryRoutes);
router.use('/content', contentRoutes);
router.use('/admin', adminRoutes);
router.use('/community', communityRoutes);
router.use('/analytics', analyticsRoutes);

// Legacy endpoints for backward compatibility
router.use('/', chatRoutes);
router.use('/', userRoutes);
router.use('/', moodRoutes);
router.use('/', memoryRoutes);
router.use('/', contentRoutes);
router.use('/', adminRoutes);
router.use('/', communityRoutes);
router.use('/', analyticsRoutes);

export default router;