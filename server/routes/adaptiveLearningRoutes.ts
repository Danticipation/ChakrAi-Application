import { Router, type Request, type Response } from 'express';
import { safe } from '../util/safe.js';
import { z } from 'zod';
import { storage } from '../src/storage.js';
import { insertLearningMilestoneSchema, insertProgressMetricSchema, insertAdaptiveLearningInsightSchema, insertWellnessJourneyEventSchema } from '../../shared/schema.ts';
// Remove auth middleware for now to avoid import errors
// import { authMiddleware } from '../middleware/security';

const router = Router();

// All routes require authentication - temporarily disabled for development
// router.use(authMiddleware);

// Get progress overview
router.get('/overview', safe(async (req: Request, res: Response) => {
  // Use default user ID for development
  const userId = 1;

  const overview = await storage.getProgressOverview(userId);
  res.json(overview);
}));

// Get learning milestones
router.get('/milestones', safe(async (req: Request, res: Response) => {
  // Use default user ID for development
  const userId = 1;

  const milestones = await storage.getLearningMilestones(userId);
  res.json(milestones);
}));

// Create learning milestone
router.post('/milestones', safe(async (req: Request, res: Response) => {
  // Use default user ID for development
  const userId = 1;

  const validatedData = insertLearningMilestoneSchema.parse({
    ...req.body,
    userId
  });

  const milestone = await storage.createLearningMilestone(validatedData);
  res.status(201).json(milestone);
}));

// Update learning milestone
router.put('/milestones/:id', safe(async (req: Request, res: Response) => {
  // Use default user ID for development
  const userId = 1;

  const milestoneId = parseInt(req.params.id ?? '');
  if (isNaN(milestoneId)) {
    return res.status(400).json({ error: 'Invalid milestone ID' });
  }

  const milestone = await storage.updateLearningMilestone(milestoneId, req.body);
  return res.json(milestone);
}));

// Mark milestone as completed
router.post('/milestones/:id/complete', safe(async (req: Request, res: Response) => {
  // Use default user ID for development
  const userId = 1;

  const milestoneId = parseInt(req.params.id ?? '');
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

  return res.json(milestone);
}));

// Get progress metrics
router.get('/metrics', safe(async (req: Request, res: Response) => {
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
}));

// Create progress metric
router.post('/metrics', safe(async (req: Request, res: Response) => {
  // Use default user ID for development
  const userId = 1;

  const validatedData = insertProgressMetricSchema.parse({
    ...req.body,
    userId
  });

  const metric = await storage.createProgressMetric(validatedData);
  res.status(201).json(metric);
}));

// Get adaptive learning insights
router.get('/insights', safe(async (req: Request, res: Response) => {
  // Use default user ID for development
  const userId = 1;

  const { active } = req.query;
  const activeFilter = active === 'true' ? true : active === 'false' ? false : undefined;
  
  const insights = await storage.getAdaptiveLearningInsights(userId, activeFilter);
  res.json(insights);
}));

// Mark insight as viewed
router.post('/insights/:id/viewed', safe(async (req: Request, res: Response) => {
  // Use default user ID for development
  const userId = 1;

  const insightId = parseInt(req.params.id ?? '');
  if (isNaN(insightId)) {
    return res.status(400).json({ error: 'Invalid insight ID' });
  }

  const insight = await storage.markInsightViewed(insightId);
  return res.json(insight);
}));

// Update insight feedback
router.post('/insights/:id/feedback', safe(async (req: Request, res: Response) => {
  // Use default user ID for development
  const userId = 1;

  const insightId = parseInt(req.params.id ?? '');
  if (isNaN(insightId)) {
    return res.status(400).json({ error: 'Invalid insight ID' });
  }

  const { feedback } = req.body;
  if (!feedback || typeof feedback !== 'string' || feedback.trim().length === 0) {
    return res.status(400).json({ error: 'Feedback is required and must be a non-empty string' });
  }

  const insight = await storage.updateInsightFeedback(insightId, feedback);
  return res.json(insight);
}));

// Get wellness journey events
router.get('/journey-events', safe(async (req: Request, res: Response) => {
  // Use default user ID for development
  const userId = 1;

  const events = await storage.getWellnessJourneyEvents(userId);
  res.json(events);
}));

// Mark celebration as shown
router.post('/journey-events/:id/celebration', safe(async (req: Request, res: Response) => {
  // Use default user ID for development
  const userId = 1;

  const eventId = parseInt(req.params.id ?? '');
  if (isNaN(eventId)) {
    return res.status(400).json({ error: 'Invalid event ID' });
  }

  const event = await storage.markCelebrationShown(eventId);
  return res.json(event);
}));

// Calculate progress (manual trigger for testing)
router.post('/calculate-progress', safe(async (req: Request, res: Response) => {
  // Use default user ID for development
  const userId = 1;

  await storage.calculateLearningProgress(userId);
  res.json({ message: 'Progress calculation completed' });
}));

// Generate insights (manual trigger for testing)
router.post('/generate-insights', safe(async (req: Request, res: Response) => {
  // Use default user ID for development
  const userId = 1;

  await storage.generateProgressInsights(userId);
  res.json({ message: 'Insights generation completed' });
}));

export default router;
