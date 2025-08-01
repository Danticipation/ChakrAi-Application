import React, { useState, useEffect, useRef } from 'react';
import NeonCursor from '@/components/neon-cursor';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Brain, BookOpen, Mic, User, Square, Send, Target, RotateCcw, Sun, Star, Heart, BarChart3, Gift, Headphones, Shield, X, Palette, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useTheme, ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SubscriptionProvider, useSubscription } from '@/contexts/SubscriptionContext';
// import { SubscriptionModal } from '@/components/SubscriptionModal';
// import { UsageLimitModal } from '@/components/UsageLimitModal';
import MemoryDashboard from '@/components/MemoryDashboard';
import VoiceSelector from '@/components/VoiceSelector';
import ThemeSelector from '@/components/ThemeSelector';
// import AuthModal from '@/components/AuthModal';

import PersonalityQuiz from '@/components/PersonalityQuiz';
import VoluntaryQuestionDeck from '@/components/VoluntaryQuestionDeck';
import FeedbackSystem from '@/components/FeedbackSystem';
import TherapeuticJournal from '@/components/TherapeuticJournal';
import PersonalityReflection from '@/components/PersonalityReflection';
import MicrophoneTest from '@/components/MicrophoneTest';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import WellnessRewards from '@/components/WellnessRewards';
import CommunitySupport from '@/components/CommunitySupport';
import AdaptiveLearning from '@/components/AdaptiveLearning';
import AdaptiveTherapyPlan from '@/components/AdaptiveTherapyPlan';
import AgentSystem from '@/components/AgentSystem';
import VRTherapy from '@/components/VRTherapy';
import HealthIntegration from '@/components/HealthIntegration';
import PrivacyCompliance from '@/components/PrivacyCompliance';
import TherapistPortal from '@/components/TherapistPortal';
import AiPerformanceMonitoringDashboard from '@/components/AiPerformanceMonitoringDashboard';
import Horoscope from '@/components/Horoscope';
import DailyAffirmation from '@/components/DailyAffirmation';
import FloatingChat from '@/components/FloatingChat';
import MovableChat from '@/components/MovableChat';
import ChallengeSystem from '@/components/ChallengeSystem';
import SupabaseSetup from '@/components/SupabaseSetup';
import { startRecording as startAudioRecording, stopRecording, sendAudioToWhisper } from '@/utils/audio';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const chakraiLogo = './TrAI-Logo.png';

// Error Boundary for robust error handling
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Layout ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-red-400 p-4">Something went wrong. Please try again later.</div>;
    }
    return this.props.children;
  }
}

const AppLayout: React.FC = () => {
  const { currentTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('home');
  const [selectedVoice, setSelectedVoice] = useState('james');
  
  // Chat functionality
  const [chatInput, setChatInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Array<{sender: 'user' | 'bot', text: string, time: string}>>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice recording functions
  const handleStartRecording = async () => {
    await startAudioRecording(mediaRecorderRef, audioChunksRef, setIsRecording, setChatInput);
  };

  const handleStopRecording = () => {
    stopRecording(mediaRecorderRef, setIsRecording);
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  // Device fingerprint generation
  const generateDeviceFingerprint = () => {
    const stored = localStorage.getItem('chakrai_device_fingerprint');
    if (stored) return stored;
    
    const fingerprint = `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem('chakrai_device_fingerprint', fingerprint);
    return fingerprint;
  };

  const generateSessionId = () => {
    const stored = sessionStorage.getItem('chakrai_session_id');
    if (stored) return stored;
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem('chakrai_session_id', sessionId);
    return sessionId;
  };

  // Send message functionality
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = {
      sender: 'user' as const,
      text: chatInput,
      time: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Send to AI API with device fingerprint headers and voice parameter
    try {
      const deviceFingerprint = generateDeviceFingerprint();
      const sessionId = generateSessionId();
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Fingerprint': deviceFingerprint,
          'X-Session-Id': sessionId
        },
        body: JSON.stringify({
          message: chatInput,
          voice: selectedVoice // Use the selected voice from state
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Main Chat API response:', data);
        console.log('🔍 Main Chat - audioUrl exists:', !!data.audioUrl);
        console.log('🔍 Main Chat - audioUrl length:', data.audioUrl?.length);
        console.log('🔍 Main Chat - response keys:', Object.keys(data));
        
        // Clear input first
        setChatInput('');
        
        const botMessage = {
          sender: 'bot' as const,
          text: data.message || data.response || data.text || 'I received your message.',
          time: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, botMessage]);
        
        // Play audio if available
        if (data.audioUrl) {
          console.log('🔊 Main Chat - Playing audio response...');
          try {
            // Convert base64 to audio blob and play
            const binaryString = atob(data.audioUrl);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play().catch(error => {
              console.error('Audio playback failed:', error);
            });
          } catch (audioError) {
            console.error('Audio processing failed:', audioError);
          }
        } else {
          console.log('🔇 Main Chat - No audio in response');
        }
      } else {
        console.error('Chat API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        sender: 'bot' as const,
        text: 'Sorry, I had trouble processing your message. Please try again.',
        time: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  const [showSettings, setShowSettings] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showMovableChat, setShowMovableChat] = useState(false);
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);
  
  // Collapsible sidebar state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    core: false,
    mirrors: false,
    guided: false,
    healthcare: true, // Start collapsed
    community: true, // Start collapsed
    settings: true,  // Start collapsed
  });

  // Component rendering function
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'home':
        return (
          <div className="p-6 space-y-6 max-h-full overflow-y-auto">
            <div className="text-center space-y-4 mb-8">
              <h1 className="text-4xl font-bold theme-text font-serif tracking-wide">
                Welcome to <span className="font-samarkan">Chakrai</span>
              </h1>
              <p className="theme-text-secondary text-xl font-light max-w-2xl mx-auto leading-relaxed">
                Your Personal AI Wellness Companion
              </p>
              <p className="theme-text text-lg max-w-3xl mx-auto leading-relaxed font-light opacity-90">
                Connect with your inner wisdom through AI-powered reflection and growth. Click "Chat with Chakrai" to begin your wellness journey.
              </p>
            </div>
            <div className="flex justify-center mb-8">
              <button
                onClick={() => setActiveSection('chat')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-white/20"
              >
                🧘 Start Your Reflection Journey
              </button>
            </div>
          </div>
        );
      case 'questions':
        return <VoluntaryQuestionDeck />;
      case 'journal':
        return <TherapeuticJournal userId={currentUserId} onEntryCreated={() => {}} />;
      case 'memory':
        return <MemoryDashboard />;
      case 'adaptive':
        return <AdaptiveLearning />;
      case 'analytics':
        return <AnalyticsDashboard userId={currentUserId} onNavigate={setActiveSection} />;
      case 'health':
        return <HealthIntegration />;
      case 'challenges':
        return <ChallengeSystem />;
      case 'rewards':
        return <WellnessRewards />;
      case 'community':
        return <CommunitySupport currentUser={{ id: currentUserId || 1, name: 'User', isAuthenticated: true }} />;
      case 'agents':
        return <AgentSystem userId={currentUserId || 1} />;
      case 'vr':
        return <VRTherapy />;
      case 'therapy-plans':
        return <AdaptiveTherapyPlan userId={currentUserId || 1} onPlanUpdate={() => {}} />;
      case 'daily':
        return <PersonalityReflection userId={currentUserId || undefined} />;
      case 'feedback':
        return <FeedbackSystem />;
      case 'microphone-test':
        return <MicrophoneTest />;
      case 'privacy':
        return <PrivacyCompliance />;
      case 'supabase-setup':
        return <SupabaseSetup />;
      case 'ai-monitoring':
        return <AiPerformanceMonitoringDashboard />;
      case 'therapist':
        return <TherapistPortal />;
      case 'horoscope':
        return <Horoscope />;
      case 'affirmation':
        return <DailyAffirmation />;
      case 'chat':
        return (
          <div className="h-full flex flex-col relative overflow-hidden">
            {/* AI Companion Header */}
            <div className="flex-shrink-0 theme-card border-b border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                      <Brain className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold theme-text font-serif">
                      <span className="font-samarkan">Chakrai</span>
                    </h2>
                    <p className="theme-text-secondary text-sm">Your AI Wellness Companion</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSection('home')}
                  className="p-2 theme-text-secondary hover:theme-text rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Chat Messages Area */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {/* Welcome Message */}
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div className="theme-card max-w-2xl p-4 rounded-2xl rounded-tl-sm shadow-lg">
                    <p className="theme-text leading-relaxed">
                      🌟 Welcome to your reflection journey! I'm Chakrai, your personal AI wellness companion. 
                      I'm here to support your mental wellness through thoughtful conversation, insights, and guidance.
                    </p>
                    <p className="theme-text leading-relaxed mt-3">
                      How are you feeling today? What's on your mind? I'm here to listen and help you explore your thoughts and emotions.
                    </p>
                  </div>
                </div>
                
                {/* Chat Messages */}
                {messages.map((message, index) => (
                  <div key={index} className={`flex items-start space-x-3 ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === 'user' 
                        ? 'bg-gradient-to-br from-green-500 to-blue-500' 
                        : 'bg-gradient-to-br from-blue-500 to-purple-600'
                    }`}>
                      {message.sender === 'user' ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Brain className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className={`theme-card max-w-2xl p-4 rounded-2xl shadow-lg ${
                      message.sender === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'
                    }`}>
                      <p className="theme-text leading-relaxed">{message.text}</p>
                      <p className="theme-text-secondary text-xs mt-2">{message.time}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Area */}
              <div className="flex-shrink-0 theme-card border-t border-white/10 p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-end space-x-4">
                    <div className="flex-1">
                      <div className="relative">
                        <textarea
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Share your thoughts, feelings, or ask me anything..."
                          className="w-full theme-input resize-none rounded-2xl pl-4 pr-12 py-4 min-h-[60px] max-h-32 focus:ring-2 focus:ring-blue-500/50 transition-all"
                          rows={2}
                        />
                        <button 
                          onClick={handleSendMessage}
                          disabled={!chatInput.trim()}
                          className="absolute right-3 bottom-3 p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                        {isRecording && (
                          <div className="absolute top-2 left-3 flex items-center space-x-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            <span>Recording...</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={handleVoiceToggle}
                      className={`p-3 rounded-full transition-colors ${
                        isRecording 
                          ? 'bg-red-500 text-white animate-pulse' 
                          : 'theme-text-secondary hover:theme-text'
                      }`}
                    >
                      <Mic className="w-6 h-6" />
                    </button>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button className="px-4 py-2 theme-card-hover rounded-full text-sm theme-text-secondary hover:theme-text transition-colors border border-white/10">
                      💭 How am I feeling today?
                    </button>
                    <button className="px-4 py-2 theme-card-hover rounded-full text-sm theme-text-secondary hover:theme-text transition-colors border border-white/10">
                      🎯 Set a wellness goal
                    </button>
                    <button className="px-4 py-2 theme-card-hover rounded-full text-sm theme-text-secondary hover:theme-text transition-colors border border-white/10">
                      📝 Journal my thoughts
                    </button>
                    <button className="px-4 py-2 theme-card-hover rounded-full text-sm theme-text-secondary hover:theme-text transition-colors border border-white/10">
                      🧘 Guided meditation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-6 space-y-6 max-h-full overflow-y-auto">
            <div className="text-center space-y-4 mb-8">
              <h1 className="text-4xl font-bold theme-text font-serif tracking-wide">
                Welcome to <span className="font-samarkan">Chakrai</span>
              </h1>
              <p className="theme-text-secondary text-xl font-light max-w-2xl mx-auto leading-relaxed">
                Your Personal AI Wellness Companion
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen theme-background flex flex-col">
      {/* Sparkling Stars Background */}
      <div className="stars-background">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="star"></div>
        ))}
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="flex">
          {/* Collapsible Sidebar */}
          <div className="w-72 fixed left-0 top-0 h-full theme-card border-r border-white/10 z-10 overflow-y-auto">
            <div className="p-3">
              
              {/* Chakrai Logo */}
              <div className="flex items-center justify-center mb-6 p-4">
                <img src={chakraiLogo} alt="Chakrai" className="h-12 w-auto" />
                <span className="ml-3 text-2xl font-bold text-blue-400">Chakrai</span>
              </div>
              
              {/* Core Companion Section - Collapsible */}
              <div className="mb-2">
                <button
                  onClick={() => setCollapsedSections(prev => ({ ...prev, core: !prev.core }))}
                  className="w-full flex items-center justify-between theme-text-secondary text-xs font-medium px-3 py-2 hover:theme-text transition-colors rounded-lg mb-1"
                >
                  <span>🟦 Core Companion</span>
                  {collapsedSections.core ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </button>
                {!collapsedSections.core && (
                  <div className="space-y-1">
                    {[
                      { id: 'home', label: 'Home' },
                      { id: 'chat', label: 'Chat with Chakrai' },
                      { id: 'challenges', label: 'Reflection Goals' },
                      { id: 'rewards', label: 'Reflection Rewards' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveSection(tab.id);
                          setIsFloatingChatOpen(false);
                        }}
                        className={`w-full h-9 px-3 text-xs font-medium transition-all rounded text-left ${
                          activeSection === tab.id
                            ? 'bg-blue-500/20 border border-blue-500/30 theme-text'
                            : 'theme-text hover:bg-white/5'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mirrors of You Section - Collapsible */}
              <div className="mb-2 border-t border-white/10 pt-2">
                <button
                  onClick={() => setCollapsedSections(prev => ({ ...prev, mirrors: !prev.mirrors }))}
                  className="w-full flex items-center justify-between theme-text-secondary text-xs font-medium px-3 py-2 hover:theme-text transition-colors rounded-lg mb-1"
                >
                  <span>💠 Mirrors of You</span>
                  {collapsedSections.mirrors ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </button>
                {!collapsedSections.mirrors && (
                  <div className="space-y-1">
                    {[
                      { id: 'questions', label: 'Get to Know Me' },
                      { id: 'journal', label: 'Journal' },
                      { id: 'daily', label: 'Reflection' },
                      { id: 'memory', label: 'Insight Vault' },
                      { id: 'adaptive', label: 'Mind Mirror' },
                      { id: 'analytics', label: 'State of Self' },
                      { id: 'health', label: 'Somatic Mirror' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id)}
                        className={`w-full h-9 px-3 text-xs font-medium transition-all rounded text-left ${
                          activeSection === tab.id
                            ? 'bg-blue-500/20 border border-blue-500/30 theme-text'
                            : 'theme-text hover:bg-white/5'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Guided Support Section - Collapsible */}
              <div className="mb-2 border-t border-white/10 pt-2">
                <button
                  onClick={() => setCollapsedSections(prev => ({ ...prev, guided: !prev.guided }))}
                  className="w-full flex items-center justify-between theme-text-secondary text-xs font-medium px-3 py-2 hover:theme-text transition-colors rounded-lg mb-1"
                >
                  <span>🧘 Guided Support</span>
                  {collapsedSections.guided ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </button>
                {!collapsedSections.guided && (
                  <div className="space-y-1">
                    {[
                      { id: 'agents', label: 'Reflective Allies' },
                      { id: 'vr', label: 'InnerScape' },
                      { id: 'therapy-plans', label: 'Therapy Plans' },
                      { id: 'community', label: 'Community' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id)}
                        className={`w-full h-9 px-3 text-xs font-medium transition-all rounded text-left ${
                          activeSection === tab.id
                            ? 'bg-blue-500/20 border border-blue-500/30 theme-text'
                            : 'theme-text hover:bg-white/5'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Healthcare Section - Starts Collapsed */}
              <div className="mb-2 border-t border-white/10 pt-2">
                <button
                  onClick={() => setCollapsedSections(prev => ({ ...prev, healthcare: !prev.healthcare }))}
                  className="w-full flex items-center justify-between theme-text-secondary text-xs font-medium px-3 py-2 hover:theme-text transition-colors rounded-lg mb-1"
                >
                  <span>🏥 Healthcare</span>
                  {collapsedSections.healthcare ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </button>
                {!collapsedSections.healthcare && (
                  <div className="space-y-1">
                    {[
                      { id: 'health', label: 'Health Integration' },
                      { id: 'ai-monitoring', label: 'AI Monitoring' },
                      { id: 'therapist', label: 'Therapist Portal' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id)}
                        className={`w-full h-9 px-3 text-xs font-medium transition-all rounded text-left ${
                          activeSection === tab.id
                            ? 'bg-blue-500/20 border border-blue-500/30 theme-text'
                            : 'theme-text hover:bg-white/5'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Community Section - Starts Collapsed */}
              <div className="mb-2 border-t border-white/10 pt-2">
                <button
                  onClick={() => setCollapsedSections(prev => ({ ...prev, community: !prev.community }))}
                  className="w-full flex items-center justify-between theme-text-secondary text-xs font-medium px-3 py-2 hover:theme-text transition-colors rounded-lg mb-1"
                >
                  <span>🏘️ Community</span>
                  {collapsedSections.community ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </button>
                {!collapsedSections.community && (
                  <div className="space-y-1">
                    {[
                      { id: 'community', label: 'Community Support' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id)}
                        className={`w-full h-9 px-3 text-xs font-medium transition-all rounded text-left ${
                          activeSection === tab.id
                            ? 'bg-blue-500/20 border border-blue-500/30 theme-text'
                            : 'theme-text hover:bg-white/5'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Settings & Tools Section - Starts Collapsed */}
              <div className="mb-2 border-t border-white/10 pt-2">
                <button
                  onClick={() => setCollapsedSections(prev => ({ ...prev, settings: !prev.settings }))}
                  className="w-full flex items-center justify-between theme-text-secondary text-xs font-medium px-3 py-2 hover:theme-text transition-colors rounded-lg mb-1"
                >
                  <span>⚙️ Settings & Tools</span>
                  {collapsedSections.settings ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </button>
                {!collapsedSections.settings && (
                  <div className="space-y-1">
                    {[
                      { id: 'voice', label: 'Voice Settings' },
                      { id: 'themes', label: 'Themes' },
                      { id: 'feedback', label: 'Feedback' },
                      { id: 'microphone-test', label: 'Mic Test' },
                      { id: 'supabase-setup', label: 'Community Setup' },
                      { id: 'privacy', label: 'Privacy' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          if (tab.id === 'themes') {
                            setShowThemeModal(true);
                          } else if (tab.id === 'voice') {
                            setShowSettings(true);
                          } else {
                            setActiveSection(tab.id);
                          }
                        }}
                        className={`w-full h-9 px-3 text-xs font-medium transition-all rounded text-left ${
                          activeSection === tab.id
                            ? 'bg-blue-500/20 border border-blue-500/30 theme-text'
                            : 'theme-text hover:bg-white/5'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Section Status Indicator */}
              <div className="mt-4 pt-2 border-t border-white/10">
                <div className="text-xs theme-text-secondary text-center opacity-60">
                  {Object.values(collapsedSections).filter(collapsed => !collapsed).length} of 6 sections expanded
                </div>
              </div>
              
            </div>
          </div>

          {/* Main Content Area */}
          <div className="ml-72 flex-1 min-h-screen">
            <div className="theme-card backdrop-blur-sm rounded-xl p-6 border border-[var(--theme-accent)]/30 shadow-lg m-6">
              <h2 className="text-2xl font-bold theme-text text-center mb-4">
                Chakrai Mental Wellness Platform
              </h2>
            </div>
            
            <div className="p-6">
              <ErrorBoundary>
                {renderActiveSection()}
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Simplified */}
      <div className="block lg:hidden">
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-6">
            <img src={chakraiLogo} alt="Chakrai" className="h-10 w-auto" />
            <div>
              <p className="text-white font-bold text-lg">Chakrai</p>
              <p className="text-white/70 text-xs">Mental Wellness</p>
            </div>
          </div>
          
          <ErrorBoundary>
            {renderActiveSection()}
          </ErrorBoundary>
        </div>
      </div>

      {/* Voice Settings Modal */}
      {showSettings && (
        <VoiceSelector
          selectedVoice={selectedVoice}
          onVoiceChange={setSelectedVoice}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Theme Modal */}
      {showThemeModal && (
        <ThemeSelector onClose={() => setShowThemeModal(false)} />
      )}

      {/* Floating Chat Component */}
      {!(activeSection === 'chat' && isFloatingChatOpen) && (
        <FloatingChat
          isOpen={isFloatingChatOpen}
          onToggle={() => setIsFloatingChatOpen(!isFloatingChatOpen)}
          selectedVoice={selectedVoice}
        />
      )}

      {/* Movable Chat with Avatar */}
      {showMovableChat && (
        <MovableChat
          selectedVoice={selectedVoice}
          onVoiceChange={setSelectedVoice}
          onClose={() => setShowMovableChat(false)}
        />
      )}
    </div>
  );
};

// User session management wrapper
const AppWithOnboarding = () => {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showPersonalityQuiz, setShowPersonalityQuiz] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // User session management
  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Get device fingerprint for anonymous users
        const deviceFingerprint = await generateDeviceFingerprint();

        console.log('Using device fingerprint:', deviceFingerprint);
        
        // Check if user exists or create anonymous user
        const response = await axios.post('/api/users/anonymous', {
          deviceFingerprint
        });

        const userId = response.data.user.id;
        console.log('Got user ID:', userId);
        setCurrentUserId(userId);

        // Check if this specific user needs personality quiz
        const profileResponse = await axios.get(`/api/user-profile-check/${userId}`);
        console.log('Profile check response:', profileResponse.data);

        if (profileResponse.data.needsQuiz) {
          console.log('User needs personality quiz');
          setShowPersonalityQuiz(true);
        } else {
          console.log('User has completed personality quiz');
        }
      } catch (error) {
        console.error('Failed to initialize user:', error);
        // Create fallback anonymous user with timestamp-based ID
        const fallbackUserId = Date.now() % 100000;
        setCurrentUserId(fallbackUserId);
        setShowPersonalityQuiz(true); // New users need the quiz
      } finally {
        setIsLoadingProfile(false);
      }
    };

    initializeUser();
  }, []);

  const generateDeviceFingerprint = async (): Promise<string> => {
    // Use only stable, consistent device characteristics
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.platform || 'unknown'
    ].join('|');

    // Create a hash of the fingerprint for consistent identification
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprint));
    const hashArray = new Uint8Array(hash);
    const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex.slice(0, 32);
  };

  const handlePersonalityQuizComplete = async (profile: any) => {
    try {
      if (currentUserId) {
        await axios.post('/api/user-profile', {
          userId: currentUserId,
          ...profile,
          quizCompleted: true
        });
      }
      setShowPersonalityQuiz(false);
    } catch (error) {
      console.error('Failed to save personality profile:', error);
    }
  };

  const handleDataReset = async () => {
    if (currentUserId) {
      // Clear user data but keep the user record
      try {
        await Promise.all([
          axios.delete(`/api/users/${currentUserId}/messages`),
          axios.delete(`/api/users/${currentUserId}/journal-entries`),
          axios.delete(`/api/users/${currentUserId}/mood-entries`),
        ]);

        // Clear localStorage for fresh start
        localStorage.removeItem('freshStart');
        localStorage.setItem('freshStart', 'true');

        // Refresh the page
        window.location.reload();
      } catch (error) {
        console.error('Failed to reset user data:', error);
      }
    }
  };

  // Show loading while initializing
  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Initializing your wellness companion...</p>
        </div>
      </div>
    );
  }

  // Show personality quiz if needed
  if (showPersonalityQuiz) {
    return (
      <PersonalityQuiz 
        onComplete={handlePersonalityQuizComplete}
        onSkip={() => setShowPersonalityQuiz(false)}
      />
    );
  }

  return <AppLayout currentUserId={currentUserId} onDataReset={handleDataReset} />;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <AppWithOnboarding />
            <NeonCursor />
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}