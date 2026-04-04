import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gift, Trophy, Star, Target, TrendingUp, Award } from 'lucide-react';
import axios from 'axios';

interface WellnessPoints {
  totalPoints: number;
  availablePoints: number;
  lifetimePoints: number;
  currentLevel: number;
  pointsToNextLevel: number;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  category: string;
  badge_icon: string;
  points_reward: number;
  rarity: string;
  unlock_criteria: any;
  is_unlocked: boolean;
}

interface RewardItem {
  id: number;
  name: string;
  description: string;
  category: string;
  points_cost: number;
  rarity: string;
  therapeutic_value: string;
  is_available: boolean;
}

interface Challenge {
  id: number;
  name: string;
  description: string;
  challenge_type: string;
  target_goal: number;
  points_reward: number;
  participant_count: number;
  is_active: boolean;
  duration: number;
}

interface WellnessStreak {
  id: number;
  streak_type: string;
  current_streak: number;
  longest_streak: number;
  is_active: boolean;
}

const WellnessRewards: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: wellnessPoints } = useQuery<WellnessPoints>({
    queryKey: ['/api/wellness-points/1'],
    queryFn: () => axios.get('/api/wellness-points/1').then(res => res.data)
  });

  const { data: achievements } = useQuery<Achievement[]>({
    queryKey: ['/api/achievements/1'],
    queryFn: () => axios.get('/api/achievements/1').then(res => res.data)
  });

  const { data: rewards } = useQuery<RewardItem[]>({
    queryKey: ['/api/rewards-shop'],
    queryFn: () => axios.get('/api/rewards-shop').then(res => res.data)
  });

  const { data: challenges } = useQuery<Challenge[]>({
    queryKey: ['/api/community-challenges'],
    queryFn: () => axios.get('/api/community-challenges').then(res => res.data)
  });

  const { data: streaks } = useQuery<WellnessStreak[]>({
    queryKey: ['/api/wellness-streaks/1'],
    queryFn: () => axios.get('/api/wellness-streaks/1').then(res => res.data)
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'engagement': return Trophy;
      case 'milestone': return Star;
      case 'wellness': return Target;
      case 'achievement': return Award;
      default: return Gift;
    }
  };

  const renderOverviewTab = () => {
    return (
      <div className="space-y-6">
        {/* Points Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm theme-text-secondary">Available Points</p>
                <p className="text-2xl font-bold theme-text">{wellnessPoints?.availablePoints || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-[var(--theme-accent)]">
                <Star className="w-6 h-6 theme-text" />
              </div>
            </div>
          </div>

          <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm theme-text-secondary">Current Level</p>
                <p className="text-2xl font-bold theme-text">{wellnessPoints?.currentLevel || 1}</p>
              </div>
              <div className="p-3 rounded-full bg-[var(--theme-accent)]">
                <Trophy className="w-6 h-6 theme-text" />
              </div>
            </div>
          </div>

          <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm theme-text-secondary">Lifetime Points</p>
                <p className="text-2xl font-bold theme-text">{wellnessPoints?.lifetimePoints || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-[var(--theme-accent)]">
                <Award className="w-6 h-6 theme-text" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
          <h3 className="text-lg font-semibold theme-text mb-4">Recent Achievements</h3>
          <div className="space-y-3">
            {Array.isArray(achievements) && achievements.length > 0 ? (
              achievements.slice(0, 3).map((achievement) => {
                const IconComponent = getCategoryIcon(achievement.category);
                return (
                  <div key={achievement.id} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-white/20">
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{achievement.name}</p>
                        <p className="text-sm text-white/60">{achievement.description}</p>
                      </div>
                    </div>
                    <div className="text-sm text-white font-medium">+{achievement.points_reward}</div>
                  </div>
                );
              })
            ) : (
              <p className="text-white/60">No achievements available</p>
            )}
          </div>
        </div>

        {/* Active Streaks */}
        <div className="theme-card rounded-xl p-6 border border-silver hover:border-2 hover:animate-shimmer">
          <h3 className="text-lg font-semibold theme-text mb-4">Active Streaks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.isArray(streaks) && streaks.length > 0 ? (
              streaks.map((streak) => (
                <div key={streak.id} className="p-4 bg-white/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium capitalize">{streak.streak_type.replace('_', ' ')}</span>
                    <span className="text-white font-bold">{streak.current_streak} days</span>
                  </div>
                  <div className="mt-2 w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full"
                      style={{ width: `${Math.min((streak.current_streak / streak.longest_streak) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-white/60">No active streaks</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen theme-primary p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Wellness Rewards</h1>
          <p className="text-white/80">Track your progress and earn rewards for your wellness journey</p>
        </div>

        {/* Navigation Tabs */}
        <div className="w-full theme-surface rounded-lg p-1 mb-6 shadow-lg border border-silver">
          <div className="grid grid-cols-4 gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'rewards', label: 'Rewards Shop', icon: Gift },
              { id: 'challenges', label: 'Challenges', icon: Target },
              { id: 'achievements', label: 'Achievements', icon: Trophy },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shimmer-border w-full px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 theme-text ${
                  activeTab === tab.id
                    ? 'theme-primary shadow-lg border-2 animate-shimmer'
                    : 'theme-surface hover:theme-primary-light hover:shadow-md border hover:border-2 hover:animate-shimmer'
                }`}
              >
                <tab.icon className="w-4 h-4 mx-auto mb-1 theme-text" />
                <div className="text-xs theme-text">
                  {tab.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'rewards' && (
          <div className="text-center py-8 text-white/60">
            <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Rewards shop feature coming soon</p>
          </div>
        )}
        {activeTab === 'challenges' && (
          <div className="text-center py-8 text-white/60">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Challenges feature coming soon</p>
          </div>
        )}
        {activeTab === 'achievements' && (
          <div className="text-center py-8 text-white/60">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Full achievements page coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WellnessRewards;
