import React, { useState, useEffect, useRef } from 'react';
import NeonCursor from '@/components/neon-cursor';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Brain, BookOpen, Mic, User, Square, Send, Target, RotateCcw, Sun, Star, Heart, BarChart3, Gift, Headphones, Shield, X, Palette, Settings } from 'lucide-react';
import axios from 'axios';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext';
import { SubscriptionModal } from './components/SubscriptionModal';
import { UsageLimitModal } from './components/UsageLimitModal';
import MemoryDashboard from './components/MemoryDashboard';
import VoiceSelector from './components/VoiceSelector';
import ThemeSelector from './components/ThemeSelector';
import AuthModal from './components/AuthModal';

import PersonalityQuiz from './components/PersonalityQuiz';
import VoluntaryQuestionDeck from './components/VoluntaryQuestionDeck';
import FeedbackSystem from './components/FeedbackSystem';
import TherapeuticJournal from './components/TherapeuticJournal';
import PersonalityReflection from './components/PersonalityReflection';
import MicrophoneTest from './components/MicrophoneTest';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import WellnessRewards from './components/WellnessRewards';
import CommunitySupport from './components/CommunitySupport';
import AdaptiveLearning from './components/AdaptiveLearning';
import AdaptiveTherapyPlan from './components/AdaptiveTherapyPlan';
import AgentSystem from './components/AgentSystem';
import VRTherapy from './components/VRTherapy';
import HealthIntegration from './components/HealthIntegration';
import PrivacyCompliance from './components/PrivacyCompliance';
import TherapistPortal from './components/TherapistPortal';
import AiPerformanceMonitoringDashboard from './components/AiPerformanceMonitoringDashboard';
import Horoscope from './components/Horoscope';
import DailyAffirmation from './components/DailyAffirmation';
import PWAManager from './components/PWAManager';
import MicroSession from './components/MicroSession';
import TherapeuticAnalytics from './components/TherapeuticAnalytics';
import { EHRIntegration } from './components/EHRIntegration';
import PrivacyPolicy from './components/PrivacyPolicy';
import FloatingChat from './components/FloatingChat';
import MovableChat from './components/MovableChat';
import ChallengeSystem from './components/ChallengeSystem';
import SettingsPanel from './components/SettingsPanel';
// import DynamicAmbientSound from './components/DynamicAmbientSound'; // DISABLED due to audio issues
import { getCurrentUserId } from './utils/userSession';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const chakraiLogo = './TrAI-Logo.png';

interface BotStats {
  level: number;
  stage: string;
}

interface Message {
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

interface Goal {
  id: number;
  name: string;
  current: number;
  target: number;
  color: string;
}

interface AppLayoutProps {
  currentUserId: number | null;
  onDataReset: () => void;
}

const AppLayout = ({ currentUserId, onDataReset }: AppLayoutProps) => {
  const { currentTheme, changeTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { subscription, canUseFeature, updateUsage } = useSubscription();
  const [activeSection, setActiveSection] = useState('welcome');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false);
  const queryClient = useQueryClient();
  
  // Debug logging for activeSection changes
  useEffect(() => {
    console.log('Active section changed to:', activeSection);
  }, [activeSection]);

  const [isRecording, setIsRecording] = useState(false);
  const [showMovableChat, setShowMovableChat] = useState(false);

  const [input, setInput] = useState('');
  const [botStats, setBotStats] = useState<BotStats | null>(null);
  // Check for fresh start and initialize empty messages
  const isFreshStart = localStorage.getItem('freshStart') === 'true';
  const [messages, setMessages] = useState<Message[]>(isFreshStart ? [] : []);
  const [loading, setLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState<string>('');
  const [showReflection, setShowReflection] = useState(false);
  const [streakStats, setStreakStats] = useState<{
    consecutiveDaysActive: number;
    consecutiveDaysJournaling: number;
    totalActiveDays: number;
  } | null>(null);

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'chat':
        // Chat is handled separately in the main layout now
        return null;

      case 'daily':
        return <PersonalityReflection userId={getCurrentUserId()} />;

      case 'journal':
        return (
          <TherapeuticJournal 
            userId={getCurrentUserId()} 
            onEntryCreated={(entry) => {
              console.log('New journal entry created:', entry);
            }}
          />
        );

      case 'memory':
        return <MemoryDashboard />;

      case 'analytics':
        return <AnalyticsDashboard userId={getCurrentUserId()} />;

      case 'challenges':
        return <ChallengeSystem onNavigate={setActiveSection} />;

      case 'rewards':
        return <WellnessRewards />;

      case 'community':
        return <CommunitySupport />;

      case 'adaptive':
        return <AdaptiveLearning />;

      case 'therapy-plans':
        return <AdaptiveTherapyPlan userId={getCurrentUserId()} onPlanUpdate={(plan) => console.log('Plan updated:', plan)} />;

      case 'agents':
        return <AgentSystem userId={getCurrentUserId()} />;

      case 'vr':
        return <VRTherapy />;

      case 'health':
        return <HealthIntegration />;

      case 'privacy':
        return <PrivacyCompliance />;

      case 'therapist':
        return <TherapistPortal />;

      case 'outcomes':
        return <TherapeuticAnalytics userId={getCurrentUserId()} />;

      case 'ehr':
        return <EHRIntegration />;

      case 'privacy-policy':
        return <PrivacyPolicy />;

      case 'themes':
        return (
          <div className="h-full theme-background p-6 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              <ThemeSelector onClose={() => setActiveSection('chat')} />
            </div>
          </div>
        );

      case 'voice':
        return (
          <div className="h-full theme-background p-6 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              <div className="theme-card backdrop-blur-sm rounded-2xl p-8 border border-[var(--theme-accent)]/30 shadow-lg">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">Voice Settings</h2>
                <VoiceSelector 
                  selectedVoice="james" 
                  onVoiceChange={(voice) => console.log('Voice changed:', voice)} 
                />
              </div>
            </div>
          </div>
        );

      case 'feedback':
        return <FeedbackSystem userId={getCurrentUserId()} />;

      case 'microphone-test':
        return <MicrophoneTest />;

      case 'welcome':
      default:
        return (
          <div className="flex items-center justify-center h-full text-white/60">
            <div className="text-center">
              <img src={chakraiLogo} alt="Chakrai" className="h-32 w-auto mx-auto mb-4" />
              <h1 className="text-4xl font-bold mb-4">Welcome to Chakrai</h1>
              <p className="text-lg">Your AI-powered mental wellness companion</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex bg-gray-900">
      <NeonCursor />
      
      {/* Sidebar Navigation */}
      <div className="w-64 bg-gray-800 p-4">
        <div className="mb-8">
          <img src={chakraiLogo} alt="Chakrai" className="h-10 w-auto" />
        </div>
        
        <nav className="space-y-2">
          <button
            onClick={() => setActiveSection('welcome')}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              activeSection === 'welcome' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            Home
          </button>
          
          <button
            onClick={() => setActiveSection('analytics')}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              activeSection === 'analytics' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            Analytics
          </button>
          
          <button
            onClick={() => setActiveSection('journal')}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              activeSection === 'journal' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            Journal
          </button>
          
          <button
            onClick={() => setActiveSection('adaptive')}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              activeSection === 'adaptive' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            Adaptive Learning
          </button>

          <button
            onClick={() => setActiveSection('challenges')}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              activeSection === 'challenges' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            Challenges
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 p-4 border-b border-gray-700">
          <h1 className="text-xl font-semibold text-white">Chakrai Mental Wellness</h1>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {renderActiveSection()}
        </div>
      </div>

      {/* Modals */}
      {showMovableChat && (
        <MovableChat onClose={() => setShowMovableChat(false)} />
      )}
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <AppLayout currentUserId={getCurrentUserId()} onDataReset={() => {}} />
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;