import React, { useState, useEffect } from 'react';
import { X, Crown, Check, Zap, Star, Shield, Infinity } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../contexts/AuthContext';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY ? 
  loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY as string) : 
  null;

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    const handleShowUpgrade = () => {
      // Modal will be controlled by parent component
    };

    window.addEventListener('show-upgrade-modal', handleShowUpgrade);
    return () => window.removeEventListener('show-upgrade-modal', handleShowUpgrade);
  }, []);

  if (!isOpen) return null;

  const plans = {
    monthly: {
      id: 'monthly',
      name: 'Premium Monthly',
      price: '$9.99',
      interval: 'per month',
      features: [
        'Unlimited AI conversations',
        'Advanced personality insights',
        'Voice features (8 premium voices)',
        'Detailed progress analytics',
        'Export data capabilities',
        'Priority customer support',
        'Crisis detection & response',
        'VR therapy sessions',
        'Custom therapeutic plans',
        'Advanced mood forecasting'
      ]
    },
    yearly: {
      id: 'yearly',
      name: 'Premium Yearly',
      price: '$99.99',
      interval: 'per year',
      originalPrice: '$119.88',
      features: [
        'Everything in monthly plan',
        'Save $20 per year (17% off)',
        'Priority feature previews',
        'Extended data storage',
        'Advanced customization options'
      ]
    }
  };

  const freeFeatures = [
    '20 AI conversations per month',
    '5 journal entries per month', 
    '3 voice interactions per month',
    'Basic mood tracking',
    '1 personality insight per month',
    'Limited analytics'
  ];

  const handleSubscribe = async (planType: 'monthly' | 'yearly') => {
    if (!stripePromise) {
      alert('Payment system is not configured. Please contact support.');
      return;
    }

    setLoading(true);
    
    try {
      // Create checkout session
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isAuthenticated && {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          })
        },
        body: JSON.stringify({
          planType,
          deviceFingerprint: !isAuthenticated ? await getDeviceFingerprint() : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceFingerprint = async (): Promise<string> => {
    // Simple device fingerprinting for anonymous users
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    return btoa(fingerprint).slice(0, 32);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="theme-card max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-xl border border-[var(--theme-accent)]/30">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--theme-accent)]/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold theme-text">Upgrade to Premium</h2>
              <p className="theme-text-secondary text-sm">Unlock unlimited access to all features</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--theme-surface)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 theme-text" />
          </button>
        </div>

        <div className="p-6">
          {/* Plan Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-[var(--theme-surface)] p-1 rounded-lg">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPlan === 'monthly'
                    ? 'bg-[var(--theme-accent)] text-white'
                    : 'theme-text-secondary hover:theme-text'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedPlan('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                  selectedPlan === 'yearly'
                    ? 'bg-[var(--theme-accent)] text-white'
                    : 'theme-text-secondary hover:theme-text'
                }`}
              >
                Yearly
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 rounded">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          {/* Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <div className="theme-card p-6 rounded-lg border border-[var(--theme-accent)]/30">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold theme-text mb-2">Free Plan</h3>
                <div className="text-3xl font-bold theme-text">$0</div>
                <div className="theme-text-secondary text-sm">Forever</div>
              </div>
              
              <ul className="space-y-3">
                {freeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="theme-text-secondary text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Premium Plan */}
            <div className="theme-card p-6 rounded-lg border-2 border-gradient-to-r from-yellow-400 to-orange-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold theme-text mb-2 flex items-center justify-center space-x-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <span>{plans[selectedPlan].name}</span>
                </h3>
                <div className="flex items-center justify-center space-x-2">
                  <div className="text-3xl font-bold theme-text">{plans[selectedPlan].price}</div>
                  {selectedPlan === 'yearly' && plans[selectedPlan].originalPrice && (
                    <div className="text-lg theme-text-secondary line-through">
                      {plans[selectedPlan].originalPrice}
                    </div>
                  )}
                </div>
                <div className="theme-text-secondary text-sm">{plans[selectedPlan].interval}</div>
              </div>
              
              <ul className="space-y-3 mb-6">
                {plans[selectedPlan].features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    {feature.includes('Unlimited') || feature.includes('Everything') ? (
                      <Infinity className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    ) : feature.includes('Save') ? (
                      <Star className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    )}
                    <span className="theme-text text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleSubscribe(selectedPlan)}
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                <span>{loading ? 'Processing...' : 'Subscribe Now'}</span>
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span className="theme-text-secondary text-sm">Secure payment powered by Stripe</span>
            </div>
            <p className="theme-text-secondary text-xs">
              Cancel anytime. {!isAuthenticated && 'Anonymous users maintain subscription via device recognition.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
