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

// Types for adaptive learning data
interface LearningPreferences {
  preferredTopics: string[];
  exercisePreferences: string[];
  adaptationLevel: number;
  personalityTraits: string[];
}

interface ConversationPattern {
  id: string;
  pattern: string;
  frequency: number;
  effectiveness: number;
  category: string;
  lastUsed: string;
}

interface WellnessRecommendation {
  id: string;
  name: string;
  description: string;
  personalizedReason: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  confidence: number;
}

interface LearningInsights {
  learningProgress: number;
  confidenceScore: number;
  conversationThemes: string[];
  behavioralPatterns: string[];
  effectiveApproaches: string[];
  wellnessNeeds: string[];
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

  // Fetch data with React Query
  const {
    data: preferences,
    isLoading: preferencesLoading,
    error: preferencesError,
    refetch: refetchPreferences
  } = useQuery({
    queryKey: ['/api/adaptive-learning/preferences'],
    enabled: true
  });

  const {
    data: patterns = [],
    isLoading: patternsLoading,
    error: patternsError,
    refetch: refetchPatterns
  } = useQuery({
    queryKey: ['/api/adaptive-learning/patterns'],
    enabled: true
  });

  const {
    data: recommendations = [],
    isLoading: recommendationsLoading,
    error: recommendationsError,
    refetch: refetchRecommendations
  } = useQuery({
    queryKey: ['/api/adaptive-learning/recommendations'],
    enabled: true
  });

  const {
    data: insights,
    isLoading: insightsLoading,
    error: insightsError,
    refetch: refetchInsights
  } = useQuery({
    queryKey: ['/api/adaptive-learning/insights'],
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
      <div className="space-y-6">
        {/* Adaptation Level */}
        <AdaptiveLearningCard 
          title="Adaptation Level" 
          icon={<Settings className="w-5 h-5" />}
        >
          <div className="space-y-4">
            <div className="bg-gray-200 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-white h-3 rounded-full transition-all duration-300"
                style={{ width: `${(preferences?.adaptationLevel || 0) * 100}%` }}
              ></div>
            </div>
            <p className="theme-text-secondary text-sm">
              Higher levels mean more personalized responses based on your interaction patterns
            </p>
          </div>
        </AdaptiveLearningCard>

        {/* Topics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AdaptiveLearningCard 
            title="Preferred Topics" 
            icon={<Target className="w-5 h-5" />}
          >
            <div className="flex flex-wrap gap-2">
              {preferences?.preferredTopics?.map((topic, index) => (
                <span key={index} className="px-2 py-1 bg-white/20 rounded theme-text text-sm">
                  {topic}
                </span>
              )) || <span className="theme-text-secondary">No preferences set</span>}
            </div>
          </AdaptiveLearningCard>
          
          <AdaptiveLearningCard 
            title="Exercise Preferences" 
            icon={<Award className="w-5 h-5" />}
          >
            <div className="flex flex-wrap gap-2">
              {preferences?.exercisePreferences?.map((exercise, index) => (
                <span key={index} className="px-2 py-1 bg-white/20 rounded theme-text text-sm">
                  {exercise}
                </span>
              )) || <span className="theme-text-secondary">No preferences set</span>}
            </div>
          </AdaptiveLearningCard>
        </div>
      </div>
    );
  }, [preferences]);

  const renderPatternsTab = useCallback(() => {
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
            {patterns.map((pattern) => (
              <div key={pattern.id} className="p-4 bg-white/10 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="theme-text font-medium capitalize">{pattern.category}</span>
                  <div className="flex items-center space-x-2">
                    <span className="theme-text-secondary text-sm">Effectiveness:</span>
                    <span className="theme-text font-bold">{Math.round(pattern.effectiveness * 100)}%</span>
                  </div>
                </div>
                <p className="theme-text-secondary text-sm mb-2">{pattern.pattern}</p>
                <div className="flex items-center justify-between text-xs theme-text-secondary">
                  <span>Used {pattern.frequency} times</span>
                  <span>Last used: {new Date(pattern.lastUsed).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </AdaptiveLearningCard>
      </div>
    );
  }, [patterns]);

  const renderRecommendationsTab = useCallback(() => {
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
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-4 bg-white/10 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="theme-text font-medium">{rec.name}</h4>
                  <span className="text-xs theme-text-secondary px-2 py-1 bg-blue-100 text-blue-700 rounded capitalize">
                    {rec.difficulty}
                  </span>
                </div>
                <p className="theme-text-secondary text-sm mb-2">{rec.description}</p>
                <p className="theme-text-secondary text-xs mb-2 italic">Why for you: {rec.personalizedReason}</p>
                <div className="flex items-center justify-between">
                  <span className="theme-text-secondary text-xs flex items-center">
                    <span className="mr-1">⏱️</span>
                    {rec.duration} min
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className="theme-text-secondary text-xs">Confidence:</span>
                    <span className="theme-text font-bold text-xs">{Math.round(rec.confidence * 100)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AdaptiveLearningCard>
      </div>
    );
  }, [recommendations]);

  const renderInsightsTab = useCallback(() => {
    if (!insights) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AdaptiveLearningCard 
            title="Learning Progress" 
            icon={<Brain className="w-5 h-5" />}
          >
            <div className="text-center">
              <div className="text-3xl font-bold theme-text mb-2">
                {Math.round((insights.learningProgress || 0) * 100)}%
              </div>
              <p className="text-sm theme-text-secondary">AI adaptation level</p>
            </div>
          </AdaptiveLearningCard>

          <AdaptiveLearningCard 
            title="Confidence Score" 
            icon={<Award className="w-5 h-5" />}
          >
            <div className="text-center">
              <div className="text-3xl font-bold theme-text mb-2">
                {Math.round((insights.confidenceScore || 0) * 100)}%
              </div>
              <p className="text-sm theme-text-secondary">Response accuracy</p>
            </div>
          </AdaptiveLearningCard>
        </div>

        <AdaptiveLearningCard 
          title="AI Learning Insights" 
          icon={<TrendingUp className="w-5 h-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium theme-text mb-3 flex items-center">
                <span className="mr-2">💬</span>
                Conversation Themes
              </h4>
              <div className="space-y-1">
                {insights.conversationThemes?.map((theme, index) => (
                  <span key={index} className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm mr-1 mb-1">
                    {theme}
                  </span>
                )) || <span className="theme-text-secondary">No themes identified</span>}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium theme-text mb-3 flex items-center">
                <span className="mr-2">🔍</span>
                Behavioral Patterns
              </h4>
              <div className="space-y-1">
                {insights.behavioralPatterns?.map((pattern, index) => (
                  <span key={index} className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-sm mr-1 mb-1">
                    {pattern}
                  </span>
                )) || <span className="theme-text-secondary">No patterns identified</span>}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium theme-text mb-3 flex items-center">
                <span className="mr-2">✅</span>
                Effective Approaches
              </h4>
              <div className="space-y-1">
                {insights.effectiveApproaches?.map((approach, index) => (
                  <span key={index} className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm mr-1 mb-1">
                    {approach}
                  </span>
                )) || <span className="theme-text-secondary">No approaches identified</span>}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium theme-text mb-3 flex items-center">
                <span className="mr-2">🎯</span>
                Wellness Needs
              </h4>
              <div className="space-y-1">
                {insights.wellnessNeeds?.map((need, index) => (
                  <span key={index} className="inline-block px-2 py-1 bg-amber-100 text-amber-700 rounded text-sm mr-1 mb-1">
                    {need}
                  </span>
                )) || <span className="theme-text-secondary">No needs identified</span>}
              </div>
            </div>
          </div>
        </AdaptiveLearningCard>
      </div>
    );
  }, [insights]);

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