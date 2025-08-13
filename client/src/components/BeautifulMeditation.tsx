import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, Settings, Volume2, VolumeX, 
  Clock, Star, TreePine, Waves, Wind, Sun, Moon, 
  Heart, Brain, CheckCircle, SkipForward
} from 'lucide-react';

interface MeditationSession {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  type: 'guided' | 'breathing' | 'mindfulness' | 'visualization';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  backgroundSound: string;
  color: string;
  icon: React.ComponentType<any>;
}

const BeautifulMeditation: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedSession, setSelectedSession] = useState<MeditationSession | null>(null);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [meditationScript, setMeditationScript] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<'natasha' | 'natasha_husband'>('natasha');
  const [meditationTimer, setMeditationTimer] = useState<NodeJS.Timeout | null>(null);

  const meditationSessions: MeditationSession[] = [
    {
      id: 'morning-mindfulness',
      name: 'Morning Mindfulness',
      description: 'Start your day with clarity and intention',
      duration: 10,
      type: 'mindfulness',
      difficulty: 'beginner',
      backgroundSound: 'birds',
      color: 'from-orange-400 to-yellow-500',
      icon: Sun
    },
    {
      id: 'stress-relief',
      name: 'Stress Relief',
      description: 'Release tension and find calm',
      duration: 15,
      type: 'breathing',
      difficulty: 'beginner',
      backgroundSound: 'ocean',
      color: 'from-blue-400 to-cyan-500',
      icon: Waves
    },
    {
      id: 'deep-focus',
      name: 'Deep Focus',
      description: 'Enhance concentration and mental clarity',
      duration: 20,
      type: 'guided',
      difficulty: 'intermediate',
      backgroundSound: 'forest',
      color: 'from-green-400 to-emerald-500',
      icon: TreePine
    },
    {
      id: 'evening-unwind',
      name: 'Evening Unwind',
      description: 'Prepare for restful sleep',
      duration: 12,
      type: 'visualization',
      difficulty: 'beginner',
      backgroundSound: 'rain',
      color: 'from-purple-400 to-indigo-500',
      icon: Moon
    },
    {
      id: 'loving-kindness',
      name: 'Loving Kindness',
      description: 'Cultivate compassion and self-love',
      duration: 18,
      type: 'guided',
      difficulty: 'intermediate',
      backgroundSound: 'soft_music',
      color: 'from-pink-400 to-rose-500',
      icon: Heart
    },
    {
      id: 'body-scan',
      name: 'Body Scan',
      description: 'Connect with your physical sensations',
      duration: 25,
      type: 'mindfulness',
      difficulty: 'advanced',
      backgroundSound: 'nature',
      color: 'from-teal-400 to-blue-500',
      icon: Brain
    }
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate meditation script based on session type
  const generateMeditationScript = (session: MeditationSession): string => {
    const scripts = {
      mindfulness: `Welcome to your ${session.duration}-minute ${session.name} meditation. Find a comfortable position and close your eyes. Take a deep breath in through your nose, and slowly exhale through your mouth. Feel your body settling into this moment. Notice any thoughts that arise, acknowledge them gently, and let them pass like clouds in the sky. Focus on your breath, the rise and fall of your chest, the sensation of air entering and leaving your body. You are present, you are grounded, you are at peace.`,
      breathing: `Let's begin this ${session.duration}-minute ${session.name} meditation. Settle comfortably and close your eyes. Place one hand on your chest and one on your belly. Breathe in slowly for 4 counts, feeling your belly rise. Hold for 4 counts. Exhale slowly for 6 counts, feeling your belly fall. This is your anchor, your safe harbor. With each breath, you release tension and stress. Inhale calm, exhale worry. You are creating space for peace within yourself.`,
      guided: `Welcome to your ${session.duration}-minute ${session.name} meditation journey. Close your eyes and take three deep, cleansing breaths. Imagine yourself in a peaceful place - perhaps a serene forest, a quiet beach, or a comfortable room filled with soft light. You are safe here, you are loved here. Feel the warmth of compassion flowing through your body. With each breath, you are becoming more relaxed, more centered, more at peace with yourself and the world around you.`,
      visualization: `Begin your ${session.duration}-minute ${session.name} meditation. Close your eyes and breathe naturally. Visualize a warm, golden light above your head. This light represents peace, love, and healing. Watch as this light slowly descends, entering through the crown of your head, flowing through your entire body. Feel it warming every cell, healing every worry, dissolving every tension. You are filled with this beautiful, healing light. You are whole, you are peaceful, you are exactly where you need to be.`
    };
    return scripts[session.type] || scripts.mindfulness;
  };

  // Generate and play meditation audio
  const playMeditationAudio = async (session: MeditationSession) => {
    try {
      setIsLoadingAudio(true);
      console.log('Generating meditation audio for:', session.name);
      
      const script = generateMeditationScript(session);
      setMeditationScript(script);

      // Generate audio using ElevenLabs TTS
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: script,
          voice: selectedVoice, // Use selected meditation voice
          stability: 0.4, // More stable for meditation
          similarity_boost: 0.8 // Higher similarity for consistent voice
        }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Create new audio element
        const audio = new Audio(audioUrl);
        audio.volume = (volume / 100) * (isMuted ? 0 : 1);
        
        // Set up audio event listeners
        audio.addEventListener('loadstart', () => {
          console.log('Audio loading started');
        });
        
        audio.addEventListener('canplaythrough', () => {
          console.log('Audio ready to play');
          setIsLoadingAudio(false);
        });
        
        audio.addEventListener('play', () => {
          console.log('Audio started playing');
          setIsPlaying(true);
        });
        
        audio.addEventListener('pause', () => {
          console.log('Audio paused');
          setIsPlaying(false);
        });
        
        audio.addEventListener('ended', () => {
          console.log('Voice guidance completed, meditation continues...');
          // Don't stop the meditation or reset timer - voice is just guidance
          // The meditation timer continues independently
        });
        
        // Remove timeupdate listener - we'll use independent timer instead
        
        audio.addEventListener('error', (e) => {
          console.error('Audio playback error:', e);
          setIsPlaying(false);
          setIsLoadingAudio(false);
        });
        
        setAudioElement(audio);
        
        // Start independent meditation timer
        startMeditationTimer(session);
        
        // Start playing
        await audio.play();
        
      } else {
        console.error('Failed to generate meditation audio');
        setIsLoadingAudio(false);
        // Fallback to ambient sound meditation
        startAmbientMeditation(session);
      }
    } catch (error) {
      console.error('Error playing meditation audio:', error);
      setIsLoadingAudio(false);
      // Fallback to ambient sound meditation
      startAmbientMeditation(session);
    }
  };

  // Start independent meditation timer
  const startMeditationTimer = (session: MeditationSession) => {
    console.log(`Starting ${session.duration}-minute meditation timer for:`, session.name);
    setIsPlaying(true);
    setCurrentTime(0);
    
    const timer = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + 1;
        if (newTime >= session.duration * 60) {
          console.log('Meditation session completed');
          setIsPlaying(false);
          clearInterval(timer);
          setMeditationTimer(null);
          // Clean up audio if still playing
          if (audioElement) {
            audioElement.pause();
          }
          return session.duration * 60; // Keep final time displayed
        }
        return newTime;
      });
    }, 1000);
    
    setMeditationTimer(timer);
  };

  // Fallback ambient meditation without voice
  const startAmbientMeditation = (session: MeditationSession) => {
    console.log('Starting ambient meditation session:', session.name);
    startMeditationTimer(session);
  };

  // Handle play/pause
  const togglePlayPause = async () => {
    if (!selectedSession) return;

    if (isPlaying) {
      // Pause meditation
      setIsPlaying(false);
      if (meditationTimer) {
        clearInterval(meditationTimer);
        setMeditationTimer(null);
      }
      if (audioElement) {
        audioElement.pause();
      }
    } else {
      // Start or resume meditation
      if (currentTime === 0 || currentTime >= selectedSession.duration * 60) {
        // Start new session
        await playMeditationAudio(selectedSession);
      } else {
        // Resume existing session
        startMeditationTimer(selectedSession);
        if (audioElement) {
          await audioElement.play();
        }
      }
    }
  };

  // Reset meditation session
  const resetMeditation = () => {
    if (meditationTimer) {
      clearInterval(meditationTimer);
      setMeditationTimer(null);
    }
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    console.log('Meditation session reset');
  };

  // Update audio volume when volume state changes
  React.useEffect(() => {
    if (audioElement) {
      audioElement.volume = (volume / 100) * (isMuted ? 0 : 1);
    }
  }, [volume, isMuted, audioElement]);

  // Cleanup audio and timer on unmount
  React.useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
      if (meditationTimer) {
        clearInterval(meditationTimer);
      }
    };
  }, [audioElement, meditationTimer]);

  const SessionCard = ({ session, isSelected, onClick }: {
    session: MeditationSession;
    isSelected: boolean;
    onClick: () => void;
  }) => {
    const Icon = session.icon;
    
    return (
      <div
        className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
          isSelected 
            ? 'bg-white/25 border-2 border-white/50 shadow-2xl' 
            : 'bg-white/10 border border-white/20 hover:bg-white/15'
        }`}
        onClick={onClick}
      >
        {/* Background Gradient */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${session.color} opacity-20 group-hover:opacity-30 transition-opacity duration-300`} />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-r ${session.color}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-white/60" />
              <span className="text-white/80 text-sm">{session.duration} min</span>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-white mb-2">{session.name}</h3>
          <p className="text-white/70 text-sm mb-4 leading-relaxed">{session.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                session.difficulty === 'beginner' ? 'bg-green-500/20 text-green-300' :
                session.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-red-500/20 text-red-300'
              }`}>
                {session.difficulty}
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                {session.type}
              </span>
            </div>
            
            {isSelected && (
              <div className="flex items-center text-green-400">
                <CheckCircle className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🧘 Guided Meditation
          </h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            Find inner peace and balance through our collection of guided meditation practices
          </p>
        </div>

        {/* Settings Panel */}
        <div className="mb-8 p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Meditation Settings
            </h2>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-white/60 hover:text-white transition-colors duration-300"
            >
              {showSettings ? 'Hide' : 'Show'} Settings
            </button>
          </div>

          {showSettings && (
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Meditation Voice</label>
                <select 
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value as 'natasha' | 'natasha_husband')}
                >
                  <option value="natasha">Natasha (Female - Calming)</option>
                  <option value="natasha_husband">Natasha's Husband (Male - Deep)</option>
                </select>
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Voice Type</label>
                <select className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white">
                  <option value="guided">Voice Guided</option>
                  <option value="music">Music Only</option>
                  <option value="silent">Silent</option>
                </select>
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Background Sound</label>
                <select className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white">
                  <option value="none">None</option>
                  <option value="ocean">Ocean Waves</option>
                  <option value="forest">Forest Sounds</option>
                  <option value="rain">Rain</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Session Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Choose Your Practice</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meditationSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isSelected={selectedSession?.id === session.id}
                onClick={() => setSelectedSession(session)}
              />
            ))}
          </div>
        </div>

        {/* Meditation Player */}
        {selectedSession && (
          <div className="p-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="text-center mb-8">
              <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${selectedSession.color} mb-4`}>
                <selectedSession.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{selectedSession.name}</h3>
              <p className="text-white/70">{selectedSession.description}</p>
            </div>

            {/* Progress Circle */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 90}`}
                    strokeDashoffset={`${2 * Math.PI * 90 * (1 - currentTime / (selectedSession.duration * 60))}`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">
                      {formatTime(Math.max(0, selectedSession.duration * 60 - currentTime))}
                    </div>
                    <div className="text-white/60 text-sm">remaining</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-6 mb-6">
              <button
                onClick={resetMeditation}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300"
                title="Reset meditation"
              >
                <RotateCcw className="w-6 h-6 text-white" />
              </button>
              
              <button
                onClick={() => {
                  const newTime = Math.max(0, currentTime - 10);
                  setCurrentTime(newTime);
                  if (audioElement) {
                    audioElement.currentTime = newTime;
                  }
                }}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300"
              >
                <SkipForward className="w-6 h-6 text-white transform rotate-180" />
              </button>

              <button
                onClick={togglePlayPause}
                disabled={isLoadingAudio}
                className={`p-6 rounded-full bg-gradient-to-r ${selectedSession.color} hover:shadow-2xl transition-all duration-300 transform hover:scale-105 ${isLoadingAudio ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoadingAudio ? (
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </button>

              <button
                onClick={() => {
                  const newTime = Math.min(selectedSession.duration * 60, currentTime + 10);
                  setCurrentTime(newTime);
                  if (audioElement) {
                    audioElement.currentTime = newTime;
                  }
                }}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300"
              >
                <SkipForward className="w-6 h-6 text-white" />
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300"
              >
                {isMuted ? (
                  <VolumeX className="w-6 h-6 text-white" />
                ) : (
                  <Volume2 className="w-6 h-6 text-white" />
                )}
              </button>
            </div>

            {/* Volume Control */}
            {!isMuted && (
              <div className="flex items-center justify-center space-x-4">
                <Volume2 className="w-4 h-4 text-white/60" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-32 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-white/60 text-sm">{volume}%</span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default BeautifulMeditation;