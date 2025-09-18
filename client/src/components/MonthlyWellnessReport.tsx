import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  TrendingUp, 
  Award, 
  Target, 
  Heart,
  Download,
  Share,
  ChevronLeft,
  ChevronRight,
  FileText,
  BarChart3
} from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';

interface MonthlyReport {
  id: string;
  userId: number;
  month: number;
  year: number;
  summary: string;
  keyHighlights: string[];
  emotionalJourney: string;
  progressAchievements: string[];
  challengesAndGrowth: string[];
  therapeuticInsights: string[];
  goalsForNextMonth: string[];
  overallScore: number;
  generatedAt: Date;
  metrics: {
    emotionalTrends: {
      dominantEmotions: Array<{ emotion: string; frequency: number; trend: string }>;
      averageValence: number;
      progressDirection: string;
    };
    activityMetrics: {
      totalSessions: number;
      journalEntries: number;
      streakDays: number;
      completedGoals: number;
    };
    therapeuticProgress: {
      insightGrowth: number;
      copingSkillsDeveloped: string[];
      confidenceScore: number;
    };
    achievements: {
      badgesEarned: number;
      consistencyScore: number;
      milestonesReached: string[];
    };
  };
}

interface MonthlyWellnessReportProps {
  userId: number;
}

export function MonthlyWellnessReport({ userId }: MonthlyWellnessReportProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchMonthlyReport();
  }, [userId, currentDate]);

  const fetchMonthlyReport = async () => {
    try {
      setLoading(true);
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const response = await fetch(`/api/analytics/monthly-report/${userId}/${year}/${month}`);
      
      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
      } else if (response.status === 404) {
        // Report doesn't exist, show option to generate
        setReport(null);
      }
    } catch (error) {
      console.error('Failed to fetch monthly report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setGenerating(true);
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const response = await fetch('/api/analytics/generate-monthly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, month, year })
      });
      
      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
      }
    } catch (error) {
      console.error('Failed to generate monthly report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async () => {
    if (!report) return;
    
    try {
      const response = await fetch('/api/analytics/export-monthly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: report.id, format: 'pdf' })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wellness-report-${format(currentDate, 'yyyy-MM')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Award className="w-6 h-6 text-green-600" />;
    if (score >= 60) return <Target className="w-6 h-6 text-yellow-600" />;
    return <Heart className="w-6 h-6 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Monthly Wellness Report</h1>
          <p className="text-gray-600">Comprehensive insights into your therapeutic journey</p>
        </div>
        <div className="flex items-center space-x-2">
          {report && (
            <>
              <Button variant="outline" size="sm" onClick={downloadReport}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Month Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="text-center">
              <h2 className="text-xl font-semibold">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <p className="text-sm text-gray-600">Monthly Wellness Summary</p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateMonth('next')}
              disabled={currentDate >= new Date()}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {!report ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Report Available</h3>
            <p className="text-gray-600 mb-6">
              Generate your monthly wellness report for {format(currentDate, 'MMMM yyyy')}
            </p>
            <Button onClick={generateReport} disabled={generating}>
              {generating ? 'Generating...' : 'Generate Report'}
              <BarChart3 className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card className={`border-2 ${getScoreColor(report.overallScore)}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Overall Wellness Score</h3>
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl font-bold">{report.overallScore}/100</div>
                    <div className="flex-1">
                      <Progress value={report.overallScore} className="h-3" />
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {getScoreIcon(report.overallScore)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                Monthly Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{report.summary}</p>
            </CardContent>
          </Card>

          {/* Key Highlights */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <Award className="w-5 h-5 mr-2" />
                Key Highlights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.keyHighlights.map((highlight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <p className="text-green-800">{highlight}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Emotional Journey & Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-pink-500" />
                  Emotional Journey
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed mb-4">{report.emotionalJourney}</p>
                
                {/* Emotional Metrics */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Emotional Progress</span>
                    <Badge variant={report.metrics.emotionalTrends.progressDirection === 'improving' ? 'default' : 'secondary'}>
                      {report.metrics.emotionalTrends.progressDirection}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Dominant Emotions</span>
                    <div className="flex flex-wrap gap-2">
                      {report.metrics.emotionalTrends.dominantEmotions.slice(0, 3).map((emotion, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {emotion.emotion} ({emotion.frequency})
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                  Progress Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.progressAchievements.map((achievement, index) => (
                  <div key={index} className="flex items-start space-x-3 p-2 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-blue-800 text-sm">{achievement}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Activity Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {report.metrics.activityMetrics.totalSessions}
                  </div>
                  <div className="text-sm text-gray-600">Total Sessions</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {report.metrics.activityMetrics.journalEntries}
                  </div>
                  <div className="text-sm text-gray-600">Journal Entries</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {report.metrics.activityMetrics.streakDays}
                  </div>
                  <div className="text-sm text-gray-600">Streak Days</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {report.metrics.activityMetrics.completedGoals}
                  </div>
                  <div className="text-sm text-gray-600">Goals Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Challenges & Growth + Therapeutic Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-800">Challenges & Growth</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.challengesAndGrowth.map((challenge, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg">
                    <Target className="w-4 h-4 text-purple-500 mt-1 flex-shrink-0" />
                    <p className="text-purple-800 text-sm">{challenge}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
              <CardHeader>
                <CardTitle className="text-indigo-800">Therapeutic Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.therapeuticInsights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg">
                    <Award className="w-4 h-4 text-indigo-500 mt-1 flex-shrink-0" />
                    <p className="text-indigo-800 text-sm">{insight}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Therapeutic Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Therapeutic Development</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Insight Growth</span>
                    <span className="text-sm text-gray-500">
                      {report.metrics.therapeuticProgress.insightGrowth}%
                    </span>
                  </div>
                  <Progress value={report.metrics.therapeuticProgress.insightGrowth} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Confidence Score</span>
                    <span className="text-sm text-gray-500">
                      {Math.round(report.metrics.therapeuticProgress.confidenceScore * 100)}%
                    </span>
                  </div>
                  <Progress value={report.metrics.therapeuticProgress.confidenceScore * 100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Consistency</span>
                    <span className="text-sm text-gray-500">
                      {report.metrics.achievements.consistencyScore}%
                    </span>
                  </div>
                  <Progress value={report.metrics.achievements.consistencyScore} className="h-2" />
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Coping Skills Developed</h4>
                <div className="flex flex-wrap gap-2">
                  {report.metrics.therapeuticProgress.copingSkillsDeveloped.map((skill, index) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goals for Next Month */}
          <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
            <CardHeader>
              <CardTitle className="flex items-center text-teal-800">
                <Target className="w-5 h-5 mr-2" />
                Goals for Next Month
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.goalsForNextMonth.map((goal, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg">
                  <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-teal-600 text-sm font-medium">{index + 1}</span>
                  </div>
                  <p className="text-teal-800">{goal}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Report Generation Info */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Report generated on {format(new Date(report.generatedAt), 'PPP')}</span>
                <span>Report ID: {report.id}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
