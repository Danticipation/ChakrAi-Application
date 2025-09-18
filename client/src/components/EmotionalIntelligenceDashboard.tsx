import { getCurrentUserId } from "../utils/userSession";
import React, { useState, useCallback } from 'react';
import { Brain, TrendingUp, AlertTriangle, Target, Zap, Clock, Heart, MessageCircle, Loader2, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from "axios";
import type { AxiosResponse } from "axios";

interface MoodForecast {
  id: number;
  userId: number;
  forecastDate: string;
  predictedMood: string;
  confidenceScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  triggerFactors: string[];
  preventiveRecommendations: string[];
  actualMood?: string;
  forecastAccuracy?: string;
}

interface PredictiveInsight {
  id: number;
  userId: number;
  insight: string;
  probability: number;
  timeframe: string;
  preventiveActions: string[];
  riskMitigation: string[];
  isActive: boolean;
  wasAccurate?: boolean;
  userFeedback?: string;
}

interface EmotionalResponseAdaptation {
  id: number;
  userId: number;
  originalMessage: string;
  adaptedResponse: string;
  tone: string;
  intensity: string;
  responseLength: string;
  effectiveness?: string;
  userResponse?: string;
}

interface DashboardOverview {
  totalForecasts: number;
  averageAccuracy: number;
  activeInsights: number;
  adaptationEffectiveness: number;
  emotionalStability: number;
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

// Empty State Component
const EmptyState: React.FC<{ icon: React.ReactNode; message: string; description?: string }> = ({ 
  icon, message, description 
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="w-12 h-12 text-gray-400 mb-3">{icon}</div>
    <h3 className="text-sm font-medium text-gray-700 mb-1">{message}</h3>
    {description && <p className="text-xs text-gray-500 text-center">{description}</p>}
  </div>
);

// Utility function to normalize percentages
const normalizePercentage = (value: string | number | undefined): number => {
  if (typeof value === 'number') return Math.min(100, Math.max(0, value));
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace('%', ''));
    return isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
  }
  return 0;
};

export default function EmotionalIntelligenceDashboard() {
  const userId = getCurrentUserId();
  const [activeTab, setActiveTab] = useState('overview');
  const [isGeneratingForecast, setIsGeneratingForecast] = useState(false);
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

  // Fetch dashboard overview
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard 
  } = useQuery({
    queryKey: ['emotional-intelligence', 'dashboard', userId],
    queryFn: async (): Promise<ApiResponse<DashboardOverview>> => {
      const response: AxiosResponse<ApiResponse<DashboardOverview>> = await axios.get(
        `/api/emotional-intelligence/dashboard/${userId}`
      );
      return response.data;
    },
    enabled: !!userId && activeTab === 'overview'
  });

  // Fetch mood forecasts
  const { 
    data: forecastsData, 
    isLoading: forecastsLoading, 
    error: forecastsError,
    refetch: refetchForecasts 
  } = useQuery({
    queryKey: ['emotional-intelligence', 'mood-forecasts', userId],
    queryFn: async (): Promise<ApiResponse<MoodForecast[]>> => {
      const response: AxiosResponse<ApiResponse<MoodForecast[]>> = await axios.get(
        `/api/emotional-intelligence/mood-forecasts/${userId}?limit=10`
      );
      return response.data;
    },
    enabled: !!userId && activeTab === 'forecasting'
  });

  // Fetch predictive insights
  const { 
    data: insightsData, 
    isLoading: insightsLoading, 
    error: insightsError,
    refetch: refetchInsights 
  } = useQuery({
    queryKey: ['emotional-intelligence', 'insights', userId],
    queryFn: async (): Promise<ApiResponse<PredictiveInsight[]>> => {
      const response: AxiosResponse<ApiResponse<PredictiveInsight[]>> = await axios.get(
        `/api/emotional-intelligence/insights/${userId}`
      );
      return response.data;
    },
    enabled: !!userId && activeTab === 'insights'
  });

  // Fetch response adaptations
  const { 
    data: adaptationsData, 
    isLoading: adaptationsLoading, 
    error: adaptationsError,
    refetch: refetchAdaptations 
  } = useQuery({
    queryKey: ['emotional-intelligence', 'adaptations', userId],
    queryFn: async (): Promise<ApiResponse<EmotionalResponseAdaptation[]>> => {
      const response: AxiosResponse<ApiResponse<EmotionalResponseAdaptation[]>> = await axios.get(
        `/api/emotional-intelligence/adaptations/${userId}?limit=20`
      );
      return response.data;
    },
    enabled: !!userId && activeTab === 'adaptations'
  });

  // Debounced generate new mood forecast with loading state
  const generateForecastMutation = useMutation({
    mutationFn: async () => {
      setIsGeneratingForecast(true);
      const response: AxiosResponse<ApiResponse<MoodForecast>> = await axios.post(
        '/api/emotional-intelligence/mood-forecast', 
        { userId }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emotional-intelligence', 'mood-forecasts', userId] });
      queryClient.invalidateQueries({ queryKey: ['emotional-intelligence', 'dashboard', userId] });
    },
    onSettled: () => {
      setIsGeneratingForecast(false);
    }
  });

  // Memoized generate forecast handler to prevent multiple clicks
  const handleGenerateForecast = useCallback(() => {
    if (isGeneratingForecast) return;
    generateForecastMutation.mutate();
  }, [isGeneratingForecast, generateForecastMutation]);

  // Safe data extraction with proper typing
  const overview: DashboardOverview = dashboardData?.data || {
    totalForecasts: 0,
    averageAccuracy: 0,
    activeInsights: 0,
    adaptationEffectiveness: 0,
    emotionalStability: 75
  };

  const forecasts: MoodForecast[] = forecastsData?.data || [];
  const insights: PredictiveInsight[] = insightsData?.data || [];
  const adaptations: EmotionalResponseAdaptation[] = adaptationsData?.data || [];

  // Theme-aware styling function
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800';
      case 'high': return 'bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800';
      case 'medium': return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800';
      default: return 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800';
    }
  };

  // Show appropriate loading states based on active tab
  if (activeTab === 'overview' && dashboardLoading) {
    return <LoadingSpinner message="Loading emotional intelligence dashboard..." />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Advanced Emotional Intelligence
          </h1>
          <p className="text-gray-600">
            Predictive mood forecasting and contextual emotional response system
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-blue-700">Total Forecasts</p>
              <p className="text-2xl font-bold text-blue-900">{overview.totalForecasts}</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-green-700">Accuracy</p>
              <p className="text-2xl font-bold text-green-900">{overview.averageAccuracy}%</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-purple-700">Active Insights</p>
              <p className="text-2xl font-bold text-purple-900">{overview.activeInsights}</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm text-orange-700">Adaptation Rate</p>
              <p className="text-2xl font-bold text-orange-900">{overview.adaptationEffectiveness}%</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-sm text-indigo-700">Emotional Stability</p>
              <p className="text-2xl font-bold text-indigo-900">{overview.emotionalStability}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="w-full bg-white dark:bg-gray-800 rounded-lg p-1 mb-6 shadow-lg">
        <div className="grid grid-cols-4 gap-1">
          {[
            { id: 'overview', label: 'System Overview' },
            { id: 'forecasting', label: 'Mood Forecasts' },
            { id: 'insights', label: 'Predictive Insights' },
            { id: 'adaptations', label: 'Response Adaptations' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full px-2 py-3 text-xs font-bold rounded-md transition-all border-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-accent)] text-white shadow-lg border-2 border-silver animate-shimmer'
                  : 'bg-gray-700 text-white border-gray-600 hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg border border-gray-200" style={{ backgroundColor: 'var(--surface-secondary)' }}>
              <h3 className="text-lg font-semibold mb-4">Emotional Intelligence Metrics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Forecast Accuracy</span>
                    <span>{overview.averageAccuracy}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${overview.averageAccuracy}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Adaptation Effectiveness</span>
                    <span>{overview.adaptationEffectiveness}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${overview.adaptationEffectiveness}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Emotional Stability</span>
                    <span>{overview.emotionalStability}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${overview.emotionalStability}%` }}></div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">System Status</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Advanced Emotional Intelligence system is operational with predictive mood forecasting and contextual response adaptation capabilities.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg border border-gray-200" style={{ backgroundColor: 'var(--surface-secondary)' }}>
              <h3 className="text-lg font-semibold mb-4">Recent Activity Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Generated {overview.totalForecasts} mood forecasts</p>
                    <p className="text-xs text-gray-600">Predictive accuracy: {overview.averageAccuracy}%</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">{overview.activeInsights} active predictive insights</p>
                    <p className="text-xs text-gray-600">Risk mitigation recommendations available</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Response adaptations active</p>
                    <p className="text-xs text-gray-600">{overview.adaptationEffectiveness}% effectiveness rate</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                  <Heart className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium">Emotional stability maintained</p>
                    <p className="text-xs text-gray-600">{overview.emotionalStability}% stability score</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'forecasting' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Mood Forecasts</h2>
              <button 
                onClick={handleGenerateForecast}
                disabled={isGeneratingForecast}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isGeneratingForecast ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate New Forecast'
                )}
              </button>
            </div>

            {forecastsError && (
              <ErrorMessage 
                error={forecastsError.message || 'Failed to load mood forecasts'} 
                onRetry={() => refetchForecasts()}
              />
            )}

            {forecastsLoading ? (
              <LoadingSpinner message="Loading mood forecasts..." />
            ) : forecasts.length === 0 ? (
              <EmptyState 
                icon={<TrendingUp />}
                message="No mood forecasts available"
                description="Generate your first forecast to begin predictive mood analysis."
              />
            ) : (
              forecasts.map((forecast) => (
                <div key={`forecast-${forecast.id}`} className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Predicted Mood: <span className="text-purple-600">{forecast.predictedMood}</span>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getRiskLevelColor(forecast.riskLevel)}`}>
                          {forecast.riskLevel} risk
                        </span>
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(forecast.forecastDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Confidence</p>
                      <p className="text-lg font-semibold">{Math.round(forecast.confidenceScore * 100)}%</p>
                      {forecast.forecastAccuracy && (
                        <p className="text-xs text-green-600">Accuracy: {normalizePercentage(forecast.forecastAccuracy)}%</p>
                      )}
                    </div>
                  </div>

                  {forecast.triggerFactors.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Trigger Factors:</h4>
                      <div className="flex flex-wrap gap-1">
                        {forecast.triggerFactors.map((factor, index) => (
                          <span key={`trigger-${forecast.id}-${index}`} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {forecast.preventiveRecommendations.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Preventive Recommendations:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {forecast.preventiveRecommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-gray-600">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {forecast.actualMood && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <p className="text-sm">
                        <strong>Actual Mood:</strong> {forecast.actualMood}
                        {forecast.forecastAccuracy && (
                          <span className="ml-2 text-green-600">
                            (Accuracy: {forecast.forecastAccuracy}%)
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Predictive Insights</h2>
            
            {insightsError && (
              <ErrorMessage 
                error={insightsError.message || 'Failed to load predictive insights'} 
                onRetry={() => refetchInsights()}
              />
            )}

            {insightsLoading ? (
              <LoadingSpinner message="Loading predictive insights..." />
            ) : insights.length === 0 ? (
              <EmptyState 
                icon={<Zap />}
                message="No predictive insights available"
                description="Insights will be generated as you interact with the system."
              />
            ) : (
              insights.map((insight) => (
                <div key={`insight-${insight.id}`} className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <h3 className="text-lg font-semibold">Predictive Insight</h3>
                      <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded">
                        {Math.round(insight.probability * 100)}% probability
                      </span>
                    </div>
                    <span className="text-sm font-medium text-blue-600">
                      {insight.timeframe}
                    </span>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-4">{insight.insight}</p>

                  {insight.preventiveActions.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Preventive Actions:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {insight.preventiveActions.map((action, index) => (
                          <li key={`action-${insight.id}-${index}`} className="text-sm text-gray-600 dark:text-gray-400">
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {insight.riskMitigation.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Risk Mitigation:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {insight.riskMitigation.map((mitigation, index) => (
                          <li key={`mitigation-${insight.id}-${index}`} className="text-sm text-gray-600 dark:text-gray-400">
                            {mitigation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className={`px-2 py-1 text-xs rounded ${
                      insight.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {insight.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {insight.wasAccurate !== undefined && (
                      <span className={`px-2 py-1 text-xs rounded ${
                        insight.wasAccurate ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      }`}>
                        {insight.wasAccurate ? 'Accurate' : 'Inaccurate'}
                      </span>
                    )}
                  </div>

                  {insight.userFeedback && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>User Feedback:</strong> {insight.userFeedback}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'adaptations' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Response Adaptations</h2>
            
            {adaptationsError && (
              <ErrorMessage 
                error={adaptationsError.message || 'Failed to load response adaptations'} 
                onRetry={() => refetchAdaptations()}
              />
            )}

            {adaptationsLoading ? (
              <LoadingSpinner message="Loading response adaptations..." />
            ) : adaptations.length === 0 ? (
              <EmptyState 
                icon={<MessageCircle />}
                message="No response adaptations available"
                description="Adaptations will appear as the system learns your preferences."
              />
            ) : (
              adaptations.map((adaptation) => (
                <div key={`adaptation-${adaptation.id}`} className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-blue-500" />
                        Original Message
                      </h3>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                        <p className="text-sm">{adaptation.originalMessage}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-green-500" />
                        Adapted Response
                      </h3>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                        <p className="text-sm">{adaptation.adaptedResponse}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid md:grid-cols-4 gap-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Tone</p>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded">
                        {adaptation.tone}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Intensity</p>
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 rounded">
                        {adaptation.intensity}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Length</p>
                      <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 rounded">
                        {adaptation.responseLength}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Effectiveness</p>
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 rounded">
                        {adaptation.effectiveness ? `${normalizePercentage(adaptation.effectiveness)}%` : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {adaptation.userResponse && (
                    <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-200 dark:border-indigo-800">
                      <p className="text-sm text-indigo-700 dark:text-indigo-300">
                        <strong>User Response:</strong> {adaptation.userResponse}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
