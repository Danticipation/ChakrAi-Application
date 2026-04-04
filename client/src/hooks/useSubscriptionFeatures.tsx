import { useSubscription } from '@/contexts/SubscriptionContext';

/**
 * Custom hook for subscription feature checking
 */
export function useSubscriptionFeatures() {
  const {
    isPremium,
    currentTier,
    features,
    canUseFeature,
    needsUpgrade,
    remainingUsage,
    subscription
  } = useSubscription();

  return {
    // Quick tier checks
    isFree: currentTier === 'free',
    isPremium: currentTier === 'premium',
    isProfessional: currentTier === 'professional',
    isAnyPremium: isPremium, // premium or professional
    
    // Feature checks
    canUseComprehensiveAnalysis: canUseFeature('comprehensiveAnalysis'),
    canUseDomainAnalysis: canUseFeature('domainAnalysis'),
    canUseTherapeuticRecommendations: canUseFeature('therapeuticRecommendations'),
    canUseProgressTracking: canUseFeature('progressTracking'),
    canExportReports: canUseFeature('exportReports'),
    hasUnlimitedAnalyses: canUseFeature('unlimitedAnalyses'),
    
    // Usage info
    remainingUsage,
    isUnlimited: remainingUsage === -1,
    hasUsageLeft: remainingUsage > 0 || remainingUsage === -1,
    
    // Features object
    features,
    
    // Upgrade checks
    needsUpgradeFor: (feature: keyof typeof features) => needsUpgrade(feature),
    
    // Tier info
    currentTier,
    subscription
  };
}

/**
 * Component wrapper for subscription-gated features
 */
interface SubscriptionGateProps {
  feature?: keyof ReturnType<typeof useSubscriptionFeatures>['features'];
  tier?: 'free' | 'premium' | 'professional';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export function SubscriptionGate({ 
  feature, 
  tier, 
  children, 
  fallback = null,
  showUpgradePrompt = false 
}: SubscriptionGateProps) {
  const { currentTier, canUseFeature, needsUpgrade } = useSubscription();
  
  let hasAccess = true;
  
  // Check tier requirement
  if (tier) {
    const tierLevels = { free: 0, premium: 1, professional: 2 };
    const requiredLevel = tierLevels[tier];
    const userLevel = tierLevels[currentTier];
    hasAccess = userLevel >= requiredLevel;
  }
  
  // Check feature requirement
  if (feature && hasAccess) {
    hasAccess = canUseFeature(feature);
  }
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (showUpgradePrompt) {
    return (
      <div className="border border-yellow-400 bg-yellow-50 p-4 rounded-lg">
        <h3 className="font-semibold text-yellow-800">Upgrade Required</h3>
        <p className="text-yellow-700">
          This feature requires a {tier || 'premium'} subscription.
        </p>
        <button className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">
          Upgrade Now
        </button>
      </div>
    );
  }
  
  return <>{fallback}</>;
}

/**
 * Usage badge component
 */
export function UsageBadge({ 
  feature, 
  compact = false 
}: { 
  feature?: keyof ReturnType<typeof useSubscriptionFeatures>['features'];
  compact?: boolean;
}) {
  const { remainingUsage, currentTier, canUseFeature } = useSubscription();
  const isUnlimited = remainingUsage === -1;
  
  if (feature && !canUseFeature(feature)) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
        {compact ? 'ðŸ”’' : 'ðŸ”’ Upgrade Required'}
      </span>
    );
  }
  
  if (isUnlimited) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
        {compact ? 'âˆž' : 'âˆž Unlimited'}
      </span>
    );
  }
  
  const colorClass = remainingUsage > 3 ? 'bg-green-100 text-green-800' :
                    remainingUsage > 0 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800';
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${colorClass}`}>
      {compact ? remainingUsage : `${remainingUsage} remaining`}
    </span>
  );
}

/**
 * Quick subscription status component
 */
export function SubscriptionStatus() {
  const { currentTier, subscription, remainingUsage, isUnlimited } = useSubscriptionFeatures();
  
  const tierColors = {
    free: 'bg-gray-100 text-gray-800',
    premium: 'bg-blue-100 text-blue-800',
    professional: 'bg-purple-100 text-purple-800'
  };
  
  const tierLabels = {
    free: 'ðŸ†“ Free',
    premium: 'ðŸ’Ž Premium',
    professional: 'ðŸ† Professional'
  };
  
  return (
    <div className="flex items-center space-x-2">
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${tierColors[currentTier]}`}>
        {tierLabels[currentTier]}
      </span>
      {!isUnlimited && (
        <UsageBadge compact />
      )}
    </div>
  );
}
