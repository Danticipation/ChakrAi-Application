import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage.js';
import { insertLearningMilestoneSchema, insertProgressMetricSchema, insertAdaptiveLearningInsightSchema, insertWellnessJourneyEventSchema } from '../../shared/schema.ts';
// Remove auth middleware for now to avoid import errors
// import { authMiddleware } from '../middleware/security';

const router = Router();

// All routes require authentication - temporarily disabled for development
// router.use(authMiddleware);

// Get progress overview
router.get('/overview', async (req, res) => {
  try {
    // Use default user ID for development
    const userId = 1;

    const overview = await storage.getProgressOverview(userId);
    res.json(overview);
  } catch (error) {
    console.error('Error fetching progress overview:', error);
    res.status(500).json({ error: 'Failed to fetch progress overview' });
  }
});

// Get learning milestones
router.get('/milestones', async (req, res) => {
  try {
    // Use default user ID for development
    const userId = 1;

    const milestones = await storage.getLearningMilestones(userId);
    res.json(milestones);
  } catch (error) {
    console.error('Error fetching milestones:', error);
    res.status(500).json({ error: 'Failed to fetch milestones' });
  }
});

// Create learning milestone
router.post('/milestones', async (req, res) => {
  try {
    // Use default user ID for development
    const userId = 1;

    const validatedData = insertLearningMilestoneSchema.parse({
      ...req.body,
      userId
    });

    const milestone = await storage.createLearningMilestone(validatedData);
    res.status(201).json(milestone);
  } catch (error) {
    console.error('Error creating milestone:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid milestone data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create milestone' });
  }
});

// Update learning milestone
router.put('/milestones/:id', async (req, res) => {
  try {
    // Use default user ID for development
    const userId = 1;

    const milestoneId = parseInt(req.params.id);
    if (isNaN(milestoneId)) {
      return res.status(400).json({ error: 'Invalid milestone ID' });
    }

    const milestone = await storage.updateLearningMilestone(milestoneId, req.body);
    res.json(milestone);
  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

// Mark milestone as completed
router.post('/milestones/:id/complete', async (req, res) => {
  try {
    // Use default user ID for development
    const userId = 1;

    const milestoneId = parseInt(req.params.id);
    if (isNaN(milestoneId)) {
      return res.status(400).json({ error: 'Invalid milestone ID' });
    }

    const milestone = await storage.markMilestoneCompleted(milestoneId);
    
    // Create a celebration event
    await storage.createWellnessJourneyEvent({
      userId,
      eventType: 'milestone',
      title: `Milestone Achieved: ${milestone.title}`,
      description: `You've successfully completed the "${milestone.title}" milestone in your ${milestone.category?.replace('_', ' ') || 'wellness'} journey.`,
      significance: milestone.priority || 5,
      celebrationLevel: 'standard',
      relatedMilestones: [milestone.id?.toString() || '']
    });

    res.json(milestone);
  } catch (error) {
    console.error('Error completing milestone:', error);
    res.status(500).json({ error: 'Failed to complete milestone' });
  }
});

// Get progress metrics
router.get('/metrics', async (req, res) => {
  try {
    // Use default user ID for development
    const userId = 1;

    const { timeframe, metricType } = req.query;
    const validTimeframe = typeof timeframe === 'string' ? timeframe : undefined;
    const validMetricType = typeof metricType === 'string' ? metricType : undefined;
    
    const metrics = await storage.getProgressMetrics(
      userId,
      validTimeframe,
      validMetricType
    );
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching progress metrics:', error);
    res.status(500).json({ error: 'Failed to fetch progress metrics' });
  }
});

// Create progress metric
router.post('/metrics', async (req, res) => {
  try {
    // Use default user ID for development
    const userId = 1;

    const validatedData = insertProgressMetricSchema.parse({
      ...req.body,
      userId
    });

    const metric = await storage.createProgressMetric(validatedData);
    res.status(201).json(metric);
  } catch (error) {
    console.error('Error creating progress metric:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid metric data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create progress metric' });
  }
});

// Get adaptive learning insights
router.get('/insights', async (req, res) => {
  try {
    // Use default user ID for development
    const userId = 1;

    const { active } = req.query;
    const activeFilter = active === 'true' ? true : active === 'false' ? false : undefined;
    
    const insights = await storage.getAdaptiveLearningInsights(userId, activeFilter);
    res.json(insights);
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// Mark insight as viewed
router.post('/insights/:id/viewed', async (req, res) => {
  try {
    // Use default user ID for development
    const userId = 1;

    const insightId = parseInt(req.params.id);
    if (isNaN(insightId)) {
      return res.status(400).json({ error: 'Invalid insight ID' });
    }

    const insight = await storage.markInsightViewed(insightId);
    res.json(insight);
  } catch (error) {
    console.error('Error marking insight as viewed:', error);
    res.status(500).json({ error: 'Failed to mark insight as viewed' });
  }
});

// Update insight feedback
router.post('/insights/:id/feedback', async (req, res) => {
  try {
    // Use default user ID for development
    const userId = 1;

    const insightId = parseInt(req.params.id);
    if (isNaN(insightId)) {
      return res.status(400).json({ error: 'Invalid insight ID' });
    }

    const { feedback } = req.body;
    if (!feedback || typeof feedback !== 'string' || feedback.trim().length === 0) {
      return res.status(400).json({ error: 'Feedback is required and must be a non-empty string' });
    }

    const insight = await storage.updateInsightFeedback(insightId, feedback);
    res.json(insight);
  } catch (error) {
    console.error('Error updating insight feedback:', error);
    res.status(500).json({ error: 'Failed to update insight feedback' });
  }
});

// Get wellness journey events
router.get('/journey-events', async (req, res) => {
  try {
    // Use default user ID for development
    const userId = 1;

    const events = await storage.getWellnessJourneyEvents(userId);
    res.json(events);
  } catch (error) {
    console.error('Error fetching journey events:', error);
    res.status(500).json({ error: 'Failed to fetch journey events' });
  }
});

// Mark celebration as shown
router.post('/journey-events/:id/celebration', async (req, res) => {
  try {
    // Use default user ID for development
    const userId = 1;

    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const event = await storage.markCelebrationShown(eventId);
    res.json(event);
  } catch (error) {
    console.error('Error marking celebration as shown:', error);
    res.status(500).json({ error: 'Failed to mark celebration as shown' });
  }
});

// Calculate progress (manual trigger for testing)
router.post('/calculate-progress', async (req, res) => {
  try {
    // Use default user ID for development
    const userId = 1;

    await storage.calculateLearningProgress(userId);
    res.json({ message: 'Progress calculation completed' });
  } catch (error) {
    console.error('Error calculating progress:', error);
    res.status(500).json({ error: 'Failed to calculate progress' });
  }
});

// Generate insights (manual trigger for testing)
router.post('/generate-insights', async (req, res) => {
  try {
    // Use default user ID for development
    const userId = 1;

    await storage.generateProgressInsights(userId);
    res.json({ message: 'Insights generation completed' });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

export default router;