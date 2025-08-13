import express from 'express';
import chatRoutes from './chat.js';
import userRoutes from './user.js';
import moodRoutes from './mood.js';
import memoryRoutes from './memory.js';
import contentRoutes from './content.js';
import adminRoutes from './admin.js';
import communityRoutes from './community.js';
import analyticsRoutes from './analytics.js';
import voiceRoutes from './voice.js';
import authRoutes from './auth.js';
import journalRoutes from './journal.js';
import meditationRoutes from './meditation.js';
import comprehensiveAnalyticsRoutes from './comprehensiveAnalytics.js';
import textToSpeechRoutes from './textToSpeech.js';
import dashboardRoutes from './dashboard.js';

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
router.use('/voice', voiceRoutes);
router.use('/auth', authRoutes);
router.use('/journal', journalRoutes);
router.use('/meditation', meditationRoutes);
router.use('/analytics', comprehensiveAnalyticsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/', textToSpeechRoutes);

// Legacy endpoints for backward compatibility
router.use('/', chatRoutes);
router.use('/', userRoutes);
router.use('/', moodRoutes);
router.use('/', memoryRoutes);
router.use('/', contentRoutes);
router.use('/', adminRoutes);
router.use('/', communityRoutes);
router.use('/', analyticsRoutes);
router.use('/', voiceRoutes);
router.use('/', authRoutes);
router.use('/', journalRoutes);
router.use('/', meditationRoutes);
router.use('/', comprehensiveAnalyticsRoutes);
router.use('/', dashboardRoutes);
router.use('/', textToSpeechRoutes);

export default router;