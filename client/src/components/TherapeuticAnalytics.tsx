import { getCurrentUserId } from "../utils/userSession";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Heart, 
  Target, 
  Users, 
  Download,
  Calendar,
  Brain,
  Sparkles
} from 'lucide-react';

interface EmotionalTrend {
  date: string;
  avgSentiment: number;
  avgIntensity: number;
  dominantTone: string;
}

interface EffectiveAffirmation {
  affirmationType: string;
  avgEfficacy: number;
  totalPresented: number;
  avgEngagement: string;
}

interface AnalyticsDashboard {
  emotionalTrends: EmotionalTrend[];
  effectiveAffirmations: EffectiveAffirmation[];
  summary: {
    weeklyEmotionalImprovement: number;
    topAffirmationType: string;
    overallEfficacy: number;
  };
}

interface EfficacyReport {
  reportType: string;
  dateRange: string;
  totalUsers: number;
  averageEmotionalImprovement: number;
  goalCompletionRate: number;
  userRetentionRate: number;
  mostEffectiveAffirmations: string[];
  keyInsights: string[];
  clinicalMetrics: {
    anxietyReduction: number;
    depressionImprovement: number;
    stressManagement: number;
    overallWellness: number;
  };
}

interface TherapeuticAnalyticsProps {
  userId?: number;
}

export default function TherapeuticAnalytics({ userId = getCurrentUserId() }: TherapeuticAnalyticsProps) {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [efficacyReport, setEfficacyReport] = useState<EfficacyReport | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'trends' | 'optimization'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');

  useEffect(() => {
    loadDashboard();
  }, [userId]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/dashboard/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setDashboard(data);
      }
    } catch (error) {
      console.error('Failed to load analytics dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateEfficacyReport = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      if (reportPeriod === 'weekly') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (reportPeriod === 'monthly') {
        startDate.setMonth(endDate.getMonth() - 1);
      } else {
        startDate.setMonth(endDate.getMonth() - 3);
      }

      const response = await fetch('/api/analytics/efficacy-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: reportPeriod,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
      });

      if (response.ok) {
        const report = await response.json();
        setEfficacyReport(report);
      }
    } catch (error) {
      console.error('Failed to generate efficacy report:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackAnalytics = async (type: string, data: any) => {
    try {
      await fetch(`/api/analytics/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...data })
      });
    } catch (error) {
      console.error(`Failed to track ${type}:`, error);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-theme-primary to-theme-secondary border-theme-accent/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Emotional Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {(dashboard?.summary?.weeklyEmotionalImprovement || 0) > 0 ? '+' : ''}
              {((dashboard?.summary?.weeklyEmotionalImprovement || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-white/70 mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-theme-primary to-theme-secondary border-theme-accent/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white flex items-center">
              <Heart className="w-4 h-4 mr-2" />
              Top Affirmation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-white capitalize">
              {dashboard?.summary.topAffirmationType || 'Self-Compassion'}
            </div>
            <p className="text-xs text-white/70 mt-1">Most effective type</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-theme-primary to-theme-secondary border-theme-accent/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Overall Efficacy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {((dashboard?.summary.overallEfficacy || 0) * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-white/70 mt-1">Therapeutic effectiveness</p>
          </CardContent>
        </Card>
      </div>

      {/* Emotional Trends Chart */}
      <Card className="bg-gradient-to-br from-theme-primary to-theme-secondary border-theme-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <BarChart3 className="w-5 h-5 mr-2 text-white" />
            Emotional Trends (7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboard?.emotionalTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 theme-card/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium text-white">
                    {new Date(trend.date).toLocaleDateString()}
                  </div>
                  <Badge variant={trend.avgSentiment > 0 ? 'default' : 'secondary'} className="text-xs">
                    {trend.dominantTone}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">
                      Sentiment: {(trend.avgSentiment * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-white/70">
                      Intensity: {(trend.avgIntensity * 100).toFixed(0)}%
                    </div>
                  </div>
                  {trend.avgSentiment > 0 ? 
                    <TrendingUp className="w-4 h-4 text-green-500" /> : 
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  }
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Effective Affirmations */}
      <Card className="bg-gradient-to-br from-theme-primary to-theme-secondary border-theme-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Sparkles className="w-5 h-5 mr-2 text-white" />
            Most Effective Affirmations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboard?.effectiveAffirmations.map((affirmation, index) => (
              <div key={index} className="p-4 border border-theme-accent/30 rounded-lg theme-card/20">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-white capitalize">
                    {affirmation.affirmationType.replace('-', ' ')}
                  </h4>
                  <Badge variant="outline" className="text-xs text-white border-white/30">
                    {(affirmation.avgEfficacy * 100).toFixed(0)}% effective
                  </Badge>
                </div>
                <div className="text-sm text-white/70">
                  <p>Presented {affirmation.totalPresented} times</p>
                  <p>Engagement: {affirmation.avgEngagement}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-theme-primary to-theme-secondary border-theme-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <span className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-white" />
              Therapeutic Efficacy Report
            </span>
            <div className="flex items-center space-x-2">
              <select 
                value={reportPeriod} 
                onChange={(e) => setReportPeriod(e.target.value as any)}
                className="text-sm border border-white/30 theme-card/20 text-white rounded px-2 py-1"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
              <Button onClick={generateEfficacyReport} disabled={loading} size="sm">
                <Calendar className="w-4 h-4 mr-1" />
                Generate Report
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {efficacyReport ? (
            <div className="space-y-6">
              {/* Report Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 theme-card/20 rounded-lg">
                  <div className="text-2xl font-bold text-white">{efficacyReport.totalUsers}</div>
                  <div className="text-sm text-white/70">Total Users</div>
                </div>
                <div className="text-center p-4 theme-card/20 rounded-lg">
                  <div className="text-2xl font-bold text-white">
                    {(efficacyReport.averageEmotionalImprovement * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-white/70">Emotional Improvement</div>
                </div>
                <div className="text-center p-4 theme-card/20 rounded-lg">
                  <div className="text-2xl font-bold text-white">
                    {efficacyReport.goalCompletionRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-white/70">Goal Completion</div>
                </div>
                <div className="text-center p-4 theme-card/20 rounded-lg">
                  <div className="text-2xl font-bold text-white">
                    {(efficacyReport.userRetentionRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-white/70">User Retention</div>
                </div>
              </div>

              {/* Clinical Metrics */}
              <Card className="bg-gradient-to-br from-theme-primary to-theme-secondary border-theme-accent/30">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Clinical Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">
                        {(efficacyReport.clinicalMetrics.anxietyReduction * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-white/70">Anxiety Reduction</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">
                        {(efficacyReport.clinicalMetrics.depressionImprovement * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-white/70">Depression Improvement</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">
                        {(efficacyReport.clinicalMetrics.stressManagement * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-white/70">Stress Management</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">
                        {(efficacyReport.clinicalMetrics.overallWellness * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-white/70">Overall Wellness</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Insights */}
              <Card className="bg-gradient-to-br from-theme-primary to-theme-secondary border-theme-accent/30">
                <CardHeader>
                  <CardTitle className="text-white">Key Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {efficacyReport.keyInsights.map((insight, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Brain className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-white/90">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Export Options */}
              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={() => window.print()}>
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="outline" 
                  onClick={() => {
                    const dataStr = JSON.stringify(efficacyReport, null, 2);
                    const dataBlob = new Blob([dataStr], {type: 'application/json'});
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `therapeutic_report_${reportPeriod}.json`;
                    link.click();
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-white/70">
              Click "Generate Report" to create a therapeutic efficacy report
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-theme-primary to-theme-secondary p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Therapeutic Outcome Analytics</h1>
          <p className="text-white/80">Internal tools for measuring therapeutic efficacy and optimization</p>
        </div>

        {/* Navigation Tabs */}
        <div className="w-full bg-[var(--theme-surface)] rounded-lg p-1 mb-6 shadow-lg border-2 border-[var(--theme-accent)]">
          <div className="grid grid-cols-4 gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'reports', label: 'Efficacy Reports', icon: Users },
              { id: 'trends', label: 'Trends', icon: TrendingUp },
              { id: 'optimization', label: 'Optimization', icon: Target }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`shimmer-border theme-button w-full px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'shadow-lg border-2 animate-shimmer'
                    : 'hover:shadow-md border hover:border-2 hover:animate-shimmer'
                }`}
              >
                <tab.icon 
                  className="w-4 h-4 mx-auto mb-1" 
                  style={{ 
                    background: 'none',
                    backgroundColor: 'transparent',
                    color: 'white',
                    fill: 'white'
                  }}
                />
                <div 
                  className="text-xs"
                  style={{ 
                    background: 'none',
                    backgroundColor: 'transparent',
                    color: 'white'
                  }}
                >
                  {tab.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-gradient-to-br from-[var(--theme-surface)] to-[var(--theme-primary)] rounded-xl shadow-lg p-6 border-2 border-[var(--theme-accent)]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--theme-accent)]"></div>
              <span className="ml-2 text-white">Loading analytics...</span>
            </div>
          )}

          {!loading && (
            <>
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'reports' && renderReports()}
              {activeTab === 'trends' && renderDashboard()}
              {activeTab === 'optimization' && renderDashboard()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}