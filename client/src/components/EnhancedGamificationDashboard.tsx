import { getCurrentUserId } from "../utils/userSession";
import React, { useState } from 'react';
import { Trophy, Star, Target, Calendar, ShoppingCart, Users, Zap, Gift, TrendingUp, Award, Clock, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosResponse } from 'axios';

interface WellnessPointsBalance {
  userId: number;
  totalPoints: number;
  lifetimePoints: number;
  pointsSpent: number;
  currentLevel: number;
  pointsToNextLevel: number;
  levelProgress: number;
}

interface TherapeuticReward {
  id: number;
  name: string;
  description: string;
  category: string;
  pointsCost: number;
  rarity: string;
  therapeuticValue: string;
  isAvailable: boolean;
  canAfford?: boolean;
  isUnlocked?: boolean;
}

interface CommunityChallenge {
  id: number;
  name: string;
  description: string;
  challengeType: string;
  duration: number;
  startDate: string;
  endDate: string;
  targetGoal: number;
  pointsReward: number;
  participantCount: number;
  therapeuticFocus: string;
  dailyPrompts: any[];
  isParticipating?: boolean;
  progress?: number;
  completedDays?: number;
  daysRemaining?: number;
}

interface EmotionalAchievement {
  id: number;
  achievementId: string;
  name: string;
  description: string;
  category: string;
  badgeIcon: string;
  badgeColor: string;
  pointsReward: number;
  rarity: string;
  therapeuticSignificance: string;
  unlockedAt?: string;
}

interface UserReward {
  id: number;
  rewardId: number;
  name: string;
  category: string;
  pointsSpent: number;
  purchasedAt: string;
  isActive: boolean;
  isEquipped: boolean;
}

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Reusable Loading Component
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-500" />
    <span className="text-sm text-gray-600">{message}</span>
  </div>
);

// Reusable Error Component
const ErrorMessage: React.FC<{ error: string; onRetry?: () => void }> = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 bg-red-50 border border-red-200 rounded-lg">
    <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
    <h3 className="text-sm font-medium text-red-800 mb-1">Error Loading Data</h3>
    <p className="text-xs text-red-600 text-center mb-3">{error}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

// Utility function to validate progress values
const validateProgress = (value: number | undefined): number => {
  if (typeof value !== 'number' || isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
};

// Reusable Reward Card Component
const RewardCard: React.FC<{
  reward: TherapeuticReward;
  isProcessing: boolean;
  onPurchase: () => void;
}> = ({ reward, isProcessing, onPurchase }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
    <div className="flex justify-between items-start mb-3">
      <h3 className="font-semibold text-gray-900">{reward.name}</h3>
      <span className={`px-2 py-1 text-xs rounded ${
        reward.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
        reward.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
        reward.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {reward.rarity}
      </span>
    </div>
    
    <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
    
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <span className="text-lg font-bold text-blue-600">{reward.pointsCost}</span>
        <span className="text-sm text-gray-500">points</span>
      </div>
      
      <button
        onClick={onPurchase}
        disabled={!reward.canAfford || !reward.isUnlocked || isProcessing}
        className={`px-3 py-1 text-sm rounded transition-colors ${
          reward.canAfford && reward.isUnlocked && !isProcessing
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center space-x-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Purchasing...</span>
          </div>
        ) : (
          'Purchase'
        )}
      </button>
    </div>
  </div>
);

// Reusable Challenge Card Component
const ChallengeCard: React.FC<{
  challenge: CommunityChallenge;
  isProcessing: boolean;
  onJoin: () => void;
}> = ({ challenge, isProcessing, onJoin }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
    <div className="flex justify-between items-start mb-3">
      <h3 className="font-semibold text-gray-900">{challenge.name}</h3>
      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
        {challenge.participantCount} participants
      </span>
    </div>
    
    <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
    
    <div className="mb-3">
      <div className="flex justify-between text-sm text-gray-500 mb-1">
        <span>Progress</span>
        <span>{validateProgress(challenge.progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
          style={{ width: `${validateProgress(challenge.progress)}%` }}
        />
      </div>
    </div>
    
    <div className="flex justify-between items-center">
      <div className="text-sm text-gray-500">
        <span>{challenge.daysRemaining} days left</span>
        <span className="mx-2">•</span>
        <span className="text-blue-600">+{challenge.pointsReward} points</span>
      </div>
      
      {!challenge.isParticipating ? (
        <button
          onClick={onJoin}
          disabled={isProcessing}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            !isProcessing
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center space-x-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Joining...</span>
            </div>
          ) : (
            'Join Challenge'
          )}
        </button>
      ) : (
        <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded">
          Participating
        </span>
      )}
    </div>
  </div>
);

const EnhancedGamificationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rewards' | 'challenges' | 'achievements'>('overview');
  const [selectedChallenge, setSelectedChallenge] = useState<CommunityChallenge | null>(null);
  const [selectedReward, setSelectedReward] = useState<TherapeuticReward | null>(null);
  const [processingRewards, setProcessingRewards] = useState<Set<number>>(new Set());
  const [processingChallenges, setProcessingChallenges] = useState<Set<number>>(new Set());
  
  const userId = getCurrentUserId();
  const queryClient = useQueryClient();

  // User validation
  if (!userId) {
    return (
      <div className="p-4">
        <ErrorMessage 
          error="User not found. Please log in or refresh the page." 
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // Fetch gamification dashboard data
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard 
  } = useQuery({
    queryKey: ['gamification', 'dashboard', userId],
    queryFn: async (): Promise<ApiResponse<{
      pointsBalance: WellnessPointsBalance;
      achievements: EmotionalAchievement[];
      userRewards: UserReward[];
      weeklyProgress: any;
    }>> => {
      const response: AxiosResponse<ApiResponse<any>> = await axios.get(
        `/api/gamification/dashboard/${userId}`
      );
      return response.data;
    },
    enabled: !!userId && activeTab === 'overview'
  });

  // Fetch rewards shop
  const { 
    data: rewardsData, 
    isLoading: rewardsLoading, 
    error: rewardsError,
    refetch: refetchRewards 
  } = useQuery({
    queryKey: ['gamification', 'rewards-shop', userId],
    queryFn: async (): Promise<ApiResponse<TherapeuticReward[]>> => {
      const response: AxiosResponse<ApiResponse<TherapeuticReward[]>> = await axios.get(
        `/api/rewards-shop/${userId}`
      );
      return response.data;
    },
    enabled: !!userId && activeTab === 'rewards'
  });

  // Fetch community challenges
  const { 
    data: challengesData, 
    isLoading: challengesLoading, 
    error: challengesError,
    refetch: refetchChallenges 
  } = useQuery({
    queryKey: ['gamification', 'community-challenges'],
    queryFn: async (): Promise<ApiResponse<CommunityChallenge[]>> => {
      const response: AxiosResponse<ApiResponse<CommunityChallenge[]>> = await axios.get(
        '/api/community-challenges'
      );
      return response.data;
    },
    enabled: !!userId && activeTab === 'challenges'
  });

  // Purchase reward mutation with individual item tracking
  const purchaseRewardMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      setProcessingRewards(prev => new Set(prev).add(rewardId));
      const response = await axios.post(`/api/rewards-shop/${userId}/purchase`, { rewardId });
      return response.data;
    },
    onSuccess: (data, rewardId) => {
      queryClient.invalidateQueries({ queryKey: ['gamification', 'dashboard', userId] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'rewards-shop', userId] });
      setSelectedReward(null);
      setProcessingRewards(prev => {
        const newSet = new Set(prev);
        newSet.delete(rewardId);
        return newSet;
      });
    },
    onError: (error, rewardId) => {
      console.error('Failed to purchase reward:', error);
      setProcessingRewards(prev => {
        const newSet = new Set(prev);
        newSet.delete(rewardId);
        return newSet;
      });
    }
  });

  // Join challenge mutation with individual item tracking
  const joinChallengeMutation = useMutation({
    mutationFn: async (challengeId: number) => {
      setProcessingChallenges(prev => new Set(prev).add(challengeId));
      const response = await axios.post(`/api/community-challenges/${challengeId}/join`, { userId });
      return response.data;
    },
    onSuccess: (data, challengeId) => {
      queryClient.invalidateQueries({ queryKey: ['gamification', 'dashboard', userId] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'community-challenges'] });
      setSelectedChallenge(null);
      setProcessingChallenges(prev => {
        const newSet = new Set(prev);
        newSet.delete(challengeId);
        return newSet;
      });
    },
    onError: (error, challengeId) => {
      console.error('Failed to join challenge:', error);
      setProcessingChallenges(prev => {
        const newSet = new Set(prev);
        newSet.delete(challengeId);
        return newSet;
      });
    }
  });

  // Safe data extraction with proper fallbacks
  const wellnessPoints: WellnessPointsBalance = dashboardData?.data?.pointsBalance || {
    userId,
    totalPoints: 0,
    lifetimePoints: 0,
    pointsSpent: 0,
    currentLevel: 1,
    pointsToNextLevel: 100,
    levelProgress: 0
  };

  const rewards: TherapeuticReward[] = rewardsData?.data || [];
  const challenges: CommunityChallenge[] = challengesData?.data || [];
  const userAchievements: EmotionalAchievement[] = dashboardData?.data?.achievements || [];
  const userRewards: UserReward[] = dashboardData?.data?.userRewards || [];

  // Enhanced handlers with validation and error feedback
  const handlePurchaseReward = (reward: TherapeuticReward) => {
    if (!reward.canAfford) {
      console.warn('Insufficient points to purchase this reward');
      return;
    }
    if (!reward.isUnlocked) {
      console.warn('This reward is not yet unlocked');
      return;
    }
    if (processingRewards.has(reward.id)) {
      return; // Already processing
    }
    
    purchaseRewardMutation.mutate(reward.id);
  };

  const handleJoinChallenge = (challenge: CommunityChallenge) => {
    if (challenge.isParticipating) {
      console.warn('Already participating in this challenge');
      return;
    }
    if (processingChallenges.has(challenge.id)) {
      return; // Already processing
    }
    
    joinChallengeMutation.mutate(challenge.id);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-600';
      case 'epic': return 'text-purple-600';
      case 'rare': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'resilience': return '🛡️';
      case 'emotional_breakthrough': return '💡';
      case 'self_awareness': return '🔍';
      case 'mindfulness': return '🧘';
      case 'social_connection': return '🤝';
      case 'coping_skills': return '💪';
      case 'progress_milestone': return '🎯';
      default: return '⭐';
    }
  };

  // Show loading states based on active tab
  if (activeTab === 'overview' && dashboardLoading) {
    return <LoadingSpinner message="Loading wellness dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6E6FA] via-white to-[#ADD8E6] p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Wellness Points */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Wellness Journey</h1>
              <p className="text-gray-600">Your path to mental wellness through positive reinforcement</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-col items-center">
              <div className="bg-gradient-to-r from-[#ADD8E6] to-[#98FB98] text-white rounded-2xl px-6 py-4 text-center">
                <div className="text-2xl font-bold">{wellnessPoints.totalPoints}</div>
                <div className="text-sm opacity-90">Wellness Points</div>
              </div>
              
              <div className="mt-3 flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-700">{wellnessPoints.currentLevel}</div>
                  <div className="text-xs text-gray-500">Level</div>
                </div>
                
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-[#ADD8E6] to-[#98FB98] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${validateProgress(wellnessPoints.levelProgress * 100)}%` }}
                  ></div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-700">{wellnessPoints.pointsToNextLevel}</div>
                  <div className="text-xs text-gray-500">To Next Level</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="w-full bg-white rounded-lg p-1 mb-6 shadow-lg">
          <div className="grid grid-cols-4 gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'rewards', label: 'Rewards Shop', icon: '🎁' },
              { id: 'challenges', label: 'Challenges', icon: '🏆' },
              { id: 'achievements', label: 'Achievements', icon: '🏅' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full px-4 py-4 text-sm font-bold rounded-md transition-all border-2 text-white ${
                  activeTab === tab.id
                    ? 'bg-blue-600 border-blue-400 shadow-lg'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-800'
                }`}
              >
                <span className="text-lg text-white">{tab.icon}</span>
                <div className="text-sm mt-1 text-white">{tab.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Achievements */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">🏅</span>
                Recent Achievements
              </h3>
              
              <div className="space-y-3">
                {userAchievements.slice(0, 3).map((achievement) => (
                  <div key={`achievement-${achievement.id}`} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl">
                    <div className="text-2xl">{achievement.badgeIcon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{achievement.name}</h4>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      <div className="flex items-center mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${getRarityColor(achievement.rarity)} bg-gray-100`}>
                          {achievement.rarity}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">+{achievement.pointsReward} points</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {userAchievements.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🎯</div>
                    <p>Keep engaging to unlock your first achievement!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Active Challenges */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">🏆</span>
                Active Challenges
              </h3>
              
              <div className="space-y-3">
                {challenges.filter(c => c.isParticipating).slice(0, 3).map((challenge) => (
                  <div key={`challenge-${challenge.id}`} className="p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800">{challenge.name}</h4>
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                        {challenge.completedDays || 0}/{challenge.targetGoal}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-[#ADD8E6] to-[#98FB98] h-2 rounded-full"
                        style={{ width: `${validateProgress(challenge.progress)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">{challenge.daysRemaining} days left</span>
                      <span className="text-xs text-blue-600">+{challenge.pointsReward} points</span>
                    </div>
                  </div>
                ))}
                
                {challenges.filter(c => c.isParticipating).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🎯</div>
                    <p>Join a challenge to start your wellness journey!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Rewards */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">🎁</span>
                Your Rewards
              </h3>
              
              <div className="space-y-3">
                {userRewards.slice(0, 3).map((reward) => (
                  <div key={`user-reward-${reward.id}`} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#ADD8E6] to-[#98FB98] rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold">
                        {reward.category === 'avatar' ? '👤' : 
                         reward.category === 'theme' ? '🎨' : 
                         reward.category === 'premium_content' ? '⭐' : '🏆'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{reward.name}</h4>
                      <p className="text-sm text-gray-600">{reward.pointsSpent} points spent</p>
                      {reward.isEquipped && (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">Equipped</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {userRewards.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🛍️</div>
                    <p>Visit the rewards shop to spend your wellness points!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Overview */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">📈</span>
                Wellness Stats
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{wellnessPoints.lifetimePoints}</div>
                  <div className="text-sm text-blue-800">Lifetime Points</div>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{dashboardData?.stats?.totalAchievements || 0}</div>
                  <div className="text-sm text-green-800">Achievements</div>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">{dashboardData?.stats?.activeChallengesCount || 0}</div>
                  <div className="text-sm text-purple-800">Active Challenges</div>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-r from-pink-50 to-pink-100 rounded-xl">
                  <div className="text-2xl font-bold text-pink-600">{wellnessPoints.pointsSpent}</div>
                  <div className="text-sm text-pink-800">Points Spent</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rewards Shop Tab */}
        {activeTab === 'rewards' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="mr-3">🎁</span>
              Therapeutic Rewards Shop
            </h3>
            
            {rewardsError && (
              <ErrorMessage 
                error={rewardsError.message || 'Failed to load rewards shop'} 
                onRetry={() => refetchRewards()}
              />
            )}
            
            {rewardsLoading ? (
              <LoadingSpinner message="Loading rewards shop..." />
            ) : rewards.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Rewards Available</h3>
                <p className="text-gray-500">Check back later for new rewards!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.map((reward) => (
                  <RewardCard
                    key={`reward-${reward.id}`}
                    reward={reward}
                    isProcessing={processingRewards.has(reward.id)}
                    onPurchase={() => handlePurchaseReward(reward)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Community Challenges Tab */}
        {activeTab === 'challenges' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="mr-3">🏆</span>
              Community Wellness Challenges
            </h3>
            
            {challengesError && (
              <ErrorMessage 
                error={challengesError.message || 'Failed to load challenges'} 
                onRetry={() => refetchChallenges()}
              />
            )}
            
            {challengesLoading ? (
              <LoadingSpinner message="Loading challenges..." />
            ) : challenges.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Challenges Available</h3>
                <p className="text-gray-500">Check back later for new challenges!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {challenges.map((challenge) => (
                  <ChallengeCard
                    key={`challenge-${challenge.id}`}
                    challenge={challenge}
                    isProcessing={processingChallenges.has(challenge.id)}
                    onJoin={() => handleJoinChallenge(challenge)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Emotional Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="mr-3">🏅</span>
              Emotional Achievements
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userAchievements.map((achievement, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-2xl bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-200"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: achievement.badgeColor + '20', color: achievement.badgeColor }}
                    >
                      {achievement.badgeIcon}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{achievement.name}</h4>
                      <span className={`text-sm px-2 py-1 rounded-full ${getRarityColor(achievement.rarity)} bg-gray-100`}>
                        {achievement.rarity}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                  
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <h5 className="text-xs font-semibold text-blue-800 mb-1">Therapeutic Significance:</h5>
                    <p className="text-xs text-blue-700">{achievement.therapeuticSignificance}</p>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">
                      {getCategoryIcon(achievement.category)} {achievement.category.replace('_', ' ')}
                    </span>
                    <span className="font-semibold text-green-600">+{achievement.pointsReward} points</span>
                  </div>
                  
                  {achievement.unlockedAt && (
                    <div className="mt-2 text-xs text-gray-500">
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
              
              {userAchievements.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🎯</div>
                  <h4 className="text-xl font-semibold mb-2">No Achievements Yet</h4>
                  <p>Continue your therapeutic journey to unlock meaningful achievements that recognize your emotional growth and resilience.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedGamificationDashboard;