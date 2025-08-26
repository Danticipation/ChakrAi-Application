import React from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Crown, Lock, Zap, Star } from 'lucide-react';

interface PremiumGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

const PremiumGate: React.FC<PremiumGateProps> = ({ 
  feature, 
  children, 
  fallback, 
  showUpgrade = true 
}) => {
  const { isPremium, checkUsageLimit } = useSubscription();
  const [usageData, setUsageData] = React.useState<{ canUse: boolean; remaining: number; limit: number } | null>(null);
  
  React.useEffect(() => {
    const loadUsageData = async () => {
      const data = await checkUsageLimit();
      setUsageData({ canUse: data.allowed, remaining: data.remaining, limit: data.limit });
    };
    loadUsageData();
  }, [checkUsageLimit]);
  
  if (!usageData) {
    return <div>Loading...</div>;
  }
  
  const { canUse, remaining, limit } = usageData;

  if (isPremium || canUse) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="theme-card p-6 rounded-lg border border-[var(--theme-accent)]/30 text-center">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
          <Crown className="w-8 h-8 text-white" />
        </div>
      </div>
      
      <h3 className="text-lg font-semibold theme-text mb-2">Premium Feature</h3>
      <p className="theme-text-secondary text-sm mb-4">
        {remaining === 0 ? 
          `You've used all ${limit} free ${feature.replace('_', ' ')} for this month.` :
          `This feature requires a premium subscription.`
        }
      </p>
      
      {showUpgrade && (
        <button
          onClick={() => console.log('Upgrade to premium')}
          className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 flex items-center space-x-2 mx-auto"
        >
          <Zap className="w-4 h-4" />
          <span>Upgrade to Premium</span>
        </button>
      )}
    </div>
  );
};

interface UsageBadgeProps {
  feature: string;
  compact?: boolean;
}

export const UsageBadge: React.FC<UsageBadgeProps> = ({ feature, compact = false }) => {
  const { isPremium, checkUsageLimit } = useSubscription();
  const [usageData, setUsageData] = React.useState<{ remaining: number; limit: number } | null>(null);
  
  React.useEffect(() => {
    const loadUsageData = async () => {
      const data = await checkUsageLimit();
      setUsageData({ remaining: data.remaining, limit: data.limit });
    };
    loadUsageData();
  }, [checkUsageLimit]);
  
  if (!usageData) {
    return null;
  }
  
  const { remaining, limit } = usageData;

  if (isPremium) {
    return (
      <div className={`inline-flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs rounded-full ${compact ? '' : 'mb-2'}`}>
        <Crown className="w-3 h-3" />
        <span>Premium</span>
      </div>
    );
  }

  if (remaining === 0) {
    return (
      <div className={`inline-flex items-center space-x-1 px-2 py-1 bg-red-500 text-white text-xs rounded-full ${compact ? '' : 'mb-2'}`}>
        <Lock className="w-3 h-3" />
        <span>Limit Reached</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white text-xs rounded-full ${compact ? '' : 'mb-2'}`}>
      <span>{remaining}/{limit} remaining</span>
    </div>
  );
};

interface PremiumButtonProps {
  feature: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({ 
  feature, 
  onClick, 
  children, 
  className = '', 
  disabled = false 
}) => {
  const { isPremium, checkUsageLimit } = useSubscription();
  const [canUse, setCanUse] = React.useState<boolean>(false);
  
  React.useEffect(() => {
    const loadUsageData = async () => {
      const data = await checkUsageLimit();
      setCanUse(data.allowed);
    };
    loadUsageData();
  }, [checkUsageLimit]);
  
  const { canUse: canUseValue } = { canUse };

  const handleClick = () => {
    if (isPremium || canUse) {
      onClick();
    } else {
      console.log('Upgrade to premium');
    }
  };

  const isDisabled = disabled || (!isPremium && !canUse);

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`${className} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} relative group`}
    >
      {children}
      {!isPremium && !canUse && (
        <div className="absolute -top-1 -right-1">
          <Crown className="w-4 h-4 text-yellow-500" />
        </div>
      )}
    </button>
  );
};

export default PremiumGate;