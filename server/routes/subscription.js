import express from 'express';
import { db } from '../db.js'; // Import db
import { users, userDevices } from '../../shared/schema.js'; // Import users and userDevices schemas
import { eq } from 'drizzle-orm'; // Import eq for queries

const router = express.Router();

// Helper to get authenticated user ID
const getAuthUserId = (req) => {
  if (req.authenticatedUserId) {
    return req.authenticatedUserId;
  }
  console.warn('⚠️ req.authenticatedUserId not found, falling back to req.userId');
  return req.userId || 1; // Default to 1 for testing if no user ID is present
};

// Helper to get canonical UID
const getCanonicalUid = (res) => {
  if (res.locals.uid) {
    return res.locals.uid;
  }
  console.warn('⚠️ res.locals.uid not found, canonical UID unavailable.');
  return null;
};

// Basic subscription status endpoint that frontend is calling
router.get('/tiered-analysis/subscription-status', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const uid = getCanonicalUid(res);

    if (!uid) {
      console.error('❌ Subscription status failed: UID not available from middleware.');
      return res.status(500).json({ error: 'Authentication context missing' });
    }

    console.log(`📋 Getting subscription status for userId: ${userId} (UID: ${uid})`);

    // Fetch subscription from database
    const userSubscription = await db.select().from(users).where(eq(users.sessionId, uid)).limit(1); // Assuming sessionId in users table maps to uid

    let tier = 'free';
    let status = 'active';
    let monthlyUsage = 0;
    let monthlyLimit = 1; // Default for free tier
    let features = {
      comprehensiveAnalysis: false,
      domainAnalysis: false,
      therapeuticRecommendations: false,
      progressTracking: false,
      exportReports: false,
      unlimitedAnalyses: false,
    };

    if (userSubscription.length > 0) {
      const sub = userSubscription[0];
      tier = sub.subscriptionStatus === 'premium' ? 'premium' : 'free'; // Map subscriptionStatus to tier
      status = sub.subscriptionStatus === 'free' ? 'active' : sub.subscriptionStatus; // Map subscriptionStatus to status
      monthlyUsage = sub.monthlyUsage;
      monthlyLimit = sub.subscriptionStatus === 'premium' ? -1 : 1; // -1 for unlimited if premium, 1 for free

      // Map features based on tier
      if (tier === 'premium' || tier === 'professional') {
        features = {
          comprehensiveAnalysis: true,
          domainAnalysis: true,
          therapeuticRecommendations: true,
          progressTracking: true,
          exportReports: true,
          unlimitedAnalyses: true,
        };
      }
    }

    res.json({
      success: true,
      subscription: {
        tier,
        status,
        monthlyUsage,
        monthlyLimit,
        lastUsageReset: new Date().toISOString(), // Placeholder
        features: Object.keys(features).filter(key => features[key]) // Only return active features
      },
      usage: {
        remaining: monthlyLimit === -1 ? -1 : Math.max(0, monthlyLimit - monthlyUsage),
        limit: monthlyLimit,
        monthlyUsed: monthlyUsage,
        dailyUsed: 0 // Not tracked in this example
      }
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// Legacy subscription status endpoint (backup)
router.get('/subscription/status', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const uid = getCanonicalUid(res);

    if (!uid) {
      console.error('❌ Legacy subscription status failed: UID not available from middleware.');
      return res.status(500).json({ error: 'Authentication context missing' });
    }

    console.log(`📋 Getting legacy subscription status for userId: ${userId} (UID: ${uid})`);

    const userSubscription = await db.select().from(users).where(eq(users.sessionId, uid)).limit(1); // Assuming sessionId in users table maps to uid

    let plan = 'free';
    let status = 'active';
    let tier = 'basic';
    let monthlyUsage = 0;
    let lastUsageReset = new Date().toISOString();

    if (userSubscription.length > 0) {
      const sub = userSubscription[0];
      plan = sub.subscriptionStatus === 'premium' ? 'premium' : 'free';
      status = sub.subscriptionStatus === 'free' ? 'active' : sub.subscriptionStatus;
      tier = sub.subscriptionStatus === 'premium' ? 'premium' : 'basic';
      monthlyUsage = sub.monthlyUsage;
      lastUsageReset = sub.lastUsageReset?.toISOString() || lastUsageReset;
    }
    
    res.json({
      plan,
      status,
      tier,
      monthlyUsage,
      lastUsageReset
    });
  } catch (error) {
    console.error('Error getting legacy subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// Endpoint to update usage (e.g., after an analysis)
router.post('/subscription/usage', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const uid = getCanonicalUid(res);
    const { increment = 1 } = req.body;

    if (!uid) {
      console.error('❌ Usage update failed: UID not available from middleware.');
      return res.status(500).json({ error: 'Authentication context missing' });
    }

    console.log(`📊 Updating usage for userId: ${userId} (UID: ${uid}) by ${increment}`);

    const userSubscription = await db.select().from(users).where(eq(users.sessionId, uid)).limit(1); // Assuming sessionId in users table maps to uid

    if (userSubscription.length > 0) {
      const sub = userSubscription[0];
      if (sub.monthlyLimit === -1) { // Unlimited tier
        return res.json({ success: true, message: 'Usage not tracked for unlimited tier' });
      }

      const newUsage = sub.monthlyUsage + increment;
      await db.update(users).set({ monthlyUsage: newUsage }).where(eq(users.sessionId, uid));
      res.json({ success: true, newUsage });
    } else {
      // If no user record with this session ID, this is an unexpected state given hipaaAuthMiddleware
      // For now, we'll log a warning and return an error.
      console.warn(`⚠️ No user found with sessionId ${uid} to update usage.`);
      return res.status(404).json({ error: 'User not found for usage update' });
    }
  } catch (error) {
    console.error('Error updating subscription usage:', error);
    res.status(500).json({ error: 'Failed to update usage' });
  }
});

// Endpoint to create checkout session (Stripe integration)
router.post('/subscription/create-checkout', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const uid = getCanonicalUid(res);
    const { planType, deviceFingerprint } = req.body; // deviceFingerprint might be redundant with UID

    if (!uid) {
      console.error('❌ Checkout creation failed: UID not available from middleware.');
      return res.status(500).json({ error: 'Authentication context missing' });
    }

    console.log(`💳 Creating checkout session for userId: ${userId} (UID: ${uid}), plan: ${planType}`);

    // Placeholder for Stripe integration
    // In a real application, you would:
    // 1. Create a Stripe Checkout Session
    // 2. Store relevant information (e.g., session ID, UID) in your database
    // 3. Return the session ID to the frontend

    // For now, simulate a successful session creation
    const sessionId = `cs_test_12345_${Date.now()}`;
    res.json({ success: true, sessionId });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Endpoint to get premium preview info
router.get('/tiered-analysis/premium-preview', async (req, res) => {
  try {
    console.log('📋 Getting premium preview info');
    res.json({
      success: true,
      premiumFeatures: [
        { name: 'Comprehensive Analysis', description: 'Deep dive into your mental wellness.' },
        { name: 'Domain-Specific Analysis', description: 'Targeted insights for specific areas.' },
        { name: 'Therapeutic Recommendations', description: 'Personalized guidance and exercises.' },
        { name: 'Progress Tracking', description: 'Monitor your journey over time.' },
        { name: 'Exportable Reports', description: 'Download detailed reports.' },
        { name: 'Unlimited Analyses', description: 'Access all features without limits.' },
      ],
      pricing: {
        monthly: { amount: 9.99, currency: 'USD', priceId: 'price_monthly_placeholder' },
        yearly: { amount: 99.99, currency: 'USD', priceId: 'price_yearly_placeholder' },
      }
    });
  } catch (error) {
    console.error('Error getting premium preview info:', error);
    res.status(500).json({ error: 'Failed to get premium preview info' });
  }
});

export default router;
