import express from 'express';
import chatRoutes from './chat.js';
import userRoutes from './user.js';
import moodRoutes from './mood.js';
import memoryRoutes from './memory.js';
import memoryTestRoutes from './memory-test.js';
import comprehensiveAnalysisRoutes from './comprehensive-analysis.js';
import contentRoutes from './content.js';
import adminRoutes from './admin.js';
import communityRoutes from './community.js';
import analyticsRoutes from './analytics.js';
import voiceRoutes from './voice.js';
import authRoutes from './auth.ts';
import journalRoutes from './journal.js';
import meditationRoutes from './meditation.js';
import comprehensiveAnalyticsRoutes from './comprehensiveAnalytics.js';
import textToSpeechRoutes from './textToSpeech.js';
import dashboardRoutes from './dashboard.js';
import dashboardActivitiesRoutes from './dashboardActivities.js';
import personalityQuizRoutes from './personalityQuiz.js';
import ambientSoundsRoutes from './ambientSounds.js';
import adaptiveLearningRoutes from './adaptiveLearningRoutes.ts';
import medicalStudiesRoutes from './medicalStudies.ts';
import horoscopeRoutes from './horoscope.js';
import analysisTestingRoutes from './analysis-testing.js';
import analysisDemoRoutes from './analysis-demo.js';
import tieredAnalysisRoutes from './tiered-analysis.js';
import debugRoutes from './debug.js';
import profileRoutes from './profile.js';
import dashboardCleanRoutes from './dashboard-clean.js';
import adminSchemaHealthRouter from './admin-schema-health.js';

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
router.use('/memory-test', memoryTestRoutes);
router.use('/comprehensive-analysis', comprehensiveAnalysisRoutes);
router.use('/analysis-testing', analysisTestingRoutes);
router.use('/analysis-demo', analysisDemoRoutes);
router.use('/tiered-analysis', tieredAnalysisRoutes);
router.use('/debug', debugRoutes);
router.use('/user-profile-check', profileRoutes);
router.use('/clean', dashboardCleanRoutes);
router.use('/', adminSchemaHealthRouter);
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
router.use('/dashboard', dashboardActivitiesRoutes);
router.use('/personality-quiz', personalityQuizRoutes);
router.use('/ambient-sounds', ambientSoundsRoutes);
router.use('/adaptive-learning', adaptiveLearningRoutes);
router.use('/', medicalStudiesRoutes);
router.use('/', horoscopeRoutes);
router.use('/', textToSpeechRoutes);

// Legacy endpoints for backward compatibility
router.use('/', chatRoutes);
router.use('/', userRoutes);
router.use('/', moodRoutes);
router.use('/', memoryRoutes);
router.use('/', memoryTestRoutes);
router.use('/', comprehensiveAnalysisRoutes);
router.use('/', analysisTestingRoutes);
router.use('/', analysisDemoRoutes);
router.use('/', tieredAnalysisRoutes);
router.use('/', debugRoutes);
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
router.use('/', dashboardActivitiesRoutes);
router.use('/', personalityQuizRoutes);
router.use('/', ambientSoundsRoutes);
router.use('/', adaptiveLearningRoutes);
router.use('/', textToSpeechRoutes);

export default router;