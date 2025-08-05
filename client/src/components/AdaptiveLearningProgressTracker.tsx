import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  TrendingUp, Trophy, Target, Calendar, Brain, Heart, 
  Star, Award, ChevronRight, RefreshCw, Sparkles,
  BarChart3, LineChart, Zap, CheckCircle, Clock,
  ArrowUp, ArrowDown, Minus, User, MessageCircle,
  BookOpen, Activity, Smile, ArrowRight, ExternalLink
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

interface LearningMilestone {
  id: number;
  userId: number;
  milestoneType: string;
  title: string;
  description: string;
  category: string;
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
  completedAt?: string;
  celebrationShown: boolean;
  icon: string;
  color: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

interface ProgressMetric {
  id: number;
  userId: number;
  metricType: string;
  value: number;
  date: string;
  weeklyAverage?: number;
  monthlyTotal?: number;
  trend?: string;
  achievements?: string[];
  createdAt: string;
}

interface AdaptiveLearningInsight {
  id: number;
  userId: number;
  insightType: string;
  title: string;
  content: string;
  dataPoints?: any;
  actionableRecommendations: string[];
  confidenceLevel: number;
  importance: number;
  isActive: boolean;
  userViewed: boolean;
  userFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

interface WellnessJourneyEvent {
  id: number;
  userId: number;
  eventType: string;
  title: string;
  description: string;
  emotionalContext?: any;
  significance: number;
  relatedMilestones?: string[];
  celebrationLevel: string;
  celebrationShown: boolean;
  userReflection?: string;
  createdAt: string;
}

interface ProgressOverview {
  totalMilestones: number;
  completedMilestones: number;
  activeMilestones: number;
  weeklyProgress: number;
  monthlyProgress: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  currentLevel: number;
  nextLevelProgress: number;
}

const AdaptiveLearningProgressTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'journey' | 'insights'>('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [celebrationModal, setCelebrationModal] = useState<WellnessJourneyEvent | null>(null);
  const queryClient = useQueryClient();

  // Navigation mapping for milestones
  const getMilestoneNavigation = (milestoneType: string, category: string) => {
    const navigationMap: Record<string, { path: string; label: string; description: string }> = {
      // Consistency milestones - Daily activities
      'consistency': {
        path: '/core-companion',
        label: 'Start Chat Session',
        description: 'Chat with your AI companion or write in the journal to build consistency'
      },
      // Emotional intelligence milestones
      'emotional_intelligence': {
        path: '/core-companion',
        label: 'Chat to Learn Words',
        description: 'Have conversations with your AI companion to learn new emotional vocabulary'
      },
      // Mindfulness milestones
      'mindfulness': {
        path: '/guided-support',
        label: 'Try Mindfulness',
        description: 'Access guided mindfulness sessions and meditation exercises'
      },
      // Self-care milestones
      'self_care': {
        path: '/guided-support',
        label: 'Practice Self-Care',
        description: 'Learn self-compassion techniques and wellness practices'
      },
      // Coping skills milestones
      'coping_skills': {
        path: '/guided-support',
        label: 'Build Coping Skills',
        description: 'Develop personalized stress management and coping strategies'
      },
      // Daily habits fallback
      'daily_habits': {
        path: '/core-companion',
        label: 'Start Daily Practice',
        description: 'Begin your daily wellness routine with chat or journaling'
      },
      // Emotional wellness fallback
      'emotional_wellness': {
        path: '/mirrors-of-you',
        label: 'Track Your Mood',
        description: 'Use mood tracking and reflection tools to build emotional awareness'
      },
      // Communication fallback
      'communication': {
        path: '/core-companion',
        label: 'Practice Communication',
        description: 'Engage with your AI companion to improve communication skills'
      },
      // Self-awareness fallback
      'self_awareness': {
        path: '/mirrors-of-you',
        label: 'Explore Self-Awareness',
        description: 'Use reflection tools and personality insights to grow self-awareness'
      }
    };

    // Try milestone type first, then fall back to category
    return navigationMap[milestoneType] || navigationMap[category] || {
      path: '/core-companion',
      label: 'Get Started',
      description: 'Begin your wellness journey with your AI companion'
    };
  };

  const handleMilestoneNavigation = (navigation: { path: string; label: string; description: string }) => {
    // Update URL to navigate to the specific section
    window.location.hash = navigation.path;
    // Force a page refresh to ensure navigation works
    window.location.reload();
  };

  // Fetch progress overview
  const { data: progressOverview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['/api/adaptive-learning/overview'],
    queryFn: async () => {
      const response = await fetch('/api/adaptive-learning/overview');
      if (!response.ok) throw new Error('Failed to fetch overview');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch milestones
  const { data: milestones, isLoading: milestonesLoading, error: milestonesError } = useQuery({
    queryKey: ['/api/adaptive-learning/milestones'],
    queryFn: async () => {
      const response = await fetch('/api/adaptive-learning/milestones');
      if (!response.ok) throw new Error('Failed to fetch milestones');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch progress metrics
  const { data: progressMetrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['/api/adaptive-learning/metrics', selectedTimeframe],
    queryFn: async () => {
      const response = await fetch(`/api/adaptive-learning/metrics?timeframe=${selectedTimeframe}`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch learning insights
  const { data: insights, isLoading: insightsLoading, error: insightsError } = useQuery({
    queryKey: ['/api/adaptive-learning/insights'],
    queryFn: async () => {
      const response = await fetch('/api/adaptive-learning/insights');
      if (!response.ok) throw new Error('Failed to fetch insights');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch journey events
  const { data: journeyEvents, isLoading: journeyLoading, error: journeyError } = useQuery({
    queryKey: ['/api/adaptive-learning/journey-events'],
    queryFn: async () => {
      const response = await fetch('/api/adaptive-learning/journey-events');
      if (!response.ok) throw new Error('Failed to fetch journey events');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mark insight as viewed
  const markInsightViewedMutation = useMutation({
    mutationFn: async (insightId: number) => {
      const response = await fetch(`/api/adaptive-learning/insights/${insightId}/viewed`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to mark insight as viewed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/adaptive-learning/insights'] });
    },
  });

  // Mark celebration as shown
  const markCelebrationShownMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const response = await fetch(`/api/adaptive-learning/journey-events/${eventId}/celebration`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to mark celebration as shown');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/adaptive-learning/journey-events'] });
      setCelebrationModal(null);
    },
  });

  // Show celebration for new milestones
  useEffect(() => {
    if (journeyEvents) {
      const newCelebrations = journeyEvents.filter((event: WellnessJourneyEvent) => 
        !event.celebrationShown && ['milestone', 'breakthrough', 'goal_achieved'].includes(event.eventType)
      );
      if (newCelebrations.length > 0) {
        setCelebrationModal(newCelebrations[0]);
      }
    }
  }, [journeyEvents]);

  const getMilestoneProgress = (milestone: LearningMilestone) => {
    return Math.min((milestone.currentValue / milestone.targetValue) * 100, 100);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'daily_habits': return <Clock className="w-5 h-5" />;
      case 'emotional_wellness': return <Heart className="w-5 h-5" />;
      case 'communication': return <MessageCircle className="w-5 h-5" />;
      case 'self_awareness': return <Brain className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'increasing': return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'decreasing': return <ArrowDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getMetricIcon = (metricType: string) => {
    switch (metricType) {
      case 'chat_sessions': return <MessageCircle className="w-5 h-5" />;
      case 'journal_entries': return <BookOpen className="w-5 h-5" />;
      case 'mood_logs': return <Smile className="w-5 h-5" />;
      case 'streak_days': return <Calendar className="w-5 h-5" />;
      case 'emotional_insights': return <Brain className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getInsightPriorityColor = (importance: number) => {
    if (importance >= 8) return 'bg-red-50 border-red-200 text-red-800';
    if (importance >= 6) return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    return 'bg-blue-50 border-blue-200 text-blue-800';
  };

  const formatMetricType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="theme-card rounded-lg p-6 border border-[var(--theme-accent)]/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              {progressOverview?.completedMilestones}/{progressOverview?.totalMilestones}
            </span>
          </div>
          <h3 className="text-lg font-semibold theme-text mb-2">Milestones</h3>
          <p className="theme-text-secondary text-sm">
            {Math.round((progressOverview?.completedMilestones / progressOverview?.totalMilestones) * 100 || 0)}% Complete
          </p>
        </div>

        <div className="theme-card rounded-lg p-6 border border-[var(--theme-accent)]/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              This Month
            </span>
          </div>
          <h3 className="text-lg font-semibold theme-text mb-2">Progress</h3>
          <p className="theme-text-secondary text-sm">
            {progressOverview?.monthlyProgress || 0}% growth
          </p>
        </div>

        <div className="theme-card rounded-lg p-6 border border-[var(--theme-accent)]/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
              Level {progressOverview?.currentLevel || 1}
            </span>
          </div>
          <h3 className="text-lg font-semibold theme-text mb-2">Experience</h3>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progressOverview?.nextLevelProgress || 0}%` }}
            />
          </div>
        </div>

        <div className="theme-card rounded-lg p-6 border border-[var(--theme-accent)]/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
              Best: {progressOverview?.longestStreak || 0}
            </span>
          </div>
          <h3 className="text-lg font-semibold theme-text mb-2">Streak</h3>
          <p className="theme-text-secondary text-sm">
            {progressOverview?.currentStreak || 0} days active
          </p>
        </div>
      </div>

      {/* Active Milestones */}
      <div className="theme-card rounded-lg p-6 border border-[var(--theme-accent)]/30">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold theme-text">Active Milestones</h3>
          <button
            onClick={() => setActiveTab('milestones')}
            className="flex items-center space-x-2 text-[var(--theme-accent)] hover:text-[var(--theme-accent)]/80 transition-colors"
          >
            <span className="text-sm font-medium">View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {milestones?.filter((m: LearningMilestone) => !m.isCompleted).slice(0, 4).map((milestone: LearningMilestone) => (
            <div key={milestone.id} className="p-4 theme-surface rounded-lg border border-[var(--theme-accent)]/20">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{milestone.icon}</span>
                  <div>
                    <h4 className="font-medium theme-text">{milestone.title}</h4>
                    <p className="text-sm theme-text-secondary">{milestone.category.replace('_', ' ')}</p>
                  </div>
                </div>
                <span className="text-sm font-medium theme-text">
                  {Math.round(getMilestoneProgress(milestone))}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 bg-${milestone.color}-500`}
                  style={{ width: `${getMilestoneProgress(milestone)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Insights */}
      <div className="theme-card rounded-lg p-6 border border-[var(--theme-accent)]/30">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold theme-text">Recent Insights</h3>
          <button
            onClick={() => setActiveTab('insights')}
            className="flex items-center space-x-2 text-[var(--theme-accent)] hover:text-[var(--theme-accent)]/80 transition-colors"
          >
            <span className="text-sm font-medium">View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          {insights?.filter((insight: AdaptiveLearningInsight) => insight.isActive).slice(0, 3).map((insight: AdaptiveLearningInsight) => (
            <div key={insight.id} className={`p-4 rounded-lg border ${getInsightPriorityColor(insight.importance)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium mb-2">{insight.title}</h4>
                  <p className="text-sm mb-3">{insight.content}</p>
                  {insight.actionableRecommendations?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Recommendations:</p>
                      <ul className="text-xs space-y-1">
                        {insight.actionableRecommendations.slice(0, 2).map((rec, index) => (
                          <li key={index} className="flex items-start space-x-1">
                            <span>•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="text-xs text-right">
                  <div className="font-medium">
                    {Math.round(insight.confidenceLevel * 100)}% confidence
                  </div>
                  <div className="text-gray-500">
                    {format(new Date(insight.createdAt), 'MMM dd')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMilestonesTab = () => (
    <div className="space-y-6">
      {/* Milestone Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['daily_habits', 'emotional_wellness', 'communication', 'self_awareness'].map((category) => {
          const categoryMilestones = milestones?.filter((m: LearningMilestone) => m.category === category) || [];
          const completed = categoryMilestones.filter((m: LearningMilestone) => m.isCompleted).length;
          
          return (
            <div key={category} className="theme-card rounded-lg p-4 border border-[var(--theme-accent)]/30">
              <div className="flex items-center space-x-3 mb-3">
                {getCategoryIcon(category)}
                <div>
                  <h3 className="font-semibold theme-text">{category.replace('_', ' ')}</h3>
                  <p className="text-sm theme-text-secondary">{completed}/{categoryMilestones.length} complete</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-[var(--theme-accent)] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${categoryMilestones.length > 0 ? (completed / categoryMilestones.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* All Milestones */}
      <div className="space-y-4">
        {['active', 'completed'].map((status) => (
          <div key={status} className="theme-card rounded-lg p-6 border border-[var(--theme-accent)]/30">
            <h3 className="text-lg font-semibold theme-text mb-4 capitalize">
              {status} Milestones ({milestones?.filter((m: LearningMilestone) => 
                status === 'active' ? !m.isCompleted : m.isCompleted
              ).length || 0})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {milestones?.filter((m: LearningMilestone) => 
                status === 'active' ? !m.isCompleted : m.isCompleted
              ).map((milestone: LearningMilestone) => {
                const navigation = getMilestoneNavigation(milestone.milestoneType, milestone.category);
                
                return (
                  <div key={milestone.id} className="p-4 theme-surface rounded-lg border border-[var(--theme-accent)]/20">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{milestone.icon}</span>
                        <div>
                          <h4 className="font-medium theme-text">{milestone.title}</h4>
                          <p className="text-sm theme-text-secondary">{milestone.description}</p>
                        </div>
                      </div>
                      {milestone.isCompleted && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="theme-text-secondary">Progress</span>
                        <span className="font-medium theme-text">
                          {Math.round(getMilestoneProgress(milestone))}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 bg-${milestone.color}-500`}
                          style={{ width: `${getMilestoneProgress(milestone)}%` }}
                        />
                      </div>
                      
                      {/* Navigation Button for Active Milestones */}
                      {!milestone.isCompleted && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => handleMilestoneNavigation(navigation)}
                            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-[var(--theme-accent)] text-white rounded-md text-sm font-medium hover:bg-[var(--theme-accent)]/80 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>{navigation.label}</span>
                          </button>
                          <p className="text-xs theme-text-secondary mt-1 text-center">
                            {navigation.description}
                          </p>
                        </div>
                      )}
                      
                      {milestone.completedAt && (
                        <p className="text-xs theme-text-secondary">
                          Completed {format(new Date(milestone.completedAt), 'MMM dd, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderJourneyTab = () => (
    <div className="space-y-6">
      {/* Journey Timeline */}
      <div className="theme-card rounded-lg p-6 border border-[var(--theme-accent)]/30">
        <h3 className="text-xl font-semibold theme-text mb-6">Your Wellness Journey</h3>
        <div className="space-y-6">
          {journeyEvents?.map((event: WellnessJourneyEvent, index: number) => (
            <div key={event.id} className="relative flex items-start space-x-4">
              {/* Timeline line */}
              {index < journeyEvents.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200 dark:bg-gray-700" />
              )}
              
              {/* Event icon */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                event.celebrationLevel === 'breakthrough' ? 'bg-purple-100 dark:bg-purple-900/30' :
                event.celebrationLevel === 'major' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                {event.eventType === 'milestone' && <Trophy className="w-6 h-6 text-yellow-600" />}
                {event.eventType === 'breakthrough' && <Sparkles className="w-6 h-6 text-purple-600" />}
                {event.eventType === 'challenge_overcome' && <Target className="w-6 h-6 text-green-600" />}
                {event.eventType === 'pattern_recognized' && <Brain className="w-6 h-6 text-blue-600" />}
                {event.eventType === 'goal_achieved' && <Award className="w-6 h-6 text-orange-600" />}
              </div>
              
              {/* Event content */}
              <div className="flex-1 theme-surface rounded-lg p-4 border border-[var(--theme-accent)]/20">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold theme-text">{event.title}</h4>
                    <p className="text-sm theme-text-secondary mt-1">{event.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: event.significance }, (_, i) => (
                        <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs theme-text-secondary mt-1">
                      {format(new Date(event.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                
                {event.userReflection && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-sm theme-text-secondary italic">"{event.userReflection}"</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Metrics Chart */}
      <div className="theme-card rounded-lg p-6 border border-[var(--theme-accent)]/30">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold theme-text">Progress Metrics</h3>
          <div className="flex space-x-2">
            {(['week', 'month', 'quarter'] as const).map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedTimeframe === timeframe
                    ? 'bg-[var(--theme-accent)] text-white'
                    : 'theme-surface theme-text hover:bg-[var(--theme-accent)]/10'
                }`}
              >
                {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {progressMetrics?.map((metric: ProgressMetric) => (
            <div key={metric.id} className="p-4 theme-surface rounded-lg border border-[var(--theme-accent)]/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getMetricIcon(metric.metricType)}
                  <span className="font-medium theme-text">{formatMetricType(metric.metricType)}</span>
                </div>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold theme-text">{metric.value}</div>
                {metric.weeklyAverage && (
                  <div className="text-sm theme-text-secondary">
                    Weekly avg: {metric.weeklyAverage}
                  </div>
                )}
                {metric.monthlyTotal && (
                  <div className="text-sm theme-text-secondary">
                    Monthly total: {metric.monthlyTotal}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInsightsTab = () => (
    <div className="space-y-6">
      {insights?.map((insight: AdaptiveLearningInsight) => (
        <div 
          key={insight.id} 
          className={`theme-card rounded-lg p-6 border border-[var(--theme-accent)]/30 ${
            !insight.userViewed ? 'ring-2 ring-[var(--theme-accent)]/20' : ''
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3">
              <div className={`p-3 rounded-lg ${getInsightPriorityColor(insight.importance)}`}>
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold theme-text">{insight.title}</h3>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-sm theme-text-secondary capitalize">
                    {insight.insightType.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {Math.round(insight.confidenceLevel * 100)}% confidence
                  </span>
                  <span className="text-sm theme-text-secondary">
                    {format(new Date(insight.createdAt), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </div>
            {!insight.userViewed && (
              <button
                onClick={() => markInsightViewedMutation.mutate(insight.id)}
                className="px-3 py-1 bg-[var(--theme-accent)] text-white rounded-md text-sm hover:bg-[var(--theme-accent)]/80 transition-colors"
              >
                Mark as Read
              </button>
            )}
          </div>
          
          <p className="theme-text mb-4">{insight.content}</p>
          
          {insight.actionableRecommendations?.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium theme-text">Actionable Recommendations:</h4>
              <ul className="space-y-2">
                {insight.actionableRecommendations.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <ChevronRight className="w-4 h-4 text-[var(--theme-accent)] mt-0.5 flex-shrink-0" />
                    <span className="theme-text-secondary">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {insight.dataPoints && (
            <div className="mt-4 p-3 theme-surface rounded-lg">
              <h4 className="text-sm font-medium theme-text mb-2">Supporting Data:</h4>
              <div className="text-sm theme-text-secondary">
                {JSON.stringify(insight.dataPoints, null, 2)}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const loading = overviewLoading || milestonesLoading || metricsLoading || insightsLoading || journeyLoading;
  const error = overviewError || milestonesError || metricsError || insightsError || journeyError;

  if (loading) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#1a237e] to-[#3949ab] p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-6 h-6 text-white animate-spin" />
              <span className="text-white text-lg">Loading your progress tracker...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#1a237e] to-[#3949ab] p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-300 text-lg mb-2">Failed to load progress data</div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-[#1a237e] to-[#3949ab] p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Progress Tracker</h1>
            <p className="text-white/60">Your adaptive learning and wellness journey</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => queryClient.invalidateQueries()}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="w-full bg-white/10 rounded-lg p-1 mb-6">
          <div className="grid grid-cols-4 gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'milestones', label: 'Milestones', icon: Target },
              { id: 'journey', label: 'Journey', icon: LineChart },
              { id: 'insights', label: 'Insights', icon: Brain }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full px-4 py-3 text-sm font-bold rounded-md transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-lg'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'milestones' && renderMilestonesTab()}
          {activeTab === 'journey' && renderJourneyTab()}
          {activeTab === 'insights' && renderInsightsTab()}
        </div>

        {/* Celebration Modal */}
        {celebrationModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold theme-text mb-2">🎉 Celebration! 🎉</h3>
                <h4 className="text-lg font-semibold text-yellow-600 mb-2">{celebrationModal.title}</h4>
                <p className="theme-text-secondary">{celebrationModal.description}</p>
              </div>
              
              <div className="flex items-center justify-center space-x-1 mb-4">
                {Array.from({ length: celebrationModal.significance }, (_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                ))}
              </div>
              
              <button
                onClick={() => markCelebrationShownMutation.mutate(celebrationModal.id)}
                className="w-full py-3 bg-[var(--theme-accent)] text-white rounded-lg hover:bg-[var(--theme-accent)]/80 transition-colors font-medium"
              >
                Continue Journey
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdaptiveLearningProgressTracker;