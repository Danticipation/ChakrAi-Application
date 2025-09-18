import React, { useState } from 'react';
import { 
  Brain, BookOpen, Mic, BarChart3, Heart, Target, Users, Shield, Gift, Star, Zap
} from 'lucide-react';

interface FeatureCardProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
  badge?: string | undefined;
  isPopular?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  onClick, 
  color,
  badge,
  isPopular = false
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`relative group cursor-pointer transition-all duration-300 transform hover:scale-105 ${
        isHovered ? 'z-10' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-2 -right-2 z-20">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
            <Star className="w-3 h-3 inline mr-1" />
            Popular
          </div>
        </div>
      )}

      {/* Custom Badge */}
      {badge && !isPopular && (
        <div className="absolute -top-2 -right-2 z-20">
          <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            {badge}
          </div>
        </div>
      )}

      <div className={`relative p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 overflow-hidden ${
        isHovered 
          ? 'bg-white/25 border-white/50 shadow-2xl' 
          : 'bg-white/10 border-white/20 shadow-lg'
      }`}>
        {/* Animated Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
        
        {/* Floating Animation Effect */}
        {isHovered && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-60 animate-ping"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${20 + i * 10}%`,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Icon */}
        <div className={`relative w-16 h-16 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center mb-4 group-hover:animate-pulse`}>
          <Icon className="w-8 h-8 text-white" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-200 transition-colors duration-300">
            {title}
          </h3>
          
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            {description}
          </p>

          {/* Hover Action */}
          <div className={`flex items-center text-blue-300 font-medium transition-all duration-300 ${
            isHovered ? 'translate-x-2 opacity-100' : 'translate-x-0 opacity-70'
          }`}>
            <span>Explore</span>
            <Zap className="w-4 h-4 ml-2" />
          </div>
        </div>

        {/* Pulse Effect on Hover */}
        <div className={`absolute inset-0 border-2 border-blue-400 rounded-2xl transition-all duration-300 ${
          isHovered ? 'opacity-30 scale-105' : 'opacity-0 scale-100'
        }`} />
      </div>
    </div>
  );
};

interface FeatureCardsProps {
  onFeatureClick: (feature: string) => void;
}

const FeatureCards: React.FC<FeatureCardsProps> = ({ onFeatureClick }) => {
  const features = [
    {
      icon: Brain,
      title: "AI Therapy Chat",
      description: "Deep, meaningful conversations with your AI wellness companion that adapts to your communication style",
      onClick: () => onFeatureClick('chat'),
      color: "from-blue-500 to-purple-600",
      isPopular: true
    },
    {
      icon: BookOpen,
      title: "Smart Journaling",
      description: "AI-assisted journaling with emotional pattern analysis and personalized insights",
      onClick: () => onFeatureClick('journal'),
      color: "from-green-500 to-teal-600",
      badge: "Most Used"
    },
    {
      icon: Mic,
      title: "Voice Therapy",
      description: "Natural voice conversations with local Piper TTS and OpenAI Whisper transcription",
      onClick: () => onFeatureClick('chat'),
      color: "from-orange-500 to-red-600"
    },
    {
      icon: BarChart3,
      title: "Progress Analytics",
      description: "Visual insights into your mental wellness journey with detailed mood and progress tracking",
      onClick: () => onFeatureClick('analytics'),
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: Heart,
      title: "Mindfulness & Meditation",
      description: "Guided meditation sessions and mindfulness exercises tailored to your current emotional state",
      onClick: () => onFeatureClick('meditation'),
      color: "from-rose-500 to-pink-600"
    },
    {
      icon: Target,
      title: "Memory & Growth",
      description: "Your AI companion builds a personality mirror over time, reflecting your growth patterns",
      onClick: () => onFeatureClick('memory'),
      color: "from-indigo-500 to-blue-600"
    },
    {
      icon: Users,
      title: "Community Support",
      description: "Connect with others on similar wellness journeys through anonymous, moderated forums",
      onClick: () => onFeatureClick('community'),
      color: "from-cyan-500 to-blue-600"
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Healthcare-grade encryption and anonymous user system protecting your sensitive data",
      onClick: () => onFeatureClick('privacy'),
      color: "from-gray-500 to-slate-600",
      badge: "Secure"
    },
    {
      icon: Gift,
      title: "Wellness Rewards",
      description: "Gamified progress tracking with achievement badges and wellness streak rewards",
      onClick: () => onFeatureClick('rewards'),
      color: "from-yellow-500 to-orange-600"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">
          Comprehensive Wellness Tools
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Discover powerful features designed to support your mental health journey with cutting-edge AI technology
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            onClick={feature.onClick}
            color={feature.color}
            badge={feature.badge || undefined}
            isPopular={feature.isPopular || false}
          />
        ))}
      </div>
    </div>
  );
};

export default FeatureCards;
