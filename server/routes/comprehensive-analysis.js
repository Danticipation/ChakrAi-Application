import express from 'express';
import { comprehensiveAnalyzer } from '../memory/ComprehensivePersonalityAnalyzer.js';
import { userSessionManager } from '../userSession.js';

const router = express.Router();

// 🧠 COMPREHENSIVE 190-POINT PERSONALITY ANALYSIS ENDPOINTS

/**
 * Get complete 190-point personality analysis
 * This is the main endpoint for comprehensive psychological assessment
 */
router.get('/comprehensive-analysis/:userId?', async (req, res) => {
  try {
    // Get or create anonymous user
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      sessionInfo.deviceFingerprint, 
      sessionInfo.sessionId
    );
    const userId = anonymousUser.id;

    console.log(`🧠 Generating comprehensive 190-point analysis for user ${userId}`);

    // Generate the complete analysis
    const analysis = await comprehensiveAnalyzer.generateComprehensiveAnalysis(userId);

    console.log(`✅ 190-point analysis complete: ${analysis.dataPoints.totalInsights} insights generated`);

    res.json({
      success: true,
      analysis,
      metadata: {
        analysisType: '190-point-comprehensive',
        generatedAt: new Date().toISOString(),
        userId: userId,
        dataQuality: analysis.dataPoints.analysisConfidence,
        insightCount: analysis.dataPoints.totalInsights
      }
    });

  } catch (error) {
    console.error('🚨 Comprehensive analysis failed:', error);
    res.status(500).json({
      error: 'Failed to generate comprehensive analysis',
      details: error.message
    });
  }
});

/**
 * Get analysis for specific psychological domain
 */
router.get('/domain-analysis/:domain/:userId?', async (req, res) => {
  try {
    const domain = req.params.domain;
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      sessionInfo.deviceFingerprint, 
      sessionInfo.sessionId
    );
    const userId = anonymousUser.id;

    console.log(`🔍 Generating ${domain} domain analysis for user ${userId}`);

    // Valid domains
    const validDomains = ['cognitive', 'emotional', 'communication', 'behavioral', 'interpersonal', 'personality', 'values', 'motivational', 'coping'];
    
    if (!validDomains.includes(domain)) {
      return res.status(400).json({
        error: 'Invalid domain',
        validDomains: validDomains
      });
    }

    // Generate full analysis and extract domain
    const fullAnalysis = await comprehensiveAnalyzer.generateComprehensiveAnalysis(userId);
    const domainAnalysis = fullAnalysis.detailedDomainAnalysis[domain];

    res.json({
      success: true,
      domain: domain,
      analysis: domainAnalysis,
      relatedRecommendations: fullAnalysis.actionableRecommendations,
      therapeuticInsights: fullAnalysis.therapeuticInsights,
      metadata: {
        domain: domain,
        generatedAt: new Date().toISOString(),
        userId: userId,
        dimensionCount: Object.keys(domainAnalysis.specificTraits || {}).length
      }
    });

  } catch (error) {
    console.error('🚨 Domain analysis failed:', error);
    res.status(500).json({
      error: 'Failed to generate domain analysis',
      details: error.message
    });
  }
});

/**
 * Get therapeutic recommendations based on comprehensive analysis
 */
router.get('/therapeutic-recommendations/:userId?', async (req, res) => {
  try {
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      sessionInfo.deviceFingerprint, 
      sessionInfo.sessionId
    );
    const userId = anonymousUser.id;

    console.log(`🎯 Generating therapeutic recommendations for user ${userId}`);

    const analysis = await comprehensiveAnalyzer.generateComprehensiveAnalysis(userId);

    const recommendations = {
      immediate: analysis.actionableRecommendations.immediateSteps,
      shortTerm: analysis.actionableRecommendations.shortTermGoals,
      longTerm: analysis.actionableRecommendations.longTermDevelopment,
      therapeutic: {
        priorities: analysis.actionableRecommendations.therapeuticPriorities,
        approaches: analysis.therapeuticInsights.recommendedApproaches,
        alliance: analysis.therapeuticInsights.therapeuticAlliance,
        predictors: analysis.therapeuticInsights.progressPredictors
      },
      wellness: analysis.actionableRecommendations.wellnessStrategies,
      personalizedInsights: {
        strengths: analysis.overallProfile.strengthsOverview,
        challenges: analysis.overallProfile.challengesOverview,
        uniqueTraits: analysis.overallProfile.uniqueCharacteristics
      }
    };

    res.json({
      success: true,
      recommendations,
      confidence: analysis.dataPoints.analysisConfidence,
      metadata: {
        basedOnAnalysis: '190-point-comprehensive',
        generatedAt: new Date().toISOString(),
        userId: userId,
        dataRichness: analysis.dataPoints.dataRichness
      }
    });

  } catch (error) {
    console.error('🚨 Therapeutic recommendations failed:', error);
    res.status(500).json({
      error: 'Failed to generate therapeutic recommendations',
      details: error.message
    });
  }
});

/**
 * Get personality type assessment
 */
router.get('/personality-type/:userId?', async (req, res) => {
  try {
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      sessionInfo.deviceFingerprint, 
      sessionInfo.sessionId
    );
    const userId = anonymousUser.id;

    console.log(`🎭 Generating personality type assessment for user ${userId}`);

    const analysis = await comprehensiveAnalyzer.generateComprehensiveAnalysis(userId);

    const personalityType = {
      type: analysis.overallProfile.personalityType,
      dominantTraits: analysis.overallProfile.dominantTraits,
      communicationStyle: analysis.overallProfile.communicationStyle,
      emotionalProfile: analysis.overallProfile.emotionalProfile,
      behavioralSignature: analysis.overallProfile.behavioralSignature,
      detailedTraits: {
        cognitive: analysis.detailedDomainAnalysis.cognitive?.specificTraits || {},
        emotional: analysis.detailedDomainAnalysis.emotional?.specificTraits || {},
        personality: analysis.detailedDomainAnalysis.personality?.specificTraits || {},
        interpersonal: analysis.detailedDomainAnalysis.interpersonal?.specificTraits || {}
      },
      therapeuticImplications: {
        alliance: analysis.therapeuticInsights.therapeuticAlliance,
        approaches: analysis.therapeuticInsights.recommendedApproaches,
        trajectory: analysis.therapeuticInsights.growthTrajectory
      }
    };

    res.json({
      success: true,
      personalityType,
      confidence: analysis.dataPoints.analysisConfidence,
      metadata: {
        analysisType: 'comprehensive-personality-type',
        generatedAt: new Date().toISOString(),
        userId: userId,
        basedOnDimensions: 190
      }
    });

  } catch (error) {
    console.error('🚨 Personality type assessment failed:', error);
    res.status(500).json({
      error: 'Failed to generate personality type assessment',
      details: error.message
    });
  }
});

/**
 * Get analysis summary for dashboard display
 */
router.get('/analysis-summary/:userId?', async (req, res) => {
  try {
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      sessionInfo.deviceFingerprint, 
      sessionInfo.sessionId
    );
    const userId = anonymousUser.id;

    console.log(`📊 Generating analysis summary for user ${userId}`);

    const analysis = await comprehensiveAnalyzer.generateComprehensiveAnalysis(userId);

    // Create summary scores for each domain
    const domainSummary = Object.entries(analysis.detailedDomainAnalysis).map(([domain, data]) => ({
      domain: domain,
      score: data.domainScore || 5.5,
      keyFinding: data.keyFindings?.[0] || `${domain} analysis in progress`,
      strengthsCount: data.keyFindings?.length || 0,
      dimensionsAnalyzed: Object.keys(data.specificTraits || {}).length
    }));

    const summary = {
      overview: {
        personalityType: analysis.overallProfile.personalityType,
        overallWellness: Math.round(domainSummary.reduce((sum, d) => sum + d.score, 0) / domainSummary.length * 10),
        analysisConfidence: analysis.dataPoints.analysisConfidence,
        dataRichness: analysis.dataPoints.dataRichness,
        totalInsights: analysis.dataPoints.totalInsights
      },
      domainScores: domainSummary,
      keyStrengths: analysis.overallProfile.strengthsOverview.slice(0, 5),
      primaryRecommendations: analysis.actionableRecommendations.immediateSteps.slice(0, 3),
      therapeuticFocus: analysis.therapeuticInsights.recommendedApproaches.slice(0, 3),
      progressIndicators: {
        engagement: analysis.dataPoints.dataRichness,
        alliance: analysis.therapeuticInsights.therapeuticAlliance,
        trajectory: analysis.therapeuticInsights.growthTrajectory
      }
    };

    res.json({
      success: true,
      summary,
      metadata: {
        summaryType: '190-point-comprehensive-summary',
        generatedAt: new Date().toISOString(),
        userId: userId,
        domainsAnalyzed: domainSummary.length
      }
    });

  } catch (error) {
    console.error('🚨 Analysis summary failed:', error);
    res.status(500).json({
      error: 'Failed to generate analysis summary',
      details: error.message
    });
  }
});

/**
 * Get specific insights for individual psychological dimensions
 */
router.get('/dimension-insights/:dimension/:userId?', async (req, res) => {
  try {
    const dimension = req.params.dimension;
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      sessionInfo.deviceFingerprint, 
      sessionInfo.sessionId
    );
    const userId = anonymousUser.id;

    console.log(`🔬 Generating insights for dimension ${dimension} for user ${userId}`);

    const analysis = await comprehensiveAnalyzer.generateComprehensiveAnalysis(userId);

    // Find which domain contains this dimension
    let foundDomain = null;
    let dimensionScore = null;

    Object.entries(analysis.detailedDomainAnalysis).forEach(([domain, data]) => {
      if (data.specificTraits && data.specificTraits[dimension]) {
        foundDomain = domain;
        dimensionScore = data.specificTraits[dimension];
      }
    });

    if (!foundDomain) {
      return res.status(404).json({
        error: 'Dimension not found',
        availableDimensions: Object.values(analysis.detailedDomainAnalysis)
          .flatMap((domain) => Object.keys(domain.specificTraits || {}))
      });
    }

    const insights = {
      dimension: dimension,
      score: dimensionScore,
      domain: foundDomain,
      interpretation: this.interpretDimensionScore(dimension, dimensionScore),
      relatedFindings: analysis.detailedDomainAnalysis[foundDomain].keyFindings,
      therapeuticImplications: this.getTherapeuticImplications(dimension, dimensionScore),
      developmentSuggestions: this.getDevelopmentSuggestions(dimension, dimensionScore)
    };

    res.json({
      success: true,
      insights,
      metadata: {
        dimension: dimension,
        domain: foundDomain,
        generatedAt: new Date().toISOString(),
        userId: userId
      }
    });

  } catch (error) {
    console.error('🚨 Dimension insights failed:', error);
    res.status(500).json({
      error: 'Failed to generate dimension insights',
      details: error.message
    });
  }
});

// Helper methods for dimension insights
function interpretDimensionScore(dimension, score) {
  if (score >= 8.5) return `Exceptionally strong in ${dimension.replace(/_/g, ' ')} - this is a significant personal strength`;
  if (score >= 7.5) return `Strong capability in ${dimension.replace(/_/g, ' ')} - above average performance`;
  if (score >= 6.5) return `Moderate strength in ${dimension.replace(/_/g, ' ')} - room for growth`;
  if (score >= 5.5) return `Developing ${dimension.replace(/_/g, ' ')} - foundational level`;
  return `${dimension.replace(/_/g, ' ')} represents a growth opportunity - focus area for development`;
}

function getTherapeuticImplications(dimension, score) {
  const implications = [];
  
  if (score >= 8) {
    implications.push(`High ${dimension.replace(/_/g, ' ')} can be leveraged as a therapeutic strength`);
    implications.push(`Use ${dimension.replace(/_/g, ' ')} as foundation for building other skills`);
  } else if (score < 6) {
    implications.push(`${dimension.replace(/_/g, ' ')} requires focused therapeutic attention`);
    implications.push(`Develop ${dimension.replace(/_/g, ' ')} through targeted interventions`);
  } else {
    implications.push(`${dimension.replace(/_/g, ' ')} shows potential for continued development`);
  }
  
  return implications;
}

function getDevelopmentSuggestions(dimension, score) {
  const suggestions = [];
  
  if (dimension.includes('emotional')) {
    suggestions.push('Practice mindfulness and emotional awareness exercises');
    suggestions.push('Keep an emotional journal to track patterns');
  } else if (dimension.includes('cognitive')) {
    suggestions.push('Engage in mental challenges and problem-solving activities');
    suggestions.push('Practice metacognitive reflection on thinking processes');
  } else if (dimension.includes('social') || dimension.includes('interpersonal')) {
    suggestions.push('Practice social skills in low-pressure environments');
    suggestions.push('Seek feedback on interpersonal interactions');
  } else {
    suggestions.push(`Practice activities that specifically develop ${dimension.replace(/_/g, ' ')}`);
    suggestions.push('Work with a therapist to create targeted development plan');
  }
  
  return suggestions;
}

/**
 * System status endpoint for monitoring the comprehensive analysis system
 */
router.get('/system-status', async (req, res) => {
  try {
    const status = {
      systemStatus: 'ACTIVE',
      analysisFramework: '190-point-comprehensive',
      availableDomains: [
        'cognitive (25 dimensions)',
        'emotional (30 dimensions)', 
        'communication (25 dimensions)',
        'behavioral (20 dimensions)',
        'interpersonal (25 dimensions)',
        'personality (20 dimensions)',
        'values (15 dimensions)',
        'motivational (15 dimensions)',
        'coping (15 dimensions)'
      ],
      totalDimensions: 190,
      capabilities: [
        'Comprehensive personality analysis',
        'Domain-specific assessments',
        'Therapeutic recommendations',
        'Personality type identification',
        'Individual dimension insights',
        'Progress tracking',
        'Clinical-grade assessment'
      ],
      endpoints: [
        '/comprehensive-analysis',
        '/domain-analysis/:domain',
        '/therapeutic-recommendations',
        '/personality-type',
        '/analysis-summary',
        '/dimension-insights/:dimension'
      ]
    };

    res.json(status);

  } catch (error) {
    console.error('🚨 System status check failed:', error);
    res.status(500).json({
      error: 'System status check failed',
      details: error.message
    });
  }
});

export default router;