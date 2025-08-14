import React, { useState, useEffect } from 'react';
import { 
  Brain, Heart, BookOpen, Target, BarChart3, Calendar, 
  Clock, TrendingUp, Star, Flame, MessageCircle, Mic,
  CheckCircle, ArrowRight, Play, Pause, Users
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface WellnessDashboardProps {
  userId: number | null;
  onNavigate: (section: string) => void;
}

const StatCard = ({ icon: Icon, label, value, change, color, onClick }: {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  change?: string;
  color: string;
  onClick?: () => void;
}) => (
  <div 
    className={`p-6 rounded-2xl backdrop-blur-sm border border-white/20 bg-white/10 hover:bg-white/15 transition-all duration-300 cursor-pointer group ${onClick ? 'hover:scale-105' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl bg-gradient-to-r ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {change && (
        <div className="flex items-center text-green-400 text-sm font-medium">
          <TrendingUp className="w-4 h-4 mr-1" />
          {change}
        </div>
      )}
    </div>
    <div className="text-2xl font-bold text-white mb-1">{value}</div>
    <div className="text-white/70 text-sm">{label}</div>
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
    className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer group hover:scale-105"
    onClick={onClick}
  >
    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${color} flex items-center justify-center mb-3 group-hover:animate-pulse`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="text-white font-semibold mb-1">{label}</h3>
    <p className="text-white/70 text-sm">{description}</p>
    <div className="flex items-center text-blue-300 text-sm mt-2 group-hover:translate-x-1 transition-transform duration-300">
      <span>Start</span>
      <ArrowRight className="w-4 h-4 ml-1" />
    </div>
  </div>
);

const WellnessDashboard: React.FC<WellnessDashboardProps> = ({ userId, onNavigate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todaysMood, setTodaysMood] = useState<string | null>(null);
  const [dailyAffirmation, setDailyAffirmation] = useState<string>('');

  // Fetch real dashboard statistics
  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await axios.get(`/api/dashboard/stats/${userId}`);
      return response.data;
    },
    enabled: !!userId,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch daily affirmation (force fresh on each page load)
  const { data: affirmationData } = useQuery({
    queryKey: ['daily-affirmation', new Date().toDateString()],
    queryFn: async () => {
      const response = await axios.get(`/api/daily-affirmation?t=${Date.now()}`);
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // Keep for 30 minutes instead of 24 hours
  });

  useEffect(() => {
    if (affirmationData?.affirmation) {
      setDailyAffirmation(affirmationData.affirmation);
    }
  }, [affirmationData]);

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
      icon: Target,
      label: "Progress Check",
      description: "Review your wellness journey",
      color: "from-indigo-500 to-blue-600",
      onClick: () => onNavigate('analytics')
    }
  ];

  // Fetch real recent activities
  const { data: recentActivities } = useQuery({
    queryKey: ['recent-activities', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await axios.get(`/api/dashboard/recent-activities/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-6 wellness-dashboard">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {getGreeting()}, Welcome Back
          </h1>
          <p className="text-blue-200 text-lg">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Daily Affirmation */}
        <div className="mb-8">
          <div className="relative p-8 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-sm border border-white/30 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10 animate-pulse"></div>
            <div className="absolute top-4 right-4 text-blue-300/30">
              <Star className="w-8 h-8" />
            </div>
            <div className="absolute bottom-4 left-4 text-purple-300/30">
              <Heart className="w-6 h-6" />
            </div>
            
            {/* Content */}
            <div className="relative z-10 text-center">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center justify-center">
                <Star className="w-6 h-6 mr-2 text-yellow-400" />
                Today's Affirmation
                <Star className="w-6 h-6 ml-2 text-yellow-400" />
              </h2>
              <blockquote className="text-xl text-white/90 font-medium italic leading-relaxed max-w-4xl mx-auto">
                "{dailyAffirmation || 'I am worthy of love, peace, and happiness. Today I choose to be kind to myself and trust in my journey.'}"
              </blockquote>
              <div className="mt-4 w-20 h-1 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Flame}
            label="Current Streak"
            value={isLoading ? "..." : `${dashboardStats?.currentStreak || 0} days`}
            change={dashboardStats?.streakChange || null}
            color="from-orange-500 to-red-600"
            onClick={() => onNavigate('analytics')}
          />
          <StatCard
            icon={Brain}
            label="AI Conversations"
            value={isLoading ? "..." : dashboardStats?.aiConversations || 0}
            change={dashboardStats?.conversationsChange || null}
            color="from-blue-500 to-purple-600"
            onClick={() => onNavigate('chat')}
          />
          <StatCard
            icon={BookOpen}
            label="Journal Entries"
            value={isLoading ? "..." : dashboardStats?.journalEntries || 0}
            change={dashboardStats?.journalChange || null}
            color="from-green-500 to-teal-600"
            onClick={() => onNavigate('journal')}
          />
          <StatCard
            icon={Heart}
            label="Mindful Minutes"
            value={isLoading ? "..." : dashboardStats?.mindfulMinutes || 0}
            change={dashboardStats?.mindfulChange || null}
            color="from-rose-500 to-pink-600"
            onClick={() => onNavigate('meditation')}
          />
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
                { emoji: "😔", label: "Sad", value: "sad" },
                { emoji: "😐", label: "Neutral", value: "neutral" },
                { emoji: "🙂", label: "Good", value: "good" },
                { emoji: "😊", label: "Happy", value: "happy" },
                { emoji: "🤩", label: "Excited", value: "excited" }
              ].map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setTodaysMood(mood.value)}
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

          {/* Recent Activity */}
          <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {(recentActivities || []).map((activity: any, index: number) => {
                const getIcon = () => {
                  switch(activity.type) {
                    case 'journal': return BookOpen;
                    case 'meditation': return Heart;
                    case 'chat': return MessageCircle;
                    default: return Target;
                  }
                };
                const Icon = getIcon();
                return (
                  <div key={activity.id || index} className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-300">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Icon className="w-4 h-4 text-blue-300" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{activity.label || activity.description}</div>
                      <div className="text-white/60 text-xs">{activity.timeAgo || 'Recently'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Daily Insights */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Today's Insight</h3>
            <Star className="w-6 h-6 text-yellow-400" />
          </div>
          <p className="text-white/90 text-lg italic mb-4">
            "Your willingness to engage in self-reflection shows remarkable emotional intelligence. 
            Each conversation and journal entry builds deeper self-awareness."
          </p>
          <button 
            onClick={() => onNavigate('memory')}
            className="text-blue-300 hover:text-blue-200 transition-colors duration-300 flex items-center text-sm"
          >
            View All Insights
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default WellnessDashboard;