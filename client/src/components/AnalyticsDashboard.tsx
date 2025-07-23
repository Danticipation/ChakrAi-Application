import React, { useState, useEffect } from 'react';
import { 
  Heart, Brain, TrendingUp, Target, Award, Calendar, 
  Activity, RefreshCw, BarChart3, Users, BookOpen, 
  Zap, Moon, Settings, AlertCircle, CheckCircle,
  ArrowUpRight, ArrowDownRight, Minus, Sparkles
} from 'lucide-react';

interface WellnessMetrics {
  currentWellnessScore: number;
  emotionalVolatility: number;
  therapeuticEngagement: number;
  totalJournalEntries: number;
  totalMoodEntries: number;
  averageMood: number;
}

interface ChartData {
  moodTrend: Array<{ date: string; value: number; emotion: string }>;
  wellnessTrend: Array<{ date: string; value: number; type: string }>;
  emotionDistribution: Array<{ emotion: string; count: number }>;
  progressTracking: Array<{ period: string; journalEntries: number; moodEntries: number; engagement: number }>;
}

interface DashboardData {
  overview: WellnessMetrics;
  charts: ChartData;
  insights: string;
  isFallbackData?: boolean;
}

interface NormalizedDashboardData {
  overview: WellnessMetrics;
  charts: ChartData;
  insights: string;
  isFallbackData: boolean;
}

interface MonthlyReport {
  id: number;
  reportMonth: string;
  wellnessScore: string;
  emotionalVolatility: string;
  aiGeneratedInsights: string;
  progressSummary: string;
  recommendations: string[];
  milestonesAchieved: string[];
  createdAt: string;
}

interface LongitudinalTrend {
  id: number;
  trendType: string;
  timeframe: string;
  trendDirection: string;
  trendStrength: number;
  insights: string;
  predictedOutcome: string;
  confidenceInterval: { lower: number; upper: number };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Utility Components for consistent UI patterns
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };
  
  return (
    <div className="flex items-center justify-center">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-400`} />
    </div>
  );
};

const ErrorMessage: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-red-200 rounded-lg bg-red-50">
    <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
    <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Data</h3>
    <p className="text-red-500 mb-4">{message}</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
      >
        <RefreshCw className="w-4 h-4 mr-2 inline" />
        Retry
      </button>
    )}
  </div>
);

const SkeletonCard: React.FC<{ height?: string }> = ({ height = 'h-32' }) => (
  <div 
    className={`animate-pulse ${height} bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] rounded-lg shimmer`}
    role="status" 
    aria-label="Loading content"
  >
    <span className="sr-only">Loading...</span>
  </div>
);

const AnalyticsDashboard: React.FC<{ userId: number }> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState('3months');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Normalize dashboard data structure to avoid conditionals
  const normalizeDashboardData = useCallback((data: any): NormalizedDashboardData => {
    const rawData = data?.dashboard || data;
    return {
      overview: rawData?.overview || {
        currentWellnessScore: 0,
        emotionalVolatility: 0,
        therapeuticEngagement: 0,
        totalJournalEntries: 0,
        totalMoodEntries: 0,
        averageMood: 0
      },
      charts: rawData?.charts || {
        moodTrend: [],
        wellnessTrend: [],
        emotionDistribution: [],
        progressTracking: []
      },
      insights: rawData?.insights || '',
      isFallbackData: !data?.dashboard && !!data
    };
  }, []);

  // Data validation and defensive checks
  const validateDashboardData = useCallback((data: any): boolean => {
    if (!data) return false;
    const normalized = normalizeDashboardData(data);
    return (
      normalized.overview &&
      normalized.charts &&
      Array.isArray(normalized.charts.emotionDistribution) &&
      Array.isArray(normalized.charts.moodTrend)
    );
  }, [normalizeDashboardData]);

  // Create query function with error handling
  const createQuery = useCallback((url: string) => async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format');
      }
      return response.json();
    } catch (error) {
      console.warn(`API failed for ${url}:`, error);
      throw error;
    }
  }, []);

  // Fetch dashboard data with fallback
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useQuery({
    queryKey: [`/api/analytics/simple/${userId}`],
    queryFn: createQuery(`/api/analytics/simple/${userId}`),
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch longitudinal trends with selectedTimeframe in queryKey for automatic updates
  const { data: trendsData, isLoading: trendsLoading, error: trendsError, refetch: refetchTrends } = useQuery({
    queryKey: [`/api/analytics/trends/${userId}`, selectedTimeframe],
    queryFn: createQuery(`/api/analytics/trends/${userId}?timeframe=${selectedTimeframe}`),
    retry: 2,
    enabled: activeTab === 'trends',
  });

  // Fetch monthly reports
  const { data: reportsData, isLoading: reportsLoading, error: reportsError, refetch: refetchReports } = useQuery({
    queryKey: [`/api/analytics/reports/${userId}`],
    queryFn: createQuery(`/api/analytics/reports/${userId}`),
    retry: 2,
    enabled: activeTab === 'reports',
  });

  // Generate new monthly report mutation with toast feedback
  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/analytics/generate-report/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeframe: selectedTimeframe })
      });
      if (!response.ok) throw new Error('Failed to generate report');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/analytics/reports/${userId}`] });
      toast({
        title: "Report Generated Successfully",
        description: "Your monthly wellness report has been created and is ready for review.",
        duration: 4000,
      });
    },
    onError: (error) => {
      toast({
        title: "Report Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate report. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    }
  });

  const handleGenerateReport = useCallback(() => {
    generateReportMutation.mutate();
  }, [generateReportMutation]);

  const handleRetry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [`/api/analytics/simple/${userId}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/analytics/trends/${userId}`, selectedTimeframe] });
    queryClient.invalidateQueries({ queryKey: [`/api/analytics/reports/${userId}`] });
  }, [queryClient, userId, selectedTimeframe]);

  const calculateProgress = useCallback((value: number, max: number = 100): number => {
    if (typeof value !== 'number' || typeof max !== 'number') return 0;
    if (max === 0) return 0;
    return Math.min(Math.max((value / max) * 100, 0), 100);
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    try {
      return new Intl.DateTimeFormat(navigator.language || 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  }, []);

  const renderOverviewTab = useCallback(() => {
    if (dashboardLoading) {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={`overview-skeleton-${i}`} height="h-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <SkeletonCard key={`overview-activity-skeleton-${i}`} height="h-48" />
            ))}
          </div>
        </div>
      );
    }

    if (dashboardError || !validateDashboardData(dashboardData)) {
      return <ErrorMessage message="Failed to load analytics data" onRetry={handleRetry} />;
    }

    const normalizedData = normalizeDashboardData(dashboardData);
    const { overview, charts, insights, isFallbackData } = normalizedData;

    return (
      <div className="space-y-6">
        {/* Fallback Data Warning */}
        {isFallbackData && (
          <div className="flex items-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-amber-800">Using Demo Data</p>
              <p className="text-xs text-amber-600">Unable to connect to analytics service. Showing sample data for demonstration.</p>
            </div>
          </div>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="theme-card p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-white/80">Wellness Score</h3>
              <Target className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white">{overview.currentWellnessScore}/100</p>
            <p className="text-xs text-white/60">Current wellness level</p>
          </div>

          <div className="theme-card p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-white/80">Emotional Balance</h3>
              <Brain className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">{100 - overview.emotionalVolatility}%</p>
            <p className="text-xs text-white/60">Emotional stability</p>
          </div>

          <div className="theme-card p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-white/80">Engagement</h3>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white">{overview.therapeuticEngagement}%</p>
            <p className="text-xs text-white/60">Therapeutic participation</p>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="theme-card p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Activity Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/80">Journal Entries</span>
                <span className="text-white font-medium">{overview.totalJournalEntries}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/80">Mood Check-ins</span>
                <span className="text-white font-medium">{overview.totalMoodEntries}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/80">Average Mood</span>
                <span className="text-white font-medium">{overview.averageMood}/10</span>
              </div>
            </div>
          </div>

          <div className="theme-card p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Emotion Distribution</h3>
            <div className="space-y-2">
              {(() => {
                const maxCount = Math.max(...charts.emotionDistribution.map(item => item.count));
                return charts.emotionDistribution.map((emotion) => {
                  const percentage = maxCount > 0 ? (emotion.count / maxCount) * 100 : 0;
                
                return (
                  <div key={`emotion-${emotion.emotion}`} className="flex items-center space-x-2">
                    <span className="text-sm text-white/80 w-16">{emotion.emotion}</span>
                    <div className="flex-1 bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-white font-medium w-6">{emotion.count}</span>
                  </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="theme-card p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3">AI Insights</h3>
          <p className="text-white/80 text-sm leading-relaxed">{insights}</p>
        </div>
      </div>
    );
  }, [dashboardLoading, dashboardError, dashboardData, validateDashboardData, normalizeDashboardData, handleRetry, calculateProgress]);

  const renderReportsTab = useCallback(() => {
    if (reportsLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={`reports-skeleton-${i}`} height="h-48" />
          ))}
        </div>
      );
    }

    if (reportsError) {
      return <ErrorMessage message="Failed to load reports data" onRetry={handleRetry} />;
    }

    const reports = reportsData?.reports || [];

    return (
      <div className="space-y-6">
        {/* Generate Report Button */}
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">Monthly Reports</h3>
          <button
            onClick={handleGenerateReport}
            disabled={generateReportMutation.isPending}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors duration-200"
          >
            {generateReportMutation.isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Generate Report</span>
          </button>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="p-12 text-center border-2 border-slate-200 rounded-lg bg-slate-50">
              <BarChart3 className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">No Reports Available</h3>
              <p className="text-slate-500">Generate your first monthly wellness report to see insights here.</p>
            </div>
          ) : (
            reports.map((report: MonthlyReport) => (
              <div key={`report-${report.id}`} className="theme-card p-6 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{report.reportMonth}</h4>
                    <p className="text-sm text-white/60">Generated on {formatDate(report.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/80">Wellness Score</p>
                    <p className="text-xl font-bold text-green-400">{report.wellnessScore}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h5 className="text-sm font-medium text-white/80 mb-2">AI-Generated Insights</h5>
                  <p className="text-white/70 text-sm">{report.aiGeneratedInsights}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-white/80 mb-2">Recommendations</h5>
                    <ul className="text-white/70 text-sm space-y-1">
                      {report.recommendations.map((rec, index) => (
                        <li key={`rec-${report.id}-${index}`} className="flex items-start space-x-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-white/80 mb-2">Milestones Achieved</h5>
                    <ul className="text-white/70 text-sm space-y-1">
                      {report.milestonesAchieved.map((milestone, index) => (
                        <li key={`milestone-${report.id}-${index}`} className="flex items-start space-x-2">
                          <span className="text-green-400 mt-1">✓</span>
                          <span>{milestone}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }, [reportsLoading, reportsError, reportsData, handleGenerateReport, generateReportMutation.isPending, handleRetry, formatDate]);

  const renderTrendsTab = useCallback(() => {
    if (trendsLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={`trends-skeleton-${i}`} height="h-40" />
          ))}
        </div>
      );
    }

    if (trendsError) {
      return <ErrorMessage message="Failed to load trends data" onRetry={handleRetry} />;
    }

    const trends = trendsData?.trends || [];

    return (
      <div className="space-y-6">
        {/* Timeframe Selector */}
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">Longitudinal Trends</h3>
          <select 
            value={selectedTimeframe} 
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Select timeframe for trend analysis"
          >
            <option value="1month">1 Month</option>
            <option value="3months">3 Months</option>
            <option value="6months">6 Months</option>
            <option value="1year">1 Year</option>
          </select>
        </div>

        {/* Trends List */}
        <div className="space-y-4">
          {trends.length === 0 ? (
            <div className="p-12 text-center border-2 border-slate-200 rounded-lg bg-slate-50">
              <TrendingUp className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">No Trends Available</h3>
              <p className="text-slate-500">Continue using the app to generate meaningful trend analysis.</p>
            </div>
          ) : (
            trends.map((trend: LongitudinalTrend) => (
              <div key={`trend-${trend.id}`} className="theme-card p-6 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white capitalize">
                      {trend.trendType.replace('_', ' ')}
                    </h4>
                    <p className="text-sm text-white/60">Timeframe: {trend.timeframe}</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      trend.trendDirection === 'improving' ? 'bg-green-100 text-green-800' :
                      trend.trendDirection === 'declining' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {trend.trendDirection === 'improving' && <TrendingUp className="w-4 h-4 mr-1" />}
                      {trend.trendDirection}
                    </div>
                    <p className="text-xs text-white/60 mt-1">
                      Strength: {Math.round(trend.trendStrength * 100)}%
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h5 className="text-sm font-medium text-white/80 mb-2">Insights</h5>
                  <p className="text-white/70 text-sm">{trend.insights}</p>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-white/60">Predicted Outcome: </span>
                    <span className="text-white/80">{trend.predictedOutcome}</span>
                  </div>
                  <div>
                    <span className="text-white/60">Confidence: </span>
                    <span className="text-white/80">
                      {Math.round(trend.confidenceInterval.lower * 100)}-{Math.round(trend.confidenceInterval.upper * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }, [trendsLoading, trendsError, trendsData, selectedTimeframe, handleRetry]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Analytics Dashboard</h2>
        <p className="text-white/70">Comprehensive wellness insights and progress tracking</p>
      </div>

      {/* Tab Navigation with Accessibility */}
      <div className="mb-6">
        <nav className="flex space-x-1 bg-white/10 rounded-lg p-1" role="tablist" aria-label="Analytics sections">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'reports', label: 'Reports', icon: Download },
            { id: 'trends', label: 'Trends', icon: TrendingUp }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                id={`${tab.id}-tab`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div 
        role="tabpanel" 
        id={`${activeTab}-panel`} 
        aria-labelledby={`${activeTab}-tab`}
        className="transition-opacity duration-200"
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'reports' && renderReportsTab()}
        {activeTab === 'trends' && renderTrendsTab()}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;