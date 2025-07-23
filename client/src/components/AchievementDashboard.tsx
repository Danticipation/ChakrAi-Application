import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, Trophy, Star, Target, Calendar, Flame, TrendingUp, Lock, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

interface Achievement {
  id: number;
  userId: number;
  badgeId: string;
  unlockedAt: string | null;
  progress: number | null;
  isActive: boolean | null;
  badge?: Badge;
}

interface WellnessStreak {
  id: number;
  userId: number;
  streakType: string;
  currentStreak: number | null;
  longestStreak: number | null;
  lastActivity: string | null;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'engagement' | 'milestone' | 'wellness' | 'achievement';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  isLocked?: boolean;
  unlockRequirement?: string;
}

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Reusable Loading Component
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center py-8" role="status" aria-label={message}>
    <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-500" />
    <span className="text-sm text-gray-600">{message}</span>
  </div>
);

// Reusable Error Component
const ErrorMessage: React.FC<{ error: string; onRetry?: () => void }> = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
    <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
    <h3 className="text-sm font-medium text-red-800 mb-1">Error Loading Data</h3>
    <p className="text-xs text-red-600 text-center mb-3">{error}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded transition-colors"
        aria-label="Retry loading data"
      >
        Try Again
      </button>
    )}
  </div>
);

interface AchievementDashboardProps {
  userId: number;
}

export default function AchievementDashboard({ userId }: AchievementDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Implement proper fetcher functions for React Query
  const { 
    data: achievementsData, 
    isLoading: achievementsLoading, 
    error: achievementsError,
    refetch: refetchAchievements 
  } = useQuery<ApiResponse<Achievement[]>>({
    queryKey: ['achievements', userId],
    queryFn: async () => {
      const response = await axios.get(`/api/achievements/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });

  const { 
    data: streaksData, 
    isLoading: streaksLoading, 
    error: streaksError,
    refetch: refetchStreaks 
  } = useQuery<ApiResponse<WellnessStreak[]>>({
    queryKey: ['wellness-streaks', userId],
    queryFn: async () => {
      const response = await axios.get(`/api/wellness-streaks/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });

  const { 
    data: badgesData, 
    isLoading: badgesLoading, 
    error: badgesError,
    refetch: refetchBadges 
  } = useQuery<ApiResponse<Badge[]>>({
    queryKey: ['badges'],
    queryFn: async () => {
      const response = await axios.get('/api/badges');
      return response.data;
    },
  });

  const { 
    data: userStatsData, 
    isLoading: statsLoading, 
    error: statsError,
    refetch: refetchStats 
  } = useQuery<ApiResponse<Record<string, any>>>({
    queryKey: ['user-stats', userId],
    queryFn: async () => {
      const response = await axios.get(`/api/user-stats/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });

  // Extract data with proper fallbacks
  const achievements: Achievement[] = achievementsData?.data || [];
  const streaks: WellnessStreak[] = streaksData?.data || [];
  const badges: Badge[] = badgesData?.data || [];
  const userStats: Record<string, any> = userStatsData?.data || {};

  // Enhanced loading and error states
  if (achievementsLoading || streaksLoading || badgesLoading || statsLoading) {
    return <LoadingSpinner message="Loading achievement dashboard..." />;
  }

  if (achievementsError || streaksError || badgesError || statsError) {
    const error = achievementsError || streaksError || badgesError || statsError;
    return (
      <ErrorMessage 
        error={error?.message || 'Failed to load achievement data'} 
        onRetry={() => {
          refetchAchievements();
          refetchStreaks();
          refetchBadges();
          refetchStats();
        }}
      />
    );
  }

  // Optimized badge lookup using Map for O(1) performance
  const badgeMap = new Map(badges.map(badge => [badge.id, badge]));
  const earnedBadgeIds = new Set(achievements.map(a => a.badgeId));
  
  const totalPoints = achievements.reduce((sum, achievement) => {
    const badge = badgeMap.get(achievement.badgeId);
    return sum + (badge?.points || 0);
  }, 0);

  const currentLevel = Math.floor(totalPoints / 100) + 1;
  const pointsToNextLevel = (currentLevel * 100) - totalPoints;

  // Enhanced rarity color mapping with better contrast for accessibility
  const rarityColorMap = new Map([
    ['common', 'text-gray-700 bg-gray-100 border-gray-300'],
    ['rare', 'text-blue-700 bg-blue-100 border-blue-300'],
    ['epic', 'text-purple-700 bg-purple-100 border-purple-300'],
    ['legendary', 'text-yellow-700 bg-yellow-100 border-yellow-300']
  ]);

  const getRarityColor = (rarity: string): string => {
    return rarityColorMap.get(rarity) || 'text-gray-700 bg-gray-100 border-gray-300';
  };

  // Progress calculation with animated bars
  const levelProgress = totalPoints % 100;
  const progressPercentage = Math.round((levelProgress / 100) * 100);

  const getStreakIcon = (type: string) => {
    switch (type) {
      case 'daily_checkin': return <Calendar className="w-4 h-4" />;
      case 'journal_entry': return <Award className="w-4 h-4" />;
      case 'mood_tracking': return <Star className="w-4 h-4" />;
      case 'chat_session': return <Target className="w-4 h-4" />;
      case 'goal_progress': return <TrendingUp className="w-4 h-4" />;
      default: return <Flame className="w-4 h-4" />;
    }
  };

  const getStreakLabel = (type: string) => {
    switch (type) {
      case 'daily_checkin': return 'Daily Check-in';
      case 'journal_entry': return 'Journaling';
      case 'mood_tracking': return 'Mood Tracking';
      case 'chat_session': return 'Chat Sessions';
      case 'goal_progress': return 'Goal Progress';
      default: return type;
    }
  };

  const filteredBadges = selectedCategory === 'all' 
    ? badges 
    : badges.filter((badge) => badge.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Achievement Center
        </h2>
        <p className="text-sm opacity-80" style={{ color: 'var(--text-primary)' }}>
          Track your wellness journey and earn rewards
        </p>
      </div>

      {/* Level & Points Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-4 text-center shadow-sm border-2 border-silver" style={{ backgroundColor: 'var(--pale-green)' }}>
          <Trophy className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--soft-blue-dark)' }} />
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Level {currentLevel}
          </div>
          <div className="text-sm opacity-80" style={{ color: 'var(--text-primary)' }}>
            {totalPoints} total points
          </div>
          {pointsToNextLevel > 0 && (
            <>
              <div className="text-xs mt-1" style={{ color: 'var(--text-primary)' }}>
                {pointsToNextLevel} to next level
              </div>
              {/* Animated Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                  role="progressbar"
                  aria-valuenow={progressPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Level progress: ${progressPercentage}% complete`}
                />
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl p-4 text-center shadow-sm border-2 border-silver" style={{ backgroundColor: 'var(--gentle-lavender)' }}>
          <Award className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--soft-blue-dark)' }} />
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {achievements.length}
          </div>
          <div className="text-sm opacity-80" style={{ color: 'var(--text-primary)' }}>
            Badges Earned
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-primary)' }}>
            of {badges.length} available
          </div>
        </div>
      </div>

      {/* Wellness Streaks */}
      <div className="rounded-2xl p-4 shadow-sm border-2 border-silver" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
          <Flame className="w-5 h-5 mr-2" style={{ color: 'var(--soft-blue-dark)' }} />
          Wellness Streaks
        </h3>
        <div className="space-y-3">
          {streaks.map((streak) => (
            <div key={streak.id} className="flex items-center justify-between p-3 rounded-xl border-2 border-silver" 
                 style={{ backgroundColor: 'var(--pale-green)' }}>
              <div className="flex items-center">
                <div className="p-2 rounded-lg mr-3 border-2 border-silver" style={{ backgroundColor: 'var(--soft-blue-dark)', color: 'white' }}>
                  {getStreakIcon(streak.streakType)}
                </div>
                <div>
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {getStreakLabel(streak.streakType)}
                  </div>
                  <div className="text-sm opacity-80" style={{ color: 'var(--text-primary)' }}>
                    Best: {streak.longestStreak || 0} days
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: 'var(--soft-blue-dark)' }}>
                  {streak.currentStreak || 0}
                </div>
                <div className="text-xs opacity-80" style={{ color: 'var(--text-primary)' }}>
                  current
                </div>
              </div>
            </div>
          ))}
          {streaks.length === 0 && (
            <div className="text-center py-4 opacity-60" style={{ color: 'var(--text-primary)' }}>
              Start your wellness activities to build streaks!
            </div>
          )}
        </div>
      </div>

      {/* Badge Categories with Accessibility */}
      <div className="flex flex-wrap gap-2 justify-center" role="tablist" aria-label="Badge categories">
        {['all', 'engagement', 'milestone', 'wellness', 'achievement'].map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            role="tab"
            aria-selected={selectedCategory === category}
            aria-controls={`badge-panel-${category}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border-2 border-silver focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              selectedCategory === category 
                ? 'text-white' 
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{ 
              backgroundColor: selectedCategory === category 
                ? 'var(--soft-blue-dark)' 
                : 'var(--surface-secondary)',
              color: selectedCategory === category 
                ? 'white' 
                : 'var(--text-primary)'
            }}
          >
            {category === 'all' ? 'All Badges' : category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Enhanced Badge Grid with Locked Badge UI */}
      <div className="grid grid-cols-1 gap-3" role="region" aria-label="Badges collection">
        {filteredBadges.map((badge) => {
          const isEarned = earnedBadgeIds.has(badge.id);
          const achievement = achievements.find(a => a.badgeId === badge.id);
          
          return (
            <article 
              key={badge.id}
              className={`rounded-2xl p-4 shadow-sm transition-all duration-300 border-2 border-silver ${
                isEarned 
                  ? 'ring-2 ring-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50' 
                  : 'opacity-60 hover:opacity-80'
              }`}
              style={{ backgroundColor: isEarned ? undefined : 'var(--surface-secondary)' }}
              role="group"
              aria-label={`${badge.name} badge, ${isEarned ? 'earned' : 'locked'}`}
            >
              <div className="flex items-start space-x-3">
                <div className="relative">
                  <div className={`text-3xl transition-all ${isEarned ? 'scale-110' : 'grayscale opacity-50'}`}>
                    {badge.icon}
                  </div>
                  {!isEarned && (
                    <div className="absolute -top-1 -right-1 bg-gray-600 rounded-full p-1">
                      <Lock className="w-3 h-3 text-white" aria-hidden="true" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {badge.name}
                      {!isEarned && (
                        <span className="sr-only"> (locked)</span>
                      )}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span 
                        className={`px-2 py-1 rounded-lg text-xs font-medium border ${getRarityColor(badge.rarity)}`}
                        aria-label={`${badge.rarity} rarity badge`}
                      >
                        {badge.rarity}
                      </span>
                      <span 
                        className="text-sm font-medium" 
                        style={{ color: 'var(--soft-blue-dark)' }}
                        aria-label={`Worth ${badge.points} points`}
                      >
                        {badge.points}pts
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm opacity-80 mb-2" style={{ color: 'var(--text-primary)' }}>
                    {badge.description}
                  </p>
                  
                  {isEarned ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-green-600 font-medium">
                        <Star className="w-3 h-3 mr-1" />
                        <span>Unlocked</span>
                      </div>
                      {achievement?.unlockedAt && (
                        <span className="text-xs text-gray-500">
                          {format(new Date(achievement.unlockedAt), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center text-xs text-gray-500">
                      <Lock className="w-3 h-3 mr-1" />
                      <span>Complete wellness activities to unlock</span>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
        
        {filteredBadges.length === 0 && (
          <div className="text-center py-8 px-4" role="status">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-600 mb-1">No badges in this category</h3>
            <p className="text-sm text-gray-500">Try selecting a different category to view available badges</p>
          </div>
        )}
      </div>

      {/* Motivational Message */}
      <div className="text-center p-4 rounded-2xl border-2 border-silver" style={{ backgroundColor: 'var(--gentle-lavender)' }}>
        <Star className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--soft-blue-dark)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Every small step in your wellness journey counts. Keep going!
        </p>
      </div>
    </div>
  );
}