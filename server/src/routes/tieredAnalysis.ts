import { Router } from 'express';
import { storage } from '../storage.js'; // Import the storage module

const r = Router();

/** Newer path your client calls */
r.get('/subscription-status', async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const userSubscription = await storage.getUserSubscription(userId);

    if (!userSubscription) {
      // Default to free tier if no subscription found
      return res.json({
        success: true,
        subscription: {
          tier: 'free',
          status: 'active',
          expiresAt: null,
          monthlyUsage: 0,
          monthlyLimit: 1,
          lastUsageReset: new Date().toISOString(),
          features: []
        },
        usage: {
          remaining: 1,
          limit: 1
        }
      });
    }

    // Map the userSubscription object to the tiered analysis format
    return res.json({
      success: true,
      subscription: {
        tier: userSubscription.tier,
        status: userSubscription.status,
        expiresAt: userSubscription.expiresAt?.toISOString(),
        monthlyUsage: userSubscription.monthlyUsage,
        monthlyLimit: userSubscription.monthlyLimit,
        lastUsageReset: userSubscription.lastUsageReset?.toISOString(),
        features: userSubscription.features
      },
      usage: {
        remaining: userSubscription.monthlyLimit === -1 ? -1 : Math.max(0, userSubscription.monthlyLimit - userSubscription.monthlyUsage),
        limit: userSubscription.monthlyLimit
      }
    });
  } catch (error) {
    console.error('Failed to get tiered subscription status:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve subscription status' });
  }
});

r.get('/premium-preview', async (req, res) => {
  try {
    // This endpoint provides information about premium features for upgrade display.
    // It does not require a user to be authenticated, but can use userId if available.
    const userId = req.userId;

    // In a real application, this would fetch details about different premium plans
    // and their features from a configuration or database.
    const premiumInfo = {
      premium: {
        tier: 'premium',
        priceMonthly: 9.99,
        priceYearly: 99.99,
        features: [
          'Comprehensive Analysis',
          'Domain-Specific Analysis',
          'Therapeutic Recommendations',
          'Progress Tracking',
          'Export Reports',
          'Unlimited Analyses'
        ],
        description: 'Unlock advanced features for a deeper wellness journey.'
      },
      professional: {
        tier: 'professional',
        priceMonthly: 29.99,
        priceYearly: 299.99,
        features: [
          'All Premium Features',
          'Advanced AI Insights',
          'Priority Support',
          'Customizable Reports',
          'Integration with Wearables (future)'
        ],
        description: 'For professionals and those seeking the ultimate wellness toolkit.'
      }
    };

    res.json({ success: true, data: premiumInfo });
  } catch (error) {
    console.error('Failed to get premium preview info:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve premium preview information' });
  }
});

export default r;
