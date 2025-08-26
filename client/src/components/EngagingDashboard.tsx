import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Target,
  Activity,
  Brain,
  Heart,
  BookOpen,
  MessageCircle,
  CheckCircle,
  ArrowRight,
  Play,
  Zap,
  Sparkles,
  Star
} from 'lucide-react';
import { getCurrentUserId, getAuthHeaders } from '../utils/unifiedUserSession';

interface EngagingDashboardProps {
  userId: number | null;
  onNavigate: (section: string) => void;
}

const EngagingDashboard: React.FC<EngagingDashboardProps> = ({ userId, onNavigate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [realData, setRealData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Load REAL data from ACTUAL working APIs
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get real user ID
        const realUserId = userId || await getCurrentUserId() || 1;
        console.log('🔥 Loading REAL dashboard data for user:', realUserId);

        // Use ACTUAL working endpoints  
        const headers = await getAuthHeaders();
        
        // Fetch data from real endpoints that exist
        const promises = [];
        
        // 1. Dashboard stats (EXISTS: /api/dashboard/stats/:userId)
        promises.push(
          fetch(`/api/dashboard/stats/${realUserId}`, { headers })
            .then(res => res.ok ? res.json() : null)
            .catch(err => {
              console.log('Dashboard stats not available:', err.message);
              return null;
            })
        );
        
        // 2. Mood history (EXISTS: /api/mood/history/:userId)
        promises.push(
          fetch(`/api/mood/history/${realUserId}`, { headers })
            .then(res => res.ok ? res.json() : null)
            .catch(err => {
              console.log('Mood history not available:', err.message);
              return null;
            })
        );
        
        // 3. Try journal analytics (EXISTS: /api/journal/analytics/:userId)
        promises.push(
          fetch(`/api/journal/analytics/${realUserId}`, { headers })
            .then(res => res.ok ? res.json() : null)
            .catch(err => {
              console.log('Journal analytics not available:', err.message);
              return null;
            })
        );

        const [dashboardStats, moodHistory, journalAnalytics] = await Promise.all(promises);

        // Process REAL data only
        let stats = {
          conversations: 0,
          journalEntries: 0,
          streak: 0,
          mindfulMinutes: 0
        };
        
        let recentActivity = [];

        // Use dashboard stats if available
        if (dashboardStats) {
          console.log('✅ Dashboard stats loaded:', dashboardStats);
          stats = {
            conversations: dashboardStats.aiConversations || 0,
            journalEntries: dashboardStats.journalEntries || 0,
            streak: dashboardStats.currentStreak || 0,
            mindfulMinutes: dashboardStats.mindfulMinutes || 0
          };
        }

        // Add mood data to activity if available
        if (moodHistory && moodHistory.moodEntries) {
          console.log('✅ Mood history loaded:', moodHistory.moodEntries.length, 'entries');
          const recentMoods = moodHistory.moodEntries.slice(0, 3);
          recentActivity.push(...recentMoods.map((mood: any) => ({
            type: 'mood',
            title: `Mood logged: ${mood.mood}`,
            time: new Date(mood.createdAt || mood.date).toLocaleDateString(),
            intensity: mood.intensity
          })));
        }

        // Add journal data if available
        if (journalAnalytics && journalAnalytics.totalEntries > 0) {
          console.log('✅ Journal analytics loaded:', journalAnalytics);
          recentActivity.push({
            type: 'journal',
            title: `Journal entries: ${journalAnalytics.totalEntries}`,
            time: 'Recent activity',
            avgMood: journalAnalytics.averageMoodIntensity
          });
        }

        console.log('📊 Final real data:', { stats, activityCount: recentActivity.length });

        setRealData({
          stats,
          recentActivity,
          insights: dashboardStats ? {
            primaryFocus: 'Your Wellness Journey',
            progressNote: `${stats.conversations} conversations, ${stats.journalEntries} journal entries`,
            nextGoal: stats.streak > 0 ? `Keep your ${stats.streak}-day streak going!` : 'Start your wellness journey today'
          } : null
        });

      } catch (error) {
        console.error('❌ Failed to load real data:', error);
        setError('Ready to start your wellness journey');
        // Set EMPTY data - absolutely no mock data
        setRealData({
          stats: { conversations: 0, journalEntries: 0, streak: 0, mindfulMinutes: 0 },
          recentActivity: [],
          insights: null
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, [userId]);

  const VisualMetricCard = ({ title, value, icon: Icon, color, gradient, onClick }: any) => (
    <div 
      className={`relative overflow-hidden rounded-2xl p-6 cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl ${gradient} group`}
      onClick={onClick}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]"></div>
      </div>
      
      {/* Floating particles */}
      <div className="absolute top-4 right-4 opacity-30 group-hover:opacity-60 transition-opacity">
        <Sparkles className="w-5 h-5 text-white animate-pulse" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${color} shadow-lg group-hover:shadow-xl transition-shadow`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-white drop-shadow-lg group-hover:scale-110 transition-transform">
              {value}
            </div>
          </div>
        </div>
        <h3 className="text-white/90 font-medium text-sm uppercase tracking-wide">{title}</h3>
        
        {/* Progress bar - only show if value > 0 */}
        {value > 0 && (
          <div className="mt-3 w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white/60 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
      
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </div>
  );

  const DynamicQuickAction = ({ icon: Icon, title, description, gradient, onClick }: any) => (
    <button
      onClick={onClick}
      className={`relative w-full rounded-2xl p-6 text-left group overflow-hidden transform hover:scale-105 transition-all duration-300 ${gradient} shadow-lg hover:shadow-2xl`}
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 group-hover:from-white/20 transition-all duration-300"></div>
      
      <div className="relative z-10 flex items-center space-x-4">
        <div className="p-3 rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors shadow-lg">
          <Icon className="w-7 h-7 text-white drop-shadow-lg" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-white text-lg mb-1 group-hover:text-white/90 transition-colors">
            {title}
          </h3>
          <p className="text-white/80 text-sm group-hover:text-white/90 transition-colors">
            {description}
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
      </div>
      
      {/* Sparkle animation */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Star className="w-4 h-4 text-yellow-300 animate-pulse" />
      </div>
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          ))}
        </div>
        
        <div className="text-center relative z-10">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full animate-spin"></div>
            <div className="absolute inset-2 bg-gradient-to-br from-purple-900 to-indigo-900 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-white animate-pulse" />
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Loading Your Journey...
          </h2>
          <p className="text-white/70 text-lg">Connecting to your wellness data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Dynamic background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Dynamic Header */}
        <div className="relative rounded-3xl p-8 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 text-white shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black mb-3 drop-shadow-lg">
                Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 17 ? 'Afternoon' : 'Evening'}! ✨
              </h1>
              <p className="text-cyan-100 text-xl font-medium">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black drop-shadow-lg">{realData?.stats?.streak || 0}</div>
              <div className="text-cyan-100 text-lg font-medium">Day Streak 🔥</div>
            </div>
          </div>
          
          {/* Floating elements */}
          <div className="absolute top-6 right-6 opacity-30 animate-bounce">
            <Star className="w-8 h-8 text-yellow-300" />
          </div>
        </div>

        {/* Real Data Metrics - Show actual numbers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <VisualMetricCard
            title="Your Conversations"
            value={realData?.stats?.conversations || 0}
            icon={MessageCircle}
            color="bg-blue-600"
            gradient="bg-gradient-to-br from-blue-600 to-purple-700"
            onClick={() => onNavigate('chat')}
          />
          <VisualMetricCard
            title="Journal Entries"
            value={realData?.stats?.journalEntries || 0}
            icon={BookOpen}
            color="bg-green-600"
            gradient="bg-gradient-to-br from-green-600 to-teal-700"
            onClick={() => onNavigate('journal')}
          />
          <VisualMetricCard
            title="Current Streak"
            value={realData?.stats?.streak || 0}
            icon={Zap}
            color="bg-orange-600"
            gradient="bg-gradient-to-br from-orange-600 to-red-700"
            onClick={() => onNavigate('analytics')}
          />
          <VisualMetricCard
            title="Mindful Minutes"
            value={realData?.stats?.mindfulMinutes || 0}
            icon={Heart}
            color="bg-purple-600"
            gradient="bg-gradient-to-br from-purple-600 to-pink-700"
            onClick={() => onNavigate('meditation')}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Real Activity Section */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Activity className="w-6 h-6 mr-3 text-cyan-400" />
                  {realData?.recentActivity?.length > 0 ? 'Your Recent Activity' : 'Ready to Start?'}
                </h2>
              </div>
              <div className="p-6">
                {realData?.recentActivity?.length > 0 ? (
                  <div className="space-y-4">
                    {realData.recentActivity.map((activity: any, index: number) => (
                      <div key={index} className="flex items-center space-x-4 p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 border border-white/10">
                        <div className={`w-3 h-3 rounded-full ${
                          activity.type === 'journal' ? 'bg-green-400' :
                          activity.type === 'mood' ? 'bg-blue-400' : 'bg-purple-400'
                        } shadow-lg`} />
                        <div className="flex-1">
                          <p className="font-medium text-white">{activity.title}</p>
                          <p className="text-sm text-white/70">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Sparkles className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Begin Your Wellness Journey</h3>
                    <p className="text-white/70">Start with any activity below to see your progress here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
            
            <DynamicQuickAction
              icon={MessageCircle}
              title="AI Therapy Chat"
              description="Start your therapeutic conversation"
              gradient="bg-gradient-to-br from-blue-600 to-cyan-700"
              onClick={() => onNavigate('chat')}
            />
            
            <DynamicQuickAction
              icon={BookOpen}
              title="Journal"
              description="Reflect and write your thoughts"
              gradient="bg-gradient-to-br from-green-600 to-emerald-700"
              onClick={() => onNavigate('journal')}
            />
            
            <DynamicQuickAction
              icon={Brain}
              title="Meditation"
              description="Find peace and mindfulness"
              gradient="bg-gradient-to-br from-purple-600 to-violet-700"
              onClick={() => onNavigate('meditation')}
            />
            
            <DynamicQuickAction
              icon={Activity}
              title="Progress"
              description="View your wellness journey"
              gradient="bg-gradient-to-br from-pink-600 to-rose-700"
              onClick={() => onNavigate('analytics')}
            />
          </div>
        </div>

        {/* Insights section - only show if we have real insights */}
        {realData?.insights && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <Brain className="w-6 h-6 mr-3 text-purple-400" />
              Your Wellness Insights
            </h2>
            <div className="space-y-4 text-white/90">
              <p><strong>Focus:</strong> {realData.insights.primaryFocus}</p>
              <p><strong>Progress:</strong> {realData.insights.progressNote}</p>
              <p><strong>Next Step:</strong> {realData.insights.nextGoal}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EngagingDashboard;
