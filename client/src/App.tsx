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

  // Mobile modal navigation handler for challenge navigation
  const handleMobileModalNavigation = (section: string) => {
    console.log('📱 Mobile modal navigation triggered for:', section);
    setContentLoading(true);
    setMobileModalContent(section);
    setShowMobileModal(true);
    // Simulate content loading time
    setTimeout(() => setContentLoading(false), 800);
  };

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

  // Feature descriptions for user guidance
  const featureDescriptions: Record<string, string> = {
    'daily': 'AI-powered personality reflection that analyzes your conversations to provide insights about your communication style, emotional patterns, and personal growth opportunities.',
    'journal': 'Private therapeutic journaling with mood tracking, voice-to-text, and AI insights to help process thoughts and emotions.',
    'memory': 'View how Chakrai learns and remembers your personality, preferences, and conversation patterns to provide more personalized support.',
    'analytics': 'Comprehensive wellness analytics showing mood trends, journal insights, goal progress, and therapeutic outcomes over time.',
    'questions': 'Voluntary question deck with 12 categories including personality, lifestyle, emotional, social, and therapeutic insights to enhance AI personalization.',
    'challenges': 'Gamified wellness challenges with daily, weekly, streak, and seasonal goals to motivate consistent self-care and mental health practices.',
    'rewards': 'Wellness point system where you earn rewards for therapeutic activities and can unlock achievements, themes, and premium content.',
    'community': 'Connect with peer support groups, wellness challenges, and therapeutic forums in a safe, moderated environment.',
    'vr': 'Virtual reality guided meditation, exposure therapy, and immersive therapeutic environments for enhanced mental wellness.',
    'health': 'Integrate wearable devices to correlate physical health metrics with emotional wellness for comprehensive health insights.',
    // 'ambient-sound': 'AI-curated ambient soundscapes that adapt to your current mood and wellness needs for enhanced relaxation and focus.', // DISABLED due to audio quality issues
    'agents': 'Specialized AI therapists for specific needs: CBT Coach, Mindfulness Guide, Anxiety Specialist, and Self-Compassion Coach.',
    'adaptive': 'AI learning system that adapts therapeutic approaches based on your responses, progress, and preferred communication style.',
    'therapy-plans': 'Personalized therapeutic care plans with goals, exercises, progress tracking, and professional guidance recommendations.',
    'therapist': 'Professional therapist collaboration portal for sharing session summaries, progress reports, and care coordination.',
    'privacy': 'Advanced privacy controls with zero-knowledge encryption, differential privacy analytics, and GDPR compliance features.',
    'outcomes': 'Therapeutic outcome tracking with evidence-based metrics, progress indicators, and clinical assessment tools.',
    'ehr': 'Electronic health record integration with FHIR standards, insurance-eligible session summaries, and clinical data export.',
    'privacy-policy': 'Complete privacy policy and legal compliance information for Chakrai mental wellness companion services.',
    'microphone-test': 'Comprehensive microphone diagnostic tool to test browser compatibility, device permissions, MediaRecorder support, and audio recording functionality on your mobile device.'
  };
  const [newUserName, setNewUserName] = useState('');
  const [userQuery, setUserQuery] = useState('');

  // Device fingerprinting for anonymous user profiles
  const [deviceFingerprint, setDeviceFingerprint] = useState('');

  useEffect(() => {
    // Generate device fingerprint for anonymous user identification
    const generateFingerprint = () => {
      // Check if user wants a fresh start
      const urlParams = new URLSearchParams(window.location.search);
      const freshStart = urlParams.get('fresh') === 'true';
      
      if (freshStart) {
        // Clear all localStorage data for fresh start
        localStorage.clear();
        // Generate completely new random ID
        const randomId = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem('deviceFingerprint', randomId);
        return randomId;
      }
      
      // Check for existing fingerprint in localStorage
      const existingFingerprint = localStorage.getItem('deviceFingerprint');
      if (existingFingerprint) {
        return existingFingerprint;
      }
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx!.textBaseline = 'top';
      ctx!.font = '14px Arial';
      ctx!.fillText('Device fingerprint', 2, 2);
      
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL(),
        Math.random().toString(36), // Add randomness
        Date.now().toString() // Add timestamp
      ].join('|');
      
      // Create a simple hash of the fingerprint
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      const deviceId = Math.abs(hash).toString(36);
      localStorage.setItem('deviceFingerprint', deviceId);
      return deviceId;
    };

    setDeviceFingerprint(generateFingerprint());
  }, []);
  const [selectedVoice, setSelectedVoice] = useState('hope');
  const [selectedReflectionVoice, setSelectedReflectionVoice] = useState('hope');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(true);
  const [dailyAffirmation, setDailyAffirmation] = useState('Today is a new opportunity for growth and healing.');
  const [horoscopeText, setHoroscopeText] = useState<string>('');
  const [userZodiacSign, setUserZodiacSign] = useState<string>('aries');
  const [showMicroSession, setShowMicroSession] = useState(false);
  const [microSessionType, setMicroSessionType] = useState<'journal' | 'mood' | 'gratitude'>('journal');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Mobile modal states
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [mobileModalContent, setMobileModalContent] = useState('journal');
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await axios.get('/api/user/current');
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Keyboard support for closing modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showSettings) {
          setShowSettings(false);
        } else if (showThemeModal) {
          setShowThemeModal(false);
        } else if (showMobileModal) {
          setShowMobileModal(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSettings, showThemeModal, showMobileModal]);

  useEffect(() => {
    fetchBotStats();
    fetchDailyAffirmation();
    fetchHoroscope();
    fetchWeeklySummary();
    loadZodiacData();
    fetchStreakStats();
    recordAppVisit();
    
    // User proceeds directly to app after personality quiz

    // PWA notification event handlers
    const handleMoodTracking = (event: any) => {
      setMicroSessionType('mood');
      setShowMicroSession(true);
    };

    const handleVoiceJournal = (event: any) => {
      setMicroSessionType('journal');
      setShowMicroSession(true);
    };

    const handleDailyAffirmation = (event: any) => {
      fetchDailyAffirmation();
      // Could also show affirmation modal here
    };

    window.addEventListener('openMoodTracking', handleMoodTracking);
    window.addEventListener('openVoiceJournal', handleVoiceJournal);
    window.addEventListener('showDailyAffirmation', handleDailyAffirmation);

    return () => {
      window.removeEventListener('openMoodTracking', handleMoodTracking);
      window.removeEventListener('openVoiceJournal', handleVoiceJournal);
      window.removeEventListener('showDailyAffirmation', handleDailyAffirmation);
    };
  }, [currentUser]);

  const fetchBotStats = async () => {
    try {
      const response = await fetch('/api/bot-stats');
      if (response.ok) {
        const data = await response.json();
        setBotStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch bot stats:', error);
    }
  };

  const fetchStreakStats = async () => {
    try {
      if (currentUserId) {
        const response = await fetch(`/api/users/${currentUserId}/streak-stats`);
        if (response.ok) {
          const data = await response.json();
          setStreakStats(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch streak stats:', error);
    }
  };

  // Activity tracking function to update goal progress
  const updateUserActivity = async (activityType: string) => {
    try {
      const userId = getCurrentUserId();
      if (userId) {
        await fetch('/api/users/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            activityType: activityType,
            timestamp: new Date().toISOString()
          })
        });
        // Refresh streak stats after activity
        fetchStreakStats();
      }
    } catch (error) {
      console.error('Failed to update user activity:', error);
    }
  };

  const recordAppVisit = async () => {
    try {
      if (currentUserId) {
        await fetch(`/api/users/${currentUserId}/activity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activityType: 'app_visit' })
        });
        // Refresh streak stats after recording activity
        fetchStreakStats();
      }
    } catch (error) {
      console.error('Failed to record app visit:', error);
    }
  };

  const fetchDailyAffirmation = async () => {
    try {
      const response = await fetch('/api/daily-affirmation');
      if (response.ok) {
        const data = await response.json();
        setDailyAffirmation(data.affirmation || 'Stay positive and focused today.');
      }
    } catch (error) {
      console.error('Failed to fetch daily affirmation:', error);
      setDailyAffirmation('Today is a new opportunity to grow and learn.');
    }
  };

  const fetchHoroscope = async (sign: string = userZodiacSign) => {
    // Skip external API due to CORS restrictions, use OpenAI-generated horoscope directly
    try {
      const response = await fetch('/api/horoscope', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sign })
      });

      if (response.ok) {
        const data = await response.json();
        setHoroscopeText(data.horoscope);
      } else {
        setHoroscopeText('Your stars are aligning for a day of growth and positive energy.');
      }
    } catch (error) {
      setHoroscopeText('Today brings opportunities for reflection and personal development.');
    }
  };

  const fetchWeeklySummary = async () => {
    try {
      const response = await fetch('/api/weekly-summary');
      if (response.ok) {
        const data = await response.json();
        setWeeklySummary(data.summary || 'Your therapeutic journey continues to evolve positively.');
      }
    } catch (error) {
      console.error('Failed to fetch weekly summary:', error);
      setWeeklySummary('Focus on your mental wellness and personal growth this week.');
    }
  };

  const loadZodiacData = async () => {
    try {
      const response = await fetch('/api/horoscope/aries');
      if (response.ok) {
        const data = await response.json();
        setWeeklySummary(data.horoscope || 'Today brings new opportunities for growth.');
      }
    } catch (error) {
      console.error('Failed to load horoscope:', error);
    }
  };

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

    try {
      // Generate device fingerprint for anonymous user identification
      const deviceFingerprintValue = `browser_${navigator.userAgent.slice(0, 50)}_${screen.width}x${screen.height}_${new Date().getTimezoneOffset()}`;
      
      // Get or create session ID from localStorage  
      let sessionId = localStorage.getItem('chakrai_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        localStorage.setItem('chakrai_session_id', sessionId);
      }
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Fingerprint': deviceFingerprintValue,
          'X-Session-Id': sessionId
        },
        body: JSON.stringify({
          message: input,
          voice: selectedVoice
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage: Message = {
          sender: 'bot',
          text: data.response || data.message || 'I understand.',
          time: new Date().toLocaleTimeString()
        };

        setMessages(prev => [...prev, botMessage]);

        // Update chat activity tracking
        updateUserActivity('chat_session');

        // Track emotional tone analytics
        try {
          await fetch('/api/analytics/emotional-tone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: getCurrentUserId(),
              message: input,
              sessionId: Date.now().toString()
            })
          });
        } catch (error) {
          console.error('Analytics tracking failed:', error);
        }

        // Check for potential agent handoff
        try {
          const handoffResponse = await fetch('/api/agents/analyze-handoff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: getCurrentUserId(),
              message: input,
              conversationHistory: messages.slice(-5) // Send last 5 messages for context
            })
          });

          if (handoffResponse.ok) {
            const handoffData = await handoffResponse.json();
            
            if (handoffData.shouldHandoff && handoffData.confidence > 0.7 && handoffData.handoffMessage) {
              // Add agent handoff suggestion message
              const handoffMessage: Message = {
                sender: 'bot',
                text: handoffData.handoffMessage + "\n\n*Click 'Specialists' in the navigation to connect with this specialist.*",
                time: new Date().toLocaleTimeString()
              };
              
              setMessages(prev => [...prev, handoffMessage]);
            }
          }
        } catch (error) {
          console.error('Agent handoff analysis failed:', error);
        }

        // ElevenLabs Carla voice playback with aggressive activation
        if (data.audioUrl && data.audioUrl.length > 1000) {
          console.log(`ElevenLabs ${data.voiceUsed || 'Carla'} voice detected: ${data.audioUrl.length} characters`);
          setIsLoadingVoice(true);
          
          const playElevenLabsAudio = async () => {
            try {
              // Create audio with proper MIME type
              const audioBlob = new Blob([
                Uint8Array.from(atob(data.audioUrl), c => c.charCodeAt(0))
              ], { type: 'audio/mpeg' });
              
              const audioUrl = URL.createObjectURL(audioBlob);
              const audio = new Audio(audioUrl);
              
              // Configure audio for immediate playback
              audio.preload = 'auto';
              audio.volume = 0.8;
              
              // Play with multiple fallback attempts
              try {
                await audio.play();
                console.log('✓ ElevenLabs Carla voice played successfully');
                setIsLoadingVoice(false);
                
                // Cleanup URL after playing
                audio.addEventListener('ended', () => {
                  URL.revokeObjectURL(audioUrl);
                });
                
              } catch (playError) {
                console.log('Direct play blocked, setting up click trigger...');
                setIsLoadingVoice(false);
                
                // Show user that audio is ready
                const audioReadyMessage = {
                  sender: 'bot' as const,
                  text: '🔊 Audio ready - click anywhere to hear Carla voice',
                  time: new Date().toLocaleTimeString()
                };
                setMessages(prev => [...prev, audioReadyMessage]);
                
                // Single click anywhere triggers audio
                const playOnClick = async () => {
                  try {
                    await audio.play();
                    console.log('✓ ElevenLabs Carla voice played after user interaction');
                    
                    // Remove the audio ready message
                    setMessages(prev => prev.filter(msg => msg.text !== audioReadyMessage.text));
                    
                  } catch (err) {
                    console.error('Audio play failed even with user gesture:', err);
                  }
                  
                  document.removeEventListener('click', playOnClick);
                  URL.revokeObjectURL(audioUrl);
                };
                
                document.addEventListener('click', playOnClick, { once: true });
              }
              
            } catch (error) {
              console.error('ElevenLabs audio processing failed:', error);
              setIsLoadingVoice(false);
            }
          };
          
          // Execute audio playback
          playElevenLabsAudio();
          
        } else {
          console.log('No ElevenLabs audio received or audio data too short');
          if (data.error) {
            console.error('Server audio error:', data.error);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      // Enhanced mobile audio constraints
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      };

      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Microphone access granted');

      // Check for MediaRecorder support with different MIME types
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      }

      console.log('Using MIME type:', mimeType);
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('Audio data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing audio...');
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          console.log('Audio blob created:', audioBlob.size, 'bytes');
          await sendAudioToWhisper(audioBlob);
        } else {
          console.log('No audio data recorded');
          alert('No audio was recorded. Please try again.');
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        alert('Recording error occurred. Please try again.');
      };

      // Start recording with data collection interval
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      console.log('Recording started');

      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          console.log('Auto-stopping recording after 30 seconds');
          stopRecording();
        }
      }, 30000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      const err = error as any;
      if (err?.name === 'NotAllowedError') {
        alert('Microphone permission denied. Please allow microphone access and try again.');
      } else if (err?.name === 'NotFoundError') {
        alert('No microphone found. Please check your device.');
      } else {
        alert('Could not access microphone: ' + (err?.message || 'Unknown error'));
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearAllUserData = async () => {
    if (confirm('This will clear ALL your data (messages, journal entries, mood tracking, etc.) and give you a fresh start. Are you sure?')) {
      try {
        // Get current device fingerprint
        const currentDeviceFingerprint = localStorage.getItem('deviceFingerprint');
        
        // Call backend to clear all database data
        if (currentDeviceFingerprint) {
          const response = await fetch('/clear-user-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              deviceFingerprint: currentDeviceFingerprint
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to clear server data');
          }
        }
        
        // Clear all localStorage data
        localStorage.clear();
        
        // Clear all React Query cache
        queryClient.clear();
        
        // Generate a new device fingerprint
        const userAgent = navigator.userAgent;
        const screenResolution = `${screen.width}x${screen.height}`;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const language = navigator.language;
        const platform = navigator.platform;
        
        const fingerprint = userAgent + screenResolution + timezone + language + platform + Date.now();
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
          const char = fingerprint.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        
        const newDeviceId = Math.abs(hash).toString(36);
        localStorage.setItem('deviceFingerprint', newDeviceId);
        localStorage.setItem('freshStart', 'true');
        localStorage.setItem('freshStartTime', Date.now().toString());
        
        // Clear messages state immediately
        setMessages([]);
        
        // Show success message and refresh
        alert('All data cleared successfully! Starting fresh...');
        window.location.reload();
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Error clearing data. Please try again.');
      }
    }
  };

  const sendAudioToWhisper = async (audioBlob: Blob) => {
    try {
      console.log('Sending audio to Whisper API...');
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      console.log('Transcription response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Transcription result:', data);
        if (data.text && data.text.trim()) {
          setInput(data.text.trim());
          console.log('Input set to:', data.text.trim());
        } else {
          console.log('Empty transcription result');
          alert('No speech detected. Please try speaking louder or closer to the microphone.');
        }
      } else {
        const errorData = await response.text();
        console.error('Transcription failed:', response.status, errorData);
        alert('Transcription service unavailable. Please try again later.');
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('Failed to transcribe audio. Please check your internet connection and try again.');
    }
  };

  // Function to render main content (shared between modal and main view)
  const renderMainContent = (section: string) => {
    console.log('App: Rendering section:', section);
    switch (section) {
      case 'daily':
        return <PersonalityReflection userId={getCurrentUserId()} />;

      case 'journal':
        return (
          <TherapeuticJournal 
            userId={getCurrentUserId()} 
            onEntryCreated={(entry) => {
              console.log('New journal entry created:', entry);
              fetchStreakStats();
            }}
          />
        );

      case 'memory':
        return <MemoryDashboard />;

      case 'analytics':
        return <AnalyticsDashboard userId={getCurrentUserId()} />;

      case 'questions':
        console.log('App: Rendering VoluntaryQuestionDeck component');
        return <VoluntaryQuestionDeck />;

      case 'feedback':
        return <FeedbackSystem />;

      case 'challenges':
        return <ChallengeSystem onNavigate={setActiveSection} onMobileModalNavigate={handleMobileModalNavigation} />;

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

      case 'ambient-sound':
        return (
          <div className="flex items-center justify-center h-64 text-white/60">
            <p>Ambient sound feature disabled due to audio quality issues</p>
          </div>
        );

      case 'privacy':
        return <PrivacyCompliance />;

      case 'therapist':
        return <AiPerformanceMonitoringDashboard />;

      case 'outcomes':
        return <TherapeuticAnalytics userId={getCurrentUserId()} />;

      case 'ehr':
        return <EHRIntegration />;

      case 'privacy-policy':
        return <PrivacyCompliance />;

      case 'microphone-test':
        return <MicrophoneTest />;

      default:
        return (
          <div className="flex items-center justify-center h-64 text-white/60">
            <p>Feature coming soon...</p>
          </div>
        );
    }
  };

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
              fetchStreakStats();
            }}
          />
        );

      case 'memory':
        return <MemoryDashboard />;

      case 'analytics':
        return <AnalyticsDashboard userId={getCurrentUserId()} />;

      case 'challenges':
        return <ChallengeSystem onNavigate={setActiveSection} onMobileModalNavigate={handleMobileModalNavigation} />;

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

      case 'ambient-sound':
        return (
          <div className="flex items-center justify-center h-64 text-white/60">
            <p>Ambient sound feature disabled due to audio quality issues</p>
          </div>
        );

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
                <div className="space-y-6">
                  <div>
                    <label className="block text-white/90 text-lg font-medium mb-4">Select AI Voice Companion</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        // Original voices
                        { id: 'james', name: 'James', description: 'Professional and calming' },
                        { id: 'brian', name: 'Brian', description: 'Deep and resonant' },
                        { id: 'alexandra', name: 'Alexandra', description: 'Clear and articulate' },
                        { id: 'carla', name: 'Carla', description: 'Warm and empathetic' },
                        // New voices added
                        { id: 'hope', name: 'Hope', description: 'Warm and encouraging' },
                        { id: 'charlotte', name: 'Charlotte', description: 'Gentle and empathetic' },
                        { id: 'bronson', name: 'Bronson', description: 'Confident and reassuring' },
                        { id: 'marcus', name: 'Marcus', description: 'Smooth and supportive' }
                      ].map((voice) => (
                        <button
                          key={voice.id}
                          onClick={() => setSelectedVoice(voice.id)}
                          className={`p-4 rounded-xl border-2 transition-all text-left glass-button hover-lift ${
                            selectedVoice === voice.id
                              ? 'border-white/50 gradient-blue scale-105'
                              : 'border-white/30 hover:border-white/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-white font-semibold text-lg">{voice.name}</h3>
                            {selectedVoice === voice.id && (
                              <div className="w-3 h-3 bg-white rounded-full"></div>
                            )}
                          </div>
                          <p className="text-white/80 text-sm">{voice.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-center pt-4">
                    <p className="text-white/70 text-sm">
                      Current voice: <span className="font-semibold text-white">{selectedVoice.charAt(0).toUpperCase() + selectedVoice.slice(1)}</span>
                    </p>
                    <p className="text-white/60 text-xs mt-2">
                      Voice changes will apply to all AI responses and wellness features
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'horoscope':
        return <Horoscope onBack={() => setActiveSection('chat')} />;

      case 'affirmation':
        return <DailyAffirmation onBack={() => setActiveSection('chat')} />;

      case 'logo':
        return (
          <div className="h-full theme-background p-32 overflow-y-auto">
            <div className="max-w-2x1 mx-auto">
              <div className="theme-card backdrop-blur-sm rounded-2xl p-8 border border-[var(--theme-accent)]/30 shadow-lg text-center">
                <div className="mb-8">
                  <img src={chakraiLogo} alt="Chakrai" className="h-36 w-auto mx-auto mb-6" />
                  <h1 className="text-4xl font-bold text-white mb-4">Chakrai Mental Wellness</h1>
                  <p className="text-xl text-white/90 mb-6">AI Wellness Companion</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="theme-card rounded-xl p-6 border border-[var(--theme-accent)]/30">
                    <h3 className="text-lg font-semibold theme-text mb-3">AI Capabilities</h3>
                    <ul className="text-sm theme-text opacity-80 space-y-2 text-left">
                      <li>• OpenAI GPT-4o powered conversations</li>
                      <li>• ElevenLabs voice synthesis</li>
                      <li>• Personality mirroring & learning</li>
                      <li>• Crisis detection & intervention</li>
                      <li>• Wellness journal analysis</li>
                    </ul>
                  </div>

                  <div className="theme-card rounded-xl p-6 border border-[var(--theme-accent)]/30">
                    <h3 className="text-lg font-semibold theme-text mb-3">Wellness Features</h3>
                    <ul className="text-sm theme-text opacity-80 space-y-2 text-left">
                      <li>• Mood tracking & analytics</li>
                      <li>• VR therapeutic experiences</li>
                      <li>• Community peer support</li>
                      <li>• Wearable device integration</li>
                      <li>• Privacy-first architecture</li>
                    </ul>
                  </div>
                </div>

                <div className="theme-card rounded-xl p-6 border border-[var(--theme-accent)]/30">
                  <h3 className="text-lg font-semibold theme-text mb-3">Your Progress</h3>
                  <div className="grid grid-cols-2 gap-6 text-center">
                    <div>
                      <div className="text-2xl font-bold theme-text">{botStats?.stage || 'Wellness Companion'}</div>
                      <div className="text-sm theme-text opacity-60">Level {botStats?.level || 1}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold theme-text">95%</div>
                      <div className="text-sm theme-text opacity-60">Wellness Score</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <p className="text-sm text-white/60">
                    Your trusted AI companion for mental wellness and personal growth
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'goals':
        return (
          <div className="p-4 h-full overflow-y-auto theme-background">
            <h2 className="text-2xl font-bold theme-text mb-4">Wellness Goals</h2>
            <div className="space-y-4">
              {[
                { name: 'Daily Mindfulness', current: 12, target: 21, color: 'theme-accent' },
                { name: 'Anxiety Management', current: 8, target: 14, color: 'theme-primary' },
                { name: 'Social Connection', current: 3, target: 7, color: 'theme-secondary' }
              ].map((goal, index) => (
                <div key={index} className="theme-card backdrop-blur-sm rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold theme-text">{goal.name}</h3>
                    <span className="text-sm theme-text opacity-60">{goal.current}/{goal.target} days</span>
                  </div>
                  <div className="w-full theme-secondary rounded-full h-3">
                    <div 
                      className={`${goal.color} h-3 rounded-full transition-all duration-300`}
                      style={{ width: `${(goal.current / goal.target) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'questions':
        console.log('Desktop: Rendering VoluntaryQuestionDeck component');
        return <VoluntaryQuestionDeck />;

      case 'feedback':
        return <FeedbackSystem />;

      case 'microphone-test':
        return <MicrophoneTest />;

      default:
        // Default to showing the welcome/home content instead of empty space
        return (
          <div className="p-6 space-y-6 max-h-full overflow-y-auto">
            {/* Welcome Message */}
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

            {/* Quick Action to Start Chat */}
            <div className="flex justify-center mb-8">
              <button
                onClick={() => setShowMovableChat(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-white/20"
              >
                🧘 Start Your Reflection Journey
              </button>
            </div>
          </div>
        );
    }
  };



  return (
    <div className="min-h-screen theme-background flex flex-col mobile-polish-container">
      {/* Sparkling Stars Background */}
      <div className="stars-background">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="star"></div>
        ))}
      </div>
      {/* Mobile-Optimized Header */}
      <div className="theme-background">
        {/* Mobile: Polished Header */}
        <div className="block lg:hidden mobile-polish-header">
          {/* Top Row: Logo and Status */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <img src={chakraiLogo} alt="Chakrai" className="h-10 w-auto" />
              <div>
                <p className="text-white font-bold text-lg">Chakrai</p>
                <p className="text-white/70 text-xs">Mental Wellness</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="text-right">
              <p className="text-white/90 text-sm font-medium">Level {botStats?.level || 1}</p>
              <p className="text-white/60 text-xs">{botStats?.stage || 'Sidekick'}</p>
            </div>
          </div>
          
          {/* Mobile Header Cards: Horoscope and Affirmation */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {/* Horoscope Section */}
            <button 
              onClick={() => {
                setActiveSection('horoscope');
                updateUserActivity('horoscope_access');
              }}
              className="theme-primary border-soft glass-luxury gradient-soft hover-lift p-3 flex flex-col cursor-pointer text-luxury border-2 border-silver rounded-xl"
            >
              <h3 className="text-sm font-bold theme-text mb-2 underline font-serif">Horoscope</h3>
              <p className="text-xs theme-text text-left leading-relaxed flex-1 font-light line-clamp-2">
                {horoscopeText ? horoscopeText.substring(0, 80) + '...' : "Today brings opportunities for reflection..."}
              </p>
              <p className="text-xs theme-text/70 mt-2 font-medium">Tap to read</p>
            </button>
            
            {/* Affirmation Section */}
            <button 
              onClick={() => {
                setActiveSection('affirmation');
                updateUserActivity('affirmation_access');
              }}
              className="theme-primary border-soft glass-luxury gradient-soft hover-lift p-3 flex flex-col cursor-pointer text-luxury overflow-hidden border-2 border-silver rounded-xl"
            >
              <h3 className="text-sm font-bold theme-text mb-2 underline font-serif">Affirmation</h3>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs theme-text text-left leading-relaxed font-light line-clamp-2 overflow-hidden">
                  {dailyAffirmation.length > 80 ? dailyAffirmation.substring(0, 80) + '...' : dailyAffirmation}
                </p>
              </div>
              <p className="text-xs theme-text/70 mt-2 font-medium">Tap to hear</p>
            </button>
          </div>

        </div>

        {/* Desktop: Original Layout */}
        <div className="hidden lg:block">
          <div className="flex">
            <div className="w-72"></div>
            <div className="flex-1">
              <div className="max-w-6xl mx-auto header-card-container">
                <div className="grid grid-cols-3 gap-4 header-card-grid" style={{height: 'auto', minHeight: '300px'}}>
                  {/* Horoscope Section - Luxury Enhanced */}
                  <button 
                    onClick={() => {
                      setActiveSection('horoscope');
                      updateUserActivity('horoscope_access');
                    }}
                    className="theme-primary border-soft glass-luxury gradient-soft hover-lift p-3 sm:p-8 flex flex-col cursor-pointer text-luxury border-2 border-silver rounded-2xl"
                    style={{height: 'auto', minHeight: '280px'}}
                  >
                    <h3 className="text-lg sm:text-2xl font-bold theme-text mb-3 sm:mb-6 underline font-serif">Horoscope</h3>
                    <p className="text-sm sm:text-base theme-text text-left leading-relaxed flex-1 font-light">
                      {horoscopeText ? horoscopeText.substring(0, 200) + '...' : "Today brings opportunities for reflection and personal development. The cosmic energies align to support your mental wellness journey..."}
                    </p>
                    <p className="text-xs sm:text-sm theme-text/70 mt-3 sm:mt-6 font-medium tracking-wide">Click to expand</p>
                  </button>
                  
                  {/* Logo Section - Luxury Center - Enhanced Centering */}
                  <button 
                    onClick={() => setActiveSection('logo')}
                    className="theme-card border-luxury glass-luxury gradient-luxury shadow-luxury hover-lift p-3 sm:p-8 flex flex-col items-center justify-center border-2 border-silver hover:border-silver-light transition-all cursor-pointer text-luxury relative rounded-2xl"
                    style={{height: 'auto', minHeight: '280px'}}
                  >
                    <div className="flex flex-col items-center justify-center h-full w-full">
                      <img src={chakraiLogo} alt="Chakrai" className="h-20 sm:h-32 w-auto mb-2 sm:mb-4 drop-shadow-lg flex-shrink-0" />
                      <div className="text-center">
                        <p className="text-sm sm:text-xl theme-text font-semibold tracking-wide leading-tight">Chakrai Mental Wellness</p>
                        <p className="text-xs sm:text-sm theme-text-secondary mt-1 sm:mt-2 font-light">Click for more info</p>
                      </div>
                    </div>
                  </button>
                  
                  {/* Affirmation Section - Luxury Enhanced */}
                  <button 
                    onClick={() => {
                      setActiveSection('affirmation');
                      updateUserActivity('affirmation_access');
                    }}
                    className="theme-primary border-soft glass-luxury gradient-soft hover-lift p-3 sm:p-8 flex flex-col cursor-pointer text-luxury overflow-hidden border-2 border-silver rounded-2xl"
                    style={{height: 'auto', minHeight: '280px'}}
                  >
                    <h3 className="text-lg sm:text-2xl font-bold theme-text mb-3 sm:mb-6 underline font-serif">Affirmation</h3>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm sm:text-base theme-text text-left leading-relaxed font-light line-clamp-4 overflow-hidden">
                        {dailyAffirmation.length > 120 ? dailyAffirmation.substring(0, 120) + '...' : dailyAffirmation}
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm theme-text/70 mt-3 sm:mt-6 font-medium tracking-wide">Click to hear</p>
                  </button>
                </div>
              </div>
            </div>
            <div className="w-96"></div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Mobile Responsive */}
      <div className="flex-1 flex flex-col lg:flex-row theme-background">
        {/* Mobile and iPad Navigation - 4-Tier Hierarchy */}
        <div className="lg:hidden mobile-nav-polish">
          {/* Core Companion Section */}
          <div className="mobile-nav-section">
            <div className="mobile-nav-section-title">🟦 Core Companion</div>
            <div className="mobile-nav-grid-polish">
              {[
                { id: 'chat', label: 'Home', icon: '🏠' },
                { id: 'floating-chat', label: 'Reflective Chat', icon: '💭' },
                { id: 'challenges', label: 'Reflection Goals', icon: '🎯' },
                { id: 'rewards', label: 'Reflection Rewards', icon: '🎁' },

              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    console.log('Mobile Navigation: Clicked tab:', tab.id, tab.label);
                    if (tab.id === 'floating-chat') {
                      console.log('Mobile Navigation: Opening movable chat, current state:', showMovableChat);
                      setShowMovableChat(true);
                      console.log('Mobile Navigation: MovableChat state set to true');
                    } else if (['challenges', 'rewards'].includes(tab.id)) {
                      console.log('Mobile Navigation: Opening modal for tab:', tab.id);
                      setContentLoading(true);
                      setMobileModalContent(tab.id);
                      setShowMobileModal(true);
                      setTimeout(() => setContentLoading(false), 800);
                    } else {
                      console.log('Mobile Navigation: Setting active section:', tab.id);
                      setActiveSection(tab.id);
                    }
                  }}
                  className={`mobile-nav-btn-polish touch-target ${
                    activeSection === tab.id ? 'selected' : ''
                  }`}
                >
                  <span className="mobile-nav-icon">{tab.icon}</span>
                  <span className="mobile-nav-label">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mirrors of You Section */}
          <div className="mobile-nav-section">
            <div className="mobile-nav-section-title">💠 Mirrors of You</div>
            <div className="mobile-nav-grid-polish">
              {[
                { id: 'questions', label: 'Get to Know Me', icon: '❓' },
                { id: 'journal', label: 'Journal', icon: '📝' },
                { id: 'memory', label: 'Insight Vault', icon: '🧠' },
                { id: 'adaptive', label: 'Mind Mirror', icon: '🪞' },
                { id: 'analytics', label: 'State of Self', icon: '📊' },
                { id: 'health', label: 'Somatic Mirror', icon: '💗' },

              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    console.log('Mobile Navigation: Clicked tab:', tab.id, tab.label);
                    if (['journal', 'memory', 'analytics', 'adaptive', 'health', 'questions'].includes(tab.id)) {
                      console.log('Mobile Navigation: Opening modal for tab:', tab.id);
                      // Track activity for specific sections
                      if (tab.id === 'journal') {
                        updateUserActivity('journal_access');
                      }
                      setContentLoading(true);
                      setMobileModalContent(tab.id);
                      setShowMobileModal(true);
                      setTimeout(() => setContentLoading(false), 800);
                    } else {
                      setActiveSection(tab.id);
                    }
                  }}
                  className={`mobile-nav-btn-polish touch-target ${
                    activeSection === tab.id ? 'selected' : ''
                  }`}
                >
                  <span className="mobile-nav-icon">{tab.icon}</span>
                  <span className="mobile-nav-label">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Guided Support Section */}
          <div className="mobile-nav-section">
            <div className="mobile-nav-section-title">🧘 Guided Support</div>
            <div className="mobile-nav-grid-polish">
              {[
                { id: 'agents', label: 'Reflective Allies', icon: '🤝' },
                { id: 'vr', label: 'InnerScape', icon: '🌌' },
                { id: 'therapy-plans', label: 'Therapy Plans', icon: '📋' },
                { id: 'community', label: 'Community', icon: '👥' },

              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    console.log('Mobile Navigation: Clicked tab:', tab.id, tab.label);
                    setContentLoading(true);
                    setMobileModalContent(tab.id);
                    setShowMobileModal(true);
                    setTimeout(() => setContentLoading(false), 800);
                  }}
                  className={`mobile-nav-btn-polish touch-target ${
                    activeSection === tab.id ? 'selected' : ''
                  }`}
                >
                  <span className="mobile-nav-icon">{tab.icon}</span>
                  <span className="mobile-nav-label">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Personalization & Settings Section */}
          <div className="mobile-nav-section">
            <div className="mobile-nav-section-title">⚙️ Personalization & Settings</div>
            <div className="mobile-nav-grid-polish">
              {[
                { id: 'voice', label: 'Voice Settings', icon: '🎤' },
                { id: 'themes', label: 'Themes', icon: '🎨' },
                { id: 'daily', label: 'Reflection', icon: '🔮' },
                { id: 'feedback', label: 'Feedback', icon: '💡' },
                { id: 'microphone-test', label: 'Mic Test', icon: '🔧' },
                { id: 'privacy', label: 'Privacy', icon: '🔒' },

              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    console.log('Mobile Navigation: Clicked tab:', tab.id, tab.label);
                    if (tab.id === 'themes') {
                      console.log('Mobile Navigation: Opening theme modal');
                      setShowThemeModal(true);
                    } else if (tab.id === 'voice') {
                      console.log('Mobile Navigation: Opening settings');
                      setShowSettings(true);
                    } else if (['daily', 'feedback', 'microphone-test', 'privacy'].includes(tab.id)) {
                      console.log('Mobile Navigation: Opening modal for tab:', tab.id);
                      if (tab.id === 'daily') {
                        updateUserActivity('reflection_access');
                      }
                      setContentLoading(true);
                      setMobileModalContent(tab.id);
                      setShowMobileModal(true);
                      setTimeout(() => setContentLoading(false), 800);
                    } else {
                      setActiveSection(tab.id);
                    }
                  }}
                  className={`mobile-nav-btn-polish touch-target ${
                    activeSection === tab.id ? 'selected' : ''
                  }`}
                >
                  <span className="mobile-nav-icon">{tab.icon}</span>
                  <span className="mobile-nav-label">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Left Sidebar Navigation - 4-Tier Hierarchy */}
        <div className="hidden lg:flex w-72 flex-col justify-center py-8">
          {/* Core Companion Section */}
          <div className="mb-6">
            <div className="theme-text-secondary text-sm font-medium px-6 pb-2">🟦 Core Companion</div>
            {[
              { id: 'home', label: 'Chat with Chakrai' },
              { id: 'challenges', label: 'Reflection Goals' },
              { id: 'rewards', label: 'Reflection Rewards' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  console.log('Desktop Core Companion: Clicked tab:', tab.id, tab.label);
                  if (tab.id === 'home') {
                    console.log('Desktop: Opening MovableChat directly from Home');
                    setShowMovableChat(true);
                  } else {
                    setActiveSection(tab.id);
                    setIsFloatingChatOpen(false);
                  }
                }}
                className={`shimmer-border w-full h-16 px-6 text-lg font-medium transition-all border-soft hover-lift text-luxury ${
                  (tab.id === 'home' && showMovableChat) || 
                  (activeSection === tab.id && tab.id !== 'home')
                    ? 'theme-surface theme-text glass-luxury shadow-luxury'
                    : 'theme-primary theme-text hover:theme-primary-light gradient-soft'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mirrors of You Section */}
          <div className="mb-6 border-t border-white/10 pt-4">
            <div className="theme-text-secondary text-sm font-medium px-6 pb-2">💠 Mirrors of You</div>
            {[
              { id: 'questions', label: 'Get to Know Me' },
              { id: 'journal', label: 'Journal' },
              { id: 'memory', label: 'Insight Vault' },
              { id: 'adaptive', label: 'Mind Mirror' },
              { id: 'analytics', label: 'State of Self' },
              { id: 'health', label: 'Somatic Mirror' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  console.log('Desktop Mirrors of You: Clicked tab:', tab.id, tab.label);
                  setActiveSection(tab.id);
                }}
                className={`shimmer-border w-full h-16 px-6 text-lg font-medium transition-all border-soft hover-lift text-luxury ${
                  activeSection === tab.id
                    ? 'theme-surface theme-text glass-luxury shadow-luxury'
                    : 'theme-primary theme-text hover:theme-primary-light gradient-soft'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Guided Support Section */}
          <div className="mb-6 border-t border-white/10 pt-4">
            <div className="theme-text-secondary text-sm font-medium px-6 pb-2">🧘 Guided Support</div>
            {[
              { id: 'agents', label: 'Reflective Allies' },
              { id: 'vr', label: 'InnerScape' },
              { id: 'therapy-plans', label: 'Therapy Plans' },
              { id: 'community', label: 'Community' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  console.log('Desktop Guided Support: Clicked tab:', tab.id, tab.label);
                  setActiveSection(tab.id);
                }}
                className={`shimmer-border w-full h-16 px-6 text-lg font-medium transition-all border-soft hover-lift text-luxury ${
                  activeSection === tab.id
                    ? 'theme-surface theme-text glass-luxury shadow-luxury'
                    : 'theme-primary theme-text hover:theme-primary-light gradient-soft'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Personalization & Settings Section */}
          <div className="border-t border-white/10 pt-4">
            <div className="theme-text-secondary text-sm font-medium px-6 pb-2">⚙️ Personalization & Settings</div>
            {[
              { id: 'daily', label: 'Reflection' },
              { id: 'voice', label: 'Voice Settings' },
              { id: 'themes', label: 'Color Themes' },
              { id: 'feedback', label: 'Feedback & Suggestions' },
              { id: 'microphone-test', label: 'Mic Test' },
              { id: 'privacy', label: 'Privacy & Compliance' },
              { id: 'settings', label: 'Settings' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  console.log('Desktop Personalization: Clicked tab:', tab.id, tab.label);
                  if (tab.id === 'settings') {
                    setShowSettings(true);
                  } else {
                    setActiveSection(tab.id);
                  }
                }}
                className={`shimmer-border w-full h-16 px-6 text-lg font-medium transition-all border-soft hover-lift text-luxury ${
                  activeSection === tab.id
                    ? 'theme-surface theme-text glass-luxury shadow-luxury'
                    : 'theme-accent theme-text hover:theme-primary-light gradient-soft'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Center Content Area - Mobile Responsive with Prominent Chat */}
        <div className="flex-1 mobile-content-scroll-area relative" data-main-content>
          {activeSection === 'chat' && !isFloatingChatOpen ? (
            /* Enhanced Home Dashboard - Lively Wellness Overview */
            <div className="w-full h-full theme-background p-6 overflow-y-auto relative">
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 w-20 h-20 theme-accent rounded-full opacity-10 animate-pulse"></div>
                <div className="absolute top-32 right-20 w-16 h-16 theme-secondary rounded-full opacity-10 animate-bounce"></div>
                <div className="absolute bottom-20 left-20 w-24 h-24 theme-primary rounded-full opacity-10 animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute bottom-40 right-10 w-12 h-12 theme-accent rounded-full opacity-10 animate-bounce" style={{animationDelay: '2s'}}></div>
                <div className="absolute top-1/2 left-1/4 w-8 h-8 theme-secondary rounded-full opacity-5 animate-ping" style={{animationDelay: '3s'}}></div>
              </div>

              <div className="max-w-6xl mx-auto space-y-8 relative z-10">
                
                {/* Hero Welcome Section - Luxury Enhanced */}
                <div className="theme-card border-luxury glass-luxury gradient-luxury shadow-deep p-10 text-center hover-lift text-luxury border-2 border-silver">
                  <div className="relative mb-8">
                    <img 
                      src={chakraiLogo} 
                      alt="Chakrai" 
                      className="h-48 sm:h-56 w-auto mx-auto transform hover:scale-110 transition-transform duration-300 drop-shadow-xl" 
                    />
                    <div className="absolute -top-1 -right-1 w-4 h-4 theme-accent rounded-full animate-ping"></div>
                  </div>
                  <h1 className="text-5xl font-bold theme-text mb-4 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] bg-clip-text text-transparent font-serif">
                    Welcome to <span className="font-samarkan">Chakrai</span> Mental Wellness
                  </h1>
                  <p className="theme-text-secondary text-xl mb-8 font-light tracking-wide">Your AI companion is here to support your mental health and personal growth</p>
                  
                  {/* Enhanced Chat Button with Pulse Animation */}
                  <button
                    onClick={() => setShowMovableChat(true)}
                    className="relative mt-4 px-10 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:from-purple-700 hover:via-blue-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 animate-pulse border-2 border-silver"
                  >
                    <span className="relative z-10">💬 Chat with Chakrai Avatar</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-2xl blur opacity-30 animate-pulse"></div>
                  </button>
                  
                  {/* Status Indicators */}
                  <div className="flex justify-center space-x-6 mt-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="theme-text opacity-80">AI Online</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                      <span className="theme-text opacity-80">Voice Ready</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                      <span className="theme-text opacity-80">Memory Active</span>
                    </div>
                  </div>
                </div>

                {/* Real Streak Tracking Cards with Authentic Data */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div 
                    onClick={() => setActiveSection('daily')}
                    className="theme-card border-luxury glass-luxury gradient-soft shadow-luxury p-8 text-center cursor-pointer hover-lift text-luxury group border-2 border-silver"
                  >
                    <div className="text-5xl mb-4 group-hover:animate-bounce">🧠</div>
                    <h3 className="text-2xl font-semibold theme-text mb-3 font-serif">Mind & Mood</h3>
                    <p className="theme-text-secondary mb-4 font-light">Track your emotional wellness</p>
                    <div className="theme-text-secondary text-sm mb-4 font-medium">
                      {streakStats ? `${streakStats.consecutiveDaysActive} consecutive days` : 'No data yet'}
                    </div>
                    <button className="mt-3 px-6 py-3 theme-primary theme-text border-soft font-medium hover:opacity-80 transition-all group-hover:scale-110 shadow-soft">
                      View Reflection
                    </button>
                  </div>

                  <div 
                    onClick={() => {
                      setActiveSection('journal');
                      updateUserActivity('journal_access');
                    }}
                    className="theme-card border-luxury glass-luxury gradient-soft shadow-luxury p-8 text-center cursor-pointer hover-lift text-luxury group border-2 border-silver"
                  >
                    <div className="text-5xl mb-4 group-hover:animate-pulse">📝</div>
                    <h3 className="text-2xl font-semibold theme-text mb-3 font-serif">Journal</h3>
                    <p className="theme-text-secondary mb-4 font-light">Express your thoughts freely</p>
                    <div className="theme-text-secondary text-sm mb-4 font-medium">
                      {streakStats ? `${streakStats.consecutiveDaysJournaling} consecutive days` : 'No entries yet'}
                    </div>
                    <button className="mt-3 px-6 py-3 theme-primary theme-text border-soft font-medium hover:opacity-80 transition-all group-hover:scale-110 shadow-soft">
                      Write Entry
                    </button>
                  </div>

                  <div 
                    onClick={() => setActiveSection('analytics')}
                    className="theme-card border-luxury glass-luxury gradient-soft shadow-luxury p-8 text-center cursor-pointer hover-lift text-luxury group border-2 border-silver"
                  >
                    <div className="text-5xl mb-4 group-hover:animate-spin">📊</div>
                    <h3 className="text-2xl font-semibold theme-text mb-3 font-serif">Analytics</h3>
                    <p className="theme-text-secondary mb-4 font-light">View your progress insights</p>
                    <div className="theme-text-secondary text-sm mb-4 font-medium">
                      {streakStats ? `${streakStats.totalActiveDays} total active days` : 'No data yet'}
                    </div>
                    <button className="mt-3 px-6 py-3 theme-primary theme-text border-soft font-medium hover:opacity-80 transition-all group-hover:scale-110 shadow-soft">
                      View Analytics
                    </button>
                  </div>
                </div>

                {/* Real Streak Statistics Section */}
                {streakStats && (
                  <div className="theme-card backdrop-blur-sm rounded-2xl p-8 border-2 border-silver shadow-lg">
                    <h2 className="text-2xl font-bold theme-text mb-6 text-center">🔥 Your Wellness Streaks</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold theme-text mb-2">{streakStats.consecutiveDaysActive}</div>
                        <div className="theme-text-secondary">Consecutive Days Active</div>
                        <div className="text-sm theme-text opacity-60 mt-1">Keep visiting daily!</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold theme-text mb-2">{streakStats.consecutiveDaysJournaling}</div>
                        <div className="theme-text-secondary">Journal Streak</div>
                        <div className="text-sm theme-text opacity-60 mt-1">Express your thoughts daily</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold theme-text mb-2">{streakStats.totalActiveDays}</div>
                        <div className="theme-text-secondary">Total Active Days</div>
                        <div className="text-sm theme-text opacity-60 mt-1">Your wellness journey</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Daily Inspiration Section with Enhanced Animations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div 
                    onClick={() => setActiveSection('affirmation')}
                    className="theme-card backdrop-blur-sm rounded-xl p-6 border-2 border-silver shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300 group"
                  >
                    <h3 className="text-xl font-semibold theme-text mb-3 flex items-center">
                      <Star className="mr-2 group-hover:animate-spin" size={20} />
                      Daily Affirmation
                      <div className="ml-auto w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                    </h3>
                    <p className="theme-text text-sm leading-relaxed mb-4">{dailyAffirmation}</p>
                    <div className="flex items-center text-sm theme-accent hover:underline">
                      <span>Read Full Affirmation</span>
                      <span className="ml-2 group-hover:translate-x-2 transition-transform duration-300">→</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => setActiveSection('horoscope')}
                    className="theme-card backdrop-blur-sm rounded-xl p-6 border-2 border-silver shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300 group"
                  >
                    <h3 className="text-xl font-semibold theme-text mb-3 flex items-center">
                      <Sun className="mr-2 group-hover:animate-pulse" size={20} />
                      Wellness Insights
                      <div className="ml-auto w-2 h-2 bg-orange-400 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                    </h3>
                    <p className="theme-text text-sm leading-relaxed mb-4">
                      Your wellness journey is unique. Take time today to practice self-compassion and mindful awareness.
                    </p>
                    <div className="flex items-center text-sm theme-accent hover:underline">
                      <span>View Today's Guidance</span>
                      <span className="ml-2 group-hover:translate-x-2 transition-transform duration-300">→</span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Feature Shortcuts with Animations */}
                <div className="theme-card backdrop-blur-sm rounded-xl p-6 border border-[var(--theme-accent)]/30 shadow-lg">
                  <h3 className="text-xl font-semibold theme-text mb-6 text-center">Quick Access Wellness Features</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { id: 'memory', label: 'Memory', icon: '🎯', delay: '0s' },
                      { id: 'rewards', label: 'Rewards', icon: '🎁', delay: '0.2s' },
                      { id: 'community', label: 'Community', icon: '👥', delay: '0.4s' },
                      { id: 'agents', label: 'AI Specialists', icon: '🧩', delay: '0.6s' }
                    ].map((feature) => (
                      <button
                        key={feature.id}
                        onClick={() => setActiveSection(feature.id)}
                        className="flex flex-col items-center p-6 theme-surface rounded-xl hover:opacity-80 transition-all duration-300 transform hover:scale-110 hover:shadow-lg group"
                        style={{animationDelay: feature.delay}}
                      >
                        <span className="text-3xl mb-3 group-hover:animate-bounce">{feature.icon}</span>
                        <span className="theme-text text-sm font-medium">{feature.label}</span>
                        <div className="w-8 h-1 bg-gradient-to-r from-transparent via-[var(--theme-accent)] to-transparent mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </button>
                    ))}
                  </div>
                </div>



              </div>
            </div>
          ) : false ? (
            /* OLD CHAT INTERFACE DISABLED - USE MOVABLE CHAT INSTEAD */
            <div className="w-full h-full theme-background relative flex flex-col max-h-screen">
              {/* Compact Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                <div className="flex items-center space-x-3">
                  <img src={chakraiLogo} alt="Chakrai" className="h-8 w-auto" />
                  <div>
                    <h1 className="text-lg font-bold theme-text">Reflective Chat with Chakrai</h1>
                    <p className="theme-text-secondary text-xs">Your personal AI wellness companion - Voice: {selectedVoice.charAt(0).toUpperCase() + selectedVoice.slice(1)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg border-2 border-white"
                    title="Voice & Settings"
                  >
                    <Settings size={16} />
                  </button>
                  <button
                    onClick={() => setIsFloatingChatOpen(false)}
                    className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg border-2 border-white"
                    aria-label="Close chat"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Compact Chat Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto min-h-0">
                <div className="max-w-4xl mx-auto space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="theme-card backdrop-blur-sm rounded-xl p-6 border-2 border-silver">
                        <div className="text-4xl mb-3">💭</div>
                        <h3 className="text-lg font-semibold theme-text mb-2">Start Your Reflection</h3>
                        <p className="theme-text-secondary text-sm">Share what's on your mind. I'm here to listen and support your wellness journey.</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div 
                          className={`max-w-[75%] p-3 rounded-2xl border-2 border-silver ${
                            message.sender === 'user' 
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                              : 'theme-card backdrop-blur-sm theme-text'
                          }`}
                        >
                          <p className="leading-relaxed text-sm">{message.text}</p>
                          <p className="text-xs opacity-70 mt-1">{message.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="theme-card backdrop-blur-sm rounded-2xl p-3 border-2 border-silver">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          <span className="text-sm theme-text ml-2">Chakrai is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Compact Chat Input Area - Fixed at Bottom */}
              <div className="p-4 border-t border-white/10 shrink-0">
                <div className="max-w-4xl mx-auto">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                      placeholder="Share your thoughts or ask for guidance..."
                      className="flex-1 p-3 theme-card backdrop-blur-sm border-2 border-silver rounded-xl theme-text placeholder-white/50 focus:outline-none focus:border-purple-400 text-sm"
                    />
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border-2 border-silver shadow-lg ${
                        isRecording 
                          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                          : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white'
                      }`}
                      disabled={loading}
                      title={isRecording ? 'Stop recording' : 'Start voice recording'}
                    >
                      {isRecording ? <Square size={20} /> : <Mic size={20} />}
                    </button>
                    <button
                      onClick={sendMessage}
                      disabled={loading || !input.trim()}
                      className="px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border-2 border-silver text-sm"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Separate Full Panels for Other Sections */
            <div className="w-full h-full theme-background p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                {/* Feature Header */}
                <div className="theme-card backdrop-blur-sm rounded-xl p-6 border border-[var(--theme-accent)]/30 shadow-lg mb-6">
                  <h2 className="text-2xl font-bold theme-text text-center">
                    {activeSection === 'daily' && 'Personality Reflection'}
                    {activeSection === 'journal' && 'Therapeutic Journal'}
                    {activeSection === 'memory' && 'Insight Vault'}
                    {activeSection === 'analytics' && 'Analytics & Reporting'}
                    {activeSection === 'challenges' && 'Wellness Challenges'}
                    {activeSection === 'rewards' && 'Wellness Rewards'}
                    {activeSection === 'community' && 'Community & Professional Support'}
                    {activeSection === 'adaptive' && 'Adaptive Learning & Personalization'}
                    {activeSection === 'therapy-plans' && 'Personalized Therapy Plans'}
                    {activeSection === 'agents' && 'AI Therapeutic Specialists'}
                    {activeSection === 'vr' && 'VR/AR Therapy'}
                    {activeSection === 'health' && 'Health Integration'}
                    {activeSection === 'privacy' && 'Privacy & Compliance'}
                    {activeSection === 'horoscope' && 'Horoscope'}
                    {activeSection === 'affirmation' && 'Daily Affirmation'}
                    {activeSection === 'logo' && 'Chakrai Information'}
                    {activeSection === 'goals' && 'Wellness Goals'}
                    {activeSection === 'outcomes' && 'Therapeutic Outcomes'}
                    {activeSection === 'ehr' && 'EHR Integration'}
                    {activeSection === 'privacy-policy' && 'Privacy Policy & Terms'}
                    {activeSection === 'questions' && 'Question Deck'}
                    {activeSection === 'feedback' && 'Feedback & Suggestions'}
                  </h2>
                </div>
                
                {/* Feature Content */}
                <div className="theme-card backdrop-blur-sm rounded-xl p-6 border border-[var(--theme-accent)]/30 shadow-lg">
                  {renderActiveSection()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Stats Sidebar - Enhanced with Rounded Cards and Gradients */}
        <div className="hidden lg:block w-96 py-8 px-8">
          <div className="text-white text-2xl font-bold mb-8 text-center underline">Goal Tracking</div>
          
          {/* Enhanced Progress Tracking with Rounded Cards and Gradients */}
          <div className="space-y-6">
            {/* Daily Journaling Progress */}
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/30 backdrop-blur-sm border-2 border-silver rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="theme-text text-lg font-bold mb-4 flex items-center gap-2">
                📝 Daily Journaling
              </div>
              <div className="bg-black/20 rounded-full h-6 mb-4 overflow-hidden">
                <div 
                  className="h-6 rounded-full bg-gradient-to-r from-green-400 via-green-500 to-emerald-600 shadow-lg transition-all duration-500 ease-out"
                  style={{width: streakStats ? `${Math.min(100, (streakStats.consecutiveDaysJournaling / 30) * 100)}%` : '0%'}}
                ></div>
              </div>
              <div className="theme-text text-base font-medium">{streakStats ? `${streakStats.consecutiveDaysJournaling} day streak` : '0 day streak'}</div>
              <div className="theme-text-secondary text-sm mt-1">Target: 30 days</div>
            </div>

            {/* Weekly Chat Sessions */}
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/30 backdrop-blur-sm border-2 border-silver rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="theme-text text-lg font-bold mb-4 flex items-center gap-2">
                💬 Chat Activity
              </div>
              <div className="bg-black/20 rounded-full h-6 mb-4 overflow-hidden">
                <div 
                  className="h-6 rounded-full bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-600 shadow-lg transition-all duration-500 ease-out"
                  style={{width: streakStats ? `${Math.min(100, (streakStats.consecutiveDaysActive / 7) * 100)}%` : '0%'}}
                ></div>
              </div>
              <div className="theme-text text-base font-medium">{streakStats ? `${streakStats.consecutiveDaysActive} active days` : '0 active days'}</div>
              <div className="theme-text-secondary text-sm mt-1">Target: 7 days</div>
            </div>

            {/* Total Active Days */}
            <div className="bg-gradient-to-br from-purple-500/20 to-violet-600/30 backdrop-blur-sm border-2 border-silver rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="theme-text text-lg font-bold mb-4 flex items-center gap-2">
                📊 Total Active Days
              </div>
              <div className="bg-black/20 rounded-full h-6 mb-4 overflow-hidden">
                <div 
                  className="h-6 rounded-full bg-gradient-to-r from-purple-400 via-purple-500 to-violet-600 shadow-lg transition-all duration-500 ease-out"
                  style={{width: streakStats ? `${Math.min(100, (streakStats.totalActiveDays / 30) * 100)}%` : '0%'}}
                ></div>
              </div>
              <div className="theme-text text-base font-medium">{streakStats ? `${streakStats.totalActiveDays} days total` : '0 days total'}</div>
              <div className="theme-text-secondary text-sm mt-1">Target: 30 days</div>
            </div>

            {/* Wellness Journey */}
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/30 backdrop-blur-sm border-2 border-silver rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-center">
              <div className="theme-text text-lg font-bold mb-4 flex items-center justify-center gap-2">
                🌟 Wellness Journey
              </div>
              <div className="theme-text text-3xl font-bold mb-3 bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                {streakStats && streakStats.totalActiveDays > 0 ? `Day ${streakStats.totalActiveDays}` : 'Day 1'}
              </div>
              <div className="theme-text-secondary text-sm">
                {streakStats && streakStats.totalActiveDays > 0 ? 'Keep going strong!' : 'Your journey begins'}
              </div>
            </div>

            {/* Reset Data Button */}
            <div className="bg-gradient-to-br from-red-500/20 to-red-600/30 backdrop-blur-sm border-2 border-silver rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
              <button 
                onClick={clearAllUserData}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                title="Clear all data for fresh start"
              >
                🔄 Reset All Data
              </button>
              <div className="theme-text text-xs mt-2 opacity-70">
                Clears all personal data
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50 mobile-modal-content"
          style={{ paddingTop: '60px', paddingBottom: '60px' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSettings(false);
            }
          }}
        >
          <div className="theme-card rounded-2xl p-6 w-full max-w-md border border-[var(--theme-accent)]/30 relative max-h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Voice Settings</h3>
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg border-2 border-white mb-1"
                  aria-label="Close settings"
                  style={{ zIndex: 9999 }}
                >
                  <X size={24} />
                </button>
                <span className="text-xs text-white/70">Close</span>
              </div>
            </div>
            <VoiceSelector 
              selectedVoice={selectedVoice} 
              onVoiceChange={setSelectedVoice} 
              onClose={() => setShowSettings(false)}
            />
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 theme-accent theme-text rounded-lg hover:theme-primary transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}



      {/* PWA Manager */}
      <PWAManager onNotificationPermissionChange={setNotificationsEnabled} />

      {/* Micro Session Modal */}
      <MicroSession
        isOpen={showMicroSession}
        onClose={() => setShowMicroSession(false)}
        sessionType={microSessionType}
        onComplete={(data) => {
          console.log('Micro session completed:', data);
          setShowMicroSession(false);
        }}
      />

      {/* Theme Selection Modal */}
      {showThemeModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowThemeModal(false);
            }
          }}
        >
          <div className="theme-card rounded-2xl p-6 w-full max-w-md border border-[var(--theme-accent)]/30 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold theme-text">Choose Your Theme</h3>
              <button
                onClick={() => setShowThemeModal(false)}
                className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Close theme modal"
              >
                <X size={20} />
              </button>
            </div>
            <ThemeSelector />
          </div>
        </div>
      )}

      {/* Mobile Feature Modal */}
      {showMobileModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 mobile-modal-content"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMobileModal(false);
            }
          }}
        >
          <div className={`theme-card rounded-2xl p-6 w-full border border-[var(--theme-accent)]/30 relative max-h-[90vh] overflow-y-auto mobile-content-area ${
            mobileModalContent === 'therapy-plans' ? 'max-w-6xl' : 'max-w-lg'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold theme-text capitalize">
                {mobileModalContent.replace('-', ' ')}
              </h3>
              <button
                onClick={() => {
                  setShowMobileModal(false);
                  setContentLoading(false);
                }}
                className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
            {/* Feature Description */}
            <div className="mb-4 p-4 theme-surface rounded-lg border border-white/20">
              <p className="theme-text-secondary text-sm leading-relaxed">
                {featureDescriptions[mobileModalContent as keyof typeof featureDescriptions] || 'Loading feature information...'}
              </p>
            </div>
            
            {/* Content Area */}
            <div className="text-white">
              {contentLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <svg className="animate-spin h-8 w-8 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="theme-text text-center">Loading {mobileModalContent.replace('-', ' ')}...</p>
                  <p className="theme-text-secondary text-sm text-center mt-2">Preparing your personalized content</p>
                </div>
              ) : (
                renderMainContent(mobileModalContent)
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel Modal */}
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          onReset={clearAllUserData}
          selectedVoice={selectedVoice}
          onVoiceChange={setSelectedVoice}
          currentTheme={currentTheme.id}
          onThemeChange={changeTheme}
        />
      )}

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />

      {/* Usage Limit Modal */}
      <UsageLimitModal
        isOpen={showUsageLimitModal}
        onClose={() => setShowUsageLimitModal(false)}
        onUpgrade={() => {
          setShowUsageLimitModal(false);
          setShowSubscriptionModal(true);
        }}
      />

      {/* Floating Chat Component - Only show when NOT in desktop main chat mode */}
      {!(activeSection === 'chat' && isFloatingChatOpen) && (
        <FloatingChat
          isOpen={isFloatingChatOpen}
          onToggle={() => setIsFloatingChatOpen(!isFloatingChatOpen)}
          selectedVoice={selectedVoice}
        />
      )}

      {/* Movable Chat with Avatar */}
      {showMovableChat && (
        <>
          {console.log('Rendering MovableChat, showMovableChat:', showMovableChat)}
          <MovableChat
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
            onClose={() => {
              console.log('MovableChat onClose called');
              setShowMovableChat(false);
            }}
          />
        </>
      )}
    </div>
  );
};

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
        
        // Check if user exists or create anonymous user
        const response = await axios.post('/api/users/anonymous', {
          deviceFingerprint
        });
        
        const userId = response.data.user.id;
        setCurrentUserId(userId);
        
        // Check if this specific user needs personality quiz
        const profileResponse = await axios.get(`/api/user-profile-check/${userId}`);
        
        if (profileResponse.data.needsQuiz) {
          setShowPersonalityQuiz(true);
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
          axios.delete(`/api/users/${currentUserId}/goals`),
          axios.delete(`/api/users/${currentUserId}/achievements`)
        ]);
        
        // Show personality quiz for fresh start
        setShowPersonalityQuiz(true);
        
        // Clear localStorage
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