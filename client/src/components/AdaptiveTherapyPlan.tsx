import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  Target, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  CheckCircle, 
  Clock, 
  Lightbulb,
  Activity,
  Heart,
  Zap,
  Award,
  RefreshCw,
  Loader2,
  AlertCircle,
  Undo2,
  Sparkles,
  Play
} from 'lucide-react';

interface TherapeuticPlan {
  id: string;
  userId: number;
  planType: 'daily' | 'weekly' | 'monthly' | 'crisis_intervention';
  generatedAt: string;
  validUntil: string;
  adaptationLevel: number;
  therapeuticGoals: TherapeuticGoal[];
  dailyActivities: DailyActivity[];

  progressMetrics: ProgressMetric[];
  adaptationTriggers: AdaptationTrigger[];
  confidenceScore: number;
}

interface TherapeuticGoal {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  targetCompletion: string;
  measurableOutcomes: string[];
  adaptiveStrategies: string[];
  progressIndicators: string[];
}

interface DailyActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  emotionalFocus: string[];
  instructions: string[];
  adaptationNotes: string;
  scheduledTime?: string;
  personalizedReason: string;
}

interface WeeklyMilestone {
  id: string;
  week: number;
  goalTitle: string;
  description: string;
  successCriteria: string[];
  rewardType: string;
  adaptationPoints: number;
}

interface ProgressMetric {
  category: string;
  baseline: number;
  currentValue: number;
  targetValue: number;
  trend: 'improving' | 'stable' | 'declining';
  confidenceLevel: number;
  lastUpdated: string;
}

interface AdaptationTrigger {
  type: string;
  threshold: number;
  responseAction: string;
  description: string;
}

// Enhanced Enums for maintainability
const PRIORITY_STYLES = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200'
} as const;

const DIFFICULTY_CONFIG = {
  beginner: { icon: Lightbulb, color: 'text-green-500', label: 'Beginner' },
  intermediate: { icon: Activity, color: 'text-yellow-500', label: 'Intermediate' },
  advanced: { icon: Zap, color: 'text-red-500', label: 'Advanced' }
} as const;

const TREND_CONFIG = {
  improving: { icon: TrendingUp, color: 'text-green-500', label: 'Improving' },
  stable: { icon: Target, color: 'text-blue-500', label: 'Stable' },
  declining: { icon: TrendingDown, color: 'text-red-500', label: 'Declining' }
} as const;

// localStorage keys for persistence
const STORAGE_KEYS = {
  COMPLETED_ACTIVITIES: 'therapy_completed_activities',
  PLAN_PREFERENCES: 'therapy_plan_preferences'
} as const;

interface AdaptiveTherapyPlanProps {
  userId: number;
  onPlanUpdate?: (plan: TherapeuticPlan) => void;
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
    <h3 className="text-sm font-medium text-red-800 mb-1">Error Loading Therapy Plan</h3>
    <p className="text-xs text-red-600 text-center mb-3">{error}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded transition-colors"
        aria-label="Retry loading therapy plan"
      >
        <RefreshCw className="w-3 h-3 mr-1 inline" />
        Try Again
      </button>
    )}
  </div>
);

function AdaptiveTherapyPlan({ userId, onPlanUpdate }: AdaptiveTherapyPlanProps) {
  const [currentPlan, setCurrentPlan] = useState<TherapeuticPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adapting, setAdapting] = useState(false);
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set());
  const [processingActivities, setProcessingActivities] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Persistent state management with localStorage
  useEffect(() => {
    loadPersistedState();
    fetchCurrentPlan();
  }, [userId]);

  // Load completed activities from localStorage
  const loadPersistedState = useCallback(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.COMPLETED_ACTIVITIES}_${userId}`);
      if (stored) {
        const completedIds = JSON.parse(stored);
        setCompletedActivities(new Set(completedIds));
      }
    } catch (error) {
      console.warn('Failed to load persisted state:', error);
    }
  }, [userId]);

  // Save completed activities to localStorage
  const persistCompletedActivities = useCallback((activities: Set<string>) => {
    try {
      localStorage.setItem(
        `${STORAGE_KEYS.COMPLETED_ACTIVITIES}_${userId}`,
        JSON.stringify(Array.from(activities))
      );
    } catch (error) {
      console.warn('Failed to persist completed activities:', error);
    }
  }, [userId]);

  // Enhanced fetch with error handling
  const fetchCurrentPlan = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/adaptive-therapy/plan/${userId || 0}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch plan: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validate API response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }
      
      const plan = data.plan || null;
      setCurrentPlan(plan);
      onPlanUpdate?.(plan);
      
      // Sync with server-side completed activities if available
      if (data.completedActivities && Array.isArray(data.completedActivities)) {
        // Ensure all elements are strings and filter out any invalid entries
        const validActivityIds = data.completedActivities
          .filter((id: unknown): id is string => typeof id === 'string' && id.trim() !== '')
          .map((id: string) => id.trim());
        
        const serverCompleted = new Set<string>(validActivityIds);
        setCompletedActivities(serverCompleted);
        persistCompletedActivities(serverCompleted);
      }
      
    } catch (error) {
      console.error('Failed to fetch therapeutic plan:', error);
      setError(error instanceof Error ? error.message : 'Failed to load therapy plan');
    } finally {
      setLoading(false);
    }
  }, [userId, onPlanUpdate, persistCompletedActivities]);

  // Enhanced plan generation with toast feedback
  const generateNewPlan = useCallback(async (planType: 'daily' | 'weekly' | 'monthly' = 'weekly') => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      toast({
        title: "Generating Your Plan",
        description: `Creating a personalized ${planType} therapy plan...`,
        duration: 3000,
      });
      
      const response = await fetch('/api/adaptive-therapy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planType })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate plan: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.plan) {
        throw new Error('Invalid plan data received');
      }
      
      setCurrentPlan(data.plan);
      onPlanUpdate?.(data.plan);
      
      // Clear any previously completed activities for new plan
      setCompletedActivities(new Set());
      persistCompletedActivities(new Set());
      
      toast({
        title: "Plan Created Successfully!",
        description: `Your ${planType} therapy plan is ready to use.`,
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Failed to generate new plan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate therapy plan';
      setError(errorMessage);
      
      toast({
        title: "Plan Generation Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [userId, onPlanUpdate, persistCompletedActivities, toast]);

  // Enhanced plan adaptation with toast feedback
  const adaptPlan = useCallback(async (triggerType: string, feedback?: any) => {
    if (!currentPlan || !userId) return;

    try {
      setAdapting(true);
      
      toast({
        title: "Adapting Your Plan",
        description: "Personalizing your therapy plan based on your progress...",
        duration: 3000,
      });
      
      const response = await fetch('/api/adaptive-therapy/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: currentPlan.id,
          triggerType,
          feedback,
          userId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to adapt plan: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.adaptedPlan) {
        throw new Error('Invalid adaptation response');
      }
      
      setCurrentPlan(data.adaptedPlan);
      onPlanUpdate?.(data.adaptedPlan);
      
      toast({
        title: "Plan Successfully Adapted!",
        description: "Your therapy plan has been updated based on your progress.",
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Failed to adapt plan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to adapt therapy plan';
      
      toast({
        title: "Adaptation Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setAdapting(false);
    }
  }, [currentPlan, userId, onPlanUpdate, toast]);

  // Enhanced activity completion with undo functionality and toast feedback
  const completeActivity = useCallback(async (activityId: string) => {
    if (!activityId || !userId || processingActivities.has(activityId)) return;
    
    // Show confirmation for important activities
    const activity = currentPlan?.dailyActivities.find(a => a.id === activityId);
    if (!activity) return;
    
    try {
      setProcessingActivities(prev => new Set(Array.from(prev)).add(activityId));
      
      // Optimistically update UI
      const newCompleted = new Set(Array.from(completedActivities));
      newCompleted.add(activityId);
      setCompletedActivities(newCompleted);
      persistCompletedActivities(newCompleted);
      
      const response = await fetch('/api/adaptive-therapy/complete-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          activityId,
          completedAt: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save completion status');
      }

      toast({
        title: "Activity Completed!",
        description: `Great job completing "${activity.title}"`,
        duration: 3000,
      });

      // Check if plan adaptation is needed
      try {
        const effectiveness = await fetch(`/api/adaptive-therapy/monitor/${userId}/${currentPlan?.id}`);
        if (effectiveness.ok) {
          const data = await effectiveness.json();
          if (data.shouldAdapt) {
            adaptPlan('goal_achievement');
          }
        }
      } catch (monitorError) {
        console.warn('Failed to check adaptation needs:', monitorError);
      }
      
    } catch (error) {
      console.error('Failed to complete activity:', error);
      
      // Revert optimistic update on error
      const revertedCompleted = new Set(Array.from(completedActivities));
      revertedCompleted.delete(activityId);
      setCompletedActivities(revertedCompleted);
      persistCompletedActivities(revertedCompleted);
      
      toast({
        title: "Failed to Complete Activity",
        description: "Please try again. Your progress has been restored.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setProcessingActivities(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(activityId);
        return newSet;
      });
    }
  }, [activityId, userId, processingActivities, currentPlan, completedActivities, persistCompletedActivities, adaptPlan, toast]);

  // Undo activity completion
  const uncompleteActivity = useCallback(async (activityId: string) => {
    if (!activityId || !userId || !completedActivities.has(activityId)) return;
    
    const activity = currentPlan?.dailyActivities.find(a => a.id === activityId);
    if (!activity) return;
    
    try {
      setProcessingActivities(prev => new Set(Array.from(prev)).add(activityId));
      
      // Optimistically update UI
      const newCompleted = new Set(Array.from(completedActivities));
      newCompleted.delete(activityId);
      setCompletedActivities(newCompleted);
      persistCompletedActivities(newCompleted);
      
      const response = await fetch('/api/adaptive-therapy/uncomplete-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          activityId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to undo completion');
      }

      toast({
        title: "Activity Unmarked",
        description: `"${activity.title}" marked as incomplete`,
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Failed to uncomplete activity:', error);
      
      // Revert on error
      const revertedCompleted = new Set(Array.from(completedActivities));
      revertedCompleted.add(activityId);
      setCompletedActivities(revertedCompleted);
      persistCompletedActivities(revertedCompleted);
      
      toast({
        title: "Failed to Undo Completion",
        description: "Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setProcessingActivities(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(activityId);
        return newSet;
      });
    }
  }, [activityId, userId, completedActivities, currentPlan, persistCompletedActivities, toast]);

  // Enhanced utility functions using enums and memoization
  const getPriorityColor = useMemo(() => (priority: string) => {
    return PRIORITY_STYLES[priority as keyof typeof PRIORITY_STYLES] || 'bg-gray-100 text-gray-800 border-gray-200';
  }, []);

  const getDifficultyIcon = useMemo(() => (difficulty: string) => {
    const config = DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG];
    if (!config) return <Lightbulb className="w-4 h-4 text-gray-500" aria-label="Unknown difficulty" />;
    
    const IconComponent = config.icon;
    return <IconComponent className={`w-4 h-4 ${config.color}`} aria-label={config.label} />;
  }, []);

  const getTrendIcon = useMemo(() => (trend: string) => {
    const config = TREND_CONFIG[trend as keyof typeof TREND_CONFIG];
    if (!config) return <Target className="w-4 h-4 text-gray-500" aria-label="Unknown trend" />;
    
    const IconComponent = config.icon;
    return <IconComponent className={`w-4 h-4 ${config.color}`} aria-label={config.label} />;
  }, []);

  // Safe progress calculation to handle divide-by-zero
  const calculateProgress = useMemo(() => (baseline: number, current: number, target: number) => {
    if (baseline === target) {
      // If baseline equals target, use current vs baseline for progress
      return current >= baseline ? 100 : 0;
    }
    
    const progress = ((current - baseline) / (target - baseline)) * 100;
    return Math.max(0, Math.min(100, progress)); // Clamp between 0-100
  }, []);

  // Retry function for error handling
  const handleRetry = useCallback(() => {
    setError(null);
    fetchCurrentPlan();
  }, [fetchCurrentPlan]);

  // Enhanced loading state
  if (loading) {
    return <LoadingSpinner message="Loading your personalized therapy plan..." />;
  }

  // Enhanced error state
  if (error) {
    return <ErrorMessage error={error} onRetry={handleRetry} />;
  }

  // Enhanced empty state with animations and better onboarding
  if (!currentPlan) {
    return (
      <div className="text-center p-8 space-y-6 min-h-[400px] flex flex-col justify-center" role="main" aria-label="Create therapy plan">
        <div className="space-y-4">
          <div className="relative">
            <Brain className="w-20 h-20 text-blue-500 mx-auto mb-4 animate-pulse" aria-hidden="true" />
            <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2 animate-bounce" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Create Your Adaptive Therapy Plan</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
            Get a personalized therapeutic plan that adapts to your progress and needs. 
            Choose the timeframe that works best for your wellness journey.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <Card className="border-2 border-silver hover:border-4 hover:animate-shimmer transition-all cursor-pointer group" 
                onClick={() => generateNewPlan('daily')}>
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 text-green-500 mx-auto mb-3 group-hover:scale-110 transition-transform" aria-hidden="true" />
              <h3 className="font-medium text-gray-800 mb-2">Daily Plan</h3>
              <p className="text-sm text-gray-600">Quick daily activities for immediate wellness support</p>
              <Button className="mt-4 w-full" size="sm" aria-label="Create daily therapy plan">
                <Play className="w-4 h-4 mr-1" />
                Start Daily
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-silver hover:border-4 hover:animate-shimmer transition-all cursor-pointer group" 
                onClick={() => generateNewPlan('weekly')}>
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 text-blue-500 mx-auto mb-3 group-hover:scale-110 transition-transform" aria-hidden="true" />
              <h3 className="font-medium text-gray-800 mb-2">Weekly Plan</h3>
              <p className="text-sm text-gray-600">Balanced weekly goals with progressive milestones</p>
              <Button className="mt-4 w-full" size="sm" variant="outline" aria-label="Create weekly therapy plan">
                <Play className="w-4 h-4 mr-1" />
                Start Weekly
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-silver hover:border-4 hover:animate-shimmer transition-all cursor-pointer group" 
                onClick={() => generateNewPlan('monthly')}>
            <CardContent className="p-6 text-center">
              <Award className="w-8 h-8 text-purple-500 mx-auto mb-3 group-hover:scale-110 transition-transform" aria-hidden="true" />
              <h3 className="font-medium text-gray-800 mb-2">Monthly Plan</h3>
              <p className="text-sm text-gray-600">Comprehensive long-term therapeutic journey</p>
              <Button className="mt-4 w-full" size="sm" variant="outline" aria-label="Create monthly therapy plan">
                <Play className="w-4 h-4 mr-1" />
                Start Monthly
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto space-y-4 p-3 md:p-6 therapy-plan-container">
      {/* Plan Header - Mobile Optimized */}
      <Card className="border-luxury glass-luxury gradient-luxury shadow-luxury">
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6 text-blue-600" />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg md:text-xl theme-text font-serif truncate">Your Adaptive Therapy Plan</CardTitle>
                <p className="text-sm theme-text-secondary">
                  {currentPlan.planType.charAt(0).toUpperCase() + currentPlan.planType.slice(1)} Plan • 
                  Confidence: {Math.round(currentPlan.confidenceScore * 100)}%
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-2">
              <Badge variant="outline" className="border-soft text-xs">
                Adaptation Level: {Math.round(currentPlan.adaptationLevel * 100)}%
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => adaptPlan('user_request')}
                disabled={adapting}
                className="border-soft shadow-soft w-full md:w-auto"
              >
                {adapting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {adapting ? 'Adapting...' : 'Adapt Plan'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="activities" className="w-full space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-auto therapy-plan-tabs transition-all duration-300" role="tablist">
          <TabsTrigger 
            value="activities" 
            className="text-xs md:text-sm px-2 py-2 transition-all duration-200 hover:scale-105"
            aria-label="View daily activities"
          >
            <Activity className="w-4 h-4 mr-1" aria-hidden="true" />
            Activities
          </TabsTrigger>
          <TabsTrigger 
            value="goals" 
            className="text-xs md:text-sm px-2 py-2 transition-all duration-200 hover:scale-105"
            aria-label="View therapeutic goals"
          >
            <Target className="w-4 h-4 mr-1" aria-hidden="true" />
            Goals
          </TabsTrigger>
          <TabsTrigger 
            value="progress" 
            className="text-xs md:text-sm px-2 py-2 transition-all duration-200 hover:scale-105"
            aria-label="View progress metrics"
          >
            <TrendingUp className="w-4 h-4 mr-1" aria-hidden="true" />
            Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="space-y-3 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          <div className="grid gap-3" role="list" aria-label="Daily therapy activities">
            {currentPlan.dailyActivities && currentPlan.dailyActivities.length > 0 ? currentPlan.dailyActivities.map(activity => (
              <Card 
                key={activity.id} 
                className="border-luxury glass-luxury gradient-soft shadow-luxury border-l-4 border-l-purple-400 group hover:shadow-lg transition-all duration-200"
                role="listitem"
                aria-label={`Activity: ${activity.title}`}
              >
                <CardHeader className="p-3 md:p-4 pb-2">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                    <div className="flex items-start space-x-3 min-w-0 flex-1">
                      {getDifficultyIcon(activity.difficulty)}
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base md:text-lg theme-text font-serif leading-tight group-hover:text-blue-600 transition-colors">
                          {activity.title}
                        </CardTitle>
                        <p className="text-sm theme-text-secondary mt-1 leading-relaxed">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <Badge variant="outline" className="border-soft text-xs" aria-label={`Duration: ${activity.estimatedDuration} minutes`}>
                        <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
                        {activity.estimatedDuration} min
                      </Badge>
                      {completedActivities.has(activity.id) ? (
                        <div className="flex items-center space-x-1">
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" aria-hidden="true" />
                            Completed
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => uncompleteActivity(activity.id)}
                            disabled={processingActivities.has(activity.id)}
                            className="text-xs text-gray-500 hover:text-gray-700 p-1 h-6"
                            aria-label={`Undo completion of ${activity.title}`}
                          >
                            {processingActivities.has(activity.id) ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Undo2 className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => completeActivity(activity.id)}
                          disabled={processingActivities.has(activity.id)}
                          className="border-soft shadow-soft text-xs"
                          aria-label={`Mark ${activity.title} as complete`}
                        >
                          {processingActivities.has(activity.id) ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Complete
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 md:p-4 pt-0">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium theme-text mb-2">Instructions:</p>
                      <ol className="list-decimal list-inside space-y-1 text-sm theme-text-secondary pl-2">
                        {activity.instructions.map((instruction, index) => (
                          <li key={index} className="leading-relaxed">{instruction}</li>
                        ))}
                      </ol>
                    </div>
                    
                    {activity.emotionalFocus && (
                      <div className="flex flex-wrap gap-2">
                        {activity.emotionalFocus.map(focus => (
                          <Badge key={focus} variant="secondary" className="text-xs border-soft">
                            {focus}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {activity.personalizedReason && (
                      <div className="glass-luxury gradient-soft p-3 border-soft">
                        <p className="text-sm theme-text-secondary leading-relaxed">
                          <strong className="theme-text">Why this helps:</strong> {activity.personalizedReason}
                        </p>
                      </div>
                    )}
                    
                    {activity.adaptationNotes && (
                      <div className="glass-luxury gradient-soft p-3 border-soft border-l-4 border-l-yellow-400">
                        <p className="text-sm theme-text-secondary leading-relaxed">
                          <strong className="theme-text">Adaptation notes:</strong> {activity.adaptationNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Activities Available</h3>
                <p className="text-gray-500 text-sm">
                  Your plan doesn't have any activities yet. Try adapting your plan to generate new therapeutic activities.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => adaptPlan('content_request')}
                  disabled={adapting}
                  aria-label="Request new activities for your therapy plan"
                >
                  {adapting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {adapting ? 'Generating...' : 'Add Activities'}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-3 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          <div className="grid gap-3" role="list" aria-label="Therapeutic goals">
            {currentPlan.therapeuticGoals && currentPlan.therapeuticGoals.length > 0 ? currentPlan.therapeuticGoals.map(goal => (
              <Card 
                key={goal.id} 
                className="border-luxury glass-luxury gradient-soft shadow-luxury border-l-4 border-l-green-400 group hover:shadow-lg transition-all duration-200"
                role="listitem"
                aria-label={`Goal: ${goal.title}`}
              >
                <CardHeader className="p-3 md:p-4 pb-2">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base md:text-lg theme-text font-serif leading-tight group-hover:text-green-600 transition-colors">
                        {goal.title}
                      </CardTitle>
                      <p className="text-sm theme-text-secondary mt-1 leading-relaxed">{goal.description}</p>
                    </div>
                    <Badge 
                      className={`${getPriorityColor(goal.priority)} text-xs border-soft`}
                      aria-label={`Priority: ${goal.priority}`}
                    >
                      {goal.priority} priority
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3 md:p-4 pt-0">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium theme-text mb-2">Target Completion:</p>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 theme-text-secondary" />
                        <span className="text-sm theme-text-secondary">
                          {new Date(goal.targetCompletion).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium theme-text mb-2">Measurable Outcomes:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm theme-text-secondary pl-2">
                        {goal.measurableOutcomes.map((outcome, index) => (
                          <li key={index} className="leading-relaxed">{outcome}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium theme-text mb-2">Adaptive Strategies:</p>
                      <div className="flex flex-wrap gap-2">
                        {goal.adaptiveStrategies.map((strategy, index) => (
                          <Badge key={`${goal.id}-strategy-${index}`} variant="outline" className="text-xs border-soft">
                            {strategy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Goals Set</h3>
                <p className="text-gray-500 text-sm">
                  Your therapy plan doesn't have specific goals yet. Let's adapt your plan to include meaningful therapeutic objectives.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => adaptPlan('goals_request')}
                  disabled={adapting}
                  aria-label="Request goals for your therapy plan"
                >
                  {adapting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {adapting ? 'Generating...' : 'Set Goals'}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-3 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          <div className="grid gap-3" role="list" aria-label="Progress metrics">
            {currentPlan.progressMetrics && currentPlan.progressMetrics.length > 0 ? currentPlan.progressMetrics.map(metric => (
              <Card 
                key={metric.category} 
                className="border-luxury glass-luxury gradient-soft shadow-luxury group hover:shadow-lg transition-all duration-200"
                role="listitem"
                aria-label={`Progress metric: ${metric.category}`}
              >
                <CardHeader className="p-3 md:p-4 pb-2">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                    <CardTitle className="text-base md:text-lg theme-text font-serif capitalize leading-tight">
                      {metric.category.replace('_', ' ')}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(metric.trend)}
                      <Badge variant="outline" className="border-soft text-xs">{metric.trend}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 md:p-4 pt-0">
                  <div className="space-y-3">
                    <div>
                      <div className="grid grid-cols-3 text-xs md:text-sm theme-text-secondary mb-2 gap-2">
                        <span>Baseline: {metric.baseline ? metric.baseline.toFixed(1) : '0.0'}</span>
                        <span className="text-center">Current: {metric.currentValue ? metric.currentValue.toFixed(1) : '0.0'}</span>
                        <span className="text-right">Target: {metric.targetValue ? metric.targetValue.toFixed(1) : '0.0'}</span>
                      </div>
                      <Progress 
                        value={calculateProgress(metric.baseline || 0, metric.currentValue || 0, metric.targetValue || 0)}
                        className="h-3"
                        aria-label={`Progress: ${calculateProgress(metric.baseline || 0, metric.currentValue || 0, metric.targetValue || 0).toFixed(1)}%`}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600" aria-label={`Confidence level: ${Math.round(metric.confidenceLevel * 100)} percent`}>
                        Confidence: {Math.round(metric.confidenceLevel * 100)}%
                      </span>
                      <span className="text-gray-500" aria-label={`Last updated on ${new Date(metric.lastUpdated).toLocaleDateString()}`}>
                        Updated: {new Date(metric.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Progress Data</h3>
                <p className="text-gray-500 text-sm">
                  Start completing activities and tracking your wellness to see progress metrics here.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => adaptPlan('progress_tracking')}
                  disabled={adapting}
                  aria-label="Enable progress tracking for your therapy plan"
                >
                  {adapting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Heart className="w-4 h-4 mr-2" />}
                  {adapting ? 'Setting up...' : 'Track Progress'}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

      
      </Tabs>

      {/* Plan Adaptation Information - Enhanced with accessibility */}
      <Card className="bg-purple-50 border-purple-200 border-2 border-silver hover:border-4 hover:animate-shimmer transition-all" role="complementary" aria-labelledby="adaptive-intelligence-title">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Brain className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" aria-hidden="true" />
            <div className="text-sm text-purple-800">
              <p id="adaptive-intelligence-title" className="font-medium mb-2">Adaptive Intelligence</p>
              <ul className="space-y-1 text-xs" role="list">
                <li role="listitem">• Your plan automatically adapts based on your progress and emotional patterns</li>
                <li role="listitem">• Activities are personalized using AI analysis of your therapeutic needs</li>
                <li role="listitem">• Real-time monitoring ensures interventions when support is needed</li>
                <li role="listitem">• Completed activities persist across sessions for continuity</li>
                <li role="listitem">• Progress tracking helps optimize your therapeutic journey</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdaptiveTherapyPlan;

