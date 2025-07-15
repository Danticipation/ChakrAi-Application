import { getCurrentUserId } from "../utils/userSession";
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

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

const EnhancedGamificationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rewards' | 'challenges' | 'achievements'>('overview');
  const [selectedChallenge, setSelectedChallenge] = useState<CommunityChallenge | null>(null);
  const [selectedReward, setSelectedReward] = useState<TherapeuticReward | null>(null);
  const userId = getCurrentUserId(); // In production, get from auth context
  const queryClient = useQueryClient();

  // Fetch gamification dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/gamification/dashboard', userId],
    queryFn: async () => {
      const response = await axios.get(`/api/gamification/dashboard/${userId}`);
      return response.data;
    },
  });

  // Fetch rewards shop
  const { data: rewardsData, isLoading: rewardsLoading } = useQuery({
    queryKey: ['/api/rewards-shop', userId],
    queryFn: async () => {
      const response = await axios.get(`/api/rewards-shop/${userId}`);
      return response.data;
    },
  });

  // Fetch community challenges
  const { data: challengesData, isLoading: challengesLoading } = useQuery({
    queryKey: ['/api/community-challenges'],
    queryFn: async () => {
      const response = await axios.get('/api/community-challenges');
      return response.data;
    },
  });

  // Purchase reward mutation
  const purchaseRewardMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const response = await axios.post(`/api/rewards-shop/${userId}/purchase`, { rewardId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gamification/dashboard', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/rewards-shop', userId] });
      setSelectedReward(null);
    }
  });

  // Join challenge mutation
  const joinChallengeMutation = useMutation({
    mutationFn: async (challengeId: number) => {
      const response = await axios.post(`/api/community-challenges/${challengeId}/join`, { userId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gamification/dashboard', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/community-challenges'] });
      setSelectedChallenge(null);
    }
  });

  const wellnessPoints: WellnessPointsBalance = dashboardData?.wellnessPoints || {
    userId,
    totalPoints: 0,
    lifetimePoints: 0,
    pointsSpent: 0,
    currentLevel: 1,
    pointsToNextLevel: 100,
    levelProgress: 0
  };

  const rewards: TherapeuticReward[] = rewardsData?.rewards || [];
  const challenges: CommunityChallenge[] = challengesData?.challenges || [];
  const userAchievements: EmotionalAchievement[] = dashboardData?.recentAchievements || [];
  const userRewards: UserReward[] = dashboardData?.userRewards || [];

  const handlePurchaseReward = (reward: TherapeuticReward) => {
    if (reward.canAfford && reward.isUnlocked) {
      purchaseRewardMutation.mutate(reward.id);
    }
  };

  const handleJoinChallenge = (challenge: CommunityChallenge) => {
    if (!challenge.isParticipating) {
      joinChallengeMutation.mutate(challenge.id);
    }
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

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ADD8E6]"></div>
      </div>
    );
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
                    style={{ width: `${wellnessPoints.levelProgress * 100}%` }}
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
                className={`w-full px-4 py-4 text-sm font-bold rounded-md transition-all border-2 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 border-blue-400 shadow-lg'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-800'
                }`}
                style={{
                  color: '#FFFFFF !important',
                  backgroundColor: activeTab === tab.id ? '#2563eb !important' : '#374151 !important'
                }}
              >
                <span className="text-lg" style={{ color: '#FFFFFF !important' }}>{tab.icon}</span>
                <div className="text-sm mt-1" style={{ color: '#FFFFFF !important' }}>{tab.label}</div>
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
                {userAchievements.slice(0, 3).map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl">
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
                {challenges.filter(c => c.isParticipating).slice(0, 3).map((challenge, index) => (
                  <div key={index} className="p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl">
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
                        style={{ width: `${(challenge.progress || 0)}%` }}
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
                {userRewards.slice(0, 3).map((reward, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl">
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
            
            {rewardsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ADD8E6]"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.map((reward) => (
                  <div 
                    key={reward.id} 
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                      reward.canAfford && reward.isUnlocked
                        ? 'border-green-200 bg-gradient-to-br from-green-50 to-white hover:shadow-lg cursor-pointer'
                        : 'border-gray-200 bg-gradient-to-br from-gray-50 to-white'
                    }`}
                    onClick={() => setSelectedReward(reward)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-lg">{reward.name}</h4>
                        <span className={`text-sm px-2 py-1 rounded-full ${getRarityColor(reward.rarity)} bg-gray-100`}>
                          {reward.rarity}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{reward.pointsCost}</div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                    
                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                      <h5 className="text-xs font-semibold text-blue-800 mb-1">Therapeutic Value:</h5>
                      <p className="text-xs text-blue-700">{reward.therapeuticValue}</p>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePurchaseReward(reward);
                      }}
                      disabled={!reward.canAfford || !reward.isUnlocked || purchaseRewardMutation.isPending}
                      className={`w-full py-2 px-4 rounded-xl font-medium transition-all duration-200 ${
                        reward.canAfford && reward.isUnlocked
                          ? 'bg-gradient-to-r from-[#ADD8E6] to-[#98FB98] text-white hover:shadow-lg'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {!reward.isUnlocked ? 'Locked' : 
                       !reward.canAfford ? 'Insufficient Points' : 
                       purchaseRewardMutation.isPending ? 'Purchasing...' : 'Purchase'}
                    </button>
                  </div>
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
            
            {challengesLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ADD8E6]"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {challenges.map((challenge) => (
                  <div 
                    key={challenge.id}
                    className={`p-6 rounded-2xl border-2 transition-all duration-200 ${
                      challenge.isParticipating
                        ? 'border-green-200 bg-gradient-to-br from-green-50 to-white'
                        : 'border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-gray-800 text-xl">{challenge.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                            {challenge.challengeType}
                          </span>
                          <span className="text-sm text-gray-500">
                            {challenge.duration} days • {challenge.participantCount} participants
                          </span>
                        </div>
                      </div>
                      
                      {challenge.isParticipating && (
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{challenge.completedDays || 0}/{challenge.targetGoal}</div>
                          <div className="text-xs text-gray-500">days completed</div>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-4">{challenge.description}</p>
                    
                    <div className="bg-purple-50 rounded-lg p-3 mb-4">
                      <h5 className="text-sm font-semibold text-purple-800 mb-1">Therapeutic Focus:</h5>
                      <p className="text-sm text-purple-700">{challenge.therapeuticFocus}</p>
                    </div>
                    
                    {challenge.isParticipating && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{challenge.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-[#ADD8E6] to-[#98FB98] h-3 rounded-full transition-all duration-300"
                            style={{ width: `${challenge.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        {challenge.daysRemaining} days remaining • +{challenge.pointsReward} points
                      </div>
                      
                      <button
                        onClick={() => handleJoinChallenge(challenge)}
                        disabled={challenge.isParticipating || joinChallengeMutation.isPending}
                        className={`py-2 px-4 rounded-xl font-medium transition-all duration-200 ${
                          challenge.isParticipating
                            ? 'bg-green-100 text-green-600 cursor-default'
                            : 'bg-gradient-to-r from-[#ADD8E6] to-[#98FB98] text-white hover:shadow-lg'
                        }`}
                      >
                        {challenge.isParticipating ? 'Participating' : 
                         joinChallengeMutation.isPending ? 'Joining...' : 'Join Challenge'}
                      </button>
                    </div>
                  </div>
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