import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Updated interfaces to match your new tiered system
interface SubscriptionStatus {
  tier: 'free' | 'premium' | 'professional';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  expiresAt?: string;
  monthlyUsage: number;
  monthlyLimit: number;
  lastUsageReset: string;
  features: SubscriptionFeatures; // Changed to SubscriptionFeatures
}

interface SubscriptionFeatures {
  comprehensiveAnalysis: boolean;
  domainAnalysis: boolean;
  therapeuticRecommendations: boolean;
  progressTracking: boolean;
  exportReports: boolean;
  unlimitedAnalyses: boolean;
}

interface SubscriptionContextType {
  subscription: SubscriptionStatus | null;
  isLoading: boolean;
  
  // Legacy compatibility properties
  isPremium: boolean;
  
  // New tiered system properties
  currentTier: 'free' | 'premium' | 'professional';
  features: SubscriptionFeatures;
  
  // Usage management
  updateUsage: (increment?: number) => Promise<void>;
  checkUsageLimit: () => Promise<{ allowed: boolean; remaining: number; limit: number }>;
  canUseFeature: (feature: keyof SubscriptionFeatures) => boolean;
  remainingUsage: number;
  
  // Subscription management
  createCheckout: (planType: 'monthly' | 'yearly') => Promise<string>;
  refreshStatus: () => Promise<void>;
  
  // Upgrade information
  getUpgradeInfo: () => Promise<any>;
  needsUpgrade: (feature: keyof SubscriptionFeatures) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

interface SubscriptionProviderProps {
  children: ReactNode;
}

// Default feature sets for each tier
const TIER_FEATURES = {
  free: {
    comprehensiveAnalysis: false,
    domainAnalysis: false,
    therapeuticRecommendations: false,
    progressTracking: false,
    exportReports: false,
    unlimitedAnalyses: false,
  },
  premium: {
    comprehensiveAnalysis: true,
    domainAnalysis: true,
    therapeuticRecommendations: true,
    progressTracking: true,
    exportReports: true,
    unlimitedAnalyses: true,
  },
  professional: {
    comprehensiveAnalysis: true,
    domainAnalysis: true,
    therapeuticRecommendations: true,
    progressTracking: true,
    exportReports: true,
    unlimitedAnalyses: true,
  }
};

const FREE_TIER_LIMITS = {
  monthly: 1, // 1 analysis per month for free users (matching your new system)
  chatMessages: 50,
  voiceMinutes: 10,
  journalEntries: 20,
  aiInsights: 5
};

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscriptionStatus = async () => {
    try {
      // Try to get status from your new tiered system first
      const response = await axios.get('/api/tiered-analysis/subscription-status');
      
      if (response.data.success) {
        const data = response.data;
        setSubscription({
          tier: data.subscription.tier,
          status: data.subscription.status,
          monthlyUsage: data.usage?.remaining !== undefined ? 
            (data.usage.limit - data.usage.remaining) : 0,
          monthlyLimit: data.usage?.limit || 1,
          lastUsageReset: new Date().toISOString(),
          features: data.subscription.features.reduce((acc: SubscriptionFeatures, featureName: keyof SubscriptionFeatures) => {
            acc[featureName] = true;
            return acc;
          }, { ...TIER_FEATURES.free }) // Initialize with free tier features
        });
      } else {
        throw new Error('Failed to get subscription status');
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
      
      // Fallback to legacy endpoint
      try {
        const legacyResponse = await axios.get('/api/subscription/status');
        setSubscription({
          tier: legacyResponse.data.status === 'premium' ? 'premium' : 'free',
          status: 'active',
          monthlyUsage: legacyResponse.data.monthlyUsage || 0,
          monthlyLimit: legacyResponse.data.status === 'premium' ? -1 : 1,
          lastUsageReset: legacyResponse.data.lastUsageReset || new Date().toISOString(),
          features: TIER_FEATURES[legacyResponse.data.status === 'premium' ? 'premium' : 'free']
        });
      } catch (legacyError) {
        console.error('Failed to fetch legacy subscription status:', legacyError);
        // Default to free tier if both fail
        setSubscription({
          tier: 'free',
          status: 'active',
          monthlyUsage: 0,
          monthlyLimit: 1,
          lastUsageReset: new Date().toISOString(),
          features: TIER_FEATURES.free
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateUsage = async (increment: number = 1) => {
    try {
      // Try new system first
      const response = await axios.post('/api/subscription/usage', { increment });
      if (subscription) {
        setSubscription({
          ...subscription,
          monthlyUsage: subscription.monthlyUsage + increment
        });
      }
    } catch (error) {
      console.error('Failed to update usage:', error);
      // Update locally if API fails
      if (subscription) {
        setSubscription({
          ...subscription,
          monthlyUsage: subscription.monthlyUsage + increment
        });
      }
    }
  };

  const checkUsageLimit = async (): Promise<{ allowed: boolean; remaining: number; limit: number }> => {
    if (!subscription) {
      return { allowed: false, remaining: 0, limit: 1 };
    }

    if (subscription.tier === 'premium' || subscription.tier === 'professional') {
      return { allowed: true, remaining: -1, limit: -1 }; // Unlimited
    }

    const remaining = Math.max(0, subscription.monthlyLimit - subscription.monthlyUsage);
    return {
      allowed: remaining > 0,
      remaining,
      limit: subscription.monthlyLimit
    };
  };

  const createCheckout = async (planType: 'monthly' | 'yearly'): Promise<string> => {
    try {
      // Get device fingerprint for anonymous users
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
      }
      const deviceFingerprint = canvas.toDataURL().slice(-50);

      const response = await axios.post('/api/subscription/create-checkout', {
        planType,
        deviceFingerprint
      });
      
      return response.data.sessionId;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      throw error;
    }
  };

  const refreshStatus = async () => {
    setIsLoading(true);
    await fetchSubscriptionStatus();
  };

  const getUpgradeInfo = async () => {
    try {
      const response = await axios.get('/api/tiered-analysis/premium-preview');
      return response.data;
    } catch (error) {
      console.error('Failed to get upgrade info:', error);
      return null;
    }
  };

  // Helper functions for feature access
  const currentTier = subscription?.tier || 'free';
  const isPremium = currentTier === 'premium' || currentTier === 'professional';
  // Use features directly from subscription state, which is now a SubscriptionFeatures object
  const features = subscription?.features || TIER_FEATURES.free;

  const canUseFeature = (feature: keyof SubscriptionFeatures): boolean => {
    return features[feature] || false; // Ensure it returns boolean
  };

  const needsUpgrade = (feature: keyof SubscriptionFeatures): boolean => {
    return !canUseFeature(feature);
  };

  const remainingUsage = subscription ? 
    (subscription.monthlyLimit === -1 ? -1 : Math.max(0, subscription.monthlyLimit - subscription.monthlyUsage)) : 0;

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        
        // Legacy compatibility
        isPremium,
        
        // New tiered system
        currentTier,
        features,
        
        // Usage management
        updateUsage,
        checkUsageLimit,
        canUseFeature,
        remainingUsage,
        
        // Subscription management
        createCheckout,
        refreshStatus,
        
        // Upgrade information
        getUpgradeInfo,
        needsUpgrade
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}
