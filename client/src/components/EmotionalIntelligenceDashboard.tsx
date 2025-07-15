import { getCurrentUserId } from "../utils/userSession";
import React, { useState } from 'react';
import { Brain, TrendingUp, AlertTriangle, Target, Zap, Clock, Heart, MessageCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

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

export default function EmotionalIntelligenceDashboard() {
  const userId = getCurrentUserId();
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  // Fetch dashboard overview
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/emotional-intelligence/dashboard', userId],
    queryFn: () => axios.get(`/api/emotional-intelligence/dashboard/${userId}`).then(res => res.data)
  });

  // Fetch mood forecasts
  const { data: forecastsData, isLoading: forecastsLoading } = useQuery({
    queryKey: ['/api/emotional-intelligence/mood-forecasts', userId],
    queryFn: () => axios.get(`/api/emotional-intelligence/mood-forecasts/${userId}?limit=10`).then(res => res.data)
  });

  // Fetch predictive insights
  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['/api/emotional-intelligence/insights', userId],
    queryFn: () => axios.get(`/api/emotional-intelligence/insights/${userId}`).then(res => res.data)
  });

  // Fetch response adaptations
  const { data: adaptationsData, isLoading: adaptationsLoading } = useQuery({
    queryKey: ['/api/emotional-intelligence/adaptations', userId],
    queryFn: () => axios.get(`/api/emotional-intelligence/adaptations/${userId}?limit=20`).then(res => res.data)
  });

  // Generate new mood forecast
  const generateForecastMutation = useMutation({
    mutationFn: () => axios.post('/api/emotional-intelligence/mood-forecast', { userId }).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emotional-intelligence/mood-forecasts', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/emotional-intelligence/dashboard', userId] });
    }
  });

  const overview: DashboardOverview = dashboardData?.overview || {
    totalForecasts: 0,
    averageAccuracy: 0,
    activeInsights: 0,
    adaptationEffectiveness: 0,
    emotionalStability: 75
  };

  const forecasts: MoodForecast[] = forecastsData?.forecasts || [];
  const insights: PredictiveInsight[] = insightsData?.insights || [];
  const adaptations: EmotionalResponseAdaptation[] = adaptationsData?.adaptations || [];

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-100 text-red-800 border border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      default: return 'bg-green-100 text-green-800 border border-green-200';
    }
  };

  if (dashboardLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
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
      <div className="w-full bg-white rounded-lg p-1 mb-6 shadow-lg">
        <div className="grid grid-cols-4 gap-1">
          {[
            { id: 'overview', label: 'System Overview' },
            { id: 'forecasts', label: 'Mood Forecasts' },
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

        {activeTab === 'forecasts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Mood Forecasts</h2>
              <button 
                onClick={() => generateForecastMutation.mutate()}
                disabled={generateForecastMutation.isPending}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {generateForecastMutation.isPending ? 'Generating...' : 'Generate New Forecast'}
              </button>
            </div>

            {forecastsLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : forecasts.length === 0 ? (
              <div className="p-8 text-center border border-gray-200 rounded-lg" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No mood forecasts available. Generate your first forecast to begin predictive mood analysis.</p>
              </div>
            ) : (
              forecasts.map((forecast) => (
                <div key={forecast.id} className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow" style={{ backgroundColor: 'var(--surface-secondary)' }}>
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
                    </div>
                  </div>

                  {forecast.triggerFactors.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Trigger Factors:</h4>
                      <div className="flex flex-wrap gap-1">
                        {forecast.triggerFactors.map((factor, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-gray-100 border border-gray-200 rounded">
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
            
            {insightsLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : insights.length === 0 ? (
              <div className="p-8 text-center border border-gray-200 rounded-lg" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <Zap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No predictive insights available. Insights will be generated as you interact with the system.</p>
              </div>
            ) : (
              insights.map((insight) => (
                <div key={insight.id} className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <h3 className="text-lg font-semibold">Predictive Insight</h3>
                      <span className="px-2 py-1 text-xs bg-gray-100 border border-gray-200 rounded">
                        {Math.round(insight.probability * 100)}% probability
                      </span>
                    </div>
                    <span className="text-sm font-medium text-blue-600">
                      {insight.timeframe}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-4">{insight.insight}</p>

                  {insight.preventiveActions.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Preventive Actions:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {insight.preventiveActions.map((action, index) => (
                          <li key={index} className="text-sm text-gray-600">
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {insight.riskMitigation.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Risk Mitigation:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {insight.riskMitigation.map((mitigation, index) => (
                          <li key={index} className="text-sm text-gray-600">
                            {mitigation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {insight.wasAccurate !== undefined && (
                    <div className={`p-2 rounded ${insight.wasAccurate ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <p className="text-sm">
                        Marked as: <strong>{insight.wasAccurate ? 'Accurate' : 'Inaccurate'}</strong>
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
            
            {adaptationsLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : adaptations.length === 0 ? (
              <div className="p-8 text-center border border-gray-200 rounded-lg" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No response adaptations available. Adaptations will appear as the system learns your preferences.</p>
              </div>
            ) : (
              adaptations.map((adaptation) => (
                <div key={adaptation.id} className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold">Response Adaptation</h3>
                    <div className="flex gap-1">
                      <span className="px-2 py-1 text-xs bg-gray-100 border border-gray-200 rounded">{adaptation.tone}</span>
                      <span className="px-2 py-1 text-xs bg-gray-100 border border-gray-200 rounded">{adaptation.intensity}</span>
                      <span className="px-2 py-1 text-xs bg-gray-100 border border-gray-200 rounded">{adaptation.responseLength}</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Original Message:</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                        {adaptation.originalMessage}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Adapted Response:</h4>
                      <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
                        {adaptation.adaptedResponse}
                      </p>
                    </div>
                  </div>

                  {adaptation.effectiveness && (
                    <div className="bg-blue-50 p-2 rounded border border-blue-200">
                      <p className="text-sm">
                        Effectiveness Rating: <strong>{Math.round(parseFloat(adaptation.effectiveness) * 100)}%</strong>
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