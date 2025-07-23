import React, { useState, useCallback, useMemo } from 'react';
import { 
  Brain, TrendingUp, AlertTriangle, Target, Shield, BarChart, Clock, Users, 
  Loader2, RefreshCw, ChevronDown, ChevronUp, CheckCircle, XCircle, 
  Eye, MessageSquare, ExternalLink, ArrowRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface AiPerformanceOverview {
  totalResponses: number;
  averageResponseQuality: number;
  averageTherapeuticEffectiveness: number;
  crisisDetectionAccuracy: number;
  falsePositiveRate: number;
  userSatisfactionAverage: number;
  averageResponseTime: number;
}

interface AiPerformanceMetric {
  id: number;
  userId: number;
  metricType: string;
  metricValue: number;
  context: string;
  aiModel: string;
  promptTokens: number;
  completionTokens: number;
  responseTime: number;
  timestamp: string;
  sessionId: string;
  conversationId: string;
}

interface AiResponseAnalysis {
  id: number;
  userId: number;
  originalPrompt: string;
  aiResponse: string;
  therapeuticScore: number;
  empathyScore: number;
  clarityScore: number;
  appropriatenessScore: number;
  userFeedback: string;
  userRating: number;
  flaggedForReview: boolean;
  reviewNotes: string;
  createdAt: string;
  updatedAt: string;
}

interface CrisisDetectionLog {
  id: number;
  userId: number;
  messageContent: string;
  detectedRiskLevel: string;
  confidenceScore: number;
  triggerKeywords: string[];
  aiAnalysis: string;
  interventionTriggered: boolean;
  interventionType: string;
  falsePositive: boolean;
  truePositive: boolean;
  reviewedBy: string;
  reviewNotes: string;
  detectedAt: string;
  reviewedAt: string;
}

export default function AiPerformanceMonitoringDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const itemsPerPage = 10;

  // Enhanced query function with error handling
  const createQuery = useCallback((endpoint: string, params: string = '', enabled: boolean = true) => ({
    queryKey: [endpoint, params],
    queryFn: async () => {
      try {
        setError(null);
        const response = await axios.get(`${endpoint}${params}`);
        return response.data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
        setError(errorMessage);
        toast({
          title: "Data loading failed",
          description: errorMessage,
          variant: "destructive"
        });
        throw error;
      }
    },
    enabled,
    retry: 2,
    retryDelay: 1000
  }), [toast]);

  // Fetch performance overview
  const { data: overviewData, isLoading: overviewLoading, error: overviewError, refetch: refetchOverview } = useQuery(
    createQuery('/api/internal/ai-performance/overview')
  );

  // Fetch recent metrics (conditional loading based on active tab)
  const { data: metricsData, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useQuery(
    createQuery('/api/internal/ai-performance/metrics', '?limit=50', activeTab === 'metrics')
  );

  // Fetch flagged response analyses (conditional loading)
  const { data: flaggedAnalysesData, isLoading: flaggedLoading, error: flaggedError, refetch: refetchFlagged } = useQuery(
    createQuery('/api/internal/ai-performance/response-analyses', '?flaggedOnly=true&limit=100', activeTab === 'flagged')
  );

  // Fetch unreviewed crisis detection logs (conditional loading)
  const { data: crisisLogsData, isLoading: crisisLoading, error: crisisError, refetch: refetchCrisis } = useQuery(
    createQuery('/api/internal/ai-performance/crisis-detection', '?reviewed=false&limit=100', activeTab === 'crisis')
  );

  const overview: AiPerformanceOverview = overviewData?.overview || {
    totalResponses: 0,
    averageResponseQuality: 0,
    averageTherapeuticEffectiveness: 0,
    crisisDetectionAccuracy: 0,
    falsePositiveRate: 0,
    userSatisfactionAverage: 0,
    averageResponseTime: 0
  };

  const metrics: AiPerformanceMetric[] = metricsData?.metrics || [];
  const flaggedAnalyses: AiResponseAnalysis[] = flaggedAnalysesData?.analyses || [];
  const crisisLogs: CrisisDetectionLog[] = crisisLogsData?.logs || [];

  // Memoized color functions for performance
  const getQualityColor = useMemo(() => (score: number) => {
    if (score >= 0.8) return 'text-green-700';
    if (score >= 0.6) return 'text-amber-600';
    return 'text-red-600';
  }, []);

  const getRiskLevelColor = useMemo(() => (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-100 text-red-900 border border-red-300';
      case 'high': return 'bg-orange-100 text-orange-900 border border-orange-300';
      case 'medium': return 'bg-amber-100 text-amber-900 border border-amber-300';
      default: return 'bg-green-100 text-green-900 border border-green-300';
    }
  }, []);

  // Card expansion toggle
  const toggleCardExpansion = useCallback((cardId: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  }, []);

  // Pagination calculations
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      metrics: (metricsData?.metrics || []).slice(startIndex, endIndex),
      flagged: (flaggedAnalysesData?.analyses || []).slice(startIndex, endIndex),
      crisis: (crisisLogsData?.logs || []).slice(startIndex, endIndex),
      totalMetrics: metricsData?.metrics?.length || 0,
      totalFlagged: flaggedAnalysesData?.analyses?.length || 0,
      totalCrisis: crisisLogsData?.logs?.length || 0
    };
  }, [metricsData, flaggedAnalysesData, crisisLogsData, currentPage, itemsPerPage]);

  // Retry handlers
  const handleRetry = useCallback(() => {
    setError(null);
    if (activeTab === 'overview') refetchOverview();
    if (activeTab === 'metrics') refetchMetrics();
    if (activeTab === 'flagged') refetchFlagged();
    if (activeTab === 'crisis') refetchCrisis();
  }, [activeTab, refetchOverview, refetchMetrics, refetchFlagged, refetchCrisis]);

  // Reusable Loading Spinner Component
  const LoadingSpinner = ({ message = "Loading..." }: { message?: string }) => (
    <div className="flex flex-col items-center justify-center h-32 space-y-4" role="status" aria-label={message}>
      <Loader2 className="animate-spin h-8 w-8 text-blue-600" aria-hidden="true" />
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  );

  // Reusable Error Message Component
  const ErrorMessage = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div className="flex flex-col items-center justify-center h-32 space-y-4 text-center px-4">
      <AlertTriangle className="h-8 w-8 text-red-500" aria-hidden="true" />
      <div className="space-y-2">
        <h3 className="font-semibold text-red-800">Data Loading Failed</h3>
        <p className="text-sm text-red-600">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry
      </button>
    </div>
  );

  // Enhanced Loading Skeleton Component
  const SkeletonCard = ({ height = "h-24" }: { height?: string }) => (
    <div className={`animate-pulse ${height} bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:400%_100%] rounded-lg`} 
         style={{ animation: 'shimmer 2s infinite linear' }} 
         role="status" 
         aria-label="Loading content">
      <span className="sr-only">Loading...</span>
    </div>
  );

  // Unified loading state for initial load
  if (overviewLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="space-y-4">
          <SkeletonCard height="h-12" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} height="h-28" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} height="h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Global error state
  if (overviewError && !overviewData) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorMessage 
          message="Failed to load performance overview data. Please check your connection and try again." 
          onRetry={handleRetry} 
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            AI Performance Monitoring
          </h1>
          <p className="text-gray-600">
            Internal tracking of response quality, therapeutic effectiveness, and crisis detection accuracy
          </p>
          <div className="text-xs text-gray-500 mt-1">
            Internal Use Only - System Performance Analytics
          </div>
        </div>
      </div>

      {/* Interactive Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('metrics')}
          className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="View detailed performance metrics"
        >
          <div className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-blue-700">Total Responses</p>
              <p className="text-2xl font-bold text-blue-900">{overview.totalResponses.toLocaleString()}</p>
              <p className="text-xs text-blue-600 mt-1 flex items-center">
                Click to view details <ArrowRight className="w-3 h-3 ml-1" />
              </p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('metrics')}
          className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 hover:from-emerald-100 hover:to-emerald-200 transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          aria-label="View response quality metrics"
        >
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm text-emerald-700">Response Quality</p>
              <p className={`text-2xl font-bold ${getQualityColor(overview.averageResponseQuality)}`}>
                {Math.round(overview.averageResponseQuality * 100)}%
              </p>
              <p className="text-xs text-emerald-600 mt-1 flex items-center">
                Click to view details <ArrowRight className="w-3 h-3 ml-1" />
              </p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('metrics')}
          className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:from-purple-100 hover:to-purple-200 transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          aria-label="View therapeutic effectiveness metrics"
        >
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-purple-700">Therapeutic Effectiveness</p>
              <p className={`text-2xl font-bold ${getQualityColor(overview.averageTherapeuticEffectiveness)}`}>
                {Math.round(overview.averageTherapeuticEffectiveness * 100)}%
              </p>
              <p className="text-xs text-purple-600 mt-1 flex items-center">
                Click to view details <ArrowRight className="w-3 h-3 ml-1" />
              </p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('crisis')}
          className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 hover:from-orange-100 hover:to-orange-200 transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          aria-label="View crisis detection logs"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm text-orange-700">Crisis Detection Accuracy</p>
              <p className={`text-2xl font-bold ${getQualityColor(overview.crisisDetectionAccuracy)}`}>
                {Math.round(overview.crisisDetectionAccuracy * 100)}%
              </p>
              <p className="text-xs text-orange-600 mt-1 flex items-center">
                Click to view logs <ArrowRight className="w-3 h-3 ml-1" />
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-sm text-indigo-700">User Satisfaction</p>
              <p className="text-xl font-bold text-indigo-900">
                {overview.userSatisfactionAverage.toFixed(1)}/5.0
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm text-yellow-700">False Positive Rate</p>
              <p className={`text-xl font-bold ${overview.falsePositiveRate > 0.1 ? 'text-red-600' : 'text-green-600'}`}>
                {Math.round(overview.falsePositiveRate * 100)}%
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-teal-600" />
            <div>
              <p className="text-sm text-teal-700">Avg Response Time</p>
              <p className="text-xl font-bold text-teal-900">
                {Math.round(overview.averageResponseTime)}ms
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation Tabs with Accessibility */}
      <div className="border-b-2 border-slate-200">
        <nav className="-mb-0.5 flex space-x-8" role="tablist" aria-label="Performance dashboard navigation">
          {[
            { id: 'overview', label: 'System Overview', icon: Shield },
            { id: 'metrics', label: 'Performance Metrics', icon: BarChart },
            { id: 'flagged', label: 'Flagged Responses', icon: AlertTriangle },
            { id: 'crisis', label: 'Crisis Detection', icon: Target },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                id={`${tab.id}-tab`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => setActiveTab(tab.id as 'overview' | 'metrics' | 'flagged' | 'crisis')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div id="overview-panel" role="tabpanel" aria-labelledby="overview-tab" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-emerald-50 p-6 rounded-lg border-2 border-emerald-200">
                <h3 className="text-lg font-semibold text-emerald-800 mb-4">Quality Metrics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-100 rounded-lg">
                    <span className="text-sm font-medium text-emerald-800">Response Quality</span>
                    <span className="text-sm font-semibold text-emerald-700">{Math.round(overview.averageResponseQuality * 100)}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-100 rounded-lg">
                    <span className="text-sm font-medium text-emerald-800">Therapeutic Effectiveness</span>
                    <span className="text-sm font-semibold text-emerald-700">{Math.round(overview.averageTherapeuticEffectiveness * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">System Performance</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-100 rounded-lg">
                    <span className="text-sm font-medium text-blue-800">Crisis Detection</span>
                    <span className="text-sm font-semibold text-blue-700">{Math.round(overview.crisisDetectionAccuracy * 100)}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-100 rounded-lg">
                    <span className="text-sm font-medium text-blue-800">Response Time</span>
                    <span className="text-sm font-semibold text-blue-700">{Math.round(overview.averageResponseTime)}ms</span>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
                <h3 className="text-lg font-semibold text-purple-800 mb-4">User Experience</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-purple-100 rounded-lg">
                    <span className="text-sm font-medium text-purple-800">User Satisfaction</span>
                    <span className="text-sm font-semibold text-purple-700">{overview.userSatisfactionAverage.toFixed(1)}/5.0</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-100 rounded-lg">
                    <span className="text-sm font-medium text-purple-800">Total Responses</span>
                    <span className="text-sm font-semibold text-purple-700">{overview.totalResponses.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div id="metrics-panel" role="tabpanel" aria-labelledby="metrics-tab" className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">Performance Metrics</h2>
            {metricsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse h-32 bg-slate-200 rounded-lg"></div>
                ))}
              </div>
            ) : metricsError ? (
              <div className="p-8 text-center border-2 border-red-200 rounded-lg bg-red-50">
                <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Metrics</h3>
                <p className="text-red-500 mb-4">Failed to load performance metrics</p>
                <button 
                  onClick={handleRetry}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                >
                  <RefreshCw className="w-4 h-4 mr-2 inline" />
                  Retry
                </button>
              </div>
            ) : metrics.length === 0 ? (
              <div className="p-12 text-center border-2 border-slate-200 rounded-lg bg-slate-50">
                <BarChart className="h-16 w-16 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No Performance Metrics</h3>
                <p className="text-slate-500">No performance metrics are currently available for review.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {metrics.slice(0, 10).map((metric) => (
                  <div key={metric.id} className="p-4 rounded-lg border-2 border-slate-200 bg-white shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 capitalize text-lg mb-1">
                          {metric.metricType.replace('_', ' ')}
                        </h3>
                        <div className="text-sm text-slate-600 space-y-1">
                          <p>Model: <span className="font-medium">{metric.aiModel}</span></p>
                          <p>{new Date(metric.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getQualityColor(metric.metricValue)}`}>
                          {Math.round(metric.metricValue * 100)}%
                        </p>
                        <p className="text-sm text-slate-500">{metric.responseTime}ms</p>
                      </div>
                    </div>
                    {metric.context && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-sm text-slate-600 italic">{metric.context}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'flagged' && (
          <div id="flagged-panel" role="tabpanel" aria-labelledby="flagged-tab" className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">Flagged Responses for Review</h2>
            {flaggedLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse h-48 bg-slate-200 rounded-lg"></div>
                ))}
              </div>
            ) : flaggedError ? (
              <div className="p-8 text-center border-2 border-red-200 rounded-lg bg-red-50">
                <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Flagged Responses</h3>
                <p className="text-red-500 mb-4">Failed to load flagged responses</p>
                <button 
                  onClick={handleRetry}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                >
                  <RefreshCw className="w-4 h-4 mr-2 inline" />
                  Retry
                </button>
              </div>
            ) : flaggedAnalyses.length === 0 ? (
              <div className="p-12 text-center border-2 border-slate-200 rounded-lg bg-slate-50">
                <CheckCircle className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">All Clear!</h3>
                <p className="text-slate-500">No flagged responses currently require review.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {flaggedAnalyses.map((analysis) => (
                  <div key={analysis.id} className="p-6 rounded-lg border-2 border-orange-300 bg-orange-50 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        <h3 className="text-lg font-semibold text-orange-800">
                          Flagged Response #{analysis.id}
                        </h3>
                      </div>
                      <span className="px-3 py-1 text-xs bg-orange-200 text-orange-800 rounded-full font-medium">
                        Requires Review
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-xs text-orange-700 font-medium">Therapeutic</p>
                        <p className={`text-lg font-bold ${getQualityColor(analysis.therapeuticScore || 0)}`}>
                          {Math.round((analysis.therapeuticScore || 0) * 100)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-orange-700 font-medium">Empathy</p>
                        <p className={`text-lg font-bold ${getQualityColor(analysis.empathyScore || 0)}`}>
                          {Math.round((analysis.empathyScore || 0) * 100)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-orange-700 font-medium">Clarity</p>
                        <p className={`text-lg font-bold ${getQualityColor(analysis.clarityScore || 0)}`}>
                          {Math.round((analysis.clarityScore || 0) * 100)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-orange-700 font-medium">Appropriateness</p>
                        <p className={`text-lg font-bold ${getQualityColor(analysis.appropriatenessScore || 0)}`}>
                          {Math.round((analysis.appropriatenessScore || 0) * 100)}%
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-4">
                      <button className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200">
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </button>
                      <button className="flex items-center px-3 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors duration-200">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Resolved
                      </button>
                      <button className="flex items-center px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        View Conversation
                      </button>
                    </div>

                    {analysis.userFeedback && (
                      <div className="bg-white p-3 rounded border">
                        <h4 className="font-medium text-sm text-orange-800 mb-1">User Feedback:</h4>
                        <p className="text-sm text-slate-600">{analysis.userFeedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'crisis' && (
          <div id="crisis-panel" role="tabpanel" aria-labelledby="crisis-tab" className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">Crisis Detection Logs</h2>
            {crisisLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse h-48 bg-slate-200 rounded-lg"></div>
                ))}
              </div>
            ) : crisisError ? (
              <div className="p-8 text-center border-2 border-red-200 rounded-lg bg-red-50">
                <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Crisis Logs</h3>
                <p className="text-red-500 mb-4">Failed to load crisis detection logs</p>
                <button 
                  onClick={handleRetry}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                >
                  <RefreshCw className="w-4 h-4 mr-2 inline" />
                  Retry
                </button>
              </div>
            ) : crisisLogs.length === 0 ? (
              <div className="p-12 text-center border-2 border-slate-200 rounded-lg bg-slate-50">
                <Shield className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">System Secure</h3>
                <p className="text-slate-500">No unreviewed crisis detection logs at this time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {crisisLogs.map((log) => (
                  <div key={log.id} className="p-6 rounded-lg border-2 border-red-300 bg-red-50 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <h3 className="text-lg font-semibold text-red-800">
                          Crisis Detection #{log.id}
                        </h3>
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${getRiskLevelColor(log.detectedRiskLevel)}`}>
                          {log.detectedRiskLevel} risk
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-red-700 font-medium">Confidence</p>
                        <p className="text-lg font-bold text-red-800">{Math.round((log.confidenceScore || 0) * 100)}%</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-4">
                      <button className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200">
                        <Eye className="w-4 h-4 mr-1" />
                        Review Crisis
                      </button>
                      <button className="flex items-center px-3 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors duration-200">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Reviewed
                      </button>
                      <button className="flex items-center px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View User Profile
                      </button>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-sm text-red-800 mb-2">Message Content:</h4>
                      <div className="text-sm text-slate-700 bg-white p-3 rounded border max-h-20 overflow-y-auto">
                        {log.messageContent}
                      </div>
                    </div>

                    {log.triggerKeywords && log.triggerKeywords.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-sm text-red-800 mb-2">Trigger Keywords:</h4>
                        <div className="flex flex-wrap gap-1">
                          {log.triggerKeywords.map((keyword, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-red-200 text-red-800 rounded-full font-medium">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {log.aiAnalysis && (
                      <div className="mb-4">
                        <h4 className="font-medium text-sm text-red-800 mb-2">AI Analysis:</h4>
                        <div className="text-sm text-slate-700 bg-blue-50 p-3 rounded border border-blue-200">
                          {log.aiAnalysis}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-slate-600 pt-2 border-t border-red-200">
                      <span>Detected: {new Date(log.detectedAt).toLocaleString()}</span>
                      <div className="flex items-center gap-4">
                        <span>Intervention: {log.interventionTriggered ? 'Yes' : 'No'}</span>
                        {log.interventionType && <span>Type: {log.interventionType}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
