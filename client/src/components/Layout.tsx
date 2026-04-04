import React, { useState, useEffect, useRef } from 'react';
import NeonCursor from '@/components/neon-cursor';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Brain, X, Settings, Menu } from 'lucide-react';
import axios from 'axios';
// Removed problematic theme context import
// import { useTheme, ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
// Removed problematic layout component imports
// import CleanLayout from '@/components/layouts/CleanLayout';
// import CleanHome from '@/components/layouts/CleanHome';
// import { SubscriptionModal } from '@/components/SubscriptionModal';
// import { UsageLimitModal } from '@/components/UsageLimitModal';
import MemoryDashboard from '@/components/MemoryDashboard';
import ConversationContinuityDisplay from '@/components/ConversationContinuityDisplay';
import VoiceSelector from '@/components/VoiceSelector';
import ThemeSelector from '@/components/ThemeSelector';
// Import comprehensive engaging components
import BeautifulChat from '@/components/BeautifulChat';
import ChakraiPlans from '@/components/ChakraiPlans';
import GlassmorphismShowcase from '@/components/GlassmorphismShowcase';
import CleanShowcase from '@/components/CleanShowcase';

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
import StarsAndStudiesPage from '@/components/StarsAndStudiesPage';
import SubscriptionTierDemo from '@/components/SubscriptionTierDemo';
// Removed duplicate chat components - using only main chat interface
import ChallengeSystem from '@/components/ChallengeSystem';
import SupabaseSetup from '@/components/SupabaseSetup';
import { VoiceRecorder } from '@/utils/voiceRecorder';
import { getCurrentUserId, getAuthHeaders } from '../utils/unifiedUserSession';
import PrivacyControl from '@/components/PrivacyControl';
import OnboardingTour from '@/components/OnboardingTour';

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
  // Removed problematic theme context usage
  // const { currentTheme, isLightMode, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('james');
  const [showSettings, setShowSettings] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  
  // Chat functionality
  const [chatInput, setChatInput] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [messages, setMessages] = useState<Array<{sender: 'user' | 'bot', text: string, time: string}>>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [selectedModel, setSelectedModel] = useState('gpt-4o'); // Added selectedModel state
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null);

  // Initialize voice recorder with strict WAV enforcement
  React.useEffect(() => {
    voiceRecorderRef.current = new VoiceRecorder({
      onTranscription: (text) => {
        setChatInput(text);
        console.log('âœ… Voice transcription received:', text);
      },
      onError: (error) => {
        console.error('âŒ Voice recording error:', error);
        // More user-friendly error display
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:red;color:white;padding:15px;border-radius:8px;z-index:10000;max-width:300px;';
        errorDiv.textContent = error;
        document.body.appendChild(errorDiv);
        setTimeout(() => document.body.removeChild(errorDiv), 5000);
      },
      onStatusChange: (status) => {
        setVoiceStatus(status);
        console.log('ðŸŽµ Voice status changed to:', status);
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

  // Async TTS generation function (non-blocking)
  // Async TTS generation function (non-blocking)
  const generateAndPlayTTS = async (text: string, voice: string) => {
    try {
      const startTime = Date.now();
      console.log('ðŸ”Š Starting TTS generation...');
      
      const ttsResponse = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice }),
      });

      if (ttsResponse.ok) {
        const audioBlob = await ttsResponse.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        const generationTime = Date.now() - startTime;
        console.log(`ðŸ”Š TTS generated in ${generationTime}ms`);
        
        audio.addEventListener('ended', () => {
          URL.revokeObjectURL(audioUrl);
        });
        
        audio.addEventListener('error', (e) => {
          console.error('ðŸ”Š TTS playback error:', e);
          URL.revokeObjectURL(audioUrl);
        });
        
        audio.volume = 0.8;
        await audio.play();
        console.log('ðŸ”Š TTS playback started');
      } else {
        console.error('ðŸ”Š TTS request failed:', ttsResponse.statusText);
      }
    } catch (error) {
      console.error('ðŸ”Š TTS generation failed:', error);
    }
  };



  // Send message functionality
  const handleSendMessage = async (message?: string) => {
    const messageText = message || chatInput;
    if (!messageText.trim()) return;
    
    console.log(`ðŸŽµ Frontend - Sending message with voice: ${selectedVoice}`);
    
    // Validate session before sending (note: unified system handles this internally)
    
    const userMessage = {
      sender: 'user' as const,
      text: messageText,
      time: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsAiTyping(true); // Show typing indicator
    
    // Send to AI API with authenticated headers and voice parameter
    try {
      const headers = await getAuthHeaders();
      console.log('ðŸ”’ Sending chat message with authenticated headers');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for audio responses
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: messageText,
          voice: selectedVoice // Use the selected voice from state
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('âœ… Chat API success - Status:', response.status);
        console.log('ðŸ“¥ Main Chat API response:', data);
        console.log('ðŸ” Main Chat - audioUrl exists:', !!data.audioUrl);
        console.log('ðŸ” Main Chat - audioUrl length:', data.audioUrl?.length);
        console.log('ðŸ” Main Chat - response keys:', Object.keys(data));
        console.log('ðŸ” Main Chat - message content:', data.message);
        
        const botMessage = {
          sender: 'bot' as const,
          text: data.message || data.response || data.text || 'I received your message.',
          time: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, botMessage]);
        setIsAiTyping(false); // Hide typing indicator
        
        // Start TTS generation immediately (don't await)
        if (isTtsEnabled && botMessage.text) {
          console.log('ðŸ”Š Generating TTS for bot response...');
          // Fire and forget - don't block UI
          generateAndPlayTTS(botMessage.text, selectedVoice);
        }
      } else {
        console.error('âŒ Chat API error - Status:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('âŒ Error details:', errorText);
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
      console.error('âŒ Error sending message - Network/Parse error:', error);
      console.error('âŒ Error type:', error instanceof Error ? error.name : typeof error);
      console.error('âŒ Error message:', error instanceof Error ? error.message : String(error));
      
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
    console.log('ðŸ” Rendering section:', activeSection); // Debug log
    switch (activeSection) {
      case 'home':
        console.log('ðŸ  Rendering Clean Home Design'); // Debug log
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
                      onClick={() => setActiveSection('190-analysis')}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center group"
                    >
                      Start Free Analysis
                      <span className="ml-2 group-hover:translate-x-1 transition-transform">â†’</span>
                    </button>
                    
                    <button 
                      onClick={() => setActiveSection('chat')}
                      className="border border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200"
                    >
                      Try Chat Demo
                    </button>
                  </div>

                  <div className="flex items-center space-x-8 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">âœ“</span>
                      <span>HIPAA Compliant</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">âœ“</span>
                      <span>End-to-End Encrypted</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">âœ“</span>
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
                evolving portrait of who you are. <strong>It's not a label â€” it's the most in-depth 
                self-reflection system ever built.</strong>
              </p>
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
                  onClick={() => setActiveSection('chat')}
                  className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  Start Your Free Analysis
                </button>
              </div>
            </div>
          </div>
        );
      case '190-analysis':
        return (
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">190-Point Personality Analysis</h1>
            <p className="text-xl text-gray-600 mb-8">Coming Soon - The most comprehensive personality assessment available</p>
            <button 
              onClick={() => setActiveSection('chat')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-medium"
            >
              Try Chat Demo Instead
            </button>
          </div>
        );
      case 'pricing':
        return <ChakraiPlans />;
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
        return <AnalyticsDashboard onNavigate={setActiveSection} />;
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
      case 'stars-studies':
        return <StarsAndStudiesPage onBack={() => setActiveSection('home')} />;
      case 'subscription-demo':
        return <SubscriptionTierDemo />;
      case 'glassmorphism-showcase':
        return <GlassmorphismShowcase />;
      case 'clean-showcase':
        return <CleanShowcase />;
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
            isTtsEnabled={isTtsEnabled}
            onTtsToggle={() => setIsTtsEnabled(!isTtsEnabled)}
            onBotMessageSpeak={(text: string) => generateAndPlayTTS(text, selectedVoice)} // Pass the TTS function with selectedVoice
            selectedModel={selectedModel} // Pass selectedModel
            onModelChange={setSelectedModel} // Pass onModelChange handler
          />
        );
      default:
        console.log('âŒ DEFAULT CASE - activeSection:', activeSection); // Debug log
        return (
          <div className="p-6 space-y-6 max-h-full overflow-y-auto">
            <div className="text-center space-y-4 mb-8">
              <h1 className="text-4xl font-bold theme-text font-serif tracking-wide">
                Welcome to <span className="font-samarkan">Chakrai</span>
              </h1>
              <p className="theme-text-secondary text-xl font-light max-w-2xl mx-auto leading-relaxed">
                Your Personal AI Wellness Companion
              </p>
              <div className="mt-8">
                <p className="text-sm theme-text-secondary">Debug: activeSection = {activeSection}</p>
                <p className="text-sm theme-text-secondary">Debug: currentUserId = {currentUserId}</p>
                <button 
                  onClick={() => setActiveSection('home')} 
                  className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  ðŸ  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-red-500">
      <div className="p-8 text-white text-4xl font-bold">
        TEST - NEW LAYOUT IS LOADING
      </div>
      {/* Clean Top Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Chakrai</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              {[
                { id: 'home', label: 'Home' },
                { id: '190-analysis', label: '190-Point Analysis' },
                { id: 'chat', label: 'Chat' },
                { id: 'journal', label: 'Journal' },
                { id: 'meditation', label: 'Wellness' },
                { id: 'pricing', label: 'Pricing' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    activeSection === item.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              {/* Get Started Button */}
              <button 
                onClick={() => setActiveSection('pricing')}
                className="hidden md:block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started Free
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200">
            <div className="px-4 py-3 space-y-2">
              {[
                { id: 'home', label: 'Home' },
                { id: 'chat', label: 'Chat' },
                { id: 'journal', label: 'Journal' },
                { id: 'meditation', label: 'Wellness' },
                { id: 'pricing', label: 'Pricing' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    activeSection === item.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary>
          {renderActiveSection()}
        </ErrorBoundary>
      </main>

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
    </div>
  );
};

// User session management wrapper
const AppWithOnboarding = () => {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showPersonalityQuiz, setShowPersonalityQuiz] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);
  
  // Privacy control handler
  const handleUserIdChange = (newUserId: number) => {
    console.log('ðŸ”„ Privacy Control: User ID changed to', newUserId);
    // Could trigger data refresh here if needed
  };

  // User session management
  useEffect(() => {
    const initializeUser = async () => {
      try {
        console.log('ðŸ”’ Initializing bulletproof user session...');
        
        // Get authenticated user session
        const userId = await getCurrentUserId();
        if (userId === 0) {
          console.error('âŒ User authentication failed during initialization');
          setCurrentUserId(null);
          setIsLoadingProfile(false);
          return;
        }
        
        const headers = await getAuthHeaders();
        
        console.log('âœ… User authentication successful. User ID:', userId);
        
        setCurrentUserId(userId);

        // Check if user exists in backend or create anonymous user
        try {
          const response = await fetch('/api/users/anonymous', {
            method: 'POST',
            headers,
            body: JSON.stringify({})
          });
          
          if (response.ok) {
            const userData = await response.json();
            console.log('âœ… Backend user verified:', userData.user?.id);
          } else {
            console.warn('âš ï¸ Backend user creation failed, continuing with calculated ID');
          }
        } catch (backendError) {
          console.warn('âš ï¸ Backend user creation failed, continuing with calculated ID:', backendError);
        }

        // Check if this specific user needs personality quiz
        try {
          const profileHeaders = await getAuthHeaders();
          const profileResponse = await fetch(`/api/user-profile-check/${userId}`, { headers: profileHeaders });
          console.log('Profile check response:', profileResponse.status);

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.needsQuiz) {
              console.log('User needs personality quiz');
              setShowPersonalityQuiz(false); // Bypass quiz for main app access
            } else {
              console.log('User has completed personality quiz');
            }
          }
        } catch (profileError) {
          console.warn('Profile check failed, defaulting to main app:', profileError);
          setShowPersonalityQuiz(false);
        }

        // Check if user needs onboarding tour
        const tourCompleted = localStorage.getItem('chakrai_tour_completed');
        if (!tourCompleted) {
          // Small delay to ensure UI is fully loaded
          setTimeout(() => {
            setShowOnboardingTour(true);
          }, 2000);
        }
      } catch (error) {
        console.error('Failed to initialize user:', error);
        // Robust fallback using getCurrentUserId which never fails
        const fallbackUserId = await getCurrentUserId();
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

  return (
    <>
      <AppLayout 
        currentUserId={currentUserId} 
        onDataReset={handleDataReset}
      />
      
      {/* Privacy Control - Shows in top-right corner */}
      <PrivacyControl onUserIdChange={handleUserIdChange} />
      
      {/* Onboarding Tour at App Level */}
      {showOnboardingTour && (
        <OnboardingTour
          onComplete={() => setShowOnboardingTour(false)}
          onSkip={() => setShowOnboardingTour(false)}
          currentSection="home"
          onNavigate={() => {}}
        />
      )}
    </>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Removed ThemeProvider that was causing errors */}
      <AuthProvider>
        <SubscriptionProvider>
          <AppWithOnboarding />
          <NeonCursor />
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

