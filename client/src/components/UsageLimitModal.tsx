import React from 'react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { X, Crown, AlertTriangle } from 'lucide-react';

interface UsageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export function UsageLimitModal({ isOpen, onClose, onUpgrade }: UsageLimitModalProps) {
  const { subscription, remainingUsage } = useSubscription();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full border-2 border-silver">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Usage Limit Reached
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

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-gray-600 dark:text-gray-400 mb-4">
              You've used {subscription?.monthlyUsage || 0} out of 100 free monthly interactions.
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
              <div 
                className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, ((subscription?.monthlyUsage || 0) / 100) * 100)}%` }}
              />
            </div>

            {remainingUsage > 0 ? (
              <p className="text-gray-700 dark:text-gray-300">
                You have <span className="font-bold text-orange-600">{remainingUsage}</span> interactions remaining this month.
              </p>
            ) : (
              <p className="text-gray-700 dark:text-gray-300">
                Your free monthly limit has been reached. Upgrade to premium for unlimited access.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={onUpgrade}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Premium
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-silver"
            >
              Continue with Free Tier
            </Button>
          </div>

          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Usage resets monthly. Premium plans include unlimited interactions.
          </div>
        </div>
      </div>
    </div>
  );
}
