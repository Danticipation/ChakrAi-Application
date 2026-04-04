import React, { useState, useEffect } from 'react';
import { 
  TrendingUp,
  Activity,
  Brain,
  Heart,
  BookOpen,
  MessageCircle,
  ArrowRight,
  Zap,
  Star
} from 'lucide-react';
import { getCurrentUserId, getAuthHeaders } from '../utils/unifiedUserSession';
import DataMigrationTool from './DataMigrationTool';

interface EnhancedDashboardProps {
  userId: number | null;
  onNavigate: (section: string) => void;
}

const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({ userId, onNavigate }) => {
  const [authenticatedUserId, setAuthenticatedUserId] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [comprehensiveData, setComprehensiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get authenticated user ID
  useEffect(() => {
    const getUser = async () => {
      try {
        const authUserId = await getCurrentUserId();
        if (authUserId === 0) {
          setError('Authentication failed');
          return;
        }
        setAuthenticatedUserId(authUserId);
        console.log('ðŸ” EnhancedDashboard: Using authenticated user:', authUserId);
      } catch (error) {
        console.error('âŒ EnhancedDashboard: Auth failed:', error);
        setError('Authentication failed');
      }
    };
    getUser();
  }, []);

  // Handle mood selection
  const handleMoodSelection = async (mood: string) => {
    try {
      // Update local state immediately for UI responsiveness
      setComprehensiveData((prev: any) => ({
        ...prev,
        todaysMood: mood
      }));
      
      if (authenticatedUserId === 0) {
        console.error('No authenticated user for mood tracking');
        return;
      }
      
      const headers = await getAuthHeaders();
      console.log('ðŸŽ­ Saving mood with unified auth for user:', authenticatedUserId);

      const response = await fetch('/api/mood', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: authenticatedUserId,
          mood,
          intensity: 5,
          triggers: [],
          notes: '',
          date: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('âœ… Mood saved successfully:', result);
        
        // Update comprehensive data with saved mood
        setComprehensiveData((prev: any) => ({
          ...prev,
          todaysMood: mood,
          moodIntensity: 5
        }));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('âŒ Failed to save mood:', response.status, errorData);
      }
    } catch (error) {
      console.error('Failed to save mood:', error);
    }
  };

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Load comprehensive data
  useEffect(() => {
    const fetchComprehensiveData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (authenticatedUserId === 0) {
          return; // Wait for auth
        }
        
        console.log('ðŸ”¥ Loading COMPREHENSIVE dashboard data for user:', authenticatedUserId);

        const headers = await getAuthHeaders();
        
        // Make API calls for comprehensive data
        const apiCalls = [
          fetch(`/api/dashboard-stats`, { headers })
            .then(res => res.ok ? res.json() : null)
            .catch(() => null),
          
          fetch(`/api/personality-insights`, { headers })
            .then(res => res.ok ? res.json() : null)
            .catch(() => null),
          
          fetch(`/api/mood/today`, { headers })
            .then(res => res.ok ? res.json() : null)
            .catch(() => null),
          
          fetch(`/api/daily-affirmation`, { headers })
            .then(res => res.ok ? res.json() : null)
            .catch(() => null)
        ];

        const [
          dashboardStats,
          personalityInsights, 
          todaysMood,
          dailyAffirmation
        ] = await Promise.all(apiCalls);

        // Process comprehensive data
        const processedData = {
          stats: {
            conversations: dashboardStats?.aiConversations || 0,
            journalEntries: dashboardStats?.journalEntries || 0,
            streak: dashboardStats?.currentStreak || 0,
            mindfulMinutes: dashboardStats?.mindfulMinutes || 0,
            changes: {
              streakChange: dashboardStats?.streakChange,
              conversationsChange: dashboardStats?.conversationsChange, 
              journalChange: dashboardStats?.journalChange,
              mindfulChange: dashboardStats?.mindfulChange
            }
          },
          
          personalityInsights: personalityInsights || null,
          todaysMood: todaysMood?.mood || null,
          moodIntensity: todaysMood?.intensity || null,
          dailyAffirmation: dailyAffirmation?.affirmation || dailyAffirmation?.text || 'Welcome to your wellness journey. Every step forward is progress.',
          recentActivity: [],
          
          weeklyGoals: {
            journalEntries: { current: 0, target: 5 },
            meditation: { current: 0, target: 60 },
            aiSessions: { current: 0, target: 10 },
            moodCheckins: { current: 0, target: 7 }
          }
        };

        setComprehensiveData(processedData);

      } catch (error) {
        console.error('âŒ Failed to load comprehensive data:', error);
        setError('Unable to load comprehensive data');
        // Set minimal data structure
        setComprehensiveData({
          stats: { conversations: 0, journalEntries: 0, streak: 0, mindfulMinutes: 0, changes: {} },
          personalityInsights: null,
          todaysMood: null,
          recentActivity: [],
          dailyAffirmation: 'Welcome to your wellness journey. Start by exploring the features below.',
          weeklyGoals: {
            journalEntries: { current: 0, target: 5 },
            meditation: { current: 0, target: 60 },
            aiSessions: { current: 0, target: 10 },
            moodCheckins: { current: 0, target: 7 }
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchComprehensiveData();
  }, [authenticatedUserId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6">
            <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-white"></div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Loading Your Dashboard...</h2>
          <p className="text-white/70 text-lg">Gathering all your wellness insights</p>
        </div>
      </div>
    );
  }

  if (!comprehensiveData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Welcome to Chakrai</h2>
          <p className="text-white/70 text-xl">Your revolutionary wellness journey starts here</p>
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
        
        {/* Data Migration Tool */}
        <DataMigrationTool />
        
        {/* Dynamic Header */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 text-white overflow-hidden relative">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black mb-3 drop-shadow-lg">
                Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 17 ? 'Afternoon' : 'Evening'}! âœ¨
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
              <div className="text-4xl font-black drop-shadow-lg">{comprehensiveData?.stats?.streak || 0}</div>
              <div className="text-cyan-100 text-lg font-medium">Day Streak ðŸ”¥</div>
            </div>
          </div>
          
          {/* Daily Affirmation */}
          <div className="mt-6 p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
            <p className="text-center text-lg font-medium italic">
              "ðŸ’« {comprehensiveData?.dailyAffirmation} ðŸ’«"
            </p>
          </div>
          
          {/* Floating elements */}
          <div className="absolute top-6 right-6 opacity-30 animate-bounce">
            <Star className="w-8 h-8 text-yellow-300" />
          </div>
        </div>

        {/* Comprehensive Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Your Conversations",
              value: comprehensiveData?.stats?.conversations || 0,
              change: comprehensiveData?.stats?.changes?.conversationsChange,
              icon: MessageCircle,
              color: "bg-blue-600",
              onClick: () => onNavigate('chat')
            },
            {
              title: "Journal Entries",
              value: comprehensiveData?.stats?.journalEntries || 0,
              change: comprehensiveData?.stats?.changes?.journalChange,
              icon: BookOpen,
              color: "bg-green-600",
              onClick: () => onNavigate('journal')
            },
            {
              title: "Current Streak",
              value: comprehensiveData?.stats?.streak || 0,
              change: comprehensiveData?.stats?.changes?.streakChange,
              icon: Zap,
              color: "bg-orange-600",
              onClick: () => onNavigate('analytics')
            },
            {
              title: "Mindful Minutes",
              value: comprehensiveData?.stats?.mindfulMinutes || 0,
              change: comprehensiveData?.stats?.changes?.mindfulChange,
              icon: Heart,
              color: "bg-purple-600",
              onClick: () => onNavigate('meditation')
            }
          ].map((metric, index) => (
            <div 
              key={index}
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6 cursor-pointer group hover:scale-105 transition-all duration-300"
              onClick={metric.onClick}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${metric.color} shadow-lg group-hover:shadow-xl transition-shadow`}>
                  <metric.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-white drop-shadow-lg group-hover:scale-110 transition-transform">
                    {metric.value}
                  </div>
                  {metric.change && (
                    <div className="flex items-center text-sm font-bold mt-1 text-green-300">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {metric.change}
                    </div>
                  )}
                </div>
              </div>
              <h3 className="text-white/90 font-medium text-sm uppercase tracking-wide">{metric.title}</h3>
              
              {metric.value > 0 && (
                <div className="mt-3 w-full h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/60 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Today's Mood Check-in Interface */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Heart className="w-6 h-6 mr-3 text-pink-400" />
            How are you feeling today?
          </h2>
          
          {/* Show current mood if selected */}
          {comprehensiveData?.todaysMood && (
            <div className="mb-6 p-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl border border-pink-400/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {comprehensiveData.todaysMood === 'sad' ? 'ðŸ˜”' :
                     comprehensiveData.todaysMood === 'neutral' ? 'ðŸ˜' :
                     comprehensiveData.todaysMood === 'good' ? 'ðŸ™‚' :
                     comprehensiveData.todaysMood === 'happy' ? 'ðŸ˜Š' :
                     comprehensiveData.todaysMood === 'excited' ? 'ðŸ¤©' : 'ðŸ™‚'}
                  </span>
                  <div>
                    <p className="text-white font-medium">Today's Mood: {comprehensiveData.todaysMood}</p>
                    {comprehensiveData.moodIntensity && (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-white/70 text-sm">Intensity:</span>
                        <div className="w-20 h-1.5 bg-white/20 rounded-full">
                          <div 
                            className="h-1.5 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full"
                            style={{ width: `${comprehensiveData.moodIntensity * 10}%` }}
                          />
                        </div>
                        <span className="text-white/70 text-sm">{comprehensiveData.moodIntensity}/10</span>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => onNavigate('journal')}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 transition-colors"
                >
                  ðŸ“” Journal
                </button>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-5 gap-4 mb-6">
            {[
              { emoji: "ðŸ˜”", label: "Sad", value: "sad" },
              { emoji: "ðŸ˜", label: "Neutral", value: "neutral" },
              { emoji: "ðŸ™‚", label: "Good", value: "good" },
              { emoji: "ðŸ˜Š", label: "Happy", value: "happy" },
              { emoji: "ðŸ¤©", label: "Excited", value: "excited" }
            ].map((mood) => (
              <button
                key={mood.value}
                onClick={() => handleMoodSelection(mood.value)}
                className={`p-4 rounded-xl text-center transition-all duration-300 transform hover:scale-105 ${
                  comprehensiveData?.todaysMood === mood.value 
                    ? 'bg-gradient-to-br from-pink-500/30 to-purple-500/30 border-2 border-pink-400 scale-105 shadow-lg' 
                    : 'bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/30'
                }`}
              >
                <div className="text-3xl mb-2 drop-shadow-lg">{mood.emoji}</div>
                <div className="text-white/90 text-sm font-medium">{mood.label}</div>
              </button>
            ))}
          </div>
          
          {!comprehensiveData?.todaysMood && (
            <div className="text-center">
              <p className="text-white/70 text-sm">Select your mood above to track your daily emotional wellness</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
            <Zap className="w-8 h-8 mr-3 text-yellow-400" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: MessageCircle,
                label: "AI Chat Session",
                description: "Start a therapeutic conversation",
                className: "bg-gradient-to-br from-blue-500/20 to-cyan-500/20",
                onClick: () => onNavigate('chat')
              },
              {
                icon: BookOpen,
                label: "Journal Entry",
                description: "Reflect on your thoughts and feelings",
                className: "bg-gradient-to-br from-green-500/20 to-emerald-500/20",
                onClick: () => onNavigate('journal')
              },
              {
                icon: Heart,
                label: "Guided Meditation",
                description: "Find peace and mindfulness",
                className: "bg-gradient-to-br from-purple-500/20 to-pink-500/20",
                onClick: () => onNavigate('meditation')
              },
              {
                icon: Brain,
                label: "Personality Reflection",
                description: "Explore your inner world deeply",
                className: "bg-gradient-to-br from-indigo-500/20 to-purple-500/20",
                onClick: () => onNavigate('daily')
              },
              {
                icon: Star,
                label: "Stars & Studies",
                description: "Horoscopes and medical research",
                className: "bg-gradient-to-br from-yellow-500/20 to-orange-500/20",
                onClick: () => onNavigate('stars-studies')
              },
              {
                icon: Activity,
                label: "Analytics",
                description: "View your progress and insights",
                className: "bg-gradient-to-br from-teal-500/20 to-cyan-500/20",
                onClick: () => onNavigate('analytics')
              }
            ].map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`${action.className} border border-white/20 rounded-2xl p-6 text-left hover:scale-105 transition-all duration-300 group backdrop-blur-xl`}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors shadow-lg">
                    <action.icon className="w-7 h-7 text-white drop-shadow-lg" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg mb-1 group-hover:text-white/90 transition-colors">
                      {action.label}
                    </h3>
                    <p className="text-white/80 text-sm group-hover:text-white/90 transition-colors">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
