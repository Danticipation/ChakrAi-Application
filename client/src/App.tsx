import React from 'react';
import './utils/authInterceptor';
import { useState, useEffect, useRef } from 'react';
import NeonCursor from '@/components/neon-cursor';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';

// Import new modern components
import ModernLayout from '@/components/ModernLayout';
import ModernDashboard from '@/components/ModernDashboard';

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
import { VoiceRecorder } from '@/utils/voiceRecorder';
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
  const [selectedVoice, setSelectedVoice] = useState('james');
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
            onBotMessageSpeak={(text: string) => {}}
            selectedModel={selectedModel} // Pass selected model
            onModelChange={setSelectedModel} // Pass model change handler
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
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showPersonalityQuiz, setShowPersonalityQuiz] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  // User session management
  useEffect(() => {
    const initializeUser = async () => {
      try {
        if (!validateUserSession()) {
          console.error('Session validation failed during initialization');
          setCurrentUserId(null);
          setIsLoadingProfile(false);
          return;
        }
        const userId = await getCurrentUserId();
        const headers = await getDeviceHeaders();
        
        setCurrentUserId(userId);

        // Check if user exists in backend
        try {
          const response = await fetch('/api/users/anonymous', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...headers
            },
            body: JSON.stringify({})
          });
          
          if (!response.ok) {
            console.warn('Backend user creation failed, continuing with calculated ID');
          }
        } catch (backendError) {
          console.warn('Backend user creation failed:', backendError);
        }

        setShowPersonalityQuiz(false);
      } catch (error) {
        console.error('Failed to initialize user:', error);
        const fallbackUserId = await getCurrentUserId();
        setCurrentUserId(fallbackUserId);
        setShowPersonalityQuiz(false);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    initializeUser();
  }, []);

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

  // Show loading while initializing
  if (isLoadingProfile) {
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
      
      {/* Privacy Control */}
      <PrivacyControl onUserIdChange={() => {}} />
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
              <NeonCursor />
            </SubscriptionProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

