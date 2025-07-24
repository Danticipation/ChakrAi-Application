import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Brain, BookOpen, Settings, BarChart3, Users, Sparkles, Mic, X, Menu } from 'lucide-react';

const chakraiLogo = './TrAI-Logo.png';

// Simplified main sections - only 6 core areas
const MAIN_SECTIONS = [
  { id: 'chat', label: 'Chat', icon: MessageCircle, color: 'from-blue-500 to-purple-600' },
  { id: 'journal', label: 'Journal', icon: BookOpen, color: 'from-green-500 to-teal-600' },
  { id: 'insights', label: 'Insights', icon: BarChart3, color: 'from-purple-500 to-pink-600' },
  { id: 'wellness', label: 'Wellness', icon: Sparkles, color: 'from-amber-500 to-orange-600' },
  { id: 'community', label: 'Community', icon: Users, color: 'from-cyan-500 to-blue-600' },
  { id: 'settings', label: 'Settings', icon: Settings, color: 'from-gray-500 to-slate-600' }
];

// Sub-features organized under main sections
const SUB_FEATURES = {
  insights: [
    { id: 'memory', label: 'Memory & Learning', description: 'See how Chakrai learns about you' },
    { id: 'analytics', label: 'Progress Analytics', description: 'Track your wellness journey' },
    { id: 'daily-reflection', label: 'Daily Reflection', description: 'Personality insights and growth' }
  ],
  wellness: [
    { id: 'challenges', label: 'Wellness Challenges', description: 'Gamified goals and achievements' },
    { id: 'rewards', label: 'Rewards & Achievements', description: 'Celebrate your progress' },
    { id: 'therapy-plans', label: 'Therapy Plans', description: 'Personalized care plans' },
    { id: 'agents', label: 'AI Specialists', description: 'Specialized therapeutic support' }
  ],
  community: [
    { id: 'support-groups', label: 'Support Groups', description: 'Connect with others' },
    { id: 'therapist-portal', label: 'Professional Care', description: 'Therapist collaboration' }
  ],
  settings: [
    { id: 'voice', label: 'Voice Settings', description: 'Choose your AI voice companion' },
    { id: 'themes', label: 'Themes', description: 'Customize your experience' },
    { id: 'privacy', label: 'Privacy & Data', description: 'Control your information' },
    { id: 'feedback', label: 'Feedback', description: 'Help us improve' }
  ]
};

interface Message {
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

const SimplifiedChakraiApp: React.FC = () => {
  const [activeSection, setActiveSection] = useState('chat');
  const [activeSubFeature, setActiveSubFeature] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Close mobile menu when section changes
  useEffect(() => {
    setShowMobileMenu(false);
    setActiveSubFeature(null);
  }, [activeSection]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      sender: 'user',
      text: input,
      time: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const botMessage: Message = {
        sender: 'bot',
        text: "I'm here to support your wellness journey. How are you feeling today?",
        time: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
    }, 1500);
  };

  const renderMainContent = () => {
    if (activeSubFeature) {
      return (
        <div className="h-full bg-gradient-to-br from-gray-900 to-black p-6">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setActiveSubFeature(null)}
              className="mb-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              ← Back to {MAIN_SECTIONS.find(s => s.id === activeSection)?.label}
            </button>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4 capitalize">
                {activeSubFeature.replace('-', ' ')}
              </h2>
              <p className="text-gray-300 mb-6">
                {SUB_FEATURES[activeSection as keyof typeof SUB_FEATURES]?.find(f => f.id === activeSubFeature)?.description}
              </p>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🚧</div>
                <p className="text-gray-400">Feature in development</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case 'chat':
        return (
          <div className="h-full flex flex-col bg-gradient-to-br from-blue-900 to-purple-900">
            {/* Chat Header */}
            <div className="flex-shrink-0 p-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
              <div className="flex items-center gap-3">
                <img src={chakraiLogo} alt="Chakrai" className="h-10 w-10 rounded-full" />
                <div>
                  <h1 className="text-white font-semibold">Chat with Chakrai</h1>
                  <p className="text-white/60 text-sm">Your AI wellness companion</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💭</div>
                    <h3 className="text-white text-xl font-semibold mb-2">Start Your Wellness Journey</h3>
                    <p className="text-white/60">Share what's on your mind. I'm here to listen and support you.</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-white border border-white/10'
                    }`}>
                      <p>{message.text}</p>
                      <p className="text-xs opacity-60 mt-2">{message.time}</p>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <span className="text-white/60 text-sm ml-2">Chakrai is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-4 bg-black/20 backdrop-blur-sm border-t border-white/10">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Share your thoughts..."
                  className="flex-1 bg-gray-800 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                />
                <button
                  className="bg-gray-800 hover:bg-gray-700 border border-white/20 rounded-xl px-4 py-3 text-white transition-colors"
                >
                  <Mic size={20} />
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl px-6 py-3 text-white font-medium transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        );

      case 'journal':
        return (
          <div className="h-full bg-gradient-to-br from-green-900 to-teal-900 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6">Therapeutic Journal</h2>
                <textarea
                  placeholder="Express your thoughts and feelings..."
                  className="w-full h-64 bg-gray-800 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 resize-none focus:outline-none focus:border-green-400"
                />
                <div className="flex justify-between items-center mt-4">
                  <p className="text-white/60 text-sm">Your thoughts are private and secure</p>
                  <button className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg text-white font-medium transition-colors">
                    Save Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'insights':
      case 'wellness':
      case 'community':
        const currentSection = MAIN_SECTIONS.find(s => s.id === activeSection);
        const features = SUB_FEATURES[activeSection as keyof typeof SUB_FEATURES] || [];

        return (
          <div className={`h-full bg-gradient-to-br ${currentSection?.color || 'from-gray-900 to-black'} p-6`}>
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  {currentSection && <currentSection.icon size={28} />}
                  {currentSection?.label}
                </h2>
                <div className="grid gap-4">
                  {features.map((feature) => (
                    <button
                      key={feature.id}
                      onClick={() => setActiveSubFeature(feature.id)}
                      className="bg-gray-700/50 hover:bg-gray-600/50 border border-white/10 rounded-xl p-6 text-left transition-colors group"
                    >
                      <h3 className="text-white font-semibold mb-2 group-hover:text-blue-300 transition-colors">
                        {feature.label}
                      </h3>
                      <p className="text-white/60 text-sm">{feature.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        const settingsFeatures = SUB_FEATURES.settings || [];

        return (
          <div className="h-full bg-gradient-to-br from-gray-900 to-black p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Settings size={28} />
                  Settings
                </h2>
                <div className="grid gap-4">
                  {settingsFeatures.map((feature) => (
                    <button
                      key={feature.id}
                      onClick={() => setActiveSubFeature(feature.id)}
                      className="bg-gray-700/50 hover:bg-gray-600/50 border border-white/10 rounded-xl p-6 text-left transition-colors group"
                    >
                      <h3 className="text-white font-semibold mb-2 group-hover:text-blue-300 transition-colors">
                        {feature.label}
                      </h3>
                      <p className="text-white/60 text-sm">{feature.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🚧</div>
              <p className="text-white/60">Feature coming soon...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src={chakraiLogo} alt="Chakrai" className="h-8 w-8 rounded-full" />
          <span className="text-white font-semibold">Chakrai</span>
        </div>
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="text-white p-2"
        >
          {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex w-64 bg-black/50 backdrop-blur-sm border-r border-white/10 flex-col">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img src={chakraiLogo} alt="Chakrai" className="h-10 w-10 rounded-full" />
              <div>
                <h1 className="text-white font-bold">Chakrai</h1>
                <p className="text-white/60 text-sm">Mental Wellness</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {MAIN_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    activeSection === section.id
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <section.icon size={20} />
                  {section.label}
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden absolute inset-0 bg-black/90 backdrop-blur-sm z-50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-8">
                <span className="text-white font-semibold">Menu</span>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="text-white p-2"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                {MAIN_SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-colors ${
                      activeSection === section.id
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <section.icon size={24} />
                    <span className="text-lg">{section.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {renderMainContent()}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden bg-black/50 backdrop-blur-sm border-t border-white/10">
        <div className="grid grid-cols-4 gap-1 p-2">
          {MAIN_SECTIONS.slice(0, 4).map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-colors ${
                activeSection === section.id
                  ? 'text-white bg-white/10'
                  : 'text-white/60'
              }`}
            >
              <section.icon size={20} />
              <span className="text-xs">{section.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimplifiedChakraiApp;