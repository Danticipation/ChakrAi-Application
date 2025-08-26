import express from 'express';
import { comprehensiveAnalyzer } from '../memory/ComprehensivePersonalityAnalyzer.js';
import { basicAnalyzer } from '../memory/BasicPersonalityAnalyzer.js';
import { SubscriptionManager, requireFeature, checkUsageLimit, SUBSCRIPTION_TIERS } from '../subscription/SubscriptionManager.js';

const router = express.Router();

// 💎 TIERED PERSONALITY ANALYSIS SYSTEM
// Free tier gets basic analysis, Premium gets full 190-point comprehensive analysis

/**
 * 🆓 FREE TIER: Basic personality analysis (10 traits, simple insights)
 */
router.get('/basic-analysis/:userId?', checkUsageLimit(), async (req, res) => {
  try {
    const { uid } = req.ctx;
    if (!uid) return res.status(401).json({ error: 'auth_ctx_missing' });
    const userId = req.userId; // Use numeric ID for legacy compatibility

    console.log(`🆓 Generating basic analysis for free user ${userId}`);

    // Get user subscription to show appropriate messaging
    const subscription = await SubscriptionManager.getUserSubscription(userId);
    
    // Generate basic analysis
    const analysis = await basicAnalyzer.generateBasicAnalysis(userId);
    
    // Add subscription context
    const response = {
      success: true,
      tier: 'basic',
      analysis,
      subscription: {
        currentTier: subscription.tier,
        usage: req.usageInfo,
        upgradeAvailable: subscription.tier === 'free'
      },
      metadata: {
        analysisType: 'basic-10-trait',
        generatedAt: new Date().toISOString(),
        userId: userId
      }
    };

    console.log(`✅ Basic analysis complete for user ${userId}`);
    res.json(response);

  } catch (error) {
    console.error('🚨 Basic analysis failed:', error);
    res.status(500).json({
      error: 'Failed to generate basic analysis',
      details: error.message
    });
  }
});

/**
 * 💎 PREMIUM TIER: Full 190-point comprehensive analysis
 */
router.get('/premium-analysis/:userId?', requireFeature('comprehensiveAnalysis'), async (req, res) => {
  try {
    const { uid } = req.ctx;
    if (!uid) return res.status(401).json({ error: 'auth_ctx_missing' });
    const userId = req.userId;

    console.log(`💎 Generating premium comprehensive analysis for user ${userId}`);

    // Generate full 190-point analysis
    const analysis = await comprehensiveAnalyzer.generateComprehensiveAnalysis(userId);
    
    // Get subscription info
    const subscription = await SubscriptionManager.getUserSubscription(userId);
    
    const response = {
      success: true,
      tier: 'premium',
      analysis,
      subscription: {
        currentTier: subscription.tier,
        features: SUBSCRIPTION_TIERS[subscription.tier].features
      },
      metadata: {
        analysisType: '190-point-comprehensive',
        generatedAt: new Date().toISOString(),
        userId: userId,
        insightCount: analysis.dataPoints.totalInsights
      }
    };

    console.log(`✅ Premium analysis complete: ${analysis.dataPoints.totalInsights} insights generated`);
    res.json(response);

  } catch (error) {
    console.error('🚨 Premium analysis failed:', error);
    res.status(500).json({
      error: 'Failed to generate premium analysis',
      details: error.message
    });
  }
});

/**
 * 🎯 SMART ANALYSIS ENDPOINT: Automatically serves appropriate tier
 */
router.get('/smart-analysis/:userId?', async (req, res) => {
  try {
    const { uid } = req.ctx;
    if (!uid) return res.status(401).json({ error: 'auth_ctx_missing' });
    const userId = req.userId;

    console.log(`🎯 Smart analysis for user ${userId}`);

    // Check user subscription
    const subscription = await SubscriptionManager.getUserSubscription(userId);
    const hasComprehensive = await SubscriptionManager.hasFeatureAccess(userId, 'comprehensiveAnalysis');

    if (hasComprehensive) {
      // Redirect to premium analysis
      req.url = `/premium-analysis/${userId}`;
      return router.handle(req, res);
    } else {
      // Redirect to basic analysis
      req.url = `/basic-analysis/${userId}`;
      return router.handle(req, res);
    }

  } catch (error) {
    console.error('🚨 Smart analysis routing failed:', error);
    res.status(500).json({
      error: 'Failed to route analysis request',
      details: error.message
    });
  }
});

/**
 * 💎 PREMIUM TIER: Domain-specific analysis
 */
router.get('/domain-analysis/:domain/:userId?', requireFeature('domainAnalysis'), async (req, res) => {
  try {
    const domain = req.params.domain;
    const { uid } = req.ctx;
    if (!uid) return res.status(401).json({ error: 'auth_ctx_missing' });
    const userId = req.userId;

    console.log(`💎 Domain analysis (${domain}) for premium user ${userId}`);

    // Valid domains
    const validDomains = ['cognitive', 'emotional', 'communication', 'behavioral', 'interpersonal', 'personality', 'values', 'motivational', 'coping'];
    
    if (!validDomains.includes(domain)) {
      return res.status(400).json({
        error: 'Invalid domain',
        validDomains: validDomains,
        availableInPremium: true
      });
    }

    // Generate full analysis and extract domain
    const fullAnalysis = await comprehensiveAnalyzer.generateComprehensiveAnalysis(userId);
    const domainAnalysis = fullAnalysis.detailedDomainAnalysis[domain];

    const response = {
      success: true,
      tier: 'premium',
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
    };

    res.json(response);

  } catch (error) {
    console.error('🚨 Domain analysis failed:', error);
    res.status(500).json({
      error: 'Failed to generate domain analysis',
      details: error.message
    });
  }
});

/**
 * 💎 PREMIUM TIER: Therapeutic recommendations
 */
router.get('/therapeutic-recommendations/:userId?', requireFeature('therapeuticRecommendations'), async (req, res) => {
  try {
    const { uid } = req.ctx;
    if (!uid) return res.status(401).json({ error: 'auth_ctx_missing' });
    const userId = req.userId;

    console.log(`💎 Therapeutic recommendations for premium user ${userId}`);

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

    const response = {
      success: true,
      tier: 'premium',
      recommendations,
      confidence: analysis.dataPoints.analysisConfidence,
      metadata: {
        basedOnAnalysis: '190-point-comprehensive',
        generatedAt: new Date().toISOString(),
        userId: userId,
        dataRichness: analysis.dataPoints.dataRichness
      }
    };

    res.json(response);

  } catch (error) {
    console.error('🚨 Therapeutic recommendations failed:', error);
    res.status(500).json({
      error: 'Failed to generate therapeutic recommendations',
      details: error.message
    });
  }
});

/**
 * 📊 SUBSCRIPTION STATUS & UPGRADE INFORMATION
 */
router.get('/subscription-status/:userId?', async (req, res) => {
  try {
    const { uid } = req.ctx;
    if (!uid) return res.status(401).json({ error: 'auth_ctx_missing' });
    const userId = req.userId;

    console.log(`📊 Getting subscription status for user ${userId}`);

    const summary = await SubscriptionManager.getSubscriptionSummary(userId);

    const response = {
      success: true,
      subscription: summary.subscription,
      usage: summary.usage,
      features: summary.features,
      upgradeInfo: summary.upgradeInfo,
      availableAnalyses: {
        basic: true,
        comprehensive: summary.features.analysisLimits.comprehensiveAnalysis,
        domainSpecific: summary.features.analysisLimits.domainAnalysis,
        therapeuticRecommendations: summary.features.analysisLimits.therapeuticRecommendations
      },
      metadata: {
        checkedAt: new Date().toISOString(),
        userId: userId
      }
    };

    res.json(response);

  } catch (error) {
    console.error('🚨 Subscription status check failed:', error);
    res.status(500).json({
      error: 'Failed to get subscription status',
      details: error.message
    });
  }
});

/**
 * 🎨 ANALYSIS PREVIEW: Shows what premium analysis would include
 */
router.get('/premium-preview/:userId?', async (req, res) => {
  try {
    const { uid } = req.ctx;
    if (!uid) return res.status(401).json({ error: 'auth_ctx_missing' });
    const userId = req.userId;

    console.log(`🎨 Premium preview for user ${userId}`);

    // Get basic analysis first
    const basicAnalysis = await basicAnalyzer.generateBasicAnalysis(userId);
    
    // Get upgrade info
    const upgradeInfo = await SubscriptionManager.getUpgradeInfo(userId);

    const preview = {
      success: true,
      currentAnalysis: {
        tier: 'basic',
        traits: basicAnalysis.basicProfile.topTraits,
        insights: Object.keys(basicAnalysis.limitedInsights).length,
        personalityType: basicAnalysis.basicProfile.personalityType
      },
      premiumPreview: {
        additionalDimensions: 180, // 190 total - 10 basic = 180 more
        additionalDomains: 8, // 9 total - 1 basic = 8 more
        features: basicAnalysis.premiumPreview.availableInPremium.additionalFeatures,
        sampleInsights: basicAnalysis.premiumPreview.availableInPremium.sampleInsights,
        therapeuticValue: basicAnalysis.premiumPreview.upgradeValue.clinicalWorth
      },
      upgradeOptions: upgradeInfo.availableUpgrades,
      comparisonChart: {
        basic: {
          traits: 10,
          domains: 1,
          insights: 'General',
          recommendations: 'Basic',
          tracking: false,
          price: 0
        },
        premium: {
          traits: 190,
          domains: 9,
          insights: 'Clinical-grade',
          recommendations: 'Therapeutic',
          tracking: true,
          price: 9.99
        }
      },
      metadata: {
        previewGenerated: new Date().toISOString(),
        userId: userId
      }
    };

    res.json(preview);

  } catch (error) {
    console.error('🚨 Premium preview failed:', error);
    res.status(500).json({
      error: 'Failed to generate premium preview',
      details: error.message
    });
  }
});

/**
 * 🔄 TIER COMPARISON ENDPOINT
 */
router.get('/tier-comparison', async (req, res) => {
  try {
    const comparison = {
      tiers: {
        free: {
          name: SUBSCRIPTION_TIERS.free.name,
          price: SUBSCRIPTION_TIERS.free.price,
          features: SUBSCRIPTION_TIERS.free.features,
          limits: SUBSCRIPTION_TIERS.free.analysisLimits,
          bestFor: 'Getting started with personality insights'
        },
        premium: {
          name: SUBSCRIPTION_TIERS.premium.name,
          price: SUBSCRIPTION_TIERS.premium.price,
          features: SUBSCRIPTION_TIERS.premium.features,
          limits: SUBSCRIPTION_TIERS.premium.analysisLimits,
          bestFor: 'Comprehensive personal development and mental wellness'
        },
        professional: {
          name: SUBSCRIPTION_TIERS.professional.name,
          price: SUBSCRIPTION_TIERS.professional.price,
          features: SUBSCRIPTION_TIERS.professional.features,
          limits: SUBSCRIPTION_TIERS.professional.analysisLimits,
          bestFor: 'Therapists, coaches, and professional use'
        }
      },
      featureMatrix: {
        'Basic personality traits': { free: '10 traits', premium: '190+ dimensions', professional: '190+ dimensions' },
        'Psychological domains': { free: 'General overview', premium: '9 comprehensive domains', professional: '9 comprehensive domains' },
        'Therapeutic recommendations': { free: 'Basic tips', premium: 'Clinical-grade insights', professional: 'Clinical-grade insights' },
        'Progress tracking': { free: false, premium: true, professional: true },
        'Monthly analyses': { free: '1', premium: 'Unlimited', professional: 'Unlimited' },
        'Domain deep-dives': { free: false, premium: true, professional: true },
        'Export reports': { free: false, premium: true, professional: true },
        'Clinical reporting': { free: false, premium: false, professional: true },
        'Multi-client management': { free: false, premium: false, professional: true },
        'API access': { free: false, premium: false, professional: true }
      },
      valueProposition: {
        premium: {
          clinicalValue: '$200-500 psychological assessment included',
          uniqueness: 'Only app with 190+ psychological dimensions',
          professionalGrade: 'Used by therapists and researchers'
        }
      }
    };

    res.json(comparison);

  } catch (error) {
    console.error('🚨 Tier comparison failed:', error);
    res.status(500).json({
      error: 'Failed to generate tier comparison',
      details: error.message
    });
  }
});

export default router;