import React, { useState, useEffect } from 'react';
import { 
  Brain, Heart, BookOpen, Target, TrendingUp, Star, Flame, MessageCircle, ArrowRight, Zap, Lightbulb, Activity, TrendingDown
} from 'lucide-react';
import { getCurrentUserId, getAuthHeaders } from '../utils/unifiedUserSession';

interface WellnessDashboardProps {
  userId: number | null;
  onNavigate: (section: string) => void;
}

interface DashboardData {
  currentStreak: number;
  aiConversations: number;
  journalEntries: number;
  mindfulMinutes: number;
  weeklyGoals: {
    journalEntries: { current: number; target: number };
    meditation: { current: number; target: number };
    aiSessions: { current: number; target: number };
    moodCheckins: { current: number; target: number };
  };
  personalityInsights?: {
    analyticalThinking: number;
    empathetic: number;
    reflectionDepth: number;
  };
  wellnessScore?: number;
  goalCompletion?: number;
  recentChange?: {
    streak: number;
    conversations: number;
    journalEntries: number;
    mindfulMinutes: number;
  };
}

const StatCard = ({ icon: Icon, label, value, change, color, onClick, trend = "up" }: {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  change?: string;
  color: string;
  onClick?: () => void;
  trend?: "up" | "down" | "neutral";
}) => (
  <div 
    className={`p-6 rounded-3xl backdrop-blur-xl border-2 border-white/30 bg-gradient-to-br from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 transition-all duration-500 cursor-pointer group transform hover:scale-110 hover:rotate-1 shadow-2xl ${onClick ? 'hover:shadow-cyan-500/25' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-4 rounded-2xl bg-gradient-to-r ${color} shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
        <Icon className="w-8 h-8 text-white drop-shadow-lg" />
      </div>
      {change && (
        <div className={`flex items-center text-sm font-bold px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 ${
          trend === 'up' ? 'text-green-300 shadow-green-500/30' : 
          trend === 'down' ? 'text-red-300 shadow-red-500/30' : 
          'text-yellow-300 shadow-yellow-500/30'
        } shadow-lg`}>
          {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1 animate-bounce" /> : 
           trend === 'down' ? <TrendingDown className="w-4 h-4 mr-1 animate-bounce" /> : 
           <Activity className="w-4 h-4 mr-1 animate-pulse" />}
          {change}
        </div>
      )}
    </div>
    <div className="text-3xl font-black text-white mb-2 group-hover:text-cyan-200 transition-colors duration-300 drop-shadow-lg">
      {value}
    </div>
    <div className="text-white/80 text-sm font-medium group-hover:text-white transition-colors duration-300">
      {label}
    </div>
    <div className="mt-3 w-full h-1 bg-white/20 rounded-full overflow-hidden">
      <div className={`h-full bg-gradient-to-r ${color} rounded-full animate-pulse group-hover:animate-none transition-all duration-500`}></div>
    </div>
  </div>
);

const QuickAction = ({ icon: Icon, label, description, color, onClick }: {
  icon: React.ComponentType<any>;
  label: string;
  description: string;
  color: string;
  onClick: () => void;
}) => (
  <div 
    className="relative p-6 rounded-3xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border-2 border-white/30 hover:border-white/50 transition-all duration-500 cursor-pointer group transform hover:scale-105 hover:-translate-y-2 shadow-xl hover:shadow-2xl overflow-hidden"
    onClick={onClick}
  >
    {/* Floating background effect */}
    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    
    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${color} flex items-center justify-center mb-4 group-hover:animate-bounce shadow-xl group-hover:shadow-2xl transition-all duration-300 relative z-10`}>
      <Icon className="w-8 h-8 text-white drop-shadow-lg" />
      <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
    
    <h3 className="text-white font-bold text-lg mb-2 group-hover:text-cyan-200 transition-colors duration-300 relative z-10">
      {label}
    </h3>
    <p className="text-white/70 text-sm mb-4 group-hover:text-white/90 transition-colors duration-300 relative z-10">
      {description}
    </p>
    
    <div className="flex items-center justify-between relative z-10">
      <div className="flex items-center text-cyan-300 text-sm font-medium group-hover:text-cyan-200 group-hover:translate-x-2 transition-all duration-300">
        <span className="mr-2">ðŸš€ Start Now</span>
        <ArrowRight className="w-4 h-4 group-hover:animate-pulse" />
      </div>
      
      {/* Progress indicator */}
      <div className="w-12 h-1 bg-white/20 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} rounded-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700`}></div>
      </div>
    </div>
    
    {/* Sparkle effect */}
    <div className="absolute top-4 right-4 text-yellow-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse">
      <Star className="w-4 h-4" fill="currentColor" />
    </div>
  </div>
);

const PersonalityPreview = ({ onNavigate, insights }: { 
  onNavigate: (section: string) => void;
  insights?: {
    analyticalThinking: number;
    empathetic: number;
    reflectionDepth: number;
  };
}) => (
  <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-sm border border-white/10 hover:border-blue-400/30 transition-all duration-300 cursor-pointer group"
       onClick={() => onNavigate('daily')}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        <Brain className="w-6 h-6 text-blue-400 mr-3" />
        <h3 className="text-xl font-semibold text-white">Personality Insights</h3>
      </div>
      <div className="flex items-center text-blue-300 group-hover:text-blue-200 transition-colors">
        <span className="text-sm mr-1">View Full Analysis</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </div>
    
    {insights ? (
      <>
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm">Analytical Thinking</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 h-2 bg-white/20 rounded-full">
                <div 
                  className="h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-1000"
                  style={{ width: `${insights.analyticalThinking}%` }}
                ></div>
              </div>
              <span className="text-blue-400 text-sm font-medium">{insights.analyticalThinking}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm">Empathetic Communication</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 h-2 bg-white/20 rounded-full">
                <div 
                  className="h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: `${insights.empathetic}%` }}
                ></div>
              </div>
              <span className="text-green-400 text-sm font-medium">{insights.empathetic}%</span>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-light text-white mb-1">{insights.reflectionDepth}</div>
          <div className="text-white/60 text-xs uppercase tracking-wide">Reflection Depth Score</div>
        </div>
      </>
    ) : (
      <div className="text-center py-8">
        <Brain className="w-12 h-12 text-white/40 mx-auto mb-4" />
        <p className="text-white/60 text-sm">Complete your personality assessment to see insights</p>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('questions');
          }}
          className="mt-3 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
        >
          Take Assessment
        </button>
      </div>
    )}
    
    <div className="bg-white/5 rounded-lg p-3 mb-3">
      <div className="flex items-start space-x-2">
        <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
        <p className="text-white/90 text-sm italic">
          {insights 
            ? "Your personality insights help personalize your wellness journey."
            : "Understanding your personality helps us provide better support."
          }
        </p>
      </div>
    </div>
  </div>
);

const GoalCard = ({ title, current, target, color }: {
  title: string;
  current: number;
  target: number;
  color: string;
}) => {
  const percentage = Math.min((current / target) * 100, 100);
  return (
    <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-medium text-sm">{title}</h4>
        <Target className={`w-4 h-4 text-${color}-400`} />
      </div>
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs text-white/70 mb-1">
          <span>{current}</span>
          <span>{target}</span>
        </div>
        <div className="w-full h-2 bg-white/20 rounded-full">
          <div 
            className={`h-2 bg-gradient-to-r from-${color}-400 to-${color}-500 rounded-full transition-all duration-1000`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <div className={`text-${color}-400 text-xs font-medium`}>
        {percentage.toFixed(0)}% Complete
      </div>
    </div>
  );
};

const WellnessDashboard: React.FC<WellnessDashboardProps> = ({ userId, onNavigate }) => {
  const [authenticatedUserId, setAuthenticatedUserId] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todaysMood, setTodaysMood] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dailyAffirmation, setDailyAffirmation] = useState<string>('');
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
        console.log('ðŸ” WellnessDashboard: Using authenticated user:', authUserId);
      } catch (error) {
        console.error('âŒ WellnessDashboard: Auth failed:', error);
        setError('Authentication failed');
      }
    };
    getUser();
  }, []);

  // Fetch real dashboard data from APIs
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (authenticatedUserId === 0) {
          return; // Wait for auth
        }
        
        // Use unified auth headers
        const headers = await getAuthHeaders();
        console.log('ðŸ” WellnessDashboard: Using unified auth for user:', authenticatedUserId);

        // Fetch comprehensive dashboard data from our new UID-based endpoint
        const [
          dashboardResponse,
          affirmationResponse,
          personalityResponse
        ] = await Promise.allSettled([
          fetch('/api/user-profile-check/dashboard?timeframe=month', { headers }),
          fetch('/api/daily-affirmation'),
          fetch('/api/personality-insights', { headers })
        ]);

        // Process dashboard stats
        let dashboardStats = null;
        if (dashboardResponse.status === 'fulfilled' && dashboardResponse.value.ok) {
          dashboardStats = await dashboardResponse.value.json();
        }

        // Process affirmation
        let affirmation = 'Welcome to your wellness journey. Every step forward is progress.';
        if (affirmationResponse.status === 'fulfilled' && affirmationResponse.value.ok) {
          const affirmationData = await affirmationResponse.value.json();
          affirmation = affirmationData.affirmation || affirmationData.text || affirmation;
        }

        // Process personality insights
        let personalityInsights = null;
        if (personalityResponse.status === 'fulfilled' && personalityResponse.value.ok) {
          personalityInsights = await personalityResponse.value.json();
        }

        // Combine all data
        const combinedData: DashboardData = {
          currentStreak: dashboardStats?.currentStreak || 0,
          aiConversations: dashboardStats?.aiConversations || dashboardStats?.totalConversations || 0,
          journalEntries: dashboardStats?.journalEntries || dashboardStats?.totalJournalEntries || 0,
          mindfulMinutes: dashboardStats?.mindfulMinutes || dashboardStats?.totalMindfulMinutes || 0,
          weeklyGoals: dashboardStats?.weeklyGoals || {
            journalEntries: { current: 0, target: 5 },
            meditation: { current: 0, target: 20 },
            aiSessions: { current: 0, target: 10 },
            moodCheckins: { current: 0, target: 7 }
          },
          personalityInsights: personalityInsights?.insights || null,
          wellnessScore: dashboardStats?.wellnessScore || null,
          goalCompletion: dashboardStats?.goalCompletion || null,
          recentChange: dashboardStats?.recentChange || null
        };

        setDashboardData(combinedData);
        setDailyAffirmation(affirmation);

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setError('Unable to load dashboard data');
        
        // Set empty state instead of mock data
        setDashboardData({
          currentStreak: 0,
          aiConversations: 0,
          journalEntries: 0,
          mindfulMinutes: 0,
          weeklyGoals: {
            journalEntries: { current: 0, target: 5 },
            meditation: { current: 0, target: 20 },
            aiSessions: { current: 0, target: 10 },
            moodCheckins: { current: 0, target: 7 }
          }
        });
        setDailyAffirmation('Welcome to your wellness journey. Start by exploring the features below.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [authenticatedUserId]);

  // Fetch current mood if exists
  useEffect(() => {
    const fetchTodaysMood = async () => {
      try {
        if (authenticatedUserId === 0) return;
        
        const headers = await getAuthHeaders();
        
        const response = await fetch('/api/mood/today', { headers });
        
        if (response.ok) {
          const moodData = await response.json();
          if (moodData.hasMoodToday && moodData.mood) {
            setTodaysMood(moodData.mood);
          }
        }
      } catch (error) {
        console.error('Failed to fetch today\'s mood:', error);
      }
    };

    fetchTodaysMood();
  }, [authenticatedUserId]);



  // Handle mood selection
  const handleMoodSelection = async (mood: string) => {
    setTodaysMood(mood);
    
    try {
      if (authenticatedUserId === 0) {
        console.error('No authenticated user for mood tracking');
        return;
      }
      
      const headers = await getAuthHeaders();
      console.log('ðŸŽ­ Saving mood with unified auth');

      await fetch('/api/mood', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mood,
          intensity: 5,
          date: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to save mood:', error);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const quickActions = [
    {
      icon: MessageCircle,
      label: "AI Chat Session",
      description: "Start a therapeutic conversation",
      color: "from-blue-500 to-purple-600",
      onClick: () => onNavigate('chat')
    },
    {
      icon: BookOpen,
      label: "Journal Entry",
      description: "Reflect on your thoughts and feelings",
      color: "from-green-500 to-teal-600",
      onClick: () => onNavigate('journal')
    },
    {
      icon: Heart,
      label: "Guided Meditation",
      description: "Find peace and mindfulness",
      color: "from-rose-500 to-pink-600",
      onClick: () => onNavigate('meditation')
    },
    {
      icon: Brain,
      label: "Personality Reflection",
      description: "Explore your inner world deeply",
      color: "from-indigo-500 to-purple-600",
      onClick: () => onNavigate('daily')
    },
    {
      icon: Star,
      label: "Stars & Studies",
      description: "Horoscopes and medical research",
      color: "from-purple-500 to-pink-600",
      onClick: () => onNavigate('stars-studies')
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900 p-6 flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-pink-400/20 to-rose-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500 via-pink-500 to-violet-500 flex items-center justify-center animate-spin" style={{animationDuration: '2s'}}>
            <Brain className="w-12 h-12 text-white animate-pulse" />
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-pink-400 to-violet-400 bg-clip-text text-transparent mb-4">
            ðŸŽ† Loading Your Wellness Universe ðŸŽ†
          </h2>
          <p className="text-cyan-200 text-lg font-medium">
            ðŸ’« Gathering your latest cosmic progress... ðŸŒŒ
          </p>
          <div className="flex justify-center space-x-2 mt-6">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            <div className="w-3 h-3 bg-violet-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900 p-6 flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-red-400/20 to-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-pink-400/20 to-rose-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center animate-bounce">
            <Brain className="w-12 h-12 text-white animate-pulse" />
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-pink-400 to-violet-400 bg-clip-text text-transparent mb-4">
            ðŸŽ† Welcome to Chakrai Universe! ðŸŽ†
          </h2>
          <p className="text-cyan-200 text-lg font-medium mb-6">
            ðŸš€ Ready to start your wellness journey? ðŸŒˆ
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-gradient-to-r from-cyan-600 via-pink-600 to-violet-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/25 transition-all duration-500 transform hover:scale-110 hover:-translate-y-1"
          >
            ðŸŽ¯ Launch Dashboard ðŸš€
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to Chakrai</h2>
          <p className="text-blue-200">Your wellness dashboard is being prepared...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900 relative overflow-hidden wellness-dashboard">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-rose-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-violet-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 right-1/4 w-64 h-64 bg-gradient-to-r from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '3s'}}></div>
      </div>
      
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-pink-400 to-violet-400 bg-clip-text text-transparent mb-4 animate-pulse">
            {getGreeting()}, Welcome Back! ðŸŒŸ
          </h1>
          <p className="text-cyan-200 text-xl font-medium">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <div className="flex justify-center items-center mt-4 space-x-2">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-3 h-3 bg-violet-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>

        {/* Daily Affirmation */}
        <div className="mb-8">
          <div className="relative p-8 rounded-3xl bg-gradient-to-r from-cyan-500/30 via-pink-500/30 to-violet-500/30 backdrop-blur-xl border-2 border-white/40 shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-pink-400/20 to-violet-400/20 animate-pulse"></div>
            
            {/* Floating particles */}
            <div className="absolute top-6 right-6 text-yellow-300 animate-bounce">
              <Star className="w-8 h-8" fill="currentColor" />
            </div>
            <div className="absolute top-12 left-8 text-pink-300 animate-pulse">
              <Heart className="w-6 h-6" fill="currentColor" />
            </div>
            <div className="absolute bottom-8 right-12 text-cyan-300 animate-spin" style={{animationDuration: '3s'}}>
              <Zap className="w-6 h-6" />
            </div>
            
            <div className="relative z-10 text-center">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center justify-center">
                <Star className="w-8 h-8 mr-3 text-yellow-400 animate-pulse" fill="currentColor" />
                ðŸŽ† Today's Power Affirmation ðŸŽ†
                <Star className="w-8 h-8 ml-3 text-yellow-400 animate-pulse" fill="currentColor" />
              </h2>
              <blockquote className="text-2xl text-white font-bold leading-relaxed max-w-4xl mx-auto mb-6">
                "ðŸ’« {dailyAffirmation} ðŸ’«"
              </blockquote>
              <div className="flex justify-center space-x-2 mb-4">
                <div className="w-6 h-1 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-full animate-pulse"></div>
                <div className="w-6 h-1 bg-gradient-to-r from-pink-400 to-violet-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <div className="w-6 h-1 bg-gradient-to-r from-violet-400 to-cyan-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview - Using Real Data Only */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Flame}
            label="Current Streak"
            value={dashboardData.currentStreak > 0 ? `${dashboardData.currentStreak} days` : 'Start today!'}
            {...(dashboardData.recentChange?.streak && dashboardData.recentChange.streak > 0 ? { change: `+${dashboardData.recentChange.streak} days` } : {})}
            color="from-orange-500 to-red-600"
            onClick={() => onNavigate('analytics')}
            trend="up"
          />
          <StatCard
            icon={Brain}
            label="AI Conversations"
            value={dashboardData.aiConversations}
            {...(dashboardData.recentChange?.conversations && dashboardData.recentChange.conversations > 0 ? { change: `+${dashboardData.recentChange.conversations} this week` } : {})}
            color="from-blue-500 to-purple-600"
            onClick={() => onNavigate('chat')}
            trend="up"
          />
          <StatCard
            icon={BookOpen}
            label="Journal Entries"
            value={dashboardData.journalEntries}
            {...(dashboardData.recentChange?.journalEntries && dashboardData.recentChange.journalEntries > 0 ? { change: `+${dashboardData.recentChange.journalEntries} this week` } : {})}
            color="from-green-500 to-teal-600"
            onClick={() => onNavigate('journal')}
            trend="up"
          />
          <StatCard
            icon={Heart}
            label="Mindful Minutes"
            value={dashboardData.mindfulMinutes}
            {...(dashboardData.recentChange?.mindfulMinutes && dashboardData.recentChange.mindfulMinutes > 0 ? { change: `+${dashboardData.recentChange.mindfulMinutes} today` } : {})}
            color="from-rose-500 to-pink-600"
            onClick={() => onNavigate('meditation')}
            trend="up"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          
          {/* Personality Preview - Left Side */}
          <div className="lg:col-span-2">
            <PersonalityPreview 
              onNavigate={onNavigate}
              {...(dashboardData.personalityInsights ? { insights: dashboardData.personalityInsights } : {})}
            />
          </div>

          {/* Weekly Goals - Right Side */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <Target className="w-5 h-5 mr-2 text-green-400" />
              Weekly Goals
            </h3>
            <GoalCard
              title="Journal Entries"
              current={dashboardData.weeklyGoals.journalEntries.current}
              target={dashboardData.weeklyGoals.journalEntries.target}
              color="green"
            />
            <GoalCard
              title="Meditation Minutes"
              current={dashboardData.weeklyGoals.meditation.current}
              target={dashboardData.weeklyGoals.meditation.target}
              color="purple"
            />
            <GoalCard
              title="AI Sessions"
              current={dashboardData.weeklyGoals.aiSessions.current}
              target={dashboardData.weeklyGoals.aiSessions.target}
              color="blue"
            />
            <GoalCard
              title="Mood Check-ins"
              current={dashboardData.weeklyGoals.moodCheckins.current}
              target={dashboardData.weeklyGoals.moodCheckins.target}
              color="pink"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <QuickAction
                key={index}
                icon={action.icon}
                label={action.label}
                description={action.description}
                color={action.color}
                onClick={action.onClick}
              />
            ))}
          </div>
        </div>

        {/* Today's Mood Check-in */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">How are you feeling today?</h3>
            <div className="grid grid-cols-5 gap-3 mb-4">
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
                  className={`p-4 rounded-xl text-center transition-all duration-300 ${
                    todaysMood === mood.value 
                      ? 'bg-blue-500/30 border-2 border-blue-400 scale-105' 
                      : 'bg-white/5 border border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-1">{mood.emoji}</div>
                  <div className="text-white/80 text-xs">{mood.label}</div>
                </button>
              ))}
            </div>
            {todaysMood && (
              <button 
                onClick={() => onNavigate('journal')}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
              >
                Journal About This Feeling
              </button>
            )}
          </div>

          {/* Quick Analytics Preview - Real Data Only */}
          <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Analytics</h3>
              <button 
                onClick={() => onNavigate('analytics')}
                className="text-blue-300 hover:text-blue-200 text-sm flex items-center"
              >
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {dashboardData.wellnessScore ? `${dashboardData.wellnessScore}%` : '--'}
                </div>
                <div className="text-white/70 text-sm">Wellness Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {dashboardData.personalityInsights?.reflectionDepth || '--'}
                </div>
                <div className="text-white/70 text-sm">Reflection Depth</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400 mb-1">
                  {dashboardData.goalCompletion ? `${dashboardData.goalCompletion}%` : '--'}
                </div>
                <div className="text-white/70 text-sm">Goal Completion</div>
              </div>
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
};

export default WellnessDashboard;
