import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Brain, 
  MessageSquare, 
  Target, 
  TrendingUp, 
  User, 
  Settings, 
  Lightbulb, 
  Award, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  ArrowRight 
} from 'lucide-react';

// Types for adaptive learning data matching backend response
interface LearningPreferences {
  learningStyle: string;
  communicationPreference: string;
  supportLevel: string;
  adaptationSpeed: string;
  personalityFocus: string[];
  therapeuticGoals: string[];
  lastUpdated: string;
}

interface ConversationPattern {
  id: number;
  type: string;
  pattern: string;
  confidence: number;
  frequency: number;
  lastObserved: string;
}

interface WellnessRecommendation {
  id: number;
  type: string;
  title: string;
  description: string;
  confidence: number;
  priority: string;
  category: string;
  estimatedDuration: string;
  adaptationReason: string;
}

interface LearningInsights {
  id: number;
  category: string;
  insight: string;
  type: string;
  strength: number;
  actionable: boolean;
  suggestion: string;
  discoveredAt: string;
}

// Utility Components
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px]">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
    <p className="text-gray-600 text-center">{message}</p>
  </div>
);

const ErrorMessage: React.FC<{ error: string; onRetry?: () => void }> = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
    <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
    <h3 className="text-lg font-medium text-gray-800 mb-2">Unable to Load Data</h3>
    <p className="text-gray-600 mb-4 max-w-md">{error}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    )}
  </div>
);

// Adaptive Learning Card Component
const AdaptiveLearningCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <div className="theme-surface rounded-lg p-6 shadow-lg border-2 border-silver">
    <div className="flex items-center gap-3 mb-4">
      <div className="text-blue-500">{icon}</div>
      <h3 className="text-lg font-semibold theme-text">{title}</h3>
    </div>
    {children}
  </div>
);

export default function AdaptiveLearning() {
  const [activeTab, setActiveTab] = useState('preferences');

  // Fetch data with React Query (properly typed)
  const {
    data: preferences,
    isLoading: preferencesLoading,
    error: preferencesError,
    refetch: refetchPreferences
  } = useQuery<LearningPreferences>({
    queryKey: ['/api/user/adaptive-preferences'],
    queryFn: async () => {
      const response = await fetch('/api/user/adaptive-preferences');
      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }
      return response.json();
    },
    enabled: true
  });

  const {
    data: patterns = [],
    isLoading: patternsLoading,
    error: patternsError,
    refetch: refetchPatterns
  } = useQuery<ConversationPattern[]>({
    queryKey: ['/api/analytics/patterns'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/patterns?userId=107');
      if (!response.ok) {
        throw new Error('Failed to fetch patterns');
      }
      return response.json();
    },
    enabled: true
  });

  const {
    data: recommendations = [],
    isLoading: recommendationsLoading,
    error: recommendationsError,
    refetch: refetchRecommendations
  } = useQuery<WellnessRecommendation[]>({
    queryKey: ['/api/analytics/recommendations'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/recommendations?userId=107');
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      return response.json();
    },
    enabled: true
  });

  const {
    data: insights = [],
    isLoading: insightsLoading,
    error: insightsError,
    refetch: refetchInsights
  } = useQuery<LearningInsights[]>({
    queryKey: ['/api/memory/insights'],
    queryFn: async () => {
      const response = await fetch('/api/memory/insights?userId=107');
      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }
      return response.json();
    },
    enabled: true
  });

  // Tab configuration (memoized)
  const tabs = useMemo(() => [
    {
      id: 'preferences',
      label: 'Preferences',
      icon: <User className="w-5 h-5" />,
      'aria-label': 'View your personalized AI preferences and settings'
    },
    {
      id: 'patterns',
      label: 'Patterns',
      icon: <MessageSquare className="w-5 h-5" />,
      'aria-label': 'View conversation patterns and communication insights'
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      icon: <Lightbulb className="w-5 h-5" />,
      'aria-label': 'View personalized wellness recommendations'
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: <Brain className="w-5 h-5" />,
      'aria-label': 'View AI adaptation insights and learning progress'
    }
  ], []);

  // ALL useCallback hooks declared here (before any early returns)
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  const renderPreferencesTab = useCallback(() => {
    if (preferencesLoading) return <LoadingSpinner message="Loading your learning preferences..." />;
    if (preferencesError) return <ErrorMessage error="Failed to load preferences" onRetry={refetchPreferences} />;
    if (!preferences) {
      return (
        <div className="text-center py-8">
          <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-600 mb-1">No Preferences Set</h3>
          <p className="text-sm text-gray-500">Start using the app to build your personalized preferences</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AdaptiveLearningCard title="Learning Style" icon={<Brain className="w-5 h-5" />}>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium theme-text">Preferred Style</span>
              <span className="text-lg font-bold text-blue-600 capitalize">{preferences.learningStyle}</span>
            </div>
            <p className="text-sm text-gray-600">
              Your identified learning style based on interaction patterns.
            </p>
          </div>
        </AdaptiveLearningCard>

        <AdaptiveLearningCard title="Communication Preference" icon={<MessageSquare className="w-5 h-5" />}>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium theme-text">Style</span>
              <span className="text-lg font-bold text-green-600 capitalize">{preferences.communicationPreference}</span>
            </div>
            <p className="text-sm text-gray-600">
              How you prefer to receive information and feedback.
            </p>
          </div>
        </AdaptiveLearningCard>

        <AdaptiveLearningCard title="Personality Focus" icon={<User className="w-5 h-5" />}>
          <div className="space-y-2">
            {preferences.personalityFocus?.map((focus: string, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-black-50 rounded-lg">
                <span className="text-sm font-medium theme-text capitalize">{focus.replace('-', ' ')}</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            ))}
          </div>
        </AdaptiveLearningCard>

        <AdaptiveLearningCard title="Therapeutic Goals" icon={<Target className="w-5 h-5" />}>
          <div className="space-y-2">
            {preferences.therapeuticGoals?.map((goal: string, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-black-50 rounded-lg">
                <span className="text-sm font-medium theme-text capitalize">{goal.replace('-', ' ')}</span>
                <Award className="w-4 h-4 text-blue-500" />
              </div>
            ))}
          </div>
        </AdaptiveLearningCard>
      </div>
    );
  }, [preferences, preferencesLoading, preferencesError, refetchPreferences]);

  const renderPatternsTab = useCallback(() => {
    if (patternsLoading) return <LoadingSpinner message="Loading conversation patterns..." />;
    if (patternsError) return <ErrorMessage error="Failed to load patterns" onRetry={refetchPatterns} />;
    if (patterns.length === 0) {
      return (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-600 mb-1">No Conversation Patterns Yet</h3>
          <p className="text-sm text-gray-500">Continue conversations to help the AI learn your communication patterns</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <AdaptiveLearningCard 
          title="Conversation Patterns" 
          icon={<MessageSquare className="w-5 h-5" />}
        >
          <div className="space-y-4">
            {patterns.map((pattern: ConversationPattern) => (
              <div key={pattern.id} className="p-4 bg-gray-800 rounded-lg border border-gray-600 hover:border-blue-400 transition-colors shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium capitalize">{pattern.type}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-300 text-sm">Confidence:</span>
                    <span className="text-white font-bold">{pattern.confidence}%</span>
                  </div>
                </div>
                <p className="text-gray-200 text-sm mb-2">{pattern.pattern}</p>
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <span>Used {pattern.frequency} times</span>
                  <span>Last observed: {new Date(pattern.lastObserved).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </AdaptiveLearningCard>
      </div>
    );
  }, [patterns, patternsLoading, patternsError, refetchPatterns]);

  const renderRecommendationsTab = useCallback(() => {
    if (recommendationsLoading) return <LoadingSpinner message="Loading recommendations..." />;
    if (recommendationsError) return <ErrorMessage error="Failed to load recommendations" onRetry={refetchRecommendations} />;
    if (recommendations.length === 0) {
      return (
        <div className="text-center py-8">
          <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-600 mb-1">No Recommendations Available</h3>
          <p className="text-sm text-gray-500">Use the app more to receive personalized wellness recommendations</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <AdaptiveLearningCard 
          title="Wellness Recommendations" 
          icon={<Lightbulb className="w-5 h-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec: WellnessRecommendation) => (
              <div key={rec.id} className="p-4 bg-gray-800 rounded-lg border border-gray-600 hover:border-blue-400 transition-colors shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{rec.title}</h4>
                  <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded capitalize">
                    {rec.priority}
                  </span>
                </div>
                <p className="text-gray-200 text-sm mb-2">{rec.description}</p>
                <p className="text-gray-300 text-xs mb-2 italic">Why for you: {rec.adaptationReason}</p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-xs flex items-center">
                    <span className="mr-1">⏱️</span>
                    {rec.estimatedDuration}
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-300 text-xs">Confidence:</span>
                    <span className="text-white font-bold text-xs">{rec.confidence}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AdaptiveLearningCard>
      </div>
    );
  }, [recommendations, recommendationsLoading, recommendationsError, refetchRecommendations]);

  const renderInsightsTab = useCallback(() => {
    if (insightsLoading) return <LoadingSpinner message="Loading insights..." />;
    if (insightsError) return <ErrorMessage error="Failed to load insights" onRetry={refetchInsights} />;
    if (insights.length === 0) {
      return (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-600 mb-1">No Insights Available</h3>
          <p className="text-sm text-gray-500">Continue using the app for AI to generate adaptation insights</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <AdaptiveLearningCard 
          title="AI Learning Insights" 
          icon={<Brain className="w-5 h-5" />}
        >
          <div className="space-y-4">
            {insights.map((insight: LearningInsights) => (
              <div key={insight.id} className="p-4 bg-gray-800 rounded-lg border border-gray-600 hover:border-blue-400 transition-colors shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium capitalize">{insight.category}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 bg-green-600 text-white rounded">
                      {insight.actionable ? 'Actionable' : 'Insight'}
                    </span>
                    <span className="text-gray-300 text-sm">Strength:</span>
                    <span className="text-white font-bold">{Math.round(insight.strength * 100)}%</span>
                  </div>
                </div>
                <p className="text-gray-200 text-sm mb-2">{insight.insight}</p>
                <p className="text-gray-300 text-xs italic mb-2">{insight.suggestion}</p>
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <span>Type: {insight.type ? insight.type.replace('-', ' ') : 'General'}</span>
                  <span>Discovered: {new Date(insight.discoveredAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </AdaptiveLearningCard>
      </div>
    );
  }, [insights, insightsLoading, insightsError, refetchInsights]);

  // Global loading and error states (after ALL hooks are declared)
  const isLoading = preferencesLoading || patternsLoading || recommendationsLoading || insightsLoading;
  const hasError = preferencesError || patternsError || recommendationsError || insightsError;

  if (isLoading) {
    return <LoadingSpinner message="Loading adaptive learning dashboard..." />;
  }

  if (hasError) {
    const error = preferencesError || patternsError || recommendationsError || insightsError;
    return (
      <ErrorMessage 
        error={error?.message || 'Failed to load adaptive learning data'} 
        onRetry={() => {
          refetchPreferences();
          refetchPatterns();
          refetchRecommendations();
          refetchInsights();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen theme-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold theme-text mb-2">Adaptive Learning</h1>
          <p className="theme-text-secondary">AI-powered personalization and learning insights</p>
        </div>

        {/* Enhanced Navigation Tabs with Accessibility */}
        <div className="w-full theme-surface rounded-lg p-1 mb-6 shadow-lg border-2 border-silver">
          <div 
            className="grid grid-cols-4 gap-1" 
            role="tablist" 
            aria-label="Adaptive learning dashboard navigation"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                aria-label={tab['aria-label']}
                className={`w-full px-3 py-3 text-sm font-medium rounded-md transition-all duration-200 border-2 border-silver ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-lg hover:bg-blue-600'
                    : 'theme-text hover:bg-blue-50 hover:border-blue-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              >
                <div className="flex flex-col items-center">
                  {tab.icon}
                  <span className="mt-1">{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Tab Content with ARIA */}
        <div className="min-h-[400px]">
          {activeTab === 'preferences' && (
            <div role="tabpanel" id="preferences-panel" aria-labelledby="preferences-tab">
              {renderPreferencesTab()}
            </div>
          )}
          {activeTab === 'patterns' && (
            <div role="tabpanel" id="patterns-panel" aria-labelledby="patterns-tab">
              {renderPatternsTab()}
            </div>
          )}
          {activeTab === 'recommendations' && (
            <div role="tabpanel" id="recommendations-panel" aria-labelledby="recommendations-tab">
              {renderRecommendationsTab()}
            </div>
          )}
          {activeTab === 'insights' && (
            <div role="tabpanel" id="insights-panel" aria-labelledby="insights-tab">
              {renderInsightsTab()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}