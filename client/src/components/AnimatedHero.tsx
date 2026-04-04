import React, { useState, useEffect } from 'react';
import { Brain, Heart, Target, Sparkles, MessageCircle, BookOpen, Mic, BarChart3 } from 'lucide-react';

const FloatingParticle = ({ delay = 0 }) => (
  <div 
    className={`absolute w-2 h-2 bg-blue-400 rounded-full opacity-30 animate-pulse`}
    style={{
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${2 + Math.random() * 3}s`
    }}
  />
);

const AnimatedStats = () => {
  const [stats, setStats] = useState([
    { label: 'Sessions Completed', value: 0, target: 1247 },
    { label: 'Mindful Minutes', value: 0, target: 8943 },
    { label: 'Insights Generated', value: 0, target: 3456 }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => prev.map(stat => ({
        ...stat,
        value: Math.min(stat.value + Math.ceil(stat.target / 100), stat.target)
      })));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4 mt-6">
      {stats.map((stat, index) => (
        <div key={index} className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          <div className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</div>
          <div className="text-blue-200 text-sm">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

interface AnimatedHeroProps {
  onStartJourney: () => void;
  onFeatureClick: (feature: string) => void;
}

const AnimatedHero: React.FC<AnimatedHeroProps> = ({ onStartJourney, onFeatureClick }) => {
  const [currentFeature, setCurrentFeature] = useState(0);
  
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Reflection",
      description: "Deep conversations that help you understand yourself better",
      color: "from-blue-500 to-purple-600",
      action: () => onFeatureClick('chat')
    },
    {
      icon: BookOpen,
      title: "Therapeutic Journaling",
      description: "Express your thoughts and track emotional patterns",
      color: "from-green-500 to-teal-600",
      action: () => onFeatureClick('journal')
    },
    {
      icon: Mic,
      title: "Voice Interaction",
      description: "Speak naturally and hear AI responses with local voice synthesis",
      color: "from-orange-500 to-red-600",
      action: () => onFeatureClick('chat')
    },
    {
      icon: BarChart3,
      title: "Progress Analytics",
      description: "Visualize your wellness journey with detailed insights",
      color: "from-purple-500 to-pink-600",
      action: () => onFeatureClick('analytics')
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.5} />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-6xl font-bold text-white font-serif tracking-wide">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Chakrai
              </span>
            </h1>
          </div>
          
          <p className="text-2xl text-blue-200 mb-4 font-light">
            Your Personal AI Wellness Companion
          </p>
          
          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
            Experience deep self-reflection through AI-powered conversations, therapeutic journaling, 
            and personalized wellness insights. Your journey to mental clarity starts here.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onStartJourney}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-white/20 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="relative flex items-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <span>Begin Your Journey</span>
              </div>
            </button>
            
            <button
              onClick={() => onFeatureClick('journal')}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold text-lg rounded-2xl border-2 border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              Explore Features
            </button>
          </div>
        </div>

        {/* Feature Showcase */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Discover Your Potential
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = index === currentFeature;
              
              return (
                <div
                  key={index}
                  onClick={feature.action}
                  className={`relative group cursor-pointer p-6 rounded-2xl transition-all duration-500 transform hover:scale-105 ${
                    isActive 
                      ? 'bg-white/20 backdrop-blur-sm border-2 border-white/40 shadow-2xl' 
                      : 'bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:animate-pulse`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {isActive && (
                    <div className="absolute top-2 right-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-ping" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Animated Stats */}
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-white mb-6">Join Thousands on Their Wellness Journey</h3>
          <AnimatedStats />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div 
            onClick={() => onFeatureClick('meditation')}
            className="group p-6 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-2xl border border-green-400/20 hover:border-green-400/40 transition-all duration-300 cursor-pointer"
          >
            <Heart className="w-8 h-8 text-green-400 mb-4 group-hover:animate-bounce" />
            <h4 className="text-lg font-semibold text-white mb-2">Guided Meditation</h4>
            <p className="text-gray-300 text-sm">Find peace with AI-guided meditation sessions</p>
          </div>
          
          <div 
            onClick={() => onFeatureClick('memory')}
            className="group p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-400/20 hover:border-purple-400/40 transition-all duration-300 cursor-pointer"
          >
            <Target className="w-8 h-8 text-purple-400 mb-4 group-hover:animate-spin" />
            <h4 className="text-lg font-semibold text-white mb-2">Memory Insights</h4>
            <p className="text-gray-300 text-sm">See how your AI companion remembers and grows with you</p>
          </div>
          
          <div 
            onClick={() => onFeatureClick('community')}
            className="group p-6 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-300 cursor-pointer"
          >
            <MessageCircle className="w-8 h-8 text-blue-400 mb-4 group-hover:animate-pulse" />
            <h4 className="text-lg font-semibold text-white mb-2">Community Support</h4>
            <p className="text-gray-300 text-sm">Connect with others on similar wellness journeys</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedHero;
