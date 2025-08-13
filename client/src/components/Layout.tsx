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
import ConversationContinuityDisplay from '@/components/ConversationContinuityDisplay';
import VoiceSelector from '@/components/VoiceSelector';
import ThemeSelector from '@/components/ThemeSelector';
import WellnessDashboard from '@/components/WellnessDashboard';
import BeautifulChat from '@/components/BeautifulChat';
// import AuthModal from '@/components/AuthModal';

import PersonalityQuiz from '@/components/PersonalityQuiz';
import VoluntaryQuestionDeck from '@/components/VoluntaryQuestionDeck';
import FeedbackSystem from '@/components/FeedbackSystem';
import EnhancedJournalInterface from '@/components/EnhancedJournalInterface';
import PersonalityReflection from '@/components/PersonalityReflection';
import MicrophoneTest from '@/components/MicrophoneTest';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import WellnessRewards from '@/components/WellnessRewards';
import CommunitySupport from '@/components/CommunitySupport';
import AdaptiveLearning from '@/components/AdaptiveLearning';
import AdaptiveLearningProgressTracker from '@/components/AdaptiveLearningProgressTracker';
import AdaptiveTherapyPlan from '@/components/AdaptiveTherapyPlan';
import AgentSystem from '@/components/AgentSystem';
import VRTherapy from '@/components/VRTherapy';
import HealthIntegration from '@/components/HealthIntegration';
import PrivacyCompliance from '@/components/PrivacyCompliance';
import BeautifulMeditation from '@/components/BeautifulMeditation';
import TherapistPortal from '@/components/TherapistPortal';
import AiPerformanceMonitoringDashboard from '@/components/AiPerformanceMonitoringDashboard';
import AdminFeedbackDashboard from '@/components/AdminFeedbackDashboard';
import AdminPortal from '@/components/AdminPortal';
import Horoscope from '@/components/Horoscope';
import DailyAffirmation from '@/components/DailyAffirmation';
import PilotAnalyticsDashboard from '@/components/PilotAnalyticsDashboard';
// Removed duplicate chat components - using only main chat interface
import ChallengeSystem from '@/components/ChallengeSystem';
import SupabaseSetup from '@/components/SupabaseSetup';
import { VoiceRecorder } from '@/utils/voiceRecorder';
import { getCurrentUserId, generateDeviceFingerprint } from '@/utils/userSession';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const chakraiLogo = './TrAI-Logo.png';

// Simple error boundary without override issues
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

const AppLayout: React.FC<{currentUserId: number | null, onDataReset: () => void}> = ({ currentUserId, onDataReset }) => {
  const { currentTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('james');
  const [collapsedSections, setCollapsedSections] = useState({
    core: false,
    mirrors: true,
    guided: false, // Show therapeutic agents by default
    healthcare: true,
    wellness: true,
    settings: true,
    community: true
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  
  // Chat functionality
  const [chatInput, setChatInput] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [messages, setMessages] = useState<Array<{sender: 'user' | 'bot', text: string, time: string}>>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null);

  // Initialize voice recorder with strict WAV enforcement
  React.useEffect(() => {
    voiceRecorderRef.current = new VoiceRecorder({
      onTranscription: (text) => {
        setChatInput(text);
        console.log('✅ Voice transcription received:', text);
      },
      onError: (error) => {
        console.error('❌ Voice recording error:', error);
        // More user-friendly error display
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:red;color:white;padding:15px;border-radius:8px;z-index:10000;max-width:300px;';
        errorDiv.textContent = error;
        document.body.appendChild(errorDiv);
        setTimeout(() => document.body.removeChild(errorDiv), 5000);
      },
      onStatusChange: (status) => {
        setVoiceStatus(status);
        console.log('🎵 Voice status changed to:', status);
      },
      maxDuration: 30, // Shorter duration for better success
      minDuration: 2   // Longer minimum for clearer speech
    });

    return () => {
      if (voiceRecorderRef.current?.getIsRecording()) {
        voiceRecorderRef.current.stopRecording();
      }
    };
  }, []);

  // Voice recording functions
  const handleVoiceToggle = () => {
    if (voiceRecorderRef.current) {
      if (voiceRecorderRef.current.getIsRecording()) {
        voiceRecorderRef.current.stopRecording();
      } else {
        voiceRecorderRef.current.startRecording();
      }
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
  const handleSendMessage = async (message?: string) => {
    const messageText = message || chatInput;
    if (!messageText.trim()) return;
    
    console.log(`🎵 Frontend - Sending message with voice: ${selectedVoice}`);
    
    const userMessage = {
      sender: 'user' as const,
      text: messageText,
      time: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsAiTyping(true); // Show typing indicator
    
    // Send to AI API with device fingerprint headers and voice parameter
    try {
      const deviceFingerprint = generateDeviceFingerprint();
      const sessionId = generateSessionId();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for audio responses
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Fingerprint': deviceFingerprint,
          'X-Session-Id': sessionId
        },
        body: JSON.stringify({
          message: messageText,
          voice: selectedVoice // Use the selected voice from state
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Chat API success - Status:', response.status);
        console.log('📥 Main Chat API response:', data);
        console.log('🔍 Main Chat - audioUrl exists:', !!data.audioUrl);
        console.log('🔍 Main Chat - audioUrl length:', data.audioUrl?.length);
        console.log('🔍 Main Chat - response keys:', Object.keys(data));
        console.log('🔍 Main Chat - message content:', data.message);
        
        const botMessage = {
          sender: 'bot' as const,
          text: data.message || data.response || data.text || 'I received your message.',
          time: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, botMessage]);
        setIsAiTyping(false); // Hide typing indicator
        
        // Play audio if available
        if (data.audioUrl) {
          console.log('🔊 Main Chat - Playing audio response...');
          console.log('🔊 Audio data length:', data.audioUrl.length);
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
            
            // Add event listeners for debugging
            audio.addEventListener('loadstart', () => console.log('🔊 Audio loading started'));
            audio.addEventListener('canplay', () => console.log('🔊 Audio can play'));
            audio.addEventListener('playing', () => console.log('🔊 Audio is playing'));
            audio.addEventListener('ended', () => console.log('🔊 Audio playback ended'));
            audio.addEventListener('error', (e) => console.error('🔊 Audio error event:', e));
            
            // Set volume and attempt to play
            audio.volume = 0.8;
            const playPromise = audio.play();
            
            if (playPromise) {
              playPromise
                .then(() => {
                  console.log('🔊 Audio playback started successfully');
                })
                .catch(error => {
                  console.error('🔊 Audio playback failed:', error);
                  console.error('🔊 Error details:', error.name, error.message);
                });
            }
          } catch (audioError) {
            console.error('🔊 Audio processing failed:', audioError);
          }
        } else {
          console.log('🔇 Main Chat - No audio in response');
        }
      } else {
        console.error('❌ Chat API error - Status:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error details:', errorText);
        // Show error message to user
        const errorMessage = {
          sender: 'bot' as const,
          text: 'Sorry, I had trouble processing your message. Please try again.',
          time: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsAiTyping(false); // Hide typing indicator on error
      }
    } catch (error) {
      console.error('❌ Error sending message - Network/Parse error:', error);
      console.error('❌ Error type:', error instanceof Error ? error.name : typeof error);
      console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
      
      let errorText = 'Sorry, I had trouble processing your message. Please try again.';
      if (error instanceof Error && error.name === 'AbortError') {
        errorText = 'The request took too long. Please try again with a shorter message.';
      }
      
      const errorMessage = {
        sender: 'bot' as const,
        text: errorText,
        time: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsAiTyping(false); // Hide typing indicator on error
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

  // Component rendering function
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'home':
        return <WellnessDashboard userId={currentUserId} onNavigate={setActiveSection} />;
      case 'questions':
        return <VoluntaryQuestionDeck />;
      case 'journal':
        return <EnhancedJournalInterface userId={currentUserId} onEntryCreated={() => {}} />;
      case 'memory':
        return <MemoryDashboard />;
      case 'conversation-continuity':
        return <ConversationContinuityDisplay />;
      case 'adaptive':
        return <AdaptiveLearning />;
      case 'progress-tracker':
        return <AdaptiveLearningProgressTracker />;
      case 'analytics':
        return <AnalyticsDashboard userId={currentUserId} onNavigate={setActiveSection} />;
      case 'meditation':
        return <BeautifulMeditation />;
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
        return <PersonalityReflection userId={currentUserId || 1} />;
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
      case 'admin-feedback':
        return <AdminFeedbackDashboard />;
      case 'admin-portal':
        return <AdminPortal />;
      case 'therapist':
        return <TherapistPortal />;
      case 'horoscope':
        return <Horoscope />;
      case 'affirmation':
        return <DailyAffirmation />;
      case 'pilot-analytics':
        return <PilotAnalyticsDashboard />;
      case 'chat':
        return (
          <BeautifulChat
            selectedVoice={selectedVoice}
            voiceStatus={voiceStatus}
            onVoiceToggle={handleVoiceToggle}
            onSendMessage={handleSendMessage}
            messages={messages.map((msg, index) => ({
              ...msg,
              id: `${msg.sender}-${index}-${msg.time}`
            }))}
            chatInput={chatInput}
            setChatInput={setChatInput}
            isAiTyping={isAiTyping}
          />
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
                          // Removed floating chat - using only main chat
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
                      { id: 'conversation-continuity', label: 'Context Threads' },
                      { id: 'adaptive', label: 'Mind Mirror' },
                      { id: 'progress-tracker', label: 'Progress Journey' },
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
                      { id: 'meditation', label: 'Guided Meditation' },
                      { id: 'agents', label: 'AI Wellness Coaches' },
                      { id: 'vr', label: 'InnerScape' },
                      { id: 'therapy-plans', label: 'Wellness Plans' },
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
                      { id: 'feedback', label: 'Feedback System' },
                      { id: 'admin-portal', label: 'Admin Portal' },
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
                      { id: 'pilot-analytics', label: 'Pilot Analytics' },
                      { id: 'voice', label: 'Voice Settings' },
                      { id: 'themes', label: 'Themes' },
                      { id: 'feedback', label: 'Feedback' },
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

      {/* Mobile Layout - Full Featured */}
      <div className="block lg:hidden">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 z-50 theme-card border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={chakraiLogo} alt="Chakrai" className="h-8 w-auto" />
              <div>
                <p className="text-white font-bold text-lg">Chakrai</p>
                <p className="text-white/70 text-xs">Mental Wellness</p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 theme-text rounded-lg hover:bg-white/10 transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed top-0 right-0 h-full w-80 theme-card border-l border-white/10 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold theme-text">Navigation</h3>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 theme-text-secondary hover:theme-text rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Mobile Navigation Items - Complete Feature Set */}
                <div className="space-y-4">
                  {/* Core Companion */}
                  <div>
                    <h4 className="text-sm font-medium theme-text-secondary mb-2">🟦 Core Companion</h4>
                    <div className="space-y-1">
                      {[
                        { id: 'home', label: 'Home', icon: '🏠' },
                        { id: 'chat', label: 'Chat with Chakrai', icon: '💬' },
                        { id: 'challenges', label: 'Reflection Goals', icon: '🎯' },
                        { id: 'rewards', label: 'Reflection Rewards', icon: '🎁' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveSection(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left transition-colors ${
                            activeSection === item.id
                              ? 'bg-blue-500/20 border border-blue-500/30 theme-text'
                              : 'theme-text hover:bg-white/5'
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span className="text-sm">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mirrors of You */}
                  <div>
                    <h4 className="text-sm font-medium theme-text-secondary mb-2">💠 Mirrors of You</h4>
                    <div className="space-y-1">
                      {[
                        { id: 'questions', label: 'Get to Know Me', icon: '❓' },
                        { id: 'journal', label: 'Journal', icon: '📔' },
                        { id: 'daily', label: 'Reflection', icon: '🌅' },
                        { id: 'memory', label: 'Insight Vault', icon: '🧠' },
                        { id: 'conversation-continuity', label: 'Context Threads', icon: '🧵' },
                        { id: 'adaptive', label: 'Mind Mirror', icon: '🪞' },
                        { id: 'progress-tracker', label: 'Progress Journey', icon: '📈' },
                        { id: 'analytics', label: 'State of Self', icon: '📊' },
                        { id: 'health', label: 'Somatic Mirror', icon: '💓' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveSection(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left transition-colors ${
                            activeSection === item.id
                              ? 'bg-blue-500/20 border border-blue-500/30 theme-text'
                              : 'theme-text hover:bg-white/5'
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span className="text-sm">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Guided Support */}
                  <div>
                    <h4 className="text-sm font-medium theme-text-secondary mb-2">🧘 Guided Support</h4>
                    <div className="space-y-1">
                      {[
                        { id: 'agents', label: 'AI Wellness Coaches', icon: '🤝' },
                        { id: 'vr', label: 'InnerScape', icon: '🌐' },
                        { id: 'therapy-plans', label: 'Wellness Plans', icon: '📋' },
                        { id: 'community', label: 'Community', icon: '👥' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveSection(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left transition-colors ${
                            activeSection === item.id
                              ? 'bg-blue-500/20 border border-blue-500/30 theme-text'
                              : 'theme-text hover:bg-white/5'
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span className="text-sm">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Healthcare */}
                  <div>
                    <h4 className="text-sm font-medium theme-text-secondary mb-2">🏥 Healthcare</h4>
                    <div className="space-y-1">
                      {[
                        { id: 'admin-portal', label: 'Admin Portal', icon: '🛡️' },
                        { id: 'therapist', label: 'Therapist Portal', icon: '👨‍⚕️' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveSection(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left transition-colors ${
                            activeSection === item.id
                              ? 'bg-blue-500/20 border border-blue-500/30 theme-text'
                              : 'theme-text hover:bg-white/5'
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span className="text-sm">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wellness */}
                  <div>
                    <h4 className="text-sm font-medium theme-text-secondary mb-2">🌟 Wellness</h4>
                    <div className="space-y-1">
                      {[
                        { id: 'horoscope', label: 'Daily Horoscope', icon: '⭐' },
                        { id: 'affirmation', label: 'Daily Affirmation', icon: '💫' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveSection(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left transition-colors ${
                            activeSection === item.id
                              ? 'bg-blue-500/20 border border-blue-500/30 theme-text'
                              : 'theme-text hover:bg-white/5'
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span className="text-sm">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Settings */}
                  <div>
                    <h4 className="text-sm font-medium theme-text-secondary mb-2">⚙️ Settings</h4>
                    <div className="space-y-1">
                      {[
                        { id: 'pilot-analytics', label: 'Pilot Analytics', icon: '📊' },
                        { id: 'voice', label: 'Voice Settings', icon: '🎤' },
                        { id: 'themes', label: 'Themes', icon: '🎨' },
                        { id: 'feedback', label: 'Feedback', icon: '💬' },
                        { id: 'privacy', label: 'Privacy', icon: '🔒' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.id === 'themes') {
                              setShowThemeModal(true);
                              setMobileMenuOpen(false);
                            } else if (item.id === 'voice') {
                              setShowSettings(true);
                              setMobileMenuOpen(false);
                            } else {
                              setActiveSection(item.id);
                              setMobileMenuOpen(false);
                            }
                          }}
                          className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left transition-colors ${
                            activeSection === item.id
                              ? 'bg-blue-500/20 border border-blue-500/30 theme-text'
                              : 'theme-text hover:bg-white/5'
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span className="text-sm">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Content */}
        <div className="pt-20 min-h-screen">
          <div className="p-4">
            <ErrorBoundary>
              {renderActiveSection()}
            </ErrorBoundary>
          </div>
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

      {/* Removed duplicate chat components - using only main chat interface in "Chat with Chakrai" section */}
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
        // Use the robust user identification system from userSession.ts
        const userId = getCurrentUserId();
        const deviceFingerprint = generateDeviceFingerprint();

        console.log('Using device fingerprint:', deviceFingerprint);
        console.log('Calculated user ID:', userId);
        setCurrentUserId(userId);

        // Check if user exists in backend or create anonymous user
        try {
          const response = await axios.post('/api/users/anonymous', {
            deviceFingerprint
          });
          
          // Verify backend user ID matches our calculation
          if (response.data.user && response.data.user.id) {
            console.log('Backend confirmed user ID:', response.data.user.id);
          }
        } catch (backendError) {
          console.warn('Backend user creation failed, continuing with calculated ID:', backendError);
        }

        // Check if this specific user needs personality quiz
        try {
          const profileResponse = await axios.get(`/api/user-profile-check/${userId}`);
          console.log('Profile check response:', profileResponse.data);

          if (profileResponse.data.needsQuiz) {
            console.log('User needs personality quiz');
            setShowPersonalityQuiz(false); // Bypass quiz for main app access
          } else {
            console.log('User has completed personality quiz');
          }
        } catch (profileError) {
          console.warn('Profile check failed, defaulting to main app:', profileError);
          setShowPersonalityQuiz(false);
        }
      } catch (error) {
        console.error('Failed to initialize user:', error);
        // Robust fallback using getCurrentUserId which never fails
        const fallbackUserId = getCurrentUserId();
        console.log('Using fallback user ID:', fallbackUserId);
        setCurrentUserId(fallbackUserId);
        setShowPersonalityQuiz(false); // Go directly to main app on errors
      } finally {
        setIsLoadingProfile(false);
      }
    };

    initializeUser();
  }, []);

  // Remove duplicate fingerprint generation - using userSession.ts version

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