import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { X, Crown, Sparkles, Zap, Shield, Check } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY as string);

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const { createCheckout, subscription } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = async (planType: 'monthly' | 'yearly') => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const sessionId = await createCheckout(planType);
      
      const { error } = await stripe.redirectToCheckout({
        sessionId: sessionId,
      });

      if (error) {
        console.error('Stripe redirect error:', error);
        alert('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start subscription process. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const features = [
    { icon: Sparkles, text: 'Unlimited AI conversations' },
    { icon: Crown, text: 'Advanced personality insights' },
    { icon: Zap, text: 'Priority voice processing' },
    { icon: Shield, text: 'Enhanced privacy protection' },
    { icon: Check, text: 'Access to all therapeutic tools' },
    { icon: Check, text: 'Unlimited journal entries' },
    { icon: Check, text: 'Advanced mood analytics' },
    { icon: Check, text: 'All 8 ElevenLabs voices' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-silver">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Upgrade to Premium
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Current Usage */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Current Plan: {!subscription?.status || subscription.status === 'cancelled' || subscription.status === 'expired' ? 'Free Tier' : 'Premium'}
            </h3>
            {(!subscription?.status || subscription.status === 'cancelled' || subscription.status === 'expired') && subscription && (
              <div className="text-gray-600 dark:text-gray-400">
                <p>Monthly Usage: {subscription.monthlyUsage}/100 interactions</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (subscription.monthlyUsage / 100) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Premium Features
          </h3>
          <div className="grid gap-3 mb-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <feature.icon className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Pricing Plans */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Monthly Plan */}
            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-colors">
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly</h4>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  $9.99<span className="text-sm font-normal text-gray-600 dark:text-gray-400">/month</span>
                </div>
              </div>
              <Button
                onClick={() => handleSubscribe('monthly')}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isProcessing ? 'Processing...' : 'Choose Monthly'}
              </Button>
            </div>

            {/* Yearly Plan */}
            <div className="border-2 border-blue-500 rounded-lg p-6 relative bg-blue-50 dark:bg-blue-900/20">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Popular
                </span>
              </div>
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Yearly</h4>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  $99.99<span className="text-sm font-normal text-gray-600 dark:text-gray-400">/year</span>
                </div>
                <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Save $19.89 (17% off)
                </div>
              </div>
              <Button
                onClick={() => handleSubscribe('yearly')}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isProcessing ? 'Processing...' : 'Choose Yearly'}
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Cancel anytime â€¢ 30-day money-back guarantee</p>
            <p className="mt-1">Secure payment processing by Stripe</p>
          </div>
        </div>
      </div>
    </div>
  );
}

