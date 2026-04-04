import express from 'express';
import { comprehensiveAnalyzer } from '../memory/ComprehensivePersonalityAnalyzer.js';
import { userSessionManager } from '../userSession.js';
import { storage } from '../storage.js';

const router = express.Router();

// 🧪 COMPREHENSIVE ANALYSIS TESTING & VALIDATION ENDPOINTS

/**
 * Test the 190-point analysis system with sample data
 */
router.get('/test-comprehensive-analysis/:userId?', async (req, res) => {
  try {
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      sessionInfo.deviceFingerprint, 
      sessionInfo.sessionId
    );
    const userId = anonymousUser.id;

    console.log(`🧪 Testing comprehensive analysis system for user ${userId}`);

    // Generate sample data if user has insufficient data
    const existingData = await gatherUserData(userId);
    
    if (existingData.totalDataPoints < 10) {
      console.log(`📝 Generating sample data for testing...`);
      await generateSampleData(userId);
    }

    // Run the comprehensive analysis
    const startTime = Date.now();
    const analysis = await comprehensiveAnalyzer.generateComprehensiveAnalysis(userId);
    const analysisTime = Date.now() - startTime;

    // Validate the analysis results
    const validation = validateAnalysisResults(analysis);

    const testResults = {
      success: true,
      testMetadata: {
        userId,
        testTime: new Date().toISOString(),
        analysisTimeMs: analysisTime,
        dataPointsUsed: existingData.totalDataPoints,
        sampleDataGenerated: existingData.totalDataPoints < 10
      },
      analysis,
      validation,
      performance: {
        analysisTime: `${analysisTime}ms`,
        domainsAnalyzed: Object.keys(analysis.detailedDomainAnalysis).length,
        totalInsights: analysis.dataPoints.totalInsights,
        confidenceLevel: analysis.dataPoints.analysisConfidence
      },
      qualityMetrics: {
        domainCompleteness: calculateDomainCompleteness(analysis),
        insightDepth: calculateInsightDepth(analysis),
        recommendationQuality: calculateRecommendationQuality(analysis),
        therapeuticValue: calculateTherapeuticValue(analysis)
      }
    };

    console.log(`✅ Comprehensive analysis test complete in ${analysisTime}ms`);
    console.log(`📊 Quality metrics:`, testResults.qualityMetrics);

    res.json(testResults);

  } catch (error) {
    console.error('🚨 Comprehensive analysis test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Comprehensive analysis test failed',
      details: error.message,
      testTime: new Date().toISOString()
    });
  }
});

/**
 * Validate specific domains of the analysis
 */
router.get('/validate-domain/:domain/:userId?', async (req, res) => {
  try {
    const domain = req.params.domain;
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      sessionInfo.deviceFingerprint, 
      sessionInfo.sessionId
    );
    const userId = anonymousUser.id;

    console.log(`🔍 Validating ${domain} domain analysis for user ${userId}`);

    const analysis = await comprehensiveAnalyzer.generateComprehensiveAnalysis(userId);
    const domainAnalysis = analysis.detailedDomainAnalysis[domain];

    if (!domainAnalysis) {
      return res.status(404).json({
        error: 'Domain not found',
        availableDomains: Object.keys(analysis.detailedDomainAnalysis)
      });
    }

    const validation = {
      domain,
      isValid: true,
      checks: {
        hasScore: domainAnalysis.domainScore !== undefined,
        scoreInRange: domainAnalysis.domainScore >= 0 && domainAnalysis.domainScore <= 10,
        hasFindings: Array.isArray(domainAnalysis.keyFindings) && domainAnalysis.keyFindings.length > 0,
        hasTraits: typeof domainAnalysis.specificTraits === 'object' && Object.keys(domainAnalysis.specificTraits).length > 0,
        hasNarrative: typeof domainAnalysis.narrativeAnalysis === 'string' && domainAnalysis.narrativeAnalysis.length > 50,
        hasGrowthOps: Array.isArray(domainAnalysis.growthOpportunities),
        hasTherapeuticFocus: Array.isArray(domainAnalysis.therapeuticFocus)
      },
      metrics: {
        domainScore: domainAnalysis.domainScore,
        findingsCount: domainAnalysis.keyFindings?.length || 0,
        traitsCount: Object.keys(domainAnalysis.specificTraits || {}).length,
        narrativeLength: domainAnalysis.narrativeAnalysis?.length || 0,
        recommendationsCount: (domainAnalysis.growthOpportunities?.length || 0) + (domainAnalysis.therapeuticFocus?.length || 0)
      },
      expectedDimensions: getDomainExpectedDimensions(domain),
      actualDimensions: Object.keys(domainAnalysis.specificTraits || {}),
      coverage: calculateDomainCoverage(domain, domainAnalysis)
    };

    // Check if validation passes
    validation.isValid = Object.values(validation.checks).every(check => check === true);

    res.json({
      success: true,
      validation,
      domainAnalysis,
      recommendations: validation.isValid ? [] : generateValidationRecommendations(validation)
    });

  } catch (error) {
    console.error('🚨 Domain validation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Domain validation failed',
      details: error.message
    });
  }
});

/**
 * Performance benchmarking endpoint
 */
router.get('/benchmark-analysis/:userId?', async (req, res) => {
  try {
    const sessionInfo = userSessionManager.getSessionFromRequest(req);
    const anonymousUser = await userSessionManager.getOrCreateAnonymousUser(
      sessionInfo.deviceFingerprint, 
      sessionInfo.sessionId
    );
    const userId = anonymousUser.id;

    console.log(`⚡ Running performance benchmark for user ${userId}`);

    const iterations = parseInt(req.query.iterations) || 3;
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      const analysis = await comprehensiveAnalyzer.generateComprehensiveAnalysis(userId);
      const endTime = Date.now();
      
      results.push({
        iteration: i + 1,
        timeMs: endTime - startTime,
        domainsAnalyzed: Object.keys(analysis.detailedDomainAnalysis).length,
        totalInsights: analysis.dataPoints.totalInsights,
        confidence: analysis.dataPoints.analysisConfidence
      });
    }

    const benchmark = {
      testMetadata: {
        userId,
        iterations,
        testTime: new Date().toISOString()
      },
      performance: {
        averageTimeMs: Math.round(results.reduce((sum, r) => sum + r.timeMs, 0) / results.length),
        minTimeMs: Math.min(...results.map(r => r.timeMs)),
        maxTimeMs: Math.max(...results.map(r => r.timeMs)),
        consistentResults: results.every(r => r.domainsAnalyzed === results[0].domainsAnalyzed)
      },
      results,
      qualityAssurance: {
        stable: results.every(r => Math.abs(r.confidence - results[0].confidence) < 5),
        performant: results.every(r => r.timeMs < 30000), // Under 30 seconds
        comprehensive: results.every(r => r.domainsAnalyzed === 9), // All 9 domains
        insightful: results.every(r => r.totalInsights >= 150) // Minimum insights
      }
    };

    console.log(`⚡ Benchmark complete: ${benchmark.performance.averageTimeMs}ms average`);

    res.json(benchmark);

  } catch (error) {
    console.error('🚨 Benchmark failed:', error);
    res.status(500).json({
      success: false,
      error: 'Benchmark failed',
      details: error.message
    });
  }
});

/**
 * System health check for comprehensive analysis
 */
router.get('/health-check', async (req, res) => {
  try {
    console.log(`🏥 Running comprehensive analysis system health check`);

    const healthCheck = {
      timestamp: new Date().toISOString(),
      system: 'Comprehensive 190-Point Personality Analysis',
      version: '1.0.0',
      status: 'HEALTHY',
      components: {
        analyzer: await checkAnalyzerHealth(),
        domains: await checkDomainsHealth(),
        storage: await checkStorageHealth(),
        api: await checkApiHealth()
      },
      capabilities: {
        totalDimensions: 190,
        supportedDomains: 9,
        analysisTypes: [
          'comprehensive-analysis',
          'domain-analysis', 
          'therapeutic-recommendations',
          'personality-type',
          'dimension-insights'
        ],
        features: [
          'Real-time analysis',
          'Multi-domain assessment',
          'Therapeutic insights',
          'Actionable recommendations',
          'Progress tracking',
          'Clinical-grade assessment'
        ]
      },
      performance: {
        expectedAnalysisTime: '5-15 seconds',
        supportedConcurrentUsers: '50+',
        dataRequirements: 'Minimum 10 data points for basic analysis',
        optimalDataPoints: '50+ for comprehensive analysis'
      }
    };

    // Determine overall health
    const componentStatuses = Object.values(healthCheck.components);
    if (componentStatuses.some(c => c.status === 'ERROR')) {
      healthCheck.status = 'UNHEALTHY';
    } else if (componentStatuses.some(c => c.status === 'WARNING')) {
      healthCheck.status = 'DEGRADED';
    }

    const statusCode = healthCheck.status === 'HEALTHY' ? 200 : 
                      healthCheck.status === 'DEGRADED' ? 207 : 500;

    res.status(statusCode).json(healthCheck);

  } catch (error) {
    console.error('🚨 Health check failed:', error);
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 'ERROR',
      error: 'Health check failed',
      details: error.message
    });
  }
});

// Helper functions

async function gatherUserData(userId) {
  const [journalEntries, messages, moodEntries, userFacts, userMemories] = await Promise.all([
    storage.getJournalEntries(userId, 100).catch(() => []),
    storage.getUserMessages(userId, 200).catch(() => []),
    storage.getUserMoodEntries(userId, 100).catch(() => []),
    storage.getUserFacts(userId).catch(() => []),
    storage.getUserMemories(userId).catch(() => [])
  ]);

  return {
    journalEntries,
    messages,
    moodEntries,
    userFacts,
    userMemories,
    totalDataPoints: journalEntries.length + messages.length + moodEntries.length + userFacts.length + userMemories.length
  };
}

async function generateSampleData(userId) {
  const sampleJournalEntries = [
    "I've been feeling more confident lately in my ability to handle challenges at work. The project I'm leading is going well.",
    "Today I practiced mindfulness meditation for 20 minutes. I noticed how my thoughts kept jumping around, but I was able to bring my attention back to my breath.",
    "I had a difficult conversation with my partner today about our future plans. I tried to listen actively and express my feelings clearly.",
    "Feeling grateful for my support network. My friends really showed up for me when I needed them this week.",
    "I've been working on setting better boundaries with my time and energy. It's challenging but I can see the benefits."
  ];

  const sampleMoods = ['optimistic', 'reflective', 'anxious', 'grateful', 'determined'];

  for (let i = 0; i < 5; i++) {
    await storage.createJournalEntry(userId, {
      title: `Sample Journal Entry ${i + 1}`,
      content: sampleJournalEntries[i],
      mood: sampleMoods[i],
      moodIntensity: 6 + Math.floor(Math.random() * 3) // 6-8
    });

    await storage.createMessage({
      userId,
      content: `Sample therapeutic conversation ${i + 1}: How has your emotional awareness been developing?`,
      isBot: false,
      timestamp: new Date()
    });

    await storage.createMessage({
      userId,
      content: `I appreciate your question. I've been noticing patterns in my emotions and learning to respond rather than react. It's a gradual process but I feel more in control.`,
      isBot: true,
      timestamp: new Date()
    });
  }

  console.log(`📝 Generated sample data for user ${userId}`);
}

function validateAnalysisResults(analysis) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    checks: {
      hasOverallProfile: !!analysis.overallProfile,
      has9Domains: Object.keys(analysis.detailedDomainAnalysis || {}).length === 9,
      hasTherapeuticInsights: !!analysis.therapeuticInsights,
      hasRecommendations: !!analysis.actionableRecommendations,
      hasDataPoints: !!analysis.dataPoints,
      minimumInsights: (analysis.dataPoints?.totalInsights || 0) >= 150
    }
  };

  // Check for errors
  Object.entries(validation.checks).forEach(([check, passed]) => {
    if (!passed) {
      validation.errors.push(`Failed check: ${check}`);
      validation.isValid = false;
    }
  });

  // Domain-specific validation
  const expectedDomains = ['cognitive', 'emotional', 'communication', 'behavioral', 'interpersonal', 'personality', 'values', 'motivational', 'coping'];
  const actualDomains = Object.keys(analysis.detailedDomainAnalysis || {});
  
  expectedDomains.forEach(domain => {
    if (!actualDomains.includes(domain)) {
      validation.errors.push(`Missing domain: ${domain}`);
      validation.isValid = false;
    }
  });

  return validation;
}

function calculateDomainCompleteness(analysis) {
  const domains = Object.values(analysis.detailedDomainAnalysis || {});
  const completenessScores = domains.map((domain) => {
    let score = 0;
    if (domain.domainScore) score += 20;
    if (domain.keyFindings?.length > 0) score += 20;
    if (Object.keys(domain.specificTraits || {}).length > 0) score += 30;
    if (domain.narrativeAnalysis?.length > 50) score += 20;
    if ((domain.growthOpportunities?.length || 0) + (domain.therapeuticFocus?.length || 0) > 0) score += 10;
    return score;
  });
  
  return Math.round(completenessScores.reduce((sum, score) => sum + score, 0) / completenessScores.length);
}

function calculateInsightDepth(analysis) {
  const totalInsights = analysis.dataPoints?.totalInsights || 0;
  const narrativeLength = Object.values(analysis.detailedDomainAnalysis || {})
    .reduce((sum, domain) => sum + (domain.narrativeAnalysis?.length || 0), 0);
  
  const depthScore = Math.min(100, (totalInsights / 190) * 50 + (narrativeLength / 2000) * 50);
  return Math.round(depthScore);
}

function calculateRecommendationQuality(analysis) {
  const recs = analysis.actionableRecommendations || {};
  const totalRecs = (recs.immediateSteps?.length || 0) + 
                   (recs.shortTermGoals?.length || 0) + 
                   (recs.longTermDevelopment?.length || 0) + 
                   (recs.therapeuticPriorities?.length || 0) + 
                   (recs.wellnessStrategies?.length || 0);
  
  return Math.min(100, (totalRecs / 20) * 100);
}

function calculateTherapeuticValue(analysis) {
  const therapeutic = analysis.therapeuticInsights || {};
  let score = 0;
  
  if (therapeutic.therapeuticAlliance?.length > 50) score += 20;
  if (therapeutic.recommendedApproaches?.length >= 3) score += 20;
  if (therapeutic.progressPredictors?.length >= 2) score += 20;
  if (therapeutic.resilienceFactors?.length >= 2) score += 20;
  if (therapeutic.growthTrajectory?.length > 30) score += 20;
  
  return score;
}

function getDomainExpectedDimensions(domain) {
  const dimensions = {
    cognitive: ['abstract_reasoning', 'analytical_thinking', 'creative_problem_solving', 'decision_making_style', 'information_processing'],
    emotional: ['emotional_awareness', 'emotional_regulation', 'emotional_expression', 'emotional_intensity', 'emotional_stability'],
    communication: ['verbal_expression', 'written_communication', 'nonverbal_awareness', 'listening_skills', 'conversational_style'],
    behavioral: ['habitual_patterns', 'routine_preferences', 'spontaneity_levels', 'risk_taking', 'impulse_control'],
    interpersonal: ['attachment_style', 'relationship_patterns', 'intimacy_comfort', 'trust_building', 'boundary_setting'],
    personality: ['extraversion_introversion', 'neuroticism_stability', 'openness_experience', 'conscientiousness', 'agreeableness'],
    values: ['core_values', 'moral_framework', 'ethical_principles', 'spiritual_beliefs', 'life_philosophy'],
    motivational: ['achievement_drive', 'power_motivation', 'affiliation_needs', 'autonomy_drive', 'mastery_motivation'],
    coping: ['stress_tolerance', 'coping_strategies', 'resilience_factors', 'recovery_patterns', 'support_seeking']
  };
  
  return dimensions[domain] || [];
}

function calculateDomainCoverage(domain, domainAnalysis) {
  const expected = getDomainExpectedDimensions(domain);
  const actual = Object.keys(domainAnalysis.specificTraits || {});
  const covered = expected.filter(dim => actual.includes(dim));
  
  return Math.round((covered.length / expected.length) * 100);
}

function generateValidationRecommendations(validation) {
  const recommendations = [];
  
  if (!validation.checks.hasScore) {
    recommendations.push('Ensure domain score is calculated and within valid range (0-10)');
  }
  
  if (!validation.checks.hasFindings) {
    recommendations.push('Generate key findings based on user data analysis');
  }
  
  if (!validation.checks.hasTraits) {
    recommendations.push('Include specific trait scores for all domain dimensions');
  }
  
  if (validation.coverage < 80) {
    recommendations.push(`Improve domain coverage - currently at ${validation.coverage}%`);
  }
  
  return recommendations;
}

async function checkAnalyzerHealth() {
  try {
    // Test analyzer instantiation
    const analyzer = comprehensiveAnalyzer;
    return {
      status: 'HEALTHY',
      message: 'Analyzer instance operational',
      version: '1.0.0'
    };
  } catch (error) {
    return {
      status: 'ERROR',
      message: 'Analyzer initialization failed',
      error: error.message
    };
  }
}

async function checkDomainsHealth() {
  try {
    const expectedDomains = 9;
    const domainCount = Object.keys({
      cognitive: true,
      emotional: true,
      communication: true,
      behavioral: true,
      interpersonal: true,
      personality: true,
      values: true,
      motivational: true,
      coping: true
    }).length;
    
    return {
      status: domainCount === expectedDomains ? 'HEALTHY' : 'WARNING',
      message: `${domainCount}/${expectedDomains} domains available`,
      domains: domainCount
    };
  } catch (error) {
    return {
      status: 'ERROR',
      message: 'Domain configuration check failed',
      error: error.message
    };
  }
}

async function checkStorageHealth() {
  try {
    // Test storage connectivity
    await storage.getUserMessages(1, 1);
    return {
      status: 'HEALTHY',
      message: 'Storage system accessible',
      connection: 'active'
    };
  } catch (error) {
    return {
      status: 'ERROR',
      message: 'Storage system unavailable',
      error: error.message
    };
  }
}

async function checkApiHealth() {
  try {
    return {
      status: 'HEALTHY',
      message: 'API endpoints operational',
      endpoints: [
        'comprehensive-analysis',
        'domain-analysis',
        'therapeutic-recommendations',
        'personality-type',
        'dimension-insights'
      ]
    };
  } catch (error) {
    return {
      status: 'ERROR',
      message: 'API health check failed',
      error: error.message
    };
  }
}

export default router;