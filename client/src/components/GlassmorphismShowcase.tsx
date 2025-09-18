import React from 'react';
import { Heart, Star, Sparkles, Brain, Zap, Shield } from 'lucide-react';

const GlassmorphismShowcase: React.FC = () => {
  return (
    <div className="min-h-screen p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white font-luxury">
          âœ¨ Chakrai Glassmorphism Showcase
        </h1>
        <p className="text-white/70 text-lg">
          Experience the soft, clean, glass feel
        </p>
      </div>

      {/* Glass Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-card glass-shimmer">
          <div className="flex items-center space-x-3 mb-4">
            <Heart className="w-6 h-6 text-pink-400" />
            <h3 className="text-lg font-semibold text-white">Wellness</h3>
          </div>
          <p className="text-white/70">
            Track your mental wellness journey with beautiful glass interfaces
          </p>
          <div className="mt-4">
            <div className="glass-progress">
              <div className="glass-progress-fill" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>

        <div className="glass-card-strong glass-shimmer">
          <div className="flex items-center space-x-3 mb-4">
            <Brain className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">AI Insights</h3>
          </div>
          <p className="text-white/70">
            Get personalized insights through advanced AI analysis
          </p>
          <div className="mt-4 flex space-x-2">
            <div className="glass-badge-success">
              <Star className="w-4 h-4" />
              Active
            </div>
          </div>
        </div>

        <div className="glass-card-subtle glass-shimmer">
          <div className="flex items-center space-x-3 mb-4">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Meditation</h3>
          </div>
          <p className="text-white/70">
            Find inner peace with guided meditation sessions
          </p>
          <div className="mt-4">
            <div className="glass-badge-warning">
              <Zap className="w-4 h-4" />
              In Progress
            </div>
          </div>
        </div>
      </div>

      {/* Glass Buttons */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white text-center">Glass Button System</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <button className="glass-btn-primary glass-shimmer">
            <Shield className="w-5 h-5 mr-2" />
            Primary Action
          </button>
          <button className="glass-btn-success glass-shimmer">
            <Heart className="w-5 h-5 mr-2" />
            Success Action
          </button>
          <button className="glass-btn-purple glass-shimmer">
            <Sparkles className="w-5 h-5 mr-2" />
            Purple Magic
          </button>
        </div>
      </div>

      {/* Glass Input Demo */}
      <div className="max-w-md mx-auto space-y-4">
        <h2 className="text-2xl font-bold text-white text-center">Glass Input System</h2>
        <div className="space-y-3">
          <input 
            type="text" 
            placeholder="Type your thoughts here..."
            className="glass-input w-full"
          />
          <textarea 
            placeholder="Share your wellness journey..."
            className="glass-textarea w-full"
          ></textarea>
        </div>
      </div>

      {/* Glass Chat Demo */}
      <div className="max-w-2xl mx-auto space-y-4">
        <h2 className="text-2xl font-bold text-white text-center">Glass Chat System</h2>
        <div className="space-y-4">
          <div className="glass-chat-user">
            <p className="text-white">Hello Chakrai! How can you help me today?</p>
          </div>
          <div className="glass-chat-assistant">
            <p className="text-white/90">
              Hello! I'm here to support your wellness journey. I can help you with meditation, 
              journaling, mood tracking, and personalized insights. What would you like to explore?
            </p>
          </div>
        </div>
      </div>

      {/* Wellness Color Variants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card glass-wellness">
          <h3 className="text-green-400 font-semibold mb-2">Wellness</h3>
          <p className="text-white/70 text-sm">Health & vitality tracking</p>
        </div>
        
        <div className="glass-card glass-meditation">
          <h3 className="text-purple-400 font-semibold mb-2">Meditation</h3>
          <p className="text-white/70 text-sm">Mindfulness & inner peace</p>
        </div>
        
        <div className="glass-card glass-journal">
          <h3 className="text-yellow-400 font-semibold mb-2">Journal</h3>
          <p className="text-white/70 text-sm">Thoughts & reflections</p>
        </div>
        
        <div className="glass-card glass-analytics">
          <h3 className="text-blue-400 font-semibold mb-2">Analytics</h3>
          <p className="text-white/70 text-sm">Insights & progress</p>
        </div>
      </div>

      {/* Loading Demo */}
      <div className="text-center">
        <div className="glass-loading inline-block">
          <p className="text-white/70">Loading your wellness data...</p>
        </div>
      </div>
    </div>
  );
};

export default GlassmorphismShowcase;

