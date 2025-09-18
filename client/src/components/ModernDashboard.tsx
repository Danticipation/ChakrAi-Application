import React, { useState, useEffect, useCallback } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import Animation, { StaggeredAnimation, TherapeuticEntrance, WellnessReveal, MindfulSlide } from '@/components/ui/Animation';
import {
  SwipeableCard
} from '@/components/ui/MobileAnimation';
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Target,
  Activity,
  Brain,
  Heart,
  BookOpen,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Play,
  Zap
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: string | null;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'stable' | null;
}

interface ModernDashboardProps {
  userId: number | null;
  onNavigate: (section: string) => void;
}

const ModernDashboard: React.FC<ModernDashboardProps> = ({ userId, onNavigate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mobile detection
  const checkMobile = useCallback(() => {
    const mobile = window.innerWidth <= 768 || 'ontouchstart' in window;
    setIsMobile(mobile);
    return mobile;
  }, []);

  useEffect(() => {
    checkMobile();
    const handleResize = () => checkMobile();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkMobile]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  }, []);

  // Fetch real data from APIs
  const fetchDashboardData = useCallback(async () => {
      if (!userId) {
        console.log('â³ Waiting for userId...');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('ðŸ“Š Fetching real dashboard data for user:', userId);

        // Fetch data from multiple endpoints
        const [journalResponse, moodResponse, chatResponse] = await Promise.allSettled([
          fetch('/api/journal/analytics'),
          fetch('/api/mood/analytics'), 
          fetch('/api/chat/analytics')
        ]);

        let journalData = null;
        let moodData = null;
        let chatData = null;

        // Process journal analytics
        if (journalResponse.status === 'fulfilled' && journalResponse.value.ok) {
          journalData = await journalResponse.value.json();
          console.log('âœ… Journal data:', journalData);
        } else {
          console.warn('âš ï¸ Journal analytics failed, using defaults');
        }

        // Process mood analytics  
        if (moodResponse.status === 'fulfilled' && moodResponse.value.ok) {
          moodData = await moodResponse.value.json();
          console.log('âœ… Mood data:', moodData);
        } else {
          console.warn('âš ï¸ Mood analytics failed, using defaults');
        }

        // Process chat analytics
        if (chatResponse.status === 'fulfilled' && chatResponse.value.ok) {
          chatData = await chatResponse.value.json();
          console.log('âœ… Chat data:', chatData);
        } else {
          console.warn('âš ï¸ Chat analytics failed, using defaults');
        }

        // Fetch recent journal entries for activity feed
        let recentEntries = [];
        try {
          const entriesResponse = await fetch('/api/journal/user-entries');
          if (entriesResponse.ok) {
            const entries = await entriesResponse.json();
            recentEntries = entries.slice(0, 3); // Get last 3 entries
            console.log('âœ… Recent entries:', recentEntries.length);
          }
        } catch (entriesError) {
          console.warn('âš ï¸ Failed to fetch recent entries:', entriesError);
        }

        // Calculate real metrics
        const totalJournalEntries = journalData?.total || 0;
        const recentJournalEntries = journalData?.recent || 0;
        const totalChatSessions = chatData?.total || 0;
        const currentStreak = calculateStreak(recentEntries);
        const weeklyProgress = calculateWeeklyProgress(recentEntries);
        const moodTrend = calculateMoodTrend(moodData);

        // Build real dashboard data
        const realDashboardData = {
          metrics: {
            currentStreak: currentStreak,
            weeklyProgress: weeklyProgress,
            completedSessions: totalChatSessions,
            moodTrend: moodTrend.label,
            moodTrendDirection: moodTrend.direction,
            totalEntries: totalJournalEntries,
            recentEntries: recentJournalEntries
          },
          todaysSchedule: generateTodaysSchedule(),
          recentActivity: generateRecentActivity(recentEntries),
          insights: generateInsights(totalJournalEntries, totalChatSessions, moodTrend)
        };

        console.log('ðŸ“Š Real dashboard data compiled:', realDashboardData);
        setDashboardData(realDashboardData);

      } catch (error) {
        console.error('âŒ Failed to fetch dashboard data:', error);
        setError('Failed to load dashboard data');
        
        // Fallback to minimal data structure
        setDashboardData({
          metrics: {
            currentStreak: 0,
            weeklyProgress: 0, 
            completedSessions: 0,
            moodTrend: 'neutral',
            moodTrendDirection: 'stable'
          },
          todaysSchedule: generateTodaysSchedule(),
          recentActivity: [],
          insights: {
            primaryFocus: 'Getting Started',
            progressNote: 'Begin your wellness journey by creating your first journal entry',
            nextGoal: 'Complete your first reflection'
          }
        });
      } finally {
        setLoading(false);
      }
    }, [userId]);

  // Fetch real data from APIs
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, userId]);

  // Helper functions for real data calculations
  const calculateStreak = (entries: any[]) => {
    if (!entries || entries.length === 0) return 0;
    
    // Sort entries by date (newest first)
    const sortedEntries = entries.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    let streak = 0;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.createdAt);
      entryDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff > streak) {
        break;
      }
    }
    
    return streak;
  };

  const calculateWeeklyProgress = (entries: any[]) => {
    if (!entries || entries.length === 0) return 0;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyEntries = entries.filter(entry => 
      new Date(entry.createdAt) >= oneWeekAgo
    );
    
    // Target: 1 entry per day = 7 entries per week
    const progress = Math.min((weeklyEntries.length / 7) * 100, 100);
    return Math.round(progress);
  };

  const calculateMoodTrend = (moodData: any) => {
    if (!moodData || !moodData.recent) {
      return { label: 'No Data', direction: 'stable' };
    }
    
    // This would need real mood data structure
    // For now, return a placeholder based on activity
    if (moodData.recent > 0) {
      return { label: 'Active', direction: 'up' };
    }
    
    return { label: 'Getting Started', direction: 'stable' };
  };

  const generateTodaysSchedule = () => {
    const now = new Date();
    const currentHour = now.getHours();
    
    const schedule = [
      { 
        time: '09:00', 
        type: 'check-in', 
        title: 'Morning Reflection', 
        status: currentHour > 9 ? 'completed' : 'pending' 
      },
      { 
        time: '14:00', 
        type: 'session', 
        title: 'Mindful Break', 
        status: currentHour > 14 ? 'completed' : 'pending' 
      },
      { 
        time: '19:00', 
        type: 'reflection', 
        title: 'Evening Journal', 
        status: currentHour > 19 ? 'completed' : 'pending' 
      }
    ];
    
    return schedule;
  };

  const generateRecentActivity = (entries: any[]) => {
    if (!entries || entries.length === 0) {
      return [
        { 
          type: 'system', 
          title: 'Welcome to Chakrai! Start by creating your first journal entry.', 
          time: 'Now' 
        }
      ];
    }
    
    return entries.slice(0, 3).map((entry, index) => {
      const entryDate = new Date(entry.createdAt);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60));
      
      let timeAgo;
      if (diffHours < 1) {
        timeAgo = 'Just now';
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      }
      
      return {
        type: 'journal',
        title: `Journal entry: "${entry.title || 'Untitled'}"`,
        time: timeAgo
      };
    });
  };

  const generateInsights = (totalEntries: number, totalSessions: number, moodTrend: any) => {
    if (totalEntries === 0 && totalSessions === 0) {
      return {
        primaryFocus: 'Getting Started',
        progressNote: 'Welcome to your wellness journey! Begin by exploring the available tools.',
        nextGoal: 'Create your first journal entry or start a conversation'
      };
    }
    
    if (totalEntries > 0 && totalSessions === 0) {
      return {
        primaryFocus: 'Journaling Progress',
        progressNote: `You've created ${totalEntries} journal entr${totalEntries === 1 ? 'y' : 'ies'}. Great start!`,
        nextGoal: 'Try starting an AI conversation to explore your thoughts further'
      };
    }
    
    return {
      primaryFocus: 'Active Engagement',
      progressNote: `You have ${totalEntries} journal entries and ${totalSessions} chat sessions. Keep up the great work!`,
      nextGoal: 'Continue building your daily reflection habit'
    };
  };

  const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon: Icon, trend }) => {
    const content = (
      <>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg animate-gentle-pulse">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                {value}
              </p>
            </div>
          </div>
          {change && (
            <div className={`flex items-center space-x-1 text-sm font-medium ${
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : 
               trend === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-progress-fill transition-all duration-1000 ease-out"
            style={{ 
              width: `${typeof value === 'number' ? Math.min(value, 100) : 0}%`,
              '--progress-width': `${typeof value === 'number' ? Math.min(value, 100) : 0}%`
            } as React.CSSProperties}
          />
        </div>
      </>
    );

    return isMobile ? (
      <SwipeableCard className="mobile-card p-6 hover-lift touch-element">
        {content}
      </SwipeableCard>
    ) : (
      <GlassCard variant="subtle" padding="lg" className="hover-lift interactive-element">
        {content}
      </GlassCard>
    );
  };

  const QuickAction = ({ icon: Icon, title, description, variant, onClick }: any) => {
    const content = (
      <div className="flex items-center space-x-4">
        <div className={`p-4 rounded-xl bg-gradient-to-br ${
          variant === 'therapy' ? 'from-blue-500 to-cyan-500' :
          variant === 'wellness' ? 'from-green-500 to-emerald-500' :
          variant === 'journal' ? 'from-yellow-500 to-orange-500' :
          'from-purple-500 to-pink-500'
        } shadow-lg wellness-glow`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300 transform group-hover:translate-x-2" />
      </div>
    );

    return isMobile ? (
      <SwipeableCard className="mobile-card p-4 touch-element cursor-pointer" onClick={onClick}>
        {content}
      </SwipeableCard>
    ) : (
      <GlassCard variant="subtle" className="cursor-pointer group hover-lift interactive-element" onClick={onClick}>
        {content}
      </GlassCard>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-purple-900 flex items-center justify-center">
        <TherapeuticEntrance>
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6 zen-breathe" />
            <p className="text-gray-600 dark:text-gray-400 text-lg animate-text-reveal">Loading your wellness dashboard...</p>
          </div>
        </TherapeuticEntrance>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-purple-900 flex items-center justify-center">
        <TherapeuticEntrance>
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6 animate-gentle-pulse" />
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg animate-text-reveal">{error}</p>
            <GradientButton 
              variant="primary" 
              onClick={() => window.location.reload()}
              className="animate-fade-in-up animate-delay-500"
            >
              Retry
            </GradientButton>
          </div>
        </TherapeuticEntrance>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-purple-900 transition-all duration-500 page-transition">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Welcome Header - Enhanced Glassmorphism */}
        <TherapeuticEntrance>
          <GlassCard variant="strong" className="bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-indigo-600/90 text-white backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent animate-text-reveal">
                  Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 17 ? 'Afternoon' : 'Evening'}
                </h1>
                <p className="text-blue-100 text-lg font-medium animate-fade-in-up animate-delay-200">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold bg-gradient-to-br from-white to-yellow-200 bg-clip-text text-transparent mb-1 mindful-float">
                  {dashboardData.metrics.currentStreak}
                </div>
                <div className="text-blue-100 text-sm font-medium tracking-wide animate-fade-in-up animate-delay-300">Day Streak</div>
              </div>
            </div>
          </GlassCard>
        </TherapeuticEntrance>

        {/* Key Metrics - NOW USING REAL DATA with Staggered Animations */}
        <StaggeredAnimation 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          staggerDelay={150}
          baseDelay={200}
        >
          <MetricCard
            title="Weekly Progress"
            value={dashboardData.metrics.weeklyProgress}
            change={dashboardData.metrics.weeklyProgress > 0 ? `${dashboardData.metrics.weeklyProgress}%` : null}
            icon={Target}
            trend={dashboardData.metrics.weeklyProgress > 50 ? 'up' : 'stable'}
          />
          <MetricCard
            title="Sessions Completed"
            value={dashboardData.metrics.completedSessions}
            change={dashboardData.metrics.completedSessions > 0 ? `+${dashboardData.metrics.completedSessions}` : null}
            icon={CheckCircle}
            trend={dashboardData.metrics.completedSessions > 0 ? 'up' : 'stable'}
          />
          <MetricCard
            title="Mood Trend"
            value={dashboardData.metrics.moodTrend}
            change={dashboardData.metrics.recentEntries > 0 ? 'Active' : null}
            icon={Heart}
            trend={dashboardData.metrics.moodTrendDirection}
          />
          <MetricCard
            title="Current Streak"
            value={dashboardData.metrics.currentStreak}
            change={dashboardData.metrics.currentStreak > 0 ? `${dashboardData.metrics.currentStreak} days` : null}
            icon={Zap}
            trend={dashboardData.metrics.currentStreak > 0 ? 'up' : 'stable'}
          />
        </StaggeredAnimation>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Today's Schedule - Enhanced Glass Design */}
          <div className="lg:col-span-2">
            <WellnessReveal delay={400}>
              <GlassCard variant="default" padding="sm">
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                      <Calendar className="w-6 h-6 mr-3 text-blue-600 animate-gentle-pulse" />
                      Today's Schedule
                    </h2>
                    <GradientButton variant="primary" size="sm" className="animate-fade-in-left animate-delay-500">
                      View All
                    </GradientButton>
                  </div>
                </div>
                <div className="p-6">
                  <StaggeredAnimation
                    className="space-y-4"
                    staggerDelay={100}
                    baseDelay={200}
                  >
                    {dashboardData.todaysSchedule.map((item: any, index: number) => (
                      <GlassCard key={index} variant="subtle" className="p-4 interactive-element">
                        <div className="flex items-center space-x-4">
                          <div className="text-sm font-bold text-blue-600 dark:text-blue-400 w-16">
                            {item.time}
                          </div>
                          <div className={`w-3 h-3 rounded-full shadow-lg animate-gentle-pulse ${
                            item.status === 'completed' ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-yellow-400 to-orange-500'
                          }`} />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize font-medium">{item.type}</p>
                          </div>
                          {item.status === 'pending' && (
                            <GradientButton 
                              variant="primary" 
                              size="sm"
                              className="animate-button-press"
                              onClick={() => {
                                if (item.type === 'reflection') onNavigate('journal');
                                else if (item.type === 'session') onNavigate('meditation');
                                else onNavigate('mood');
                              }}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Start
                            </GradientButton>
                          )}
                        </div>
                      </GlassCard>
                    ))}
                  </StaggeredAnimation>
                </div>
              </GlassCard>
            </WellnessReveal>
          </div>

          {/* Quick Actions - Enhanced Glass Design */}
          <div className="space-y-6">
            <MindfulSlide delay={600}>
              <GlassCard variant="default" padding="sm">
                <div className="p-6 border-b border-white/10">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
                </div>
                <div className="p-6">
                  <StaggeredAnimation
                    className="space-y-4"
                    staggerDelay={120}
                    baseDelay={100}
                  >
                    <QuickAction
                      icon={MessageCircle}
                      title="Start AI Session"
                      description="Begin therapeutic conversation"
                      variant="therapy"
                      onClick={() => onNavigate('chat')}
                    />
                    <QuickAction
                      icon={BookOpen}
                      title="Open Journal"
                      description="Reflect and document thoughts"
                      variant="journal"
                      onClick={() => onNavigate('journal')}
                    />
                    <QuickAction
                      icon={Brain}
                      title="Mindfulness"
                      description="Guided meditation session"
                      variant="wellness"
                      onClick={() => onNavigate('meditation')}
                    />
                    <QuickAction
                      icon={Activity}
                      title="CBT Exercise"
                      description="Cognitive behavioral therapy"
                      variant="primary"
                      onClick={() => onNavigate('exercises')}
                    />
                  </StaggeredAnimation>
                </div>
              </GlassCard>
            </MindfulSlide>

            {/* Insights Panel - Enhanced Glass Design */}
            <WellnessReveal delay={800}>
              <GlassCard variant="default" padding="sm" gradient="insights">
                <div className="p-6 border-b border-white/10">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Progress Insights</h2>
                </div>
                <div className="p-6">
                  <StaggeredAnimation
                    className="space-y-6"
                    staggerDelay={150}
                    baseDelay={200}
                  >
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">Primary Focus</h4>
                      <p className="text-gray-700 dark:text-gray-300 font-medium">{dashboardData.insights.primaryFocus}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">Progress Note</h4>
                      <p className="text-gray-700 dark:text-gray-300">{dashboardData.insights.progressNote}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">Next Goal</h4>
                      <p className="text-gray-700 dark:text-gray-300 font-medium">{dashboardData.insights.nextGoal}</p>
                    </div>
                  </StaggeredAnimation>
                </div>
              </GlassCard>
            </WellnessReveal>
          </div>
        </div>

        {/* Recent Activity - Enhanced Glass Design */}
        <TherapeuticEntrance delay={1000}>
          <GlassCard variant="default" padding="sm">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <Activity className="w-6 h-6 mr-3 text-blue-600 animate-gentle-pulse" />
                Recent Activity
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.recentActivity.length > 0 ? (
                  <StaggeredAnimation
                    className="space-y-4"
                    staggerDelay={100}
                    baseDelay={200}
                  >
                    {dashboardData.recentActivity.map((activity: any, index: number) => (
                      <GlassCard key={index} variant="subtle" className="p-4 hover-lift interactive-element">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full shadow-lg wellness-glow ${
                            activity.type === 'journal' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                            activity.type === 'mood' ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                            activity.type === 'chat' ? 'bg-gradient-to-r from-purple-400 to-pink-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'
                          }`} />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{activity.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{activity.time}</p>
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </StaggeredAnimation>
                ) : (
                  <Animation type="scaleIn" delay={500}>
                    <div className="text-center py-12">
                      <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 mindful-float">
                        <BookOpen className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg animate-text-reveal animate-delay-200">No activity yet</p>
                      <GradientButton 
                        variant="primary" 
                        size="lg"
                        onClick={() => onNavigate('journal')}
                        className="animate-fade-in-up animate-delay-500"
                      >
                        Create Your First Entry
                      </GradientButton>
                    </div>
                  </Animation>
                )}
              </div>
            </div>
          </GlassCard>
        </TherapeuticEntrance>
      </div>
    </div>
  );
};

export default ModernDashboard;

