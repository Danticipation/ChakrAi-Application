// 💎 SUBSCRIPTION TIER MANAGEMENT SYSTEM
// Handles user subscription levels and feature access control

export interface UserSubscription {
  userId: number;
  tier: 'free' | 'premium' | 'professional';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: Date;
  endDate?: Date;
  features: string[];
}

export interface TierFeatures {
  name: string;
  price: number;
  features: string[];
  analysisLimits: {
    comprehensiveAnalysis: boolean;
    basicAnalysis: boolean;
    monthlyLimit: number;
    domainAnalysis: boolean;
    therapeuticRecommendations: boolean;
    progressTracking: boolean;
    exportReports: boolean;
  };
}

export const SUBSCRIPTION_TIERS: {
  free: TierFeatures;
  premium: TierFeatures;
  professional: TierFeatures;
  [key: string]: TierFeatures;
} = {
  free: {
    name: 'Basic Wellness',
    price: 0,
    features: [
      'Basic personality insights (10 traits)',
      'Simple mood tracking', 
      'General wellness tips',
      '1 analysis per month',
      'Basic reflection prompts'
    ],
    analysisLimits: {
      comprehensiveAnalysis: false,
      basicAnalysis: true,
      monthlyLimit: 1,
      domainAnalysis: false,
      therapeuticRecommendations: false,
      progressTracking: false,
      exportReports: false
    }
  },
  
  premium: {
    name: 'Professional Analysis',
    price: 9.99,
    features: [
      '190-point comprehensive personality analysis',
      'All 9 psychological domains',
      'Therapeutic recommendations',
      'Unlimited analyses',
      'Progress tracking over time',
      'Domain-specific deep dives',
      'Detailed insights reports',
      'Advanced mood analytics'
    ],
    analysisLimits: {
      comprehensiveAnalysis: true,
      basicAnalysis: true,
      monthlyLimit: -1, // Unlimited
      domainAnalysis: true,
      therapeuticRecommendations: true,
      progressTracking: true,
      exportReports: true
    }
  },
  
  professional: {
    name: 'Clinical Suite',
    price: 29.99,
    features: [
      'Everything in Professional Analysis',
      'Clinical-grade reporting',
      'Multi-client management',
      'API access',
      'White-label options',
      'Professional dashboard',
      'Batch analysis tools',
      'Research data exports'
    ],
    analysisLimits: {
      comprehensiveAnalysis: true,
      basicAnalysis: true,
      monthlyLimit: -1,
      domainAnalysis: true,
      therapeuticRecommendations: true,
      progressTracking: true,
      exportReports: true
    }
  }
};

export class SubscriptionManager {
  /**
   * Check user's subscription tier and feature access
   */
  static async getUserSubscription(userId: number): Promise<UserSubscription> {
    try {
      // In a real app, this would query your database
      // For now, we'll simulate different subscription states
      
      // Simulate different user tiers for testing
      const mockSubscriptions: { [key: number]: UserSubscription } = {
        1: { // Free user
          userId: 1,
          tier: 'free',
          status: 'active',
          startDate: new Date(),
          features: SUBSCRIPTION_TIERS.free.features
        },
        2: { // Premium user
          userId: 2,
          tier: 'premium',
          status: 'active',
          startDate: new Date(),
          features: SUBSCRIPTION_TIERS.premium.features
        },
        3: { // Professional user
          userId: 3,
          tier: 'professional',
          status: 'active',
          startDate: new Date(),
          features: SUBSCRIPTION_TIERS.professional.features
        }
      };
      
      // Default to free tier for any user not explicitly set
      return mockSubscriptions[userId] || {
        userId,
        tier: 'free',
        status: 'active',
        startDate: new Date(),
        features: SUBSCRIPTION_TIERS.free.features
      };
      
    } catch (error) {
      console.error('Error getting user subscription:', error);
      // Default to free tier on error
      return {
        userId,
        tier: 'free',
        status: 'active',
        startDate: new Date(),
        features: SUBSCRIPTION_TIERS.free.features
      };
    }
  }

  /**
   * Check if user has access to a specific feature
   */
  static async hasFeatureAccess(userId: number, feature: keyof TierFeatures['analysisLimits']): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      const tierConfig = SUBSCRIPTION_TIERS[subscription.tier];
      
      if (!tierConfig) {
        console.error(`Invalid subscription tier: ${subscription.tier}`);
        return false;
      }
      
      const tierLimits = tierConfig.analysisLimits;
      return tierLimits[feature] === true || (typeof tierLimits[feature] === 'number' && tierLimits[feature] > 0);
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false; // Deny access on error
    }
  }

  /**
   * Check monthly usage limits
   */
  static async checkMonthlyLimit(userId: number): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      const tierConfig = SUBSCRIPTION_TIERS[subscription.tier];
      
      if (!tierConfig) {
        console.error(`Invalid subscription tier: ${subscription.tier}`);
        return { allowed: false, remaining: 0, limit: 1 };
      }
      
      const tierLimits = tierConfig.analysisLimits;
      
      if (tierLimits.monthlyLimit === -1) {
        return { allowed: true, remaining: -1, limit: -1 }; // Unlimited
      }
      
      // In a real app, you'd check actual usage from database
      // For demo, we'll simulate some usage
      const mockUsage = Math.floor(Math.random() * tierLimits.monthlyLimit);
      const remaining = Math.max(0, tierLimits.monthlyLimit - mockUsage);
      
      return {
        allowed: remaining > 0,
        remaining,
        limit: tierLimits.monthlyLimit
      };
      
    } catch (error) {
      console.error('Error checking monthly limit:', error);
      return { allowed: false, remaining: 0, limit: 1 };
    }
  }

  /**
   * Get upgrade information for current user
   */
  static async getUpgradeInfo(userId: number): Promise<{
    currentTier: string;
    availableUpgrades: Array<{
      tier: string;
      name: string;
      price: number;
      features: string[];
      benefits: string[];
    }>;
  }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      const currentTier = subscription.tier;
      
      const availableUpgrades = [];
      
      if (currentTier === 'free') {
        availableUpgrades.push({
          tier: 'premium',
          name: SUBSCRIPTION_TIERS.premium.name,
          price: SUBSCRIPTION_TIERS.premium.price,
          features: SUBSCRIPTION_TIERS.premium.features,
          benefits: [
            '190+ psychological dimensions',
            'Professional therapeutic insights', 
            'Unlimited analyses',
            'Progress tracking',
            'Worth $300+ in clinical assessment'
          ]
        });
        
        availableUpgrades.push({
          tier: 'professional',
          name: SUBSCRIPTION_TIERS.professional.name,
          price: SUBSCRIPTION_TIERS.professional.price,
          features: SUBSCRIPTION_TIERS.professional.features,
          benefits: [
            'Everything in Premium',
            'Clinical-grade reporting',
            'Multi-client management',
            'API access',
            'Professional tools'
          ]
        });
      } else if (currentTier === 'premium') {
        availableUpgrades.push({
          tier: 'professional',
          name: SUBSCRIPTION_TIERS.professional.name,
          price: SUBSCRIPTION_TIERS.professional.price,
          features: SUBSCRIPTION_TIERS.professional.features,
          benefits: [
            'Clinical-grade reporting',
            'Multi-client management',
            'API access for integration',
            'White-label options',
            'Advanced professional tools'
          ]
        });
      }
      
      return {
        currentTier,
        availableUpgrades
      };
      
    } catch (error) {
      console.error('Error getting upgrade info:', error);
      return {
        currentTier: 'free',
        availableUpgrades: []
      };
    }
  }

  /**
   * Generate subscription status summary
   */
  static async getSubscriptionSummary(userId: number): Promise<{
    subscription: UserSubscription;
    usage: any;
    features: TierFeatures;
    upgradeInfo: any;
  }> {
    const [subscription, usage, upgradeInfo] = await Promise.all([
      this.getUserSubscription(userId),
      this.checkMonthlyLimit(userId),
      this.getUpgradeInfo(userId)
    ]);
    
    const features = SUBSCRIPTION_TIERS[subscription.tier];
    
    if (!features) {
      console.error(`Invalid subscription tier: ${subscription.tier}`);
      // Fallback to free tier
      return {
        subscription: { ...subscription, tier: 'free' },
        usage,
        features: SUBSCRIPTION_TIERS.free,
        upgradeInfo
      };
    }
    
    return {
      subscription,
      usage,
      features,
      upgradeInfo
    };
  }
}

/**
 * Middleware to check subscription tier
 */
export function requireSubscriptionTier(requiredTier: 'free' | 'premium' | 'professional') {
  return async (req: any, res: any, next: any) => {
    try {
      // Get user ID from request (adapt this to your auth system)
      const userId = req.params.userId || req.user?.id || 1;
      
      const subscription = await SubscriptionManager.getUserSubscription(userId);
      
      const tierHierarchy: { [key in 'free' | 'premium' | 'professional']: number } = {
        free: 0,
        premium: 1,
        professional: 2
      };
      
      const userTierLevel = tierHierarchy[subscription.tier];
      const requiredTierLevel = tierHierarchy[requiredTier];
      
      // Additional safety check for invalid tiers
      if (userTierLevel === undefined || requiredTierLevel === undefined) {
        return res.status(500).json({
          error: 'Invalid subscription tier configuration',
          message: 'Unable to verify subscription requirements'
        });
      }
      
      if (userTierLevel < requiredTierLevel) {
        const upgradeInfo = await SubscriptionManager.getUpgradeInfo(userId);
        const requiredTierConfig = SUBSCRIPTION_TIERS[requiredTier];
        
        return res.status(402).json({
          error: 'Subscription upgrade required',
          currentTier: subscription.tier,
          requiredTier: requiredTier,
          upgradeOptions: upgradeInfo.availableUpgrades,
          message: `This feature requires ${requiredTier} subscription`,
          features: requiredTierConfig?.features || []
        });
      }
      
      req.userSubscription = subscription;
      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      res.status(500).json({ error: 'Subscription verification failed' });
    }
  };
}

/**
 * Middleware to check specific feature access
 */
export function requireFeature(feature: keyof TierFeatures['analysisLimits']) {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.params.userId || req.user?.id || 1;
      
      const hasAccess = await SubscriptionManager.hasFeatureAccess(userId, feature);
      
      if (!hasAccess) {
        const upgradeInfo = await SubscriptionManager.getUpgradeInfo(userId);
        
        return res.status(402).json({
          error: 'Feature access denied',
          feature: feature,
          upgradeRequired: true,
          upgradeOptions: upgradeInfo.availableUpgrades,
          message: `${feature} requires a premium subscription`
        });
      }
      
      next();
    } catch (error) {
      console.error('Feature access check error:', error);
      res.status(500).json({ error: 'Feature access verification failed' });
    }
  };
}

/**
 * Middleware to check monthly limits
 */
export function checkUsageLimit() {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.params.userId || req.user?.id || 1;
      
      const limitCheck = await SubscriptionManager.checkMonthlyLimit(userId);
      
      if (!limitCheck.allowed) {
        const upgradeInfo = await SubscriptionManager.getUpgradeInfo(userId);
        
        return res.status(429).json({
          error: 'Monthly limit exceeded',
          usage: limitCheck,
          upgradeOptions: upgradeInfo.availableUpgrades,
          message: `You've reached your monthly limit of ${limitCheck.limit} analyses`
        });
      }
      
      req.usageInfo = limitCheck;
      next();
    } catch (error) {
      console.error('Usage limit check error:', error);
      res.status(500).json({ error: 'Usage verification failed' });
    }
  };
}