import { Router } from 'express';
import { storage } from '../storage.js'; // Import the storage module

const r = Router();

/** Legacy path your client calls */
r.get('/status', async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userSubscription = await storage.getUserSubscription(userId);

    if (!userSubscription) {
      // Default to free tier if no subscription found
      return res.json({
        status: 'free',
        monthlyUsage: 0,
        monthlyLimit: 1,
        lastUsageReset: new Date().toISOString(),
      });
    }

    // Map the userSubscription object to the legacy format
    return res.json({
      status: userSubscription.tier, // 'premium' or 'free'
      monthlyUsage: userSubscription.monthlyUsage,
      monthlyLimit: userSubscription.monthlyLimit,
      lastUsageReset: userSubscription.lastUsageReset?.toISOString(),
    });
  } catch (error) {
    console.error('Failed to get legacy subscription status:', error);
    res.status(500).json({ error: 'Failed to retrieve legacy subscription status' });
  }
});

r.post('/usage', async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { increment } = req.body;

    await storage.updateUserMonthlyUsage(userId, increment);
    res.json({ success: true, message: 'Usage updated successfully' });
  } catch (error) {
    console.error('Failed to update usage:', error);
    res.status(500).json({ success: false, error: 'Failed to update usage' });
  }
});

r.post('/create-checkout', async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { planType, deviceFingerprint } = req.body;

    const sessionId = await storage.createCheckoutSession(userId, planType, deviceFingerprint);
    res.json({ sessionId });
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    res.status(500).json({ success: false, error: 'Failed to create checkout session' });
  }
});

export default r;
