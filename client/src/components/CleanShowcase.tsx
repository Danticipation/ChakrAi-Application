import React from 'react';
import { Heart, Brain, Shield, Users, BarChart3, Zap, Target, CheckCircle } from 'lucide-react';

const CleanShowcase: React.FC = () => {
  return (
    <div className="min-h-screen p-6 space-y-8 bg-gradient-to-br from-slate-50 to-slate-200">
      {/* Hero Section - Matching chakrai.ai */}
      <div className="text-center space-y-6 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-slate-800">
          Discover Your True Self with AI-Powered{' '}
          <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
            Wellness Coaching
          </span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Experience the world's most comprehensive 190-point personality analysis. 
          Get personalized insights, therapeutic recommendations, and AI-powered conversations 
          designed for your mental wellness journey.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <button className="clean-btn-primary px-8 py-4 text-lg">
            Start Free Analysis
          </button>
          <button className="clean-btn px-8 py-4 text-lg">
            Watch Demo
          </button>
        </div>
      </div>

      {/* Personality Analysis Card - Like chakrai.ai */}
      <div className="max-w-md mx-auto">
        <div className="clean-card">
          <div className="icon-circle icon-circle-blue mx-auto mb-6">
            <Brain className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 text-center mb-4">
            Your Personality Analysis
          </h3>
          <p className="text-slate-600 text-center mb-6">
            190+ psychological dimensions
          </p>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium">Emotional Intelligence</span>
              <span className="clean-badge-primary">8.3/10</span>
            </div>
            <div className="clean-progress">
              <div className="clean-progress-fill" style={{ width: '83%' }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium">Creative Problem Solving</span>
              <span className="clean-badge-success">9.1/10</span>
            </div>
            <div className="clean-progress">
              <div className="clean-progress-fill" style={{ width: '91%' }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium">Stress Resilience</span>
              <span className="clean-badge-warning">7.5/10</span>
            </div>
            <div className="clean-progress">
              <div className="clean-progress-fill" style={{ width: '75%' }}></div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-slate-50 rounded-xl">
            <p className="text-sm text-slate-600">
              <strong className="text-slate-800">Your Type:</strong> Empathetic Innovator
            </p>
            <p className="text-xs text-slate-500 mt-2">
              You excel at creative problem-solving while maintaining strong emotional awareness...
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid - Matching chakrai.ai style */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-800 text-center mb-12">
          Revolutionary Mental Wellness Technology
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Personality Analysis */}
          <div className="clean-card">
            <div className="icon-circle icon-circle-blue mb-6">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-4">
              190+ Point Personality Analysis
            </h3>
            <p className="text-slate-600 mb-4">
              The most comprehensive personality assessment available, analyzing 9 
              psychological domains with clinical-grade precision.
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Cognitive & Emotional Architecture
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Behavioral & Communication Patterns
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Values, Motivation & Coping Styles
              </div>
            </div>
          </div>

          {/* AI Conversations */}
          <div className="clean-card">
            <div className="icon-circle icon-circle-cyan mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-4">
              AI-Powered Wellness Conversations
            </h3>
            <p className="text-slate-600 mb-4">
              Engage with specialized AI coaches including CBT specialists, mindfulness 
              guides, and anxiety experts tailored to your needs.
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-blue-500 mr-2" />
                GPT-4 Powered Therapeutic Insights
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-blue-500 mr-2" />
                Semantic Memory System
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-blue-500 mr-2" />
                Crisis Detection & Support
              </div>
            </div>
          </div>

          {/* Voice Interactions */}
          <div className="clean-card">
            <div className="icon-circle icon-circle-purple mb-6">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-4">
              Natural Voice Interactions
            </h3>
            <p className="text-slate-600 mb-4">
              Experience therapeutic conversations through high-quality voice synthesis 
              with 8 distinct AI personalities optimized for mobile.
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-purple-500 mr-2" />
                ElevenLabs Voice Synthesis
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-purple-500 mr-2" />
                OpenAI Whisper Transcription
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-purple-500 mr-2" />
                Real-time Audio Monitoring
              </div>
            </div>
          </div>

          {/* Wellness Tools */}
          <div className="clean-card">
            <div className="icon-circle icon-circle-green mb-6">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-4">
              Comprehensive Wellness Tools
            </h3>
            <p className="text-slate-600 mb-4">
              AI-assisted journaling, mood tracking, and personalized therapeutic plans 
              based on your unique personality profile.
            </p>
            <div className="clean-badge-success mt-4">
              <Heart className="w-4 h-4" />
              Active Tools
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="clean-card">
            <div className="icon-circle icon-circle-green mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-4">
              Privacy-First Security
            </h3>
            <p className="text-slate-600 mb-4">
              Healthcare-grade security with end-to-end encryption, anonymous user system, 
              and HIPAA-compliant data handling.
            </p>
            <div className="clean-badge-success mt-4">
              <Shield className="w-4 h-4" />
              HIPAA Compliant
            </div>
          </div>

          {/* Professional Collaboration */}
          <div className="clean-card">
            <div className="icon-circle icon-circle-blue mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-4">
              Professional Collaboration
            </h3>
            <p className="text-slate-600 mb-4">
              Share insights with licensed therapists, generate clinical reports, 
              and integrate with existing healthcare systems.
            </p>
            <div className="clean-badge-primary mt-4">
              <BarChart3 className="w-4 h-4" />
              Clinical Reports
            </div>
          </div>
        </div>
      </div>

      {/* Input Demo */}
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 text-center">
          Professional Input System
        </h2>
        <div className="clean-card space-y-4">
          <input 
            type="text" 
            placeholder="How are you feeling today?"
            className="clean-input w-full"
          />
          <textarea 
            placeholder="Share your thoughts and reflections..."
            rows={4}
            className="clean-input w-full resize-none"
          ></textarea>
          <div className="flex justify-end">
            <button className="clean-btn-primary">
              Share Reflection
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="text-center py-12">
        <h2 className="text-4xl font-bold text-slate-800 mb-4">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            190 Points.
          </span>{' '}
          <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
            One True You.
          </span>
        </h2>
        <p className="text-xl text-slate-600">
          Discover the 190 Points That Make You, You
        </p>
      </div>
    </div>
  );
};

export default CleanShowcase;

