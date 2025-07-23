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
            { id: 'crisis', label: 'Crisis Detection Logs', icon: Target }
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1); // Reset pagination when changing tabs
              }}
              className={`group inline-flex items-center px-4 py-3 border-b-2 font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700 bg-blue-50'
                  : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <tab.icon className={`w-4 h-4 mr-2 ${
                activeTab === tab.id ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'
              }`} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content Panels */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div id="overview-panel" role="tabpanel" aria-labelledby="overview-tab">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border-2 border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-emerald-600" />
                  Quality Metrics
                </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Response Quality</span>
                    <span>{Math.round(overview.averageResponseQuality * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${overview.averageResponseQuality * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Therapeutic Effectiveness</span>
                    <span>{Math.round(overview.averageTherapeuticEffectiveness * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${overview.averageTherapeuticEffectiveness * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Crisis Detection Accuracy</span>
                    <span>{Math.round(overview.crisisDetectionAccuracy * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${overview.crisisDetectionAccuracy * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

              <div className="p-6 rounded-lg border-2 border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-600" />
                  System Health Indicators
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border-2 border-emerald-200 hover:bg-emerald-100 transition-colors duration-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-emerald-800">AI Model Performance</span>
                    </div>
                    <span className="text-sm font-semibold text-emerald-700">Optimal</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-2 border-blue-200 hover:bg-blue-100 transition-colors duration-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-800">Response Time</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-700">{Math.round(overview.averageResponseTime)}ms avg</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border-2 border-amber-200 hover:bg-amber-100 transition-colors duration-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span className="text-sm font-medium text-amber-800">False Positive Rate</span>
                    </div>
                    <span className="text-sm font-semibold text-amber-700">{Math.round(overview.falsePositiveRate * 100)}%</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border-2 border-indigo-200 hover:bg-indigo-100 transition-colors duration-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      <span className="text-sm font-medium text-indigo-800">User Satisfaction</span>
                    </div>
                    <span className="text-sm font-semibold text-indigo-700">{overview.userSatisfactionAverage.toFixed(1)}/5.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div id="metrics-panel" role="tabpanel" aria-labelledby="metrics-tab" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                <BarChart className="w-6 h-6 mr-2 text-blue-600" />
                Performance Metrics
              </h2>
              {paginatedData.totalMetrics > 0 && (
                <div className="text-sm text-slate-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, paginatedData.totalMetrics)} of {paginatedData.totalMetrics} metrics
                </div>
              )}
            </div>
            
            {metricsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonCard key={i} height="h-32" />
                ))}
              </div>
            ) : metricsError ? (
              <ErrorMessage message="Failed to load performance metrics" onRetry={handleRetry} />
            ) : paginatedData.metrics.length === 0 ? (
              <div className="p-12 text-center border-2 border-slate-200 rounded-lg bg-slate-50">
                <BarChart className="h-16 w-16 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No Performance Metrics</h3>
                <p className="text-slate-500">No performance metrics are currently available for review.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4">
                  {paginatedData.metrics.map((metric) => (
                    <MetricCard key={metric.id} metric={metric} getQualityColor={getQualityColor} />
                  ))}
                </div>
                
                {/* Pagination */}
                {paginatedData.totalMetrics > itemsPerPage && (
                  <PaginationControls 
                    currentPage={currentPage}
                    totalItems={paginatedData.totalMetrics}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'flagged' && (
          <div id="flagged-panel" role="tabpanel" aria-labelledby="flagged-tab" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                <AlertTriangle className="w-6 h-6 mr-2 text-orange-600" />
                Flagged Responses for Review
              </h2>
              {paginatedData.totalFlagged > 0 && (
                <div className="text-sm text-slate-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, paginatedData.totalFlagged)} of {paginatedData.totalFlagged} flagged responses
                </div>
              )}
            </div>
            
            {flaggedLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={i} height="h-48" />
                ))}
              </div>
            ) : flaggedError ? (
              <ErrorMessage message="Failed to load flagged responses" onRetry={handleRetry} />
            ) : paginatedData.flagged.length === 0 ? (
              <div className="p-12 text-center border-2 border-slate-200 rounded-lg bg-slate-50">
                <CheckCircle className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">All Clear!</h3>
                <p className="text-slate-500">No flagged responses currently require review.</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedData.flagged.map((analysis) => (
                    <FlaggedResponseCard 
                      key={analysis.id} 
                      analysis={analysis} 
                      isExpanded={expandedCards.has(analysis.id)}
                      onToggleExpand={() => toggleCardExpansion(analysis.id)}
                      getQualityColor={getQualityColor}
                    />
                  ))}
                </div>
                
                {/* Pagination */}
                {paginatedData.totalFlagged > itemsPerPage && (
                  <PaginationControls 
                    currentPage={currentPage}
                    totalItems={paginatedData.totalFlagged}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
                )}
              </>
            )}
          </div>
        )}

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Original Prompt:</h4>
                      <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                        {analysis.originalPrompt}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">AI Response:</h4>
                      <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                        {analysis.aiResponse}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Therapeutic</p>
                      <p className={`font-semibold ${getQualityColor(analysis.therapeuticScore || 0)}`}>
                        {Math.round((analysis.therapeuticScore || 0) * 100)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Empathy</p>
                      <p className={`font-semibold ${getQualityColor(analysis.empathyScore || 0)}`}>
                        {Math.round((analysis.empathyScore || 0) * 100)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Clarity</p>
                      <p className={`font-semibold ${getQualityColor(analysis.clarityScore || 0)}`}>
                        {Math.round((analysis.clarityScore || 0) * 100)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Appropriateness</p>
                      <p className={`font-semibold ${getQualityColor(analysis.appropriatenessScore || 0)}`}>
                        {Math.round((analysis.appropriatenessScore || 0) * 100)}%
                      </p>
                    </div>
                  </div>

                  {analysis.userFeedback && (
                    <div className="bg-white p-3 rounded border">
                      <h4 className="font-medium text-sm text-gray-700 mb-1">User Feedback:</h4>
                      <p className="text-sm text-gray-600">{analysis.userFeedback}</p>
                    </div>
                  )}
                </div>
              ))}
                
                {/* Pagination */}
                {paginatedData.totalFlagged > itemsPerPage && (
                  <PaginationControls 
                    currentPage={currentPage}
                    totalItems={paginatedData.totalFlagged}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'crisis' && (
          <div id="crisis-panel" role="tabpanel" aria-labelledby="crisis-tab" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                <Target className="w-6 h-6 mr-2 text-red-600" />
                Crisis Detection Logs
              </h2>
              {paginatedData.totalCrisis > 0 && (
                <div className="text-sm text-slate-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, paginatedData.totalCrisis)} of {paginatedData.totalCrisis} crisis logs
                </div>
              )}
            </div>
            
            {crisisLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={i} height="h-48" />
                ))}
              </div>
            ) : crisisError ? (
              <ErrorMessage message="Failed to load crisis detection logs" onRetry={handleRetry} />
            ) : paginatedData.crisis.length === 0 ? (
              <div className="p-12 text-center border-2 border-slate-200 rounded-lg bg-slate-50">
                <Shield className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">System Secure</h3>
                <p className="text-slate-500">No unreviewed crisis detection logs at this time.</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedData.crisis.map((log) => (
                    <CrisisLogCard 
                      key={log.id} 
                      log={log} 
                      isExpanded={expandedCards.has(log.id)}
                      onToggleExpand={() => toggleCardExpansion(log.id)}
                      getRiskLevelColor={getRiskLevelColor}
                    />
                  ))}
                </div>
                
                {/* Pagination */}
                {paginatedData.totalCrisis > itemsPerPage && (
                  <PaginationControls 
                    currentPage={currentPage}
                    totalItems={paginatedData.totalCrisis}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Extracted Components for Maintainability

// Metric Card Component
const MetricCard = ({ metric, getQualityColor }: { 
  metric: AiPerformanceMetric; 
  getQualityColor: (score: number) => string;
}) => (
  <div className="p-4 rounded-lg border-2 border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h3 className="font-semibold text-slate-800 capitalize text-lg mb-1">
          {metric.metricType.replace('_', ' ')}
        </h3>
        <div className="text-sm text-slate-600 space-y-1">
          <p className="flex items-center">
            <Brain className="w-4 h-4 mr-1" />
            Model: <span className="font-medium ml-1">{metric.aiModel}</span>
          </p>
          <p className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {new Date(metric.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-2xl font-bold ${getQualityColor(metric.metricValue)}`}>
          {Math.round(metric.metricValue * 100)}%
        </p>
        <p className="text-sm text-slate-500 flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          {metric.responseTime}ms
        </p>
      </div>
    </div>
    {metric.context && (
      <div className="mt-3 pt-3 border-t border-slate-200">
        <p className="text-sm text-slate-600 italic">{metric.context}</p>
      </div>
    )}
  </div>
);

// Flagged Response Card Component
const FlaggedResponseCard = ({ 
  analysis, 
  isExpanded, 
  onToggleExpand, 
  getQualityColor 
}: { 
  analysis: AiResponseAnalysis; 
  isExpanded: boolean;
  onToggleExpand: () => void;
  getQualityColor: (score: number) => string;
}) => (
  <div className="p-6 rounded-lg border-2 border-orange-300 bg-orange-50 shadow-sm hover:shadow-md transition-all duration-200">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-orange-800">
          Flagged Response #{analysis.id}
        </h3>
      </div>
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 text-xs bg-orange-200 text-orange-800 rounded-full font-medium">
          Requires Review
        </span>
        <button
          onClick={onToggleExpand}
          className="p-2 rounded-full hover:bg-orange-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
          aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-orange-700" />
          ) : (
            <ChevronDown className="w-4 h-4 text-orange-700" />
          )}
        </button>
      </div>
    </div>

    {/* Always visible summary */}
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

    {/* Action buttons */}
    <div className="flex gap-2 mb-4">
      <button className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <Eye className="w-4 h-4 mr-1" />
        Review
      </button>
      <button className="flex items-center px-3 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
        <CheckCircle className="w-4 h-4 mr-1" />
        Mark Resolved
      </button>
      <button className="flex items-center px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
        <MessageSquare className="w-4 h-4 mr-1" />
        View Conversation
      </button>
    </div>

    {/* Expandable content */}
    {isExpanded && (
      <div className="space-y-4 pt-4 border-t border-orange-200">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-orange-800 mb-2">Original Prompt:</h4>
            <div className="text-sm text-slate-700 bg-white p-3 rounded border max-h-32 overflow-y-auto">
              {analysis.originalPrompt}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-sm text-orange-800 mb-2">AI Response:</h4>
            <div className="text-sm text-slate-700 bg-white p-3 rounded border max-h-32 overflow-y-auto">
              {analysis.aiResponse}
            </div>
          </div>
        </div>

        {analysis.userFeedback && (
          <div>
            <h4 className="font-medium text-sm text-orange-800 mb-2">User Feedback:</h4>
            <div className="text-sm text-slate-700 bg-white p-3 rounded border">
              {analysis.userFeedback}
            </div>
          </div>
        )}
      </div>
    )}
  </div>
);

// Crisis Log Card Component
const CrisisLogCard = ({ 
  log, 
  isExpanded, 
  onToggleExpand, 
  getRiskLevelColor 
}: { 
  log: CrisisDetectionLog; 
  isExpanded: boolean;
  onToggleExpand: () => void;
  getRiskLevelColor: (level: string) => string;
}) => (
  <div className="p-6 rounded-lg border-2 border-red-300 bg-red-50 shadow-sm hover:shadow-md transition-all duration-200">
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
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-xs text-red-700 font-medium">Confidence</p>
          <p className="text-lg font-bold text-red-800">{Math.round((log.confidenceScore || 0) * 100)}%</p>
        </div>
        <button
          onClick={onToggleExpand}
          className="p-2 rounded-full hover:bg-red-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-red-700" />
          ) : (
            <ChevronDown className="w-4 h-4 text-red-700" />
          )}
        </button>
      </div>
    </div>

    {/* Action buttons */}
    <div className="flex gap-2 mb-4">
      <button className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500">
        <Eye className="w-4 h-4 mr-1" />
        Review Crisis
      </button>
      <button className="flex items-center px-3 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
        <CheckCircle className="w-4 h-4 mr-1" />
        Mark Reviewed
      </button>
      <button className="flex items-center px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
        <ExternalLink className="w-4 h-4 mr-1" />
        View User Profile
      </button>
    </div>

    {/* Always visible summary */}
    <div className="mb-4">
      <h4 className="font-medium text-sm text-red-800 mb-2">Message Content:</h4>
      <div className="text-sm text-slate-700 bg-white p-3 rounded border max-h-20 overflow-y-auto">
        {log.messageContent}
      </div>
    </div>

    {/* Expandable content */}
    {isExpanded && (
      <div className="space-y-4 pt-4 border-t border-red-200">
        {log.triggerKeywords && log.triggerKeywords.length > 0 && (
          <div>
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
          <div>
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
    )}
  </div>
);

// Pagination Controls Component
const PaginationControls = ({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  onPageChange 
}: {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Previous
        </button>
        <span className="text-sm text-slate-600">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Next
        </button>
      </div>
      <div className="text-sm text-slate-600">
        {totalItems} total items
      </div>
    </div>
  );
};