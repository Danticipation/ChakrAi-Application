import React, { useState, useEffect } from 'react';
import { 
  Brain, Heart, BookOpen, Target, BarChart3, Calendar, 
  Clock, TrendingUp, Star, Flame, MessageCircle, Mic,
  CheckCircle, ArrowRight, Play, Pause, Users
} from 'lucide-react';

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
  const [currentStreak, setCurrentStreak] = useState(7);

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
      icon: Target,
      label: "Progress Check",
      description: "Review your wellness journey",
      color: "from-indigo-500 to-blue-600",
      onClick: () => onNavigate('analytics')
    }
  ];

  const recentActivities = [
    { type: "journal", label: "Journal Entry", time: "2 hours ago", icon: BookOpen },
    { type: "meditation", label: "Morning Meditation", time: "Yesterday", icon: Heart },
    { type: "chat", label: "AI Conversation", time: "2 days ago", icon: MessageCircle }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-6">
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

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Flame}
            label="Current Streak"
            value={`${currentStreak} days`}
            change="+2"
            color="from-orange-500 to-red-600"
            onClick={() => onNavigate('analytics')}
          />
          <StatCard
            icon={Brain}
            label="AI Conversations"
            value="23"
            change="+5"
            color="from-blue-500 to-purple-600"
            onClick={() => onNavigate('chat')}
          />
          <StatCard
            icon={BookOpen}
            label="Journal Entries"
            value="47"
            change="+3"
            color="from-green-500 to-teal-600"
            onClick={() => onNavigate('journal')}
          />
          <StatCard
            icon={Heart}
            label="Mindful Minutes"
            value="156"
            change="+12"
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
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-300">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Icon className="w-4 h-4 text-blue-300" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{activity.label}</div>
                      <div className="text-white/60 text-xs">{activity.time}</div>
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