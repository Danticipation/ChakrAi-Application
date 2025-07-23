import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Target, Clock, Calendar, Star, Award, CheckCircle, Timer, Users, TrendingUp, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'streak' | 'seasonal';
  reward: {
    points: number;
    badge: string | null;
    exclusive: string | null;
  };
  progress: {
    current: number;
    goal: number;
    streak: boolean;
  };
  icon: string;
  active: boolean;
  startDate: string;
  endDate: string;
  completed?: boolean;
  completedAt?: string;
}

interface LeaderboardEntry {
  id: string;
  username: string;
  totalPoints: number;
  longestStreak: number;
  rank: number;
  avatar?: string;
}

interface RewardPreview {
  type: 'badge' | 'theme' | 'avatar' | 'feature';
  name: string;
  description: string;
  preview?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const starterChallenges: Challenge[] = [
  {
    id: "daily-mood-check",
    title: "Daily Mood Check-In",
    description: "Log your mood today to earn wellness points and track your emotional patterns.",
    type: "daily",
    reward: {
      points: 10,
      badge: null,
      exclusive: null
    },
    progress: {
      current: 0,
      goal: 1,
      streak: false
    },
    icon: "📅",
    active: true,
    startDate: "2025-07-01",
    endDate: "2025-12-31"
  },
  {
    id: "weekly-journals",
    title: "Weekly Journal Writer",
    description: "Complete 5 meaningful journal entries this week to boost your reflection practice.",
    type: "weekly",
    reward: {
      points: 50,
      badge: "🌱 Growth Seeker",
      exclusive: null
    },
    progress: {
      current: 0,
      goal: 5,
      streak: false
    },
    icon: "📓",
    active: true,
    startDate: "2025-07-01",
    endDate: "2025-07-07"
  },
  {
    id: "streak-7-day",
    title: "7-Day Wellness Warrior",
    description: "Maintain your self-care routine by logging mood and journaling daily for 7 consecutive days.",
    type: "streak",
    reward: {
      points: 100,
      badge: "🌟 Wellness Warrior",
      exclusive: null
    },
    progress: {
      current: 0,
      goal: 7,
      streak: false
    },
    icon: "🔥",
    active: true,
    startDate: "2025-07-01",
    endDate: "2025-12-31"
  },
  {
    id: "monthly-mindfulness",
    title: "Mindful Monthly",
    description: "Practice daily mindfulness for 30 days to develop lasting wellness habits.",
    type: "streak",
    reward: {
      points: 300,
      badge: "🧘 Mindfulness Master",
      exclusive: "Zen Garden Theme"
    },
    progress: {
      current: 0,
      goal: 30,
      streak: false
    },
    icon: "🧘",
    active: true,
    startDate: "2025-07-01",
    endDate: "2025-07-31"
  },
  {
    id: "seasonal-self-love",
    title: "14 Days of Self-Love",
    description: "Complete daily affirmations and self-care activities for 14 days in February.",
    type: "seasonal",
    reward: {
      points: 200,
      badge: "❤️ Self-Love Champion",
      exclusive: "Valentine's Avatar Skin"
    },
    progress: {
      current: 0,
      goal: 14,
      streak: true
    },
    icon: "❤️",
    active: false,
    startDate: "2025-02-01",
    endDate: "2025-02-14"
  },
  {
    id: "daily-gratitude",
    title: "Gratitude Practice",
    description: "Write down 3 things you're grateful for each day to boost positive thinking.",
    type: "daily",
    reward: {
      points: 15,
      badge: null,
      exclusive: null
    },
    progress: {
      current: 0,
      goal: 1,
      streak: false
    },
    icon: "🙏",
    active: true,
    startDate: "2025-07-01",
    endDate: "2025-12-31"
  },
  {
    id: "weekly-reflection",
    title: "Weekly Deep Reflection",
    description: "Complete a comprehensive weekly reflection on your growth and challenges.",
    type: "weekly",
    reward: {
      points: 75,
      badge: "🔍 Self-Awareness Badge",
      exclusive: null
    },
    progress: {
      current: 0,
      goal: 1,
      streak: false
    },
    icon: "🔍",
    active: true,
    startDate: "2025-07-01",
    endDate: "2025-07-07"
  },
  {
    id: "chat-engagement",
    title: "AI Companion Connection",
    description: "Have meaningful conversations with your AI companion for 5 days this week.",
    type: "weekly",
    reward: {
      points: 60,
      badge: "🤖 Digital Wellness Partner",
      exclusive: null
    },
    progress: {
      current: 0,
      goal: 5,
      streak: false
    },
    icon: "💬",
    active: true,
    startDate: "2025-07-01",
    endDate: "2025-07-07"
  },
  {
    id: "goal-tracker",
    title: "Weekly Goal Achiever",
    description: "Set and track progress on 3 personal wellness goals this week.",
    type: "weekly",
    reward: {
      points: 80,
      badge: "🎯 Goal Getter",
      exclusive: null
    },
    progress: {
      current: 0,
      goal: 3,
      streak: false
    },
    icon: "🎯",
    active: true,
    startDate: "2025-07-01",
    endDate: "2025-07-07"
  },
  {
    id: "holiday-wellness",
    title: "Holiday Wellness Challenge",
    description: "Maintain your wellness routine during the holiday season with daily check-ins.",
    type: "seasonal",
    reward: {
      points: 500,
      badge: "🎄 Holiday Wellness Hero",
      exclusive: "Winter Wonderland Theme"
    },
    progress: {
      current: 0,
      goal: 25,
      streak: true
    },
    icon: "🎄",
    active: false,
    startDate: "2025-12-01",
    endDate: "2025-12-25"
  }
];

// Dynamic Progress Ring Component
const ProgressRing: React.FC<{
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: 'active' | 'near-complete' | 'streak';
  showPercentage?: boolean;
  animated?: boolean;
}> = ({ 
  progress, 
  size = 80, 
  strokeWidth = 8, 
  color = 'active', 
  showPercentage = true,
  animated = true 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const colorMap = {
    active: '#10b981', // green
    'near-complete': '#f59e0b', // yellow
    streak: '#ef4444' // red/fire
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className={`transform -rotate-90 ${animated ? 'transition-all duration-1000 ease-out' : ''}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-300 dark:text-gray-600"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorMap[color]}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={animated ? 'transition-all duration-1000 ease-out' : ''}
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold theme-text">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
};

// Confetti Animation Component
const ConfettiAnimation: React.FC<{ show: boolean; onComplete: () => void }> = ({ show, onComplete }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 animate-bounce"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 5)],
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
};

// Reward Preview Tooltip Component
const RewardPreview: React.FC<{ reward: RewardPreview; children: React.ReactNode }> = ({ reward, children }) => {
  const [showPreview, setShowPreview] = useState(false);

  const rarityColors = {
    common: 'border-gray-400 bg-gray-50',
    rare: 'border-blue-400 bg-blue-50',
    epic: 'border-purple-400 bg-purple-50',
    legendary: 'border-yellow-400 bg-yellow-50'
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
    >
      {children}
      {showPreview && (
        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 rounded-lg border-2 ${rarityColors[reward.rarity]} shadow-lg z-10 min-w-48`}>
          <div className="text-sm font-bold text-gray-800">{reward.name}</div>
          <div className="text-xs text-gray-600 mt-1">{reward.description}</div>
          {reward.preview && (
            <div className="mt-2 text-xs bg-white rounded p-2 border">
              {reward.preview}
            </div>
          )}
          <div className={`text-xs mt-1 font-medium ${
            reward.rarity === 'legendary' ? 'text-yellow-600' :
            reward.rarity === 'epic' ? 'text-purple-600' :
            reward.rarity === 'rare' ? 'text-blue-600' : 'text-gray-600'
          }`}>
            {reward.rarity.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
};

interface ChallengeSystemProps {
  onNavigate?: (section: string) => void;
  onMobileModalNavigate?: (section: string) => void;
}

const ChallengeSystem: React.FC<ChallengeSystemProps> = ({ onNavigate, onMobileModalNavigate }) => {
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>(starterChallenges);
  const [selectedTab, setSelectedTab] = useState('active');
  const [userStats, setUserStats] = useState({
    totalPoints: 0,
    level: 1,
    completedChallenges: 0,
    activeStreaks: 0,
    longestStreak: 0
  });

  // Get navigation target for challenge completion - fixed to match actual challenge IDs
  const getChallengeNavigationTarget = useCallback((challengeId: string): { section: string; description: string } => {
    switch (challengeId) {
      case 'weekly-journals':
        return { section: 'journal', description: 'Go to Journal' };
      case 'streak-7-day':
        return { section: 'daily', description: 'Track Mood' };
      case 'monthly-mindfulness':
        return { section: 'daily', description: 'Daily Reflection' };
      case 'seasonal-self-love':
        return { section: 'daily', description: 'View Affirmations' };
      case 'daily-gratitude':
        return { section: 'journal', description: 'Write Gratitude' };
      case 'weekly-reflection':
        return { section: 'daily', description: 'Weekly Reflection' };
      case 'chat-engagement':
        return { section: 'chat', description: 'Chat with AI' };
      case 'goal-tracker':
        return { section: 'analytics', description: 'Set Goals' };
      case 'holiday-wellness':
        return { section: 'daily', description: 'Wellness Check-in' };
      default:
        return { section: 'journal', description: 'Complete Challenge' };
    }
  }, []);

  const handleChallengeNavigation = (challengeId: string) => {
    const target = getChallengeNavigationTarget(challengeId);
    console.log('🎯 Challenge navigation clicked:', challengeId, target);
    console.log('🎯 onNavigate prop available:', !!onNavigate);
    console.log('🎯 onMobileModalNavigate prop available:', !!onMobileModalNavigate);
    
    if (onNavigate) {
      console.log('🎯 Calling navigation with section:', target.section);
      
      // Check if we're on mobile and this section should use modal navigation
      const isMobile = window.innerWidth < 768; // md breakpoint
      const modalSections = ['journal', 'analytics', 'daily', 'challenges', 'rewards', 'community', 'vr', 'health', 'agents', 'adaptive', 'therapy-plans'];
      
      if (isMobile && modalSections.includes(target.section) && onMobileModalNavigate) {
        console.log('🎯 Using mobile modal navigation for:', target.section);
        onMobileModalNavigate(target.section);
      } else {
        console.log('🎯 Using standard navigation for:', target.section);
        onNavigate(target.section);
      }
      
      // Use toast notification instead of manual DOM manipulation
      toast({
        title: "Navigation",
        description: `🎯 Navigating to ${target.description}...`,
        duration: 2000,
      });
      
      // Scroll to top to ensure new section is prominently visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      console.error('onNavigate function not available');
    }
  };
  
  // Enhanced state for animations and features
  const [showConfetti, setShowConfetti] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');
  const [leaderboard] = useState<LeaderboardEntry[]>([
    { id: '1', username: 'MindfulMaven', totalPoints: 1250, longestStreak: 45, rank: 1, avatar: '🧘‍♀️' },
    { id: '2', username: 'WellnessWarrior', totalPoints: 980, longestStreak: 32, rank: 2, avatar: '💪' },
    { id: '3', username: 'ZenSeeker', totalPoints: 756, longestStreak: 28, rank: 3, avatar: '🌸' },
    { id: '4', username: 'You', totalPoints: 425, longestStreak: 18, rank: 4, avatar: '✨' },
    { id: '5', username: 'CalmCrafter', totalPoints: 220, longestStreak: 15, rank: 5, avatar: '🎨' }
  ]);

  // Reward previews for interactive tooltips - updated to match challenge IDs
  const rewardPreviews: Record<string, RewardPreview> = {
    'weekly-journals': {
      type: 'badge',
      name: 'Growth Seeker Badge',
      description: 'Unlocked for completing weekly journal writing',
      preview: '🌱 A beautiful growing plant animation',
      rarity: 'rare'
    },
    'monthly-mindfulness': {
      type: 'theme',
      name: 'Zen Garden Theme',
      description: 'Peaceful green and earth tones with bamboo accents',
      preview: '🎋 Soft greens, gentle animations, nature sounds',
      rarity: 'epic'
    },
    'holiday-wellness': {
      type: 'badge',
      name: 'Holiday Wellness Hero',
      description: 'Maintained wellness routine during holiday season',
      preview: '🎄 Festive badge with snowflake animations',
      rarity: 'legendary'
    },
    'streak-7-day': {
      type: 'badge',
      name: 'Wellness Warrior',
      description: '7-day streak achievement badge',
      preview: '🌟 Sparkling star animation with flame effects',
      rarity: 'epic'
    },
    'chat-engagement': {
      type: 'badge',
      name: 'Digital Wellness Partner',
      description: 'Connected with AI companion for meaningful conversations',
      preview: '🤖 Interactive chat bubble animation',
      rarity: 'rare'
    },
    'goal-tracker': {
      type: 'badge',
      name: 'Goal Getter',
      description: 'Successfully tracked and achieved personal goals',
      preview: '🎯 Target hit animation with celebration',
      rarity: 'rare'
    }
  };

  const getTypeIcon = useCallback((type: Challenge['type']) => {
    switch (type) {
      case 'daily': return <Calendar className="h-4 w-4" />;
      case 'weekly': return <Clock className="h-4 w-4" />;
      case 'streak': return <Target className="h-4 w-4" />;
      case 'seasonal': return <Star className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  }, []);

  const getTypeColor = useCallback((type: Challenge['type']) => {
    switch (type) {
      case 'daily': return 'bg-blue-500';
      case 'weekly': return 'bg-green-500';
      case 'streak': return 'bg-red-500';
      case 'seasonal': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  }, []);

  const calculateProgress = useCallback((current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  }, []);

  // Enhanced completion with animations and sound
  const playCompletionSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApJn+fuwmUnBSN/y+/ckEAKFVyx5++lUxMJR5zl8L1nIAYujdXw2YAxBy13x+/aikAKGV+35++nVBEKSp/j8cNliQU5ijfP8dm5cxOG4A');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Fail silently if audio doesn't work
    } catch (e) {
      // Ignore audio errors
    }
  };

  const handleClaimReward = (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    // Update challenge completion
    setChallenges(prev => 
      prev.map(c => 
        c.id === challengeId 
          ? { ...c, progress: { ...c.progress, current: c.progress.goal }, completed: true, completedAt: new Date().toISOString() }
          : c
      )
    );

    // Update user stats - derivedStats will automatically recalculate streaks
    setUserStats(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + challenge.reward.points,
      completedChallenges: prev.completedChallenges + 1
    }));

    // Trigger celebration animations and toast notification
    setShowConfetti(true);
    setCompletionMessage(`${challenge.reward.badge || 'Achievement'} Unlocked!`);
    playCompletionSound();
    
    toast({
      title: "Challenge Complete!",
      description: `🎉 ${challenge.reward.badge || 'Achievement'} Unlocked! +${challenge.reward.points} points`,
      duration: 4000,
    });
  };

  const getProgressColor = useCallback((current: number, goal: number, type: Challenge['type']): 'active' | 'near-complete' | 'streak' => {
    const progress = (current / goal) * 100;
    if (type === 'streak') return 'streak';
    if (progress >= 80) return 'near-complete';
    return 'active';
  }, []);

  // Derive stats in useMemo to recalculate activeStreaks and longestStreak
  const derivedStats = useMemo(() => {
    const completedStreakChallenges = challenges.filter(c => 
      c.type === 'streak' && c.progress.current >= c.progress.goal
    );
    const activeStreakChallenges = challenges.filter(c => 
      c.type === 'streak' && c.progress.current > 0 && c.progress.current < c.progress.goal
    );
    
    return {
      ...userStats,
      activeStreaks: activeStreakChallenges.length,
      longestStreak: Math.max(0, ...completedStreakChallenges.map(c => c.progress.goal))
    };
  }, [challenges, userStats]);

  // Non-mutating leaderboard sorts using useMemo
  const topPoints = useMemo(
    () => [...leaderboard].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 5),
    [leaderboard]
  );
  
  const topStreaks = useMemo(
    () => [...leaderboard].sort((a, b) => b.longestStreak - a.longestStreak).slice(0, 5),
    [leaderboard]
  );

  const activeChallenges = useMemo(() => challenges.filter(c => c.active), [challenges]);
  const completedChallenges = useMemo(() => challenges.filter(c => c.progress.current >= c.progress.goal), [challenges]);
  const upcomingChallenges = useMemo(() => challenges.filter(c => !c.active), [challenges]);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Total Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{userStats.totalPoints}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-500" />
              Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{userStats.level}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{userStats.completedChallenges}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Timer className="h-5 w-5 text-red-500" />
              Active Streaks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{derivedStats.activeStreaks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Challenge Tabs - Enhanced with Leaderboard */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4" role="tablist">
          <TabsTrigger 
            value="active" 
            className="text-xs md:text-sm" 
            role="tab" 
            aria-selected={selectedTab === 'active'}
            aria-controls="active-panel"
          >
            Active ({activeChallenges.length})
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="text-xs md:text-sm" 
            role="tab" 
            aria-selected={selectedTab === 'completed'}
            aria-controls="completed-panel"
          >
            Completed ({completedChallenges.length})
          </TabsTrigger>
          <TabsTrigger 
            value="upcoming" 
            className="text-xs md:text-sm" 
            role="tab" 
            aria-selected={selectedTab === 'upcoming'}
            aria-controls="upcoming-panel"
          >
            Upcoming ({upcomingChallenges.length})
          </TabsTrigger>
          <TabsTrigger 
            value="leaderboard" 
            className="text-xs md:text-sm" 
            role="tab" 
            aria-selected={selectedTab === 'leaderboard'}
            aria-controls="leaderboard-panel"
          >
            <Users className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4" role="tabpanel" id="active-panel" aria-labelledby="active-tab">
          {/* Mobile: Single Column Stack */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeChallenges.map((challenge) => (
              <Card key={challenge.id} className="theme-surface border-theme-accent/30 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{challenge.icon}</span>
                      <Badge 
                        variant="secondary" 
                        className={`${getTypeColor(challenge.type)} text-white`}
                      >
                        {getTypeIcon(challenge.type)}
                        <span className="ml-1 capitalize">{challenge.type}</span>
                      </Badge>
                    </div>
                    <div className="text-sm theme-text-secondary">
                      {challenge.reward.points} pts
                    </div>
                  </div>
                  <CardTitle className="text-lg theme-text">{challenge.title}</CardTitle>
                  <CardDescription className="theme-text-secondary">
                    {challenge.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Dynamic Progress Ring with Percentage */}
                  <div className="flex items-center justify-center">
                    <ProgressRing
                      progress={calculateProgress(challenge.progress.current, challenge.progress.goal)}
                      size={100}
                      strokeWidth={10}
                      color={getProgressColor(challenge.progress.current, challenge.progress.goal, challenge.type)}
                      showPercentage={true}
                      animated={true}
                    />
                  </div>
                  
                  <div className="text-center text-sm theme-text-secondary">
                    {challenge.progress.current} of {challenge.progress.goal} completed
                  </div>
                  
                  {/* Interactive Reward Preview */}
                  {challenge.reward.badge && (
                    <RewardPreview reward={rewardPreviews[challenge.id] || {
                      type: 'badge',
                      name: challenge.reward.badge,
                      description: 'Earn this achievement by completing the challenge',
                      rarity: 'common'
                    }}>
                      <div className="text-sm theme-text-secondary cursor-pointer hover:text-purple-500 transition-colors">
                        <strong>🎁 Reward:</strong> {challenge.reward.badge}
                      </div>
                    </RewardPreview>
                  )}
                  
                  {challenge.reward.exclusive && (
                    <RewardPreview reward={rewardPreviews[challenge.id] || {
                      type: 'theme',
                      name: challenge.reward.exclusive,
                      description: 'Exclusive unlock available only through this challenge',
                      rarity: 'legendary'
                    }}>
                      <div className="text-sm text-purple-600 dark:text-purple-400 cursor-pointer hover:text-purple-400 transition-colors">
                        <strong>✨ Exclusive:</strong> {challenge.reward.exclusive}
                      </div>
                    </RewardPreview>
                  )}
                  
                  {challenge.progress.streak && (
                    <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                      <Target className="h-4 w-4" />
                      <span>Streak Challenge</span>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    {challenge.progress.current >= challenge.progress.goal ? (
                      <Button 
                        onClick={() => handleClaimReward(challenge.id)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Claim Reward
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleChallengeNavigation(challenge.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {getChallengeNavigationTarget(challenge.id).description}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedChallenges.map((challenge) => (
              <Card key={challenge.id} className="theme-surface border-green-500/30 opacity-75">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{challenge.icon}</span>
                      <Badge variant="secondary" className="bg-green-500 text-white">
                        <CheckCircle className="h-3 w-3" />
                        <span className="ml-1">Completed</span>
                      </Badge>
                    </div>
                    <div className="text-sm theme-text-secondary">
                      +{challenge.reward.points} pts
                    </div>
                  </div>
                  <CardTitle className="text-lg theme-text">{challenge.title}</CardTitle>
                </CardHeader>
                
                <CardContent>
                  <Progress value={100} className="h-2" />
                  <div className="mt-2 text-sm theme-text-secondary">
                    Challenge completed! Reward claimed.
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingChallenges.map((challenge) => (
              <Card key={challenge.id} className="theme-surface border-theme-accent/30 opacity-60">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{challenge.icon}</span>
                      <Badge variant="secondary" className="bg-gray-500 text-white">
                        <Clock className="h-3 w-3" />
                        <span className="ml-1">Upcoming</span>
                      </Badge>
                    </div>
                    <div className="text-sm theme-text-secondary">
                      {challenge.reward.points} pts
                    </div>
                  </div>
                  <CardTitle className="text-lg theme-text">{challenge.title}</CardTitle>
                  <CardDescription className="theme-text-secondary">
                    {challenge.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="text-sm theme-text-secondary">
                    <strong>Starts:</strong> {new Date(challenge.startDate).toLocaleDateString()}
                  </div>
                  <div className="text-sm theme-text-secondary">
                    <strong>Ends:</strong> {new Date(challenge.endDate).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-bold theme-text">🏆 Top Wellness Champions</h3>
              <p className="text-sm theme-text-secondary mt-1">Community wellness leaderboard this month</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Wellness Points Earners */}
              <Card className="theme-surface border-theme-accent/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 theme-text">
                    <TrendingUp className="h-5 w-5 text-yellow-500" />
                    Top Points Earners
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topPoints.map((entry, index) => (
                    <div key={entry.id} className={`flex items-center justify-between p-3 rounded-lg ${
                      entry.username === 'You' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'theme-card'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-xl">{entry.avatar}</span>
                        <div>
                          <div className={`font-medium ${entry.username === 'You' ? 'text-blue-600 dark:text-blue-400' : 'theme-text'}`}>
                            {entry.username}
                          </div>
                          <div className="text-sm theme-text-secondary">
                            {entry.totalPoints} points
                          </div>
                        </div>
                      </div>
                      {index < 3 && (
                        <div className="text-2xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Longest Streak Holders */}
              <Card className="theme-surface border-theme-accent/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 theme-text">
                    <Target className="h-5 w-5 text-red-500" />
                    Longest Streaks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topStreaks.map((entry, index) => (
                    <div key={entry.id} className={`flex items-center justify-between p-3 rounded-lg ${
                      entry.username === 'You' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'theme-card'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-800 flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <span className="text-xl">{entry.avatar}</span>
                        <div>
                          <div className={`font-medium ${entry.username === 'You' ? 'text-blue-600 dark:text-blue-400' : 'theme-text'}`}>
                            {entry.username}
                          </div>
                          <div className="text-sm theme-text-secondary">
                            {entry.longestStreak} days
                          </div>
                        </div>
                      </div>
                      {entry.longestStreak >= 30 && (
                        <div className="text-xl">🔥</div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Community Challenge Participation */}
            <Card className="theme-surface border-theme-accent/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 theme-text">
                  <Users className="h-5 w-5 text-purple-500" />
                  Community Challenge
                </CardTitle>
                <CardDescription className="theme-text-secondary">
                  Join the monthly community wellness challenge
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-bold theme-text">Collective Mindfulness Hours</div>
                  <div className="text-2xl font-bold text-purple-600">847 / 1000</div>
                </div>
                <Progress value={84.7} className="h-3 mb-2" />
                <div className="text-sm theme-text-secondary text-center">
                  15 days left • {leaderboard.length} participants contributing
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Confetti Animation */}
      <ConfettiAnimation 
        show={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />

      {/* Completion Message */}
      {completionMessage && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg text-lg font-bold animate-bounce">
          {completionMessage}
        </div>
      )}
    </div>
  );
};

export default ChallengeSystem;