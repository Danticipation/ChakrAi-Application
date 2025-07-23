import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  Award, 
  Calendar as CalendarIcon,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  Filter,
  AlertCircle,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  X
} from 'lucide-react';

// Utility Components
const LoadingSpinner: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <RefreshCw className={`${className} animate-spin text-blue-500`} />
);

const ErrorMessage: React.FC<{ message: string; onRetry?: () => void; className?: string }> = ({ 
  message, 
  onRetry, 
  className = "" 
}) => (
  <div className={`p-4 border border-red-200 bg-red-50 rounded-lg flex items-center justify-between ${className}`}>
    <div className="flex items-center space-x-2">
      <AlertCircle className="w-5 h-5 text-red-500" />
      <span className="text-red-700">{message}</span>
    </div>
    {onRetry && (
      <Button onClick={onRetry} variant="outline" size="sm" className="ml-4">
        <RefreshCw className="w-4 h-4 mr-1" />
        Retry
      </Button>
    )}
  </div>
);

const SkeletonCard: React.FC = () => (
  <Card className="animate-pulse">
    <CardContent className="p-4">
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
      </div>
    </CardContent>
  </Card>
);

// Date formatting utility
const formatDateForLocale = (date: Date): string => {
  return new Intl.DateTimeFormat(navigator.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

// Safe progress calculation utility
const calculateProgress = (current: number, target: number): number => {
  if (target === 0) return 0;
  return Math.min(100, Math.max(0, (current / target) * 100));
};

// Types and Interfaces
interface DashboardData {
  id: string;
  userId: number;
  dateRange: { start: Date; end: Date };
  emotionalOverview: {
    id: string;
    currentMood: string;
    moodDistribution: Array<{ 
      id: string;
      emotion: string; 
      percentage: number; 
      color: string 
    }>;
    weeklyTrend: Array<{ 
      id: string;
      date: string; 
      valence: number; 
      arousal: number 
    }>;
    riskLevel: 'low' | 'medium' | 'high';
  };
  activityOverview: {
    id: string;
    totalSessions: number;
    weeklySessionGoal: number;
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
  };
  progressTracking: {
    id: string;
    goalsProgress: Array<{ 
      id: string;
      name: string; 
      current: number; 
      target: number; 
      category: string 
    }>;
    badgeProgress: Array<{ 
      id: string;
      name: string; 
      progress: number; 
      target: number; 
      category: string 
    }>;
    skillsDevelopment: Array<{ 
      id: string;
      skill: string; 
      level: number; 
      maxLevel: number 
    }>;
  };
  insights: {
    id: string;
    topAchievements: Array<{ id: string; text: string }>;
    areasOfStrength: Array<{ id: string; text: string }>;
    growthOpportunities: Array<{ id: string; text: string }>;
    personalizedTips: Array<{ id: string; text: string }>;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface InteractiveDashboardProps {
  userId: number;
}

export function InteractiveDashboard({ userId }: InteractiveDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  });
  const [activeView, setActiveView] = useState<'overview' | 'emotions' | 'progress' | 'insights'>('overview');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [userId, dateRange]);

  const fetchDashboardData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/analytics/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          dateRange: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString()
          }
        })
      });
      
      if (response.ok) {
        const result: ApiResponse<DashboardData> = await response.json();
        if (result.success && result.data) {
          setDashboardData(result.data);
        } else {
          throw new Error(result.error || 'Failed to load dashboard data');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      console.error('Dashboard fetch error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, dateRange]);

  const handleDateRangeChange = useCallback((newDateRange: { start: Date; end: Date }) => {
    setDateRange(newDateRange);
    setShowDatePicker(false);
  }, []);

  const exportDashboard = useCallback(async (format: 'csv' | 'pdf'): Promise<void> => {
    if (!dashboardData) return;
    
    setIsExporting(true);
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          format,
          dateRange: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString()
          },
          data: dashboardData
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `wellness-dashboard-${formatDateForLocale(dateRange.start)}-to-${formatDateForLocale(dateRange.end)}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error(`Export failed: ${response.statusText}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      console.error('Export error:', err);
      setError(`Export failed: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  }, [dashboardData, userId, dateRange]);

  const handleTabChange = useCallback((view: 'overview' | 'emotions' | 'progress' | 'insights') => {
    setActiveView(view);
  }, []);

  // Color mapping objects for consistent styling
  const riskLevelColors = {
    high: 'text-red-600 bg-red-50 border-red-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    low: 'text-green-600 bg-green-50 border-green-200'
  } as const;

  const riskLevelIcons = {
    high: <TrendingDown className="w-4 h-4" aria-hidden="true" />,
    medium: <Activity className="w-4 h-4" aria-hidden="true" />,
    low: <TrendingUp className="w-4 h-4" aria-hidden="true" />
  } as const;

  const tabConfig = {
    overview: { icon: BarChart3, label: 'Overview' },
    emotions: { icon: PieChart, label: 'Emotions' },
    progress: { icon: Target, label: 'Progress' },
    insights: { icon: Award, label: 'Insights' }
  } as const;

  const getRiskLevelColor = useCallback((level: 'low' | 'medium' | 'high'): string => {
    return riskLevelColors[level];
  }, []);

  const getRiskLevelIcon = useCallback((level: 'low' | 'medium' | 'high'): React.ReactNode => {
    return riskLevelIcons[level];
  }, []);

  // Enhanced loading state with engaging skeleton loaders
  if (loading) {
    return (
      <div className="space-y-6 p-4" role="status" aria-label="Loading dashboard">
        <div className="space-y-4">
          {/* Header skeleton */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200 rounded animate-pulse"></div>
              <div className="h-4 w-96 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-9 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"></div>
              <div className="h-9 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Tab skeleton */}
          <div className="w-full h-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse"></div>

          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>

          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry functionality
  if (error) {
    return (
      <div className="space-y-6 p-4">
        <ErrorMessage 
          message={error} 
          onRetry={fetchDashboardData}
          className="max-w-2xl mx-auto"
        />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="space-y-6 p-4">
        <ErrorMessage 
          message="No dashboard data available" 
          onRetry={fetchDashboardData}
          className="max-w-2xl mx-auto"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Enhanced Header with Date Range Picker and Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Wellness Dashboard</h1>
          <p className="text-slate-600">
            Track your wellness journey from {formatDateForLocale(dateRange.start)} to {formatDateForLocale(dateRange.end)}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Date Range Picker */}
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" aria-label="Select date range">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-4 space-y-4">
                <div className="text-sm font-medium">Select Date Range</div>
                <div className="space-y-2">
                  <Calendar
                    mode="range"
                    selected={{
                      from: dateRange.start,
                      to: dateRange.end,
                    }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        handleDateRangeChange({ start: range.from, end: range.to });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowDatePicker(false)}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Export Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" disabled={isExporting} aria-label="Export dashboard">
                {isExporting ? (
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="end">
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => exportDashboard('csv')}
                  disabled={isExporting}
                  className="w-full justify-start"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export as CSV
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => exportDashboard('pdf')}
                  disabled={isExporting}
                  className="w-full justify-start"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Export as PDF
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Accessible Navigation Tabs */}
      <div className="w-full bg-white rounded-lg p-1 shadow-lg" role="tablist" aria-label="Dashboard sections">
        <div className="grid grid-cols-4 gap-1">
          {Object.entries(tabConfig).map(([key, config]) => {
            const isActive = activeView === key;
            const IconComponent = config.icon;
            return (
              <button
                key={key}
                onClick={() => handleTabChange(key as keyof typeof tabConfig)}
                className={`w-full px-2 py-3 text-xs font-bold rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isActive
                    ? 'bg-blue-500 text-white shadow-md transform scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${key}-panel`}
                tabIndex={isActive ? 0 : -1}
              >
                <IconComponent className="w-4 h-4 mx-auto mb-1" aria-hidden="true" />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeView === 'overview' && (
        <div 
          className="space-y-6" 
          role="tabpanel" 
          id="overview-panel" 
          aria-labelledby="overview-tab"
        >
          {/* Key Metrics Cards with Safe Progress Calculations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Current Mood</p>
                    <p className="text-2xl font-bold text-blue-800 capitalize">
                      {dashboardData.emotionalOverview.currentMood}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg border ${getRiskLevelColor(dashboardData.emotionalOverview.riskLevel)}`}>
                    {getRiskLevelIcon(dashboardData.emotionalOverview.riskLevel)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Current Streak</p>
                    <p className="text-2xl font-bold text-green-800">
                      {dashboardData.activityOverview.currentStreak}
                      <span className="text-sm ml-1">days</span>
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-green-600" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Total Sessions</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {dashboardData.activityOverview.totalSessions}
                    </p>
                  </div>
                  <CalendarIcon className="w-8 h-8 text-purple-600" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Completion Rate</p>
                    <p className="text-2xl font-bold text-orange-800">
                      {dashboardData.activityOverview.completionRate}%
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-orange-600" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Insights with Unique Keys */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800">
                  <Award className="w-5 h-5 mr-2 text-yellow-500" aria-hidden="true" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardData.insights.topAchievements.slice(0, 3).map((achievement) => (
                  <div key={achievement.id} className="flex items-center space-x-3 p-2 bg-yellow-50 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" aria-hidden="true"></div>
                    <p className="text-sm text-yellow-800">{achievement.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-500" aria-hidden="true" />
                  Areas of Strength
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardData.insights.areasOfStrength.slice(0, 3).map((strength) => (
                  <div key={strength.id} className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true"></div>
                    <p className="text-sm text-green-800">{strength.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Emotions Tab with Locale Date Formatting */}
      {activeView === 'emotions' && (
        <div 
          className="space-y-6" 
          role="tabpanel" 
          id="emotions-panel" 
          aria-labelledby="emotions-tab"
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-slate-800">Emotional Overview</CardTitle>
              <p className="text-sm text-slate-600">Your emotional patterns over the selected period</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mood Distribution with Unique Keys */}
                <div>
                  <h3 className="font-semibold mb-4 text-slate-700">Mood Distribution</h3>
                  <div className="space-y-3">
                    {dashboardData.emotionalOverview.moodDistribution.map((mood) => (
                      <div key={mood.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: mood.color }}
                            aria-hidden="true"
                          ></div>
                          <span className="text-sm capitalize text-slate-700">{mood.emotion}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-slate-200 rounded-full h-2" role="progressbar" aria-label={`${mood.emotion} ${mood.percentage}%`}>
                            <div 
                              className="h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${mood.percentage}%`,
                                backgroundColor: mood.color 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-8 text-slate-600">{mood.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Trend with Locale Date Formatting */}
                <div>
                  <h3 className="font-semibold mb-4 text-slate-700">Weekly Emotional Trend</h3>
                  <div className="space-y-2">
                    {dashboardData.emotionalOverview.weeklyTrend.map((day) => (
                      <div key={day.id} className="flex items-center justify-between p-2 bg-slate-50 rounded hover:bg-slate-100 transition-colors">
                        <span className="text-sm text-slate-700">{formatDateForLocale(new Date(day.date))}</span>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-slate-500">Mood:</span>
                            <div 
                              className={`w-3 h-3 rounded-full ${
                                day.valence > 0.3 ? 'bg-green-400' : 
                                day.valence < -0.3 ? 'bg-red-400' : 'bg-yellow-400'
                              }`}
                              aria-label={`Mood: ${day.valence > 0.3 ? 'positive' : day.valence < -0.3 ? 'negative' : 'neutral'}`}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Assessment with Accessible Colors */}
          <Card className={`border-2 ${getRiskLevelColor(dashboardData.emotionalOverview.riskLevel)} hover:shadow-md transition-shadow`}>
            <CardHeader>
              <CardTitle className="flex items-center">
                {getRiskLevelIcon(dashboardData.emotionalOverview.riskLevel)}
                <span className="ml-2">Current Risk Level: {dashboardData.emotionalOverview.riskLevel.toUpperCase()}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 text-slate-700">Personalized Tips</h4>
                  <ul className="space-y-1">
                    {dashboardData.insights.personalizedTips.slice(0, 3).map((tip) => (
                      <li key={tip.id} className="text-sm flex items-start space-x-2">
                        <span className="text-blue-500 mt-1" aria-hidden="true">•</span>
                        <span className="text-slate-700">{tip.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-slate-700">Growth Opportunities</h4>
                  <ul className="space-y-1">
                    {dashboardData.insights.growthOpportunities.slice(0, 3).map((opportunity) => (
                      <li key={opportunity.id} className="text-sm flex items-start space-x-2">
                        <span className="text-purple-500 mt-1" aria-hidden="true">•</span>
                        <span className="text-slate-700">{opportunity.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress Tab with Safe Progress Calculations */}
      {activeView === 'progress' && (
        <div 
          className="space-y-6" 
          role="tabpanel" 
          id="progress-panel" 
          aria-labelledby="progress-tab"
        >
          {/* Goals Progress with Division by Zero Guards */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-slate-800">Goals Progress</CardTitle>
              <p className="text-sm text-slate-600">Track your wellness goals and achievements</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboardData.progressTracking.goalsProgress.map((goal) => {
                const progress = calculateProgress(goal.current, goal.target);
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700">{goal.name}</span>
                      <span className="text-sm text-slate-500">
                        {goal.current}/{goal.target}
                      </span>
                    </div>
                    <Progress 
                      value={progress} 
                      className="h-2" 
                      aria-label={`${goal.name} progress: ${progress.toFixed(1)}%`}
                    />
                    <Badge variant="outline" className="text-xs">
                      {goal.category}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Skills Development with Safe Progress Calculations */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-slate-800">Skills Development</CardTitle>
              <p className="text-sm text-slate-600">Your wellness skills progression</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboardData.progressTracking.skillsDevelopment.map((skill) => {
                const progress = calculateProgress(skill.level, skill.maxLevel);
                return (
                  <div key={skill.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700">{skill.skill}</span>
                      <span className="text-sm text-slate-500">
                        Level {skill.level}/{skill.maxLevel}
                      </span>
                    </div>
                    <Progress 
                      value={progress} 
                      className="h-3" 
                      aria-label={`${skill.skill} level: ${progress.toFixed(1)}%`}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Achievement Progress with Unique Keys */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-slate-800">Achievement Progress</CardTitle>
              <p className="text-sm text-slate-600">Badges and milestones you're working towards</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardData.progressTracking.badgeProgress.map((badge) => (
                  <div key={badge.id} className="p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700">{badge.name}</span>
                      <span className="text-xs text-slate-500">{badge.progress}%</span>
                    </div>
                    <Progress 
                      value={badge.progress} 
                      className="h-2 mb-1" 
                      aria-label={`${badge.name} achievement progress: ${badge.progress}%`}
                    />
                    <Badge variant="secondary" className="text-xs">
                      {badge.category}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights Tab with Unified Accessible Color Palette */}
      {activeView === 'insights' && (
        <div 
          className="space-y-6" 
          role="tabpanel" 
          id="insights-panel" 
          aria-labelledby="insights-tab"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-emerald-800 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-emerald-600" aria-hidden="true" />
                  Top Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardData.insights.topAchievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <Award className="w-5 h-5 text-yellow-500 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm text-emerald-800">{achievement.text}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" aria-hidden="true" />
                  Areas of Strength
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardData.insights.areasOfStrength.map((strength) => (
                  <div key={strength.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <TrendingUp className="w-5 h-5 text-blue-500 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm text-blue-800">{strength.text}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-purple-800 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-purple-600" aria-hidden="true" />
                  Growth Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardData.insights.growthOpportunities.map((opportunity) => (
                  <div key={opportunity.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <Target className="w-5 h-5 text-purple-500 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm text-purple-800">{opportunity.text}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-amber-800 flex items-center">
                  <LineChart className="w-5 h-5 mr-2 text-amber-600" aria-hidden="true" />
                  Personalized Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardData.insights.personalizedTips.map((tip) => (
                  <div key={tip.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <LineChart className="w-5 h-5 text-amber-500 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm text-amber-800">{tip.text}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}