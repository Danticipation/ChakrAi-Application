import express from 'express';
import Stripe from 'stripe';
import { storage } from '../storage.js';
import { authenticateToken } from './auth.js';
import { asyncHandler } from '../utils/errorHandler.js';

const router = express.Router();

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey && stripeSecretKey !== 'your_stripe_secret_key_here'
  ? new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' })
  : null;

// Price IDs from environment
const MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID;
const YEARLY_PRICE_ID = process.env.STRIPE_YEARLY_PRICE_ID;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Helper: get user ID from request (JWT token or device fingerprint)
async function getUserIdFromRequest(req) {
  // Try JWT token first
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const jwt = (await import('jsonwebtoken')).default;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.userId) {
          return decoded.userId;
        }
      } catch (e) {
        // Token invalid, fall through to device fingerprint
      }
    }
  }

  // Fall back to device fingerprint header
  const deviceFingerprint = req.headers['x-device-fingerprint'] || req.body.deviceFingerprint;
  if (deviceFingerprint) {
    const user = await storage.getUserByDeviceFingerprint(deviceFingerprint);
    if (user) return user.id;
  }

  // Last resort: try body deviceFingerprint
  if (req.body && req.body.deviceFingerprint) {
    const user = await storage.getUserByDeviceFingerprint(req.body.deviceFingerprint);
    if (user) return user.id;
  }

  return null;
}

// === GET /api/subscription/status ===
// Returns the user's current subscription status and usage
router.get('/status', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return res.json({
        status: 'free',
        monthlyUsage: 0,
        lastUsageReset: new Date().toISOString()
      });
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.json({
        status: 'free',
        monthlyUsage: 0,
        lastUsageReset: new Date().toISOString()
      });
    }

    // Check if subscription has expired
    let status = user.subscriptionStatus || 'free';
    if (status === 'premium' && user.subscriptionExpiresAt) {
      const expiresAt = new Date(user.subscriptionExpiresAt);
      if (expiresAt < new Date()) {
        // Subscription expired, downgrade to free
        await storage.updateUser(userId, {
          subscriptionStatus: 'free',
          subscriptionId: null,
          subscriptionExpiresAt: null
        });
        status = 'free';
      }
    }

    // Check if monthly usage needs reset
    let monthlyUsage = user.monthlyUsage || 0;
    let lastUsageReset = user.lastUsageReset || new Date().toISOString();
    const resetDate = new Date(lastUsageReset);
    const now = new Date();
    if (resetDate.getMonth() !== now.getMonth() || resetDate.getFullYear() !== now.getFullYear()) {
      // Reset monthly usage
      monthlyUsage = 0;
      lastUsageReset = now.toISOString();
      await storage.updateUser(userId, {
        monthlyUsage: 0,
        lastUsageReset: lastUsageReset
      });
    }

    res.json({
      status,
      expiresAt: user.subscriptionExpiresAt?.toISOString(),
      monthlyUsage,
      lastUsageReset
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

// === POST /api/subscription/usage ===
// Increments the user's monthly usage count
router.post('/usage', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req);
    const increment = req.body.increment || 1;

    if (!userId) {
      return res.json({ monthlyUsage: 0 });
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.json({ monthlyUsage: 0 });
    }

    // Premium users don't need usage tracking
    if (user.subscriptionStatus === 'premium' || user.subscriptionStatus === 'premium_device') {
      return res.json({ monthlyUsage: 0, premium: true });
    }

    // Check monthly reset
    let monthlyUsage = user.monthlyUsage || 0;
    let lastUsageReset = user.lastUsageReset || new Date().toISOString();
    const resetDate = new Date(lastUsageReset);
    const now = new Date();
    if (resetDate.getMonth() !== now.getMonth() || resetDate.getFullYear() !== now.getFullYear()) {
      monthlyUsage = 0;
      lastUsageReset = now.toISOString();
    }

    monthlyUsage += increment;

    await storage.updateUser(userId, {
      monthlyUsage,
      lastUsageReset
    });

    res.json({ monthlyUsage });
  } catch (error) {
    console.error('Error updating usage:', error);
    res.status(500).json({ error: 'Failed to update usage' });
  }
});

// === POST /api/subscription/create-checkout ===
// Creates a Stripe Checkout Session for subscription
router.post('/create-checkout', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ 
      error: 'Payments not configured. Please set STRIPE_SECRET_KEY and price IDs.' 
    });
  }

  try {
    const userId = await getUserIdFromRequest(req);
    const { planType } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User identification required' });
    }

    const priceId = planType === 'yearly' ? YEARLY_PRICE_ID : MONTHLY_PRICE_ID;
    if (!priceId || priceId === 'price_monthly_placeholder' || priceId === 'price_yearly_placeholder') {
      return res.status(503).json({ 
        error: 'Stripe price IDs not configured. Please set STRIPE_MONTHLY_PRICE_ID and STRIPE_YEARLY_PRICE_ID.' 
      });
    }

    const user = await storage.getUserById(userId);
    
    // Build success and cancel URLs
    // Use origin from request, fallback to environment variable
    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || process.env.VITE_API_URL || 'http://localhost:5000';
    const successUrl = `${origin}/?subscription=success`;
    const cancelUrl = `${origin}/?subscription=cancelled`;

    // Create or reuse Stripe customer
    let customerId = user.customerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          userId: String(userId),
          deviceFingerprint: user.deviceFingerprint || '',
          displayName: user.displayName || 'Anonymous User'
        }
      });
      customerId = customer.id;
      
      // Save customer ID to user
      await storage.updateUser(userId, { customerId });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: String(userId),
        planType
      },
      subscription_data: {
        metadata: {
          userId: String(userId),
          planType
        }
      },
      allow_promotion_codes: true,
    });

    res.json({ 
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
});

// === POST /api/subscription/cancel ===
// Cancels the user's subscription
router.post('/cancel', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payments not configured' });
  }

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ error: 'User identification required' });
    }

    const user = await storage.getUserById(userId);
    if (!user || !user.subscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Cancel at period end (user keeps access until subscription expires)
    await stripe.subscriptions.cancel(user.subscriptionId, {
      prorate: true
    });

    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// === GET /api/subscription/billing-portal ===
// Redirects to Stripe billing portal for subscription management
router.get('/billing-portal', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payments not configured' });
  }

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ error: 'User identification required' });
    }

    const user = await storage.getUserById(userId);
    if (!user || !user.customerId) {
      return res.status(400).json({ error: 'No billing account found' });
    }

    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'http://localhost:5000';
    const session = await stripe.billingPortal.sessions.create({
      customer: user.customerId,
      return_url: origin,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    res.status(500).json({ error: 'Failed to create billing portal session' });
  }
});

// === POST /api/subscription/webhook ===
// Stripe webhook handler for subscription events
// NOTE: This must be registered with express.raw BEFORE JSON body parser
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(503).send('Payments not configured');
  }

  if (!WEBHOOK_SECRET || WEBHOOK_SECRET === 'your_stripe_webhook_secret_here') {
    return res.status(503).send('Webhook secret not configured');
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(400).send('Missing stripe-signature header');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = parseInt(session.metadata?.userId || '0', 10);
        
        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const expiresAt = new Date(subscription.current_period_end * 1000);
          
          await storage.updateUser(userId, {
            subscriptionStatus: 'premium',
            subscriptionId: subscription.id,
            customerId: session.customer,
            subscriptionExpiresAt: expiresAt,
            monthlyUsage: 0
          });
          
          console.log(`User ${userId} upgraded to premium`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = parseInt(subscription.metadata?.userId || '0', 10);
        
        if (userId) {
          const expiresAt = new Date(subscription.current_period_end * 1000);
          const status = subscription.status === 'active' || subscription.status === 'trialing' 
            ? 'premium' 
            : 'free';
          
          await storage.updateUser(userId, {
            subscriptionStatus: status,
            subscriptionId: subscription.id,
            subscriptionExpiresAt: status === 'premium' ? expiresAt : null
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = parseInt(subscription.metadata?.userId || '0', 10);
        
        if (userId) {
          await storage.updateUser(userId, {
            subscriptionStatus: 'free',
            subscriptionId: null,
            subscriptionExpiresAt: null
          });
          
          console.log(`User ${userId} subscription cancelled`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const userId = parseInt(subscription.metadata?.userId || '0', 10);
          
          if (userId) {
            const expiresAt = new Date(subscription.current_period_end * 1000);
            await storage.updateUser(userId, {
              subscriptionStatus: 'premium',
              subscriptionExpiresAt: expiresAt
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const userId = parseInt(subscription.metadata?.userId || '0', 10);
          
          if (userId) {
            // Payment failed but keep premium until subscription officially ends
            console.log(`User ${userId} payment failed`);
          }
        }
        break;
      }

      default:
        // Unhandled event type - log for debugging
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

export default router;
