import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, RefreshCw, Volume2, VolumeX, Loader2, Settings, Keyboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AffirmationData {
  affirmation: string;
  category: string;
  date: string;
}

interface VoicePreferences {
  selectedVoice: string;
  speechRate: number;
  pitch: number;
  language: string;
  enableFallback: boolean;
}

interface DailyAffirmationProps {
  onBack?: () => void;
  currentUser?: {
    id: string;
    preferences?: {
      voice?: VoicePreferences;
    };
  };
}

export default function DailyAffirmation({ onBack, currentUser }: DailyAffirmationProps) {
  const [affirmationData, setAffirmationData] = useState<AffirmationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [cachedAffirmations, setCachedAffirmations] = useState<Map<string, AffirmationData>>(new Map());
  const [voicePreferences, setVoicePreferences] = useState<VoicePreferences>({
    selectedVoice: 'carla',
    speechRate: 1.0,
    pitch: 1.0,
    language: 'en-US',
    enableFallback: true
  });
  const [announcement, setAnnouncement] = useState('');
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get today's date as cache key
  const getTodayKey = useCallback(() => {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  }, []);

  // Load cached affirmations on mount
  const loadCachedAffirmations = useCallback(() => {
    try {
      const cached = localStorage.getItem('daily-affirmations');
      if (cached) {
        const entries = JSON.parse(cached) as [string, AffirmationData][];
        const affirmationsMap = new Map<string, AffirmationData>(entries);
        setCachedAffirmations(affirmationsMap);
        
        // Check if we have today's affirmation
        const todayKey = getTodayKey();
        const todaysAffirmation = affirmationsMap.get(todayKey);
        
        if (todaysAffirmation) {
          setAffirmationData(todaysAffirmation);
          return true; // Don't fetch if we have today's cached
        }
      }
    } catch (error) {
      console.error('Failed to load cached affirmations:', error);
    }
    return false;
  }, [getTodayKey]);

  // Fetch voice preferences
  const fetchVoicePreferences = useCallback(async () => {
    try {
      if (currentUser?.preferences?.voice) {
        setVoicePreferences(currentUser.preferences.voice);
        return;
      }

      const response = await fetch('/api/user/voice-preferences', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const prefs = await response.json();
        setVoicePreferences(prefs);
      }
    } catch (error) {
      console.error('Failed to fetch voice preferences:', error);
      // Use defaults - no error to user as this is enhancement
    }
  }, [currentUser]);

  // Enhanced fetch function with caching
  const fetchDailyAffirmation = useCallback(async (forceRefresh = false) => {
    const todayKey = getTodayKey();
    
    // Check cache first unless forcing refresh
    setCachedAffirmations(currentCache => {
      if (!forceRefresh && currentCache.has(todayKey)) {
        const cached = currentCache.get(todayKey)!;
        setAffirmationData(cached);
        return currentCache; // Return unchanged cache
      }
      
      // Start fetch process
      setLoading(true);
      setError(null);
      
      // Use async function within effect
      (async () => {
        try {
          console.log('Fetching daily affirmation from:', '/api/daily-affirmation');
          const response = await fetch('/api/daily-affirmation');
          console.log('Response status:', response.status, response.statusText);
          
          if (response.ok) {
            const data = await response.json();
            console.log('API response data:', data);
            
            // Clean up the affirmation text (remove extra quotes if present)
            let cleanAffirmation = data.affirmation;
            if (typeof cleanAffirmation === 'string') {
              cleanAffirmation = cleanAffirmation.replace(/^["']|["']$/g, '');
            }
            
            const newAffirmation: AffirmationData = {
              affirmation: cleanAffirmation,
              category: data.category || 'Daily Inspiration',
              date: new Date().toLocaleDateString()
            };
            
            console.log('Processed affirmation:', newAffirmation);
            
            // Update state
            setAffirmationData(newAffirmation);
            
            // Update cache
            setCachedAffirmations(prevCache => {
              const newCache = new Map(prevCache);
              newCache.set(todayKey, newAffirmation);
              
              // Clean old entries (keep last 7 days)
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              const cleanupDate = sevenDaysAgo.toISOString().split('T')[0];
              
              const keysToDelete = Array.from(newCache.keys()).filter(key => key < cleanupDate);
              keysToDelete.forEach(key => newCache.delete(key));
              
              // Save to localStorage
              try {
                localStorage.setItem('daily-affirmations', JSON.stringify(Array.from(newCache.entries())));
              } catch (storageError) {
                console.warn('Failed to cache affirmation:', storageError);
              }
              
              return newCache;
            });
            
            toast({
              title: "Fresh Affirmation",
              description: "Your daily inspiration has been updated.",
              duration: 2000,
            });
            
          } else {
            throw new Error('Failed to fetch affirmation');
          }
        } catch (fetchError) {
          console.error('Failed to fetch daily affirmation:', fetchError);
          
          // Try to use yesterday's affirmation as fallback
          const yesterdayKey = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const fallback = currentCache.get(yesterdayKey);
          
          if (fallback) {
            setAffirmationData({
              ...fallback,
              category: fallback.category + ' (Yesterday)'
            });
            setError('Using previous affirmation - check your connection');
            
            toast({
              title: "Connection Issue",
              description: "Using previous affirmation. Check your internet connection.",
              variant: "destructive",
              duration: 4000,
            });
          } else {
            setError('Unable to fetch daily affirmation. Please try again later.');
            
            toast({
              title: "Connection Failed",
              description: "Unable to load affirmation. Please check your connection and try again.",
              variant: "destructive",
              duration: 5000,
            });
          }
        } finally {
          setLoading(false);
        }
      })();
      
      return currentCache; // Return unchanged cache for now
    });
  }, [getTodayKey, toast]);

  // Safe audio decoding with comprehensive validation
  const decodeAndPlayAudio = useCallback(async (audioData: string) => {
    try {
      // Validate base64 format
      if (!audioData || typeof audioData !== 'string') {
        throw new Error('Invalid audio data format');
      }
      
      // Remove data URL prefix if present
      const base64Data = audioData.replace(/^data:audio\/[^;]+;base64,/, '');
      
      // Validate base64
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
        throw new Error('Invalid base64 audio data');
      }
      
      // Decode safely
      let binaryData;
      try {
        binaryData = atob(base64Data);
      } catch (decodeError) {
        throw new Error('Failed to decode audio data');
      }
      
      // Convert to Uint8Array
      const audioBuffer = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        audioBuffer[i] = binaryData.charCodeAt(i);
      }
      
      // Validate audio size (reasonable limits)
      if (audioBuffer.length < 1000) {
        throw new Error('Audio file too small - may be corrupted');
      }
      
      if (audioBuffer.length > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Audio file too large');
      }
      
      // Create and play audio
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Set up event handlers
      audio.addEventListener('loadeddata', () => {
        setIsLoadingAudio(false);
        setIsPlaying(true);
      });
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        
        toast({
          title: "Audio Complete",
          description: "Affirmation playback finished.",
          duration: 2000,
        });
      });
      
      audio.addEventListener('error', (e) => {
        setIsPlaying(false);
        setIsLoadingAudio(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        throw new Error('Audio playback failed - file may be corrupted');
      });
      
      // Start loading audio
      await audio.load();
      await audio.play();
      
    } catch (error) {
      setIsLoadingAudio(false);
      setIsPlaying(false);
      audioRef.current = null;
      throw error;
    }
  }, [toast]);

  // Browser TTS fallback with user preferences
  const useBrowserTTS = useCallback(() => {
    if (!affirmationData) return;

    if ('speechSynthesis' in window) {
      // Stop any existing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(affirmationData.affirmation);
      utterance.rate = voicePreferences.speechRate;
      utterance.pitch = voicePreferences.pitch;
      utterance.lang = voicePreferences.language;
      
      // Try to find preferred voice
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.toLowerCase().includes(voicePreferences.selectedVoice.toLowerCase()) ||
        voice.lang === voicePreferences.language
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.onstart = () => {
        setIsPlaying(true);
        setIsLoadingAudio(false);
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        toast({
          title: "Audio Complete",
          description: "Browser speech synthesis finished.",
          duration: 2000,
        });
      };
      
      utterance.onerror = (event) => {
        setIsPlaying(false);
        setIsLoadingAudio(false);
        setError('Speech synthesis not available');
        
        toast({
          title: "Speech Failed",
          description: "Browser speech synthesis failed. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      };
      
      setIsLoadingAudio(false);
      speechSynthesis.speak(utterance);
      
      toast({
        title: "Using Browser Voice",
        description: "Playing affirmation with browser speech synthesis.",
        duration: 2000,
      });
    } else {
      setIsLoadingAudio(false);
      setError('Audio playback not supported on this device');
      
      toast({
        title: "Audio Not Supported",
        description: "This device doesn't support audio playback.",
        variant: "destructive",
        duration: 4000,
      });
    }
  }, [affirmationData, voicePreferences, toast]);

  // Enhanced audio playbook with user preferences and fallbacks
  const playAffirmationAudio = useCallback(async () => {
    if (!affirmationData || isPlaying || isLoadingAudio) return;
    
    setIsLoadingAudio(true);
    setError(null);
    
    try {
      // Try with user's preferred voice first
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          text: affirmationData.affirmation,
          voice: voicePreferences.selectedVoice,
          speechRate: voicePreferences.speechRate,
          pitch: voicePreferences.pitch
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.audio) {
          await decodeAndPlayAudio(data.audio);
          
          toast({
            title: "High-Quality Voice",
            description: `Playing with ${voicePreferences.selectedVoice} voice.`,
            duration: 2000,
          });
        } else {
          throw new Error('No audio data received from server');
        }
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.warn('TTS API failed, trying browser fallback:', error);
      
      if (voicePreferences.enableFallback) {
        useBrowserTTS();
      } else {
        setIsLoadingAudio(false);
        setIsPlaying(false);
        setError('Voice synthesis failed. Enable fallback in settings to use browser voice.');
        
        toast({
          title: "Voice Synthesis Failed",
          description: "Enable fallback in settings to use browser voice.",
          variant: "destructive",
          duration: 4000,
        });
      }
    }
  }, [affirmationData, isPlaying, isLoadingAudio, voicePreferences, decodeAndPlayAudio, useBrowserTTS, toast]);

  // Stop audio playbook
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    setIsPlaying(false);
    setIsLoadingAudio(false);
    
    toast({
      title: "Audio Stopped",
      description: "Affirmation playback stopped.",
      duration: 2000,
    });
  }, [toast]);

  // Initialize component
  useEffect(() => {
    const initializeComponent = async () => {
      // Load voice preferences first
      await fetchVoicePreferences();
      
      // Load cached affirmations
      const hasCached = loadCachedAffirmations();
      
      // Fetch if no cached data for today
      if (!hasCached) {
        fetchDailyAffirmation();
      }
    };
    
    initializeComponent();
  }, [fetchVoicePreferences, loadCachedAffirmations, fetchDailyAffirmation]);

  // Announce affirmation changes to screen readers
  useEffect(() => {
    if (affirmationData && !loading) {
      setAnnouncement(`New daily affirmation loaded: ${affirmationData.affirmation}`);
      
      // Clear announcement after screen reader has time to read it
      const timer = setTimeout(() => setAnnouncement(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [affirmationData, loading]);

  // Keyboard navigation and shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key) {
          case 'r':
            e.preventDefault();
            handleRefresh();
            break;
          case 'p':
            e.preventDefault();
            if (affirmationData) {
              if (isPlaying) {
                stopAudio();
              } else {
                playAffirmationAudio();
              }
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [affirmationData, isPlaying]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  const handleRefresh = useCallback(() => {
    fetchDailyAffirmation(true); // Force refresh
  }, [fetchDailyAffirmation]);

  // Debug function to clear cache
  const clearCache = useCallback(() => {
    localStorage.removeItem('daily-affirmations');
    setCachedAffirmations(new Map());
    toast({
      title: "Cache Cleared",
      description: "All cached affirmations have been cleared.",
      duration: 2000,
    });
  }, [toast]);

  return (
    <div className="h-full bg-gradient-to-br from-[#1a237e] to-[#3949ab] p-6 overflow-y-auto" role="main">
      {/* Screen reader announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {announcement}
      </div>
      
      <div className="max-w-2xl mx-auto">
        <div className="theme-primary/30 backdrop-blur-sm rounded-2xl p-6 border border-[#7986cb]/30 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Heart className="text-green-300" size={32} aria-hidden="true" />
              <h1 className="text-2xl font-bold text-white">Daily Affirmation</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-3 rounded-lg theme-primary/50 hover:theme-primary/70 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label={loading ? "Refreshing affirmation..." : "Refresh daily affirmation"}
                title={loading ? "Loading..." : "Refresh (Alt+R)"}
              >
                <RefreshCw className={`text-white ${loading ? 'animate-spin' : ''}`} size={20} aria-hidden="true" />
              </button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-3 rounded-xl bg-red-600/20 hover:bg-red-600/40 transition-all duration-200 border border-red-400/20 hover:border-red-400/40 focus:outline-none focus:ring-2 focus:ring-red-300"
                  aria-label="Back to Home"
                  title="Back to Home"
                >
                  <span className="text-white text-xl" aria-hidden="true">×</span>
                </button>
              )}
            </div>
          </div>

          {/* Keyboard shortcuts help */}
          <div className="mb-4 bg-blue-500/20 border border-blue-400/30 rounded-lg p-3 text-sm text-white/80">
            <div className="flex items-center space-x-2 mb-1">
              <Keyboard className="w-4 h-4" aria-hidden="true" />
              <span className="font-medium">Keyboard Shortcuts:</span>
            </div>
            <div className="text-xs space-y-1">
              <div><kbd className="px-1 py-0.5 bg-blue-400/30 rounded text-xs">Alt+R</kbd> - Refresh affirmation</div>
              <div><kbd className="px-1 py-0.5 bg-blue-400/30 rounded text-xs">Alt+P</kbd> - Play/Stop audio</div>
            </div>
          </div>

          {/* Affirmation Display */}
          <div className="bg-[var(--theme-secondary)] rounded-xl p-6 border border-[#3949ab]/30" role="region" aria-labelledby="affirmation-title">
            {loading ? (
              <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
                <div className="flex items-center space-x-3">
                  <Heart className="text-green-300 animate-pulse" size={24} aria-hidden="true" />
                  <span className="text-white">Loading your daily inspiration...</span>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-8" role="alert">
                <p className="text-red-300 mb-4">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="px-6 py-3 theme-primary text-white rounded-lg hover:theme-primary transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label="Try loading affirmation again"
                >
                  Try Again
                </button>
              </div>
            ) : affirmationData ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Heart className="text-green-300" size={20} aria-hidden="true" />
                    <h2 id="affirmation-title" className="text-lg font-semibold text-white">
                      {affirmationData.category} - {affirmationData.date}
                    </h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={isPlaying ? stopAudio : playAffirmationAudio}
                      disabled={isLoadingAudio}
                      className="p-3 rounded-lg theme-primary/50 hover:theme-primary/70 transition-colors disabled:opacity-50 flex items-center space-x-2 min-w-[120px] focus:outline-none focus:ring-2 focus:ring-white/50"
                      aria-label={
                        isLoadingAudio 
                          ? "Loading audio..." 
                          : isPlaying 
                            ? "Stop audio playback (Alt+P)" 
                            : "Listen to affirmation (Alt+P)"
                      }
                      title={
                        isLoadingAudio 
                          ? "Loading audio..." 
                          : isPlaying 
                            ? "Stop (Alt+P)" 
                            : `Listen with ${voicePreferences.selectedVoice} voice (Alt+P)`
                      }
                    >
                      {isLoadingAudio ? (
                        <Loader2 className="text-white animate-spin" size={20} aria-hidden="true" />
                      ) : isPlaying ? (
                        <VolumeX className="text-white" size={20} aria-hidden="true" />
                      ) : (
                        <Volume2 className="text-white" size={20} aria-hidden="true" />
                      )}
                      <span className="text-sm text-white">
                        {isLoadingAudio ? "Loading..." : isPlaying ? "Stop" : "Listen"}
                      </span>
                    </button>
                  </div>
                </div>
                
                <div className="text-center mb-4" role="article" aria-labelledby="affirmation-title">
                  <blockquote className="text-white/90 leading-relaxed text-xl font-medium italic" aria-label="Today's affirmation">
                    "{affirmationData.affirmation}"
                  </blockquote>
                </div>

                {/* Voice preferences indicator */}
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center space-x-2 text-sm text-white/60 bg-blue-500/20 rounded-lg px-3 py-1">
                    <Settings className="w-4 h-4" aria-hidden="true" />
                    <span>Voice: {voicePreferences.selectedVoice} • Rate: {voicePreferences.speechRate}x</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8" role="status">
                <Heart className="text-green-300 mx-auto mb-3" size={32} aria-hidden="true" />
                <p className="text-white/70">No affirmation loaded yet</p>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/60">
              Start your day with positive energy and self-compassion
            </p>
          </div>

          {/* Affirmation Tips */}
          <div className="mt-6 theme-primary/30 rounded-xl p-4 border border-[#7986cb]/30" role="complementary" aria-labelledby="tips-title">
            <h3 id="tips-title" className="text-lg font-semibold text-white mb-3 flex items-center">
              <Heart className="mr-2 text-green-300" size={20} aria-hidden="true" />
              How to Use Your Affirmation
            </h3>
            <ul className="text-sm text-white/80 space-y-2" role="list">
              <li role="listitem">• Read it slowly and mindfully</li>
              <li role="listitem">• Repeat it three times with intention</li>
              <li role="listitem">• Listen to the audio for deeper connection</li>
              <li role="listitem">• Carry this message with you throughout the day</li>
              <li role="listitem">• Return to it when you need encouragement</li>
            </ul>
          </div>

          {/* Cache status indicator */}
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-2 text-xs text-white/50">
              <span>
                {Array.from(cachedAffirmations.keys()).includes(getTodayKey())
                  ? "✓ Cached for today" 
                  : "◦ Fresh content"}
              </span>
              <span>•</span>
              <span>{cachedAffirmations.size} affirmations stored</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}