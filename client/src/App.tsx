import React from 'react';
import './utils/authInterceptor';
import { useState, useEffect, useRef } from 'react';
import NeonCursor from '@/components/neon-cursor';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';

// Import ModernDashboard as the main dashboard
import ModernDashboard from '@/components/ModernDashboard';
import ModernLayout from '@/components/ModernLayout';

// Import existing components
import BeautifulChat from '@/components/BeautifulChat';
import EnhancedJournalInterface from '@/components/EnhancedJournalInterface';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import BeautifulMeditation from '@/components/BeautifulMeditation';
import PersonalityReflection from '@/components/PersonalityReflection';
import VoluntaryQuestionDeck from '@/components/VoluntaryQuestionDeck';
import AgentSystem from '@/components/AgentSystem';
import TherapistPortal from '@/components/TherapistPortal';
import AdminPortal from '@/components/AdminPortal';
import ChallengeSystem from '@/components/ChallengeSystem';
import WellnessRewards from '@/components/WellnessRewards';
import ChakraiPlans from '@/components/ChakraiPlans';
import PersonalityQuiz from '@/components/PersonalityQuiz';
import AvatarCustomizer from '@/components/AvatarCustomizer';
import type { AvatarConfig } from '@/components/AvatarCustomizer';
import { VoiceRecorder } from '@/utils/voiceRecorder';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentUserId, validateUserSession, getDeviceHeaders } from '@/utils/userSession';
import PrivacyControl from '@/components/PrivacyControl';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

// Import enhanced error boundaries
import ErrorBoundary from '@/components/ErrorBoundary';
import MeditationErrorBoundary from '@/components/MeditationErrorBoundary';

const ModernAppLayout: React.FC<{currentUserId: number | null, onDataReset: () => void}> = ({ currentUserId, onDataReset }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [companionAvatar, setCompanionAvatar] = useState<AvatarConfig | undefined>(() => {
    const saved = localStorage.getItem('companion_avatar');
    return saved ? JSON.parse(saved) : undefined;
  });
  const [selectedVoice, setSelectedVoice] = useState(() => {
    // Load saved voice from localStorage, default to Brandy
    return localStorage.getItem('selectedVoice') || 'Brandy';
  });
  const [selectedModel, setSelectedModel] = useState(() => {
    // Check if saved model is a Grok model and fallback to GPT-4o
    const savedModel = localStorage.getItem('selectedModel') || 'gpt-4o';
    const validModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
    return validModels.includes(savedModel) ? savedModel : 'gpt-4o';
  });
  
  // Chat functionality
  const [chatInput, setChatInput] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [messages, setMessages] = useState<Array<{sender: 'user' | 'bot', text: string, time: string, id: string}>>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null);

  // Initialize voice recorder
  React.useEffect(() => {
    voiceRecorderRef.current = new VoiceRecorder({
      onTranscription: (text) => {
        setChatInput(text);
      console.log('Voice transcription received:', text);
      },
      onError: (error) => {
        console.error('âŒ Voice recording error:', error);
      },
      onStatusChange: (status) => {
        setVoiceStatus(status);
        console.log('ðŸŽµ Voice status changed to:', status);
      },
      maxDuration: 30,
      minDuration: 2
    });

    return () => {
      if (voiceRecorderRef.current?.getIsRecording()) {
        voiceRecorderRef.current.stopRecording();
      }
    };
  }, []);

  // Save selected model to localStorage when it changes
  React.useEffect(() => {
    localStorage.setItem('selectedModel', selectedModel);
  }, [selectedModel]);

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

  // TTS toggle functionality
  const handleTtsToggle = () => {
    setIsTtsEnabled(!isTtsEnabled);
  };

  // Bot message TTS playback
  const handleBotMessageSpeak = async (text: string) => {
    if (!isTtsEnabled || !text.trim()) {
      console.log('⏭️ Chat TTS skipped:', { isTtsEnabled, hasText: !!text.trim() });
      return;
    }

    try {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setCurrentAudio(null);
      }

      console.log('🎤 Chat Bot Message TTS:', { 
        textPreview: text.substring(0, 50) + '...', 
        voice: selectedVoice,
        textLength: text.length 
      });

      const headers = await getDeviceHeaders();
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: selectedVoice,
          stability: 0.5,
          similarity_boost: 0.75
        }),
      });

      console.log('📡 Chat Bot TTS Response:', { 
        status: response.status, 
        statusText: response.statusText 
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.addEventListener('ended', () => {
          setCurrentAudio(null);
          URL.revokeObjectURL(audioUrl);
        });

        audio.addEventListener('error', (e) => {
          console.error('❌ Chat audio playback error:', e);
          setCurrentAudio(null);
          URL.revokeObjectURL(audioUrl);
        });

        setCurrentAudio(audio);
        await audio.play();
        console.log('✅ Chat bot message playing');
      } else {
        const errorText = await response.text();
        console.error('❌ Chat Bot TTS API error:', errorText);
      }
    } catch (error) {
      console.error('❌ Chat Bot TTS error:', error);
    }
  };

  // Send message functionality
  const handleSendMessage = async (message?: string) => {
    const messageText = message || chatInput;
    if (!messageText.trim()) return;
    
    if (!validateUserSession()) {
      console.error('Session validation failed for chat message');
      return;
    }
    
    const userMessage = {
      sender: 'user' as const,
      text: messageText,
      time: new Date().toLocaleTimeString(),
      id: `user-${Date.now()}`
    };
    
    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsAiTyping(true);
    
    try {
      const headers = await getDeviceHeaders();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          message: messageText,
          voice: selectedVoice,
          model: selectedModel
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        
        const botMessage = {
          sender: 'bot' as const,
          text: data.message || data.response || data.text || 'I received your message.',
          time: new Date().toLocaleTimeString(),
          id: `bot-${Date.now()}`
        };
        setMessages(prev => [...prev, botMessage]);
        setIsAiTyping(false);
      } else {
        console.error('Chat API error - Status:', response.status, response.statusText);
        const errorMessage = {
          sender: 'bot' as const,
          text: 'Sorry, I had trouble processing your message. Please try again.',
          time: new Date().toLocaleTimeString(),
          id: `error-${Date.now()}`
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsAiTyping(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorText = 'Sorry, I had trouble processing your message. Please try again.';
      if (error instanceof Error && error.name === 'AbortError') {
        errorText = 'The request took too long. Please try again with a shorter message.';
      }
      
      const errorMessage = {
        sender: 'bot' as const,
        text: errorText,
        time: new Date().toLocaleTimeString(),
        id: `error-${Date.now()}`
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsAiTyping(false);
    }
  };

  // Avatar save handler
  const handleAvatarSave = (avatar: AvatarConfig) => {
    setCompanionAvatar(avatar);
    localStorage.setItem('companion_avatar', JSON.stringify(avatar));
    setActiveSection('chat'); // Navigate back to chat
  };

  // Component rendering function
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <ModernDashboard userId={currentUserId} onNavigate={setActiveSection} />;
      case 'chat':
        return (
          <BeautifulChat
            selectedVoice={selectedVoice}
            voiceStatus={voiceStatus}
            onVoiceToggle={handleVoiceToggle}
            onSendMessage={(message: string) => handleSendMessage(message)}
            messages={messages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            isAiTyping={isAiTyping}
            isTtsEnabled={isTtsEnabled}
            onTtsToggle={handleTtsToggle}
            onBotMessageSpeak={handleBotMessageSpeak}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            onVoiceChange={setSelectedVoice}
            onAvatarClick={() => setActiveSection('avatar')}
            companionAvatar={companionAvatar}
          />
        );
      case 'journal':
        return <EnhancedJournalInterface userId={currentUserId} onEntryCreated={() => {}} />;
      case 'analytics':
        return <AnalyticsDashboard onNavigate={setActiveSection} />;
      case 'mood':
        return <PersonalityReflection userId={currentUserId || 1} />;
      case 'assessment':
        return <VoluntaryQuestionDeck />;
      case 'goals':
        return <ChallengeSystem />;
      case 'meditation':
        return (
          <MeditationErrorBoundary>
            <BeautifulMeditation />
          </MeditationErrorBoundary>
        );
      case 'exercises':
        return <AgentSystem userId={currentUserId || 1} />;
      case 'resources':
        return <WellnessRewards />;
      case 'therapist':
        return <TherapistPortal />;
      case 'admin':
        return <AdminPortal />;
      case 'pricing':
        return <ChakraiPlans />;
      case 'avatar':
        return <AvatarCustomizer onAvatarSelect={handleAvatarSave} currentAvatar={companionAvatar} />;
      default:
        return <ModernDashboard userId={currentUserId} onNavigate={setActiveSection} />;
    }
  };

  return (
    <ModernLayout
      activeSection={activeSection}
      onNavigate={setActiveSection}
      currentUserId={currentUserId}
    >
      <ErrorBoundary 
        level="component" 
        componentName="ModernAppLayout"
        onError={(error, errorInfo) => {
          // Custom error handling for main app layout
          console.error('Main layout error:', error, errorInfo);
        }}
      >
        {renderActiveSection()}
      </ErrorBoundary>
    </ModernLayout>
  );
};

// User session management wrapper
const AppWithModernDesign = () => {
  const { currentTheme } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showPersonalityQuiz, setShowPersonalityQuiz] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  // Ensure we have a JWT token for anonymous users - RUN IMMEDIATELY, BEFORE ANYTHING ELSE
  useEffect(() => {
    const ensureAuthToken = async () => {
      const existingToken = localStorage.getItem('auth_token');
      if (!existingToken) {
        try {
          console.log('🎭 No token found, creating anonymous user...');
          const response = await fetch('/api/auth/anonymous', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          if (response.ok) {
            const data = await response.json();
            localStorage.setItem('auth_token', data.token);
            console.log('✅ Anonymous JWT token created and stored');
            setIsAuthReady(true);
          } else {
            console.error('❌ Failed to create anonymous user:', response.status);
            setIsAuthReady(true); // Continue anyway
          }
        } catch (error) {
          console.error('❌ Failed to create anonymous token:', error);
          setIsAuthReady(true); // Continue anyway
        }
      } else {
        console.log('✅ Existing auth token found');
        setIsAuthReady(true);
      }
    };
    void ensureAuthToken();
  }, []); // Run once on mount
  
  // User session management - use AuthContext user
  useEffect(() => {
    // Wait for auth to be ready before proceeding
    if (!isAuthReady) {
      return;
    }
    
    if (authLoading) {
      setIsLoadingProfile(true);
      return;
    }

    if (user) {
      // User is authenticated via AuthContext
      setCurrentUserId(user.id);
      setIsLoadingProfile(false);
    } else {
      // No auth user - set to null
      setCurrentUserId(null);
      setIsLoadingProfile(false);
    }
  }, [user, authLoading, isAuthReady]);

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
      try {
        await Promise.all([
          axios.delete(`/api/users/${currentUserId}/messages`),
          axios.delete(`/api/users/${currentUserId}/journal-entries`),
          axios.delete(`/api/users/${currentUserId}/mood-entries`),
        ]);

        localStorage.removeItem('freshStart');
        localStorage.setItem('freshStart', 'true');
        window.location.reload();
      } catch (error) {
        console.error('Failed to reset user data:', error);
      }
    }
  };

  // Show loading while initializing auth OR profile
  if (!isAuthReady || isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Initializing Chakrai...</p>
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
      <ModernAppLayout 
        currentUserId={currentUserId} 
        onDataReset={handleDataReset}
      />
      
      {/* Privacy Control - Temporarily disabled due to auth conflicts */}
      {/* <PrivacyControl onUserIdChange={() => {}} /> */}
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary 
      level="app" 
      componentName="App"
      onError={(error, errorInfo) => {
        // App-level error handling
        console.error('App-level error:', error, errorInfo);
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <AppWithModernDesign />
              {/* <NeonCursor /> - Disabled due to SVG errors */}
            </SubscriptionProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

