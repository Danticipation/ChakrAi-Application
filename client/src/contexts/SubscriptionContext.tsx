import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface SubscriptionStatus {
  status: 'free' | 'premium' | 'premium_device';
  expiresAt?: string;
  monthlyUsage: number;
  lastUsageReset: string;
}

interface SubscriptionContextType {
  subscription: SubscriptionStatus | null;
  isLoading: boolean;
  updateUsage: (increment?: number) => Promise<void>;
  createCheckout: (planType: 'monthly' | 'yearly') => Promise<string>;
  refreshStatus: () => Promise<void>;
  canUseFeature: (usageLimit?: number) => boolean;
  remainingUsage: number;
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

const FREE_TIER_LIMITS = {
  monthly: 100, // 100 interactions per month for free users
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
      const response = await axios.get('/api/subscription/status');
      setSubscription(response.data);
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
      // Default to free tier if fetch fails
      setSubscription({
        status: 'free',
        monthlyUsage: 0,
        lastUsageReset: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUsage = async (increment: number = 1) => {
    try {
      const response = await axios.post('/api/subscription/usage', { increment });
      if (subscription) {
        setSubscription({
          ...subscription,
          monthlyUsage: response.data.monthlyUsage
        });
      }
    } catch (error) {
      console.error('Failed to update usage:', error);
    }
  };

  const createCheckout = async (planType: 'monthly' | 'yearly'): Promise<string> => {
    try {
      // Get device fingerprint for anonymous users
      const deviceFingerprint = localStorage.getItem('chakrai_device_fingerprint') || '';

      const response = await axios.post('/api/subscription/create-checkout', {
        planType,
        deviceFingerprint
      });
      
      // Return the checkout URL if available, otherwise fall back to session ID
      if (response.data.url) {
        window.location.href = response.data.url;
        return response.data.sessionId;
      }
      
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

  const canUseFeature = (usageLimit: number = FREE_TIER_LIMITS.monthly): boolean => {
    if (!subscription) return false;
    
    // Premium users have unlimited access
    if (subscription.status === 'premium' || subscription.status === 'premium_device') {
      return true;
    }
    
    // Free users are limited by monthly usage
    return subscription.monthlyUsage < usageLimit;
  };

  const remainingUsage = subscription ? 
    Math.max(0, FREE_TIER_LIMITS.monthly - subscription.monthlyUsage) : 0;

  useEffect(() => {
    fetchSubscriptionStatus();
    
    // Check for subscription success/cancel in URL params
    const params = new URLSearchParams(window.location.search);
    const subParam = params.get('subscription');
    if (subParam === 'success') {
      // Refresh status after successful payment
      setTimeout(() => fetchSubscriptionStatus(), 1000);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (subParam === 'cancelled') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        updateUsage,
        createCheckout,
        refreshStatus,
        canUseFeature,
        remainingUsage
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}