import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  MoreVertical,
  Calendar,
  Clock,
  Target,
  Activity,
  Brain,
  Heart,
  BookOpen,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Play,
  Zap
} from 'lucide-react';

interface ModernDashboardProps {
  userId: number | null;
  onNavigate: (section: string) => void;
}

const ModernDashboard: React.FC<ModernDashboardProps> = ({ userId, onNavigate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Mock data for professional dashboard
  useEffect(() => {
    setDashboardData({
      metrics: {
        currentStreak: 7,
        weeklyProgress: 85,
        completedSessions: 12,
        moodTrend: 'improving'
      },
      todaysSchedule: [
        { time: '09:00', type: 'check-in', title: 'Morning Mood Check', status: 'completed' },
        { time: '14:00', type: 'session', title: 'CBT Exercise', status: 'pending' },
        { time: '19:00', type: 'reflection', title: 'Evening Journal', status: 'pending' }
      ],
      recentActivity: [
        { type: 'journal', title: 'Completed gratitude exercise', time: '2 hours ago' },
        { type: 'mood', title: 'Mood logged: Good', time: '4 hours ago' },
        { type: 'session', title: 'Breathing exercise completed', time: '1 day ago' }
      ],
      insights: {
        primaryFocus: 'Anxiety Management',
        progressNote: 'Showing consistent improvement in stress levels',
        nextGoal: 'Practice mindfulness daily for 2 weeks'
      }
    });
    setLoading(false);
  }, []);

  const MetricCard = ({ title, value, change, icon: Icon, trend }: any) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        </div>
        {change && (
          <div className={`flex items-center space-x-1 text-sm ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{change}</span>
          </div>
        )}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${typeof value === 'number' ? Math.min(value, 100) : 0}%` }}
        />
      </div>
    </div>
  );

  const QuickAction = ({ icon: Icon, title, description, color, onClick }: any) => (
    <button
      onClick={onClick}
      className="w-full bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all group text-left"
    >
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
      </div>
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 17 ? 'Afternoon' : 'Evening'}
              </h1>
              <p className="text-blue-100 text-lg">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{dashboardData.metrics.currentStreak}</div>
              <div className="text-blue-100 text-sm">Day Streak</div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Weekly Progress"
            value={dashboardData.metrics.weeklyProgress}
            change="+12%"
            icon={Target}
            trend="up"
          />
          <MetricCard
            title="Sessions Completed"
            value={dashboardData.metrics.completedSessions}
            change="+3"
            icon={CheckCircle}
            trend="up"
          />
          <MetricCard
            title="Mood Trend"
            value="Improving"
            change="+15%"
            icon={Heart}
            trend="up"
          />
          <MetricCard
            title="Current Streak"
            value={dashboardData.metrics.currentStreak}
            change="+1"
            icon={Zap}
            trend="up"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Today's Schedule */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    Today's Schedule
                  </h2>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View All
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboardData.todaysSchedule.map((item: any, index: number) => (
                    <div key={index} className="flex items-center space-x-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 w-16">
                        {item.time}
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        item.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{item.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{item.type}</p>
                      </div>
                      {item.status === 'pending' && (
                        <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-4">
                <QuickAction
                  icon={MessageCircle}
                  title="Start AI Session"
                  description="Begin therapeutic conversation"
                  color="bg-blue-500"
                  onClick={() => onNavigate('chat')}
                />
                <QuickAction
                  icon={BookOpen}
                  title="Open Journal"
                  description="Reflect and document thoughts"
                  color="bg-green-500"
                  onClick={() => onNavigate('journal')}
                />
                <QuickAction
                  icon={Brain}
                  title="Mindfulness"
                  description="Guided meditation session"
                  color="bg-purple-500"
                  onClick={() => onNavigate('meditation')}
                />
                <QuickAction
                  icon={Activity}
                  title="CBT Exercise"
                  description="Cognitive behavioral therapy"
                  color="bg-orange-500"
                  onClick={() => onNavigate('exercises')}
                />
              </div>
            </div>

            {/* Insights Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Clinical Insights</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Primary Focus</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{dashboardData.insights.primaryFocus}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Progress Note</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{dashboardData.insights.progressNote}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Next Goal</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{dashboardData.insights.nextGoal}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-600" />
              Recent Activity
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.recentActivity.map((activity: any, index: number) => (
                <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'journal' ? 'bg-green-500' :
                    activity.type === 'mood' ? 'bg-blue-500' : 'bg-purple-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;
