import React from 'react';
import { ArrowRight, CheckCircle, Brain, MessageCircle, Mic, Shield, Users, Zap } from 'lucide-react';

interface CleanHomeProps {
  onNavigate: (section: string) => void;
}

const CleanHome: React.FC<CleanHomeProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-20">
      
      {/* Hero Section */}
      <div className="relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column - Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Discover Your True
                <span className="block">
                  Self with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">AI-Powered</span>
                </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  Wellness Coaching
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Experience the world's most comprehensive 190-point personality analysis. 
                Get personalized insights, therapeutic recommendations, and AI-powered 
                conversations designed for your mental wellness journey.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => onNavigate('190-analysis')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center group"
              >
                Start Free Analysis
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={() => onNavigate('features')}
                className="border border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200"
              >
                Watch Demo
              </button>
            </div>

            <div className="flex items-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>End-to-End Encrypted</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>20k+ Users</span>
              </div>
            </div>
          </div>

          {/* Right Column - Personality Analysis Preview */}
          <div className="relative">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Your Personality Analysis</h3>
                  <p className="text-gray-600">190+ psychological dimensions</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Emotional Intelligence</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div className="w-20 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">8.3/10</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Creative Problem Solving</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div className="w-22 h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">9.1/10</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Stress Resilience</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div className="w-18 h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">7.5/10</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-800 font-medium">
                  <strong>Your Type:</strong> Empathetic Innovator
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  You excel at creative problem-solving while maintaining strong emotional awareness...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 190 Points Section */}
      <div className="text-center space-y-12">
        <div className="space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
            <span className="text-blue-600">190 Points.</span> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400"> One True You.</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the 190 Points That Make You, You
          </p>
        </div>

        <p className="text-gray-600 max-w-4xl mx-auto leading-relaxed">
          Chakrai doesn't settle for surface-level personality quizzes. Our proprietary 190-point 
          analysis engine dives across 9 domains of thought, emotion, and behavior to reveal a living, 
          evolving portrait of who you are. <strong>It's not a label — it's the most in-depth 
          self-reflection system ever built.</strong>
        </p>
      </div>

      {/* Personality Framework Grid */}
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h3 className="text-3xl font-bold text-gray-900">The Chakrai 190-Point Personality Framework</h3>
          <p className="text-lg text-blue-600 font-medium">Deeper than any personality test you've ever taken.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'Cognition',
              description: 'How you solve problems, learn, and make decisions',
              icon: '🧠',
              color: 'from-blue-500 to-blue-600'
            },
            {
              title: 'Emotion',
              description: 'Your patterns of regulation, resilience, and intensity',
              icon: '❤️',
              color: 'from-red-500 to-red-600'
            },
            {
              title: 'Communication',
              description: 'How you express yourself, listen, and connect',
              icon: '💬',
              color: 'from-green-500 to-green-600'
            },
            {
              title: 'Behavioral Habits',
              description: 'The actions you take under stress or routine',
              icon: '🔄',
              color: 'from-purple-500 to-purple-600'
            },
            {
              title: 'Interpersonal Dynamics',
              description: 'Attachment, trust, and relationship styles',
              icon: '👥',
              color: 'from-orange-500 to-orange-600'
            },
            {
              title: 'Core Traits',
              description: 'The personality signatures that define your daily life',
              icon: '⭐',
              color: 'from-pink-500 to-pink-600'
            },
            {
              title: 'Values & Beliefs',
              description: 'What drives your purpose and decisions',
              icon: '🎯',
              color: 'from-blue-500 to-purple-600'
            },
            {
              title: 'Motivation',
              description: 'The forces that push you toward growth or comfort',
              icon: '⚡',
              color: 'from-yellow-500 to-orange-600'
            },
            {
              title: 'Coping & Resilience',
              description: 'How you adapt, recover, and thrive',
              icon: '🛡️',
              color: 'from-teal-500 to-teal-600'
            }
          ].map((item, index) => (
            <div 
              key={index}
              className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-shadow duration-200"
            >
              <div className="text-center space-y-3">
                <div className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-r ${item.color} flex items-center justify-center text-2xl`}>
                  {item.icon}
                </div>
                <h4 className="text-lg font-bold text-gray-900">{item.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revolutionary Technology Section */}
      <div className="text-center space-y-12">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold text-gray-900">Revolutionary Mental Wellness Technology</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience cutting-edge AI psychology that adapts to your unique personality
            and provides personalized insights for lasting personal growth.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: '190+ Point Personality Analysis',
              description: 'The most comprehensive personality assessment available, analyzing 9 psychological domains with clinical-grade precision.',
              icon: Brain,
              features: ['Cognitive & Emotional Architecture', 'Behavioral & Communication Patterns', 'Values, Motivation & Coping Styles']
            },
            {
              title: 'AI-Powered Wellness Conversations',
              description: 'Engage with specialized AI coaches including CBT specialists, mindfulness guides, and anxiety experts tailored to your needs.',
              icon: MessageCircle,
              features: ['GPT-4 Powered Therapeutic Insights', 'Semantic Memory System', 'Crisis Detection & Support']
            },
            {
              title: 'Natural Voice Interactions',
              description: 'Experience therapeutic conversations through high-quality voice synthesis with 8 distinct AI personalities optimized for mobile.',
              icon: Mic,
              features: ['ElevenLabs Voice Synthesis', 'OpenAI Whisper Transcription', 'Real-time Audio Monitoring']
            },
            {
              title: 'Comprehensive Wellness Tools',
              description: 'AI-assisted journaling, mood tracking, and personalized therapeutic plans based on evidence-based approaches.',
              icon: Zap,
              features: ['Guided Journaling & Reflection', 'Mood Analytics & Forecasting', 'CBT, MBSR & DBT Techniques']
            },
            {
              title: 'Privacy-First Security',
              description: 'Healthcare-grade security with end-to-end encryption, anonymous user system, and HIPAA compliance for complete data protection.',
              icon: Shield,
              features: ['AES-256-GCM Encryption', 'Zero-Knowledge Architecture', 'GDPR & HIPAA Compliant']
            },
            {
              title: 'Professional Collaboration',
              description: 'Share insights with licensed therapists, generate clinical reports, and integrate with professional workflows.',
              icon: Users,
              features: ['Therapist Collaboration Portal', 'Clinical Export System', 'EHR Integration']
            }
          ].map((feature, index) => (
            <div 
              key={index}
              className="bg-white/70 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200"
            >
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h4>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>

                <div className="space-y-2">
                  {feature.features.map((item, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
        <div className="space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Ready to Discover Your True Self?
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Join thousands of users who have transformed their mental wellness journey with AI-powered insights.
          </p>
          <button 
            onClick={() => onNavigate('190-analysis')}
            className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Start Your Free Analysis
          </button>
        </div>
      </div>

    </div>
  );
};

export default CleanHome;
