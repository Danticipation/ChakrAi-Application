// COMPREHENSIVE ANALYTICS API ROUTES - Detailed therapeutic insights and statistics
// Provides exceptionally detailed personality reflections and comprehensive data analysis

import express from 'express';
import { userSessionManager } from '../userSession.js';
import {
  generateComprehensivePersonalityProfile,
  generateComprehensiveStatistics,
  generateDetailedReflectionSummary
} from '../comprehensiveAnalytics.js';

const router = express.Router();

/**
 * GET /api/analytics/comprehensive-profile/:userId
 * Generate exceptionally detailed personality profile
 */
router.get('/comprehensive-profile/:userId?', async (req, res) => {
  try {
    // Get user ID from params or session
    let userId = parseInt(req.params.userId);
    
    if (!userId || isNaN(userId)) {
      const sessionInfo = userSessionManager.getSessionFromRequest(req);
      const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
        sessionInfo.deviceFingerprint, 
        sessionInfo.sessionId
      );
      userId = anonymousUser.id;
    }

    console.log(`🧠 Generating comprehensive personality profile for user ${userId}`);
    
    const profile = await generateComprehensivePersonalityProfile(userId);
    
    res.json({
      success: true,
      userId,
      profile,
      generatedAt: new Date().toISOString(),
      profileDepth: 'comprehensive',
      analysisType: 'detailed_personality_assessment'
    });

  } catch (error) {
    console.error('Error generating comprehensive profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate comprehensive personality profile',
      fallback: 'Personality analysis is developing - continue conversations for more detailed insights'
    });
  }
});

/**
 * GET /api/analytics/comprehensive-statistics/:userId
 * Generate comprehensive therapeutic statistics and analytics
 */
router.get('/comprehensive-statistics/:userId?', async (req, res) => {
  try {
    // Get user ID from params or session
    let userId = parseInt(req.params.userId);
    
    if (!userId || isNaN(userId)) {
      const sessionInfo = userSessionManager.getSessionFromRequest(req);
      const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
        sessionInfo.deviceFingerprint, 
        sessionInfo.sessionId
      );
      userId = anonymousUser.id;
    }

    console.log(`📊 Generating comprehensive statistics for user ${userId}`);
    
    const statistics = await generateComprehensiveStatistics(userId);
    
    res.json({
      success: true,
      userId,
      statistics,
      generatedAt: new Date().toISOString(),
      statisticsDepth: 'comprehensive',
      analysisType: 'detailed_therapeutic_analytics'
    });

  } catch (error) {
    console.error('Error generating comprehensive statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate comprehensive statistics',
      fallback: 'Statistical analysis is developing - continue therapeutic conversations for detailed metrics'
    });
  }
});

/**
 * GET /api/analytics/detailed-reflection/:userId
 * Generate detailed therapeutic reflection summary
 */
router.get('/detailed-reflection/:userId?', async (req, res) => {
  try {
    // Get user ID from params or session
    let userId = parseInt(req.params.userId);
    
    if (!userId || isNaN(userId)) {
      const sessionInfo = userSessionManager.getSessionFromRequest(req);
      const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
        sessionInfo.deviceFingerprint, 
        sessionInfo.sessionId
      );
      userId = anonymousUser.id;
    }

    console.log(`🔍 Generating detailed reflection summary for user ${userId}`);
    
    const reflection = await generateDetailedReflectionSummary(userId);
    
    res.json({
      success: true,
      userId,
      reflection,
      generatedAt: new Date().toISOString(),
      reflectionDepth: 'comprehensive',
      analysisType: 'detailed_therapeutic_reflection'
    });

  } catch (error) {
    console.error('Error generating detailed reflection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate detailed reflection summary',
      fallback: 'Therapeutic reflection is developing - continue sharing for deeper insights'
    });
  }
});

/**
 * GET /api/analytics/complete-dashboard/:userId
 * Generate complete analytics dashboard with all comprehensive data
 */
router.get('/complete-dashboard/:userId?', async (req, res) => {
  try {
    // Get user ID from params or session
    let userId = parseInt(req.params.userId);
    
    if (!userId || isNaN(userId)) {
      const sessionInfo = userSessionManager.getSessionFromRequest(req);
      const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
        sessionInfo.deviceFingerprint, 
        sessionInfo.sessionId
      );
      userId = anonymousUser.id;
    }

    console.log(`📊 Generating complete analytics dashboard for user ${userId}`);
    
    // Generate all comprehensive analytics in parallel
    const [profile, statistics, reflection] = await Promise.all([
      generateComprehensivePersonalityProfile(userId),
      generateComprehensiveStatistics(userId),
      generateDetailedReflectionSummary(userId)
    ]);
    
    res.json({
      success: true,
      userId,
      dashboard: {
        personalityProfile: profile,
        therapeuticStatistics: statistics,
        detailedReflection: reflection
      },
      generatedAt: new Date().toISOString(),
      dashboardType: 'complete_comprehensive_analytics',
      dataDepth: 'maximum_detail',
      therapeutic_value: 'high_specificity'
    });

  } catch (error) {
    console.error('Error generating complete dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate complete analytics dashboard',
      fallback: 'Comprehensive analytics are developing - continue therapeutic engagement for full insights'
    });
  }
});

/**
 * GET /api/analytics/personality-insights/:userId
 * Generate specific personality insights with therapeutic focus
 */
router.get('/personality-insights/:userId?', async (req, res) => {
  try {
    // Get user ID from params or session
    let userId = parseInt(req.params.userId);
    
    if (!userId || isNaN(userId)) {
      const sessionInfo = userSessionManager.getSessionFromRequest(req);
      const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
        sessionInfo.deviceFingerprint, 
        sessionInfo.sessionId
      );
      userId = anonymousUser.id;
    }

    const { insightType = 'all' } = req.query;
    
    console.log(`🧠 Generating personality insights (${insightType}) for user ${userId}`);
    
    const profile = await generateComprehensivePersonalityProfile(userId);
    
    // Extract specific insight categories based on request
    const insights = {
      communication: {
        style: profile.communicationStyle,
        patterns: profile.speechPatterns,
        listeningStyle: profile.listeningStyle
      },
      emotional: {
        patterns: profile.emotionalPatterns,
        regulation: profile.emotionalRegulation,
        triggers: profile.joyTriggers,
        stressResponses: profile.stressResponses
      },
      cognitive: {
        problemSolving: profile.problemSolvingStyle,
        decisionMaking: profile.decisionMakingStyle,
        learning: profile.learningStyle
      },
      identity: {
        values: profile.valueHierarchy,
        beliefs: profile.beliefSystems,
        identity: profile.identityMarkers
      },
      relationships: {
        attachment: profile.attachmentStyle,
        boundaries: profile.boundaryPatterns,
        conflict: profile.conflictStyle
      },
      unique: {
        mannerisms: profile.uniqueMannerisms,
        humor: profile.humorStyle,
        energy: profile.energyPatterns
      }
    };
    
    // Return specific insight type or all
    const responseData = insightType === 'all' ? insights : insights[insightType];
    
    res.json({
      success: true,
      userId,
      insightType,
      insights: responseData,
      generatedAt: new Date().toISOString(),
      specificityLevel: 'high_detail'
    });

  } catch (error) {
    console.error('Error generating personality insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate personality insights',
      fallback: 'Personality insights are developing through continued interaction'
    });
  }
});

export default router;