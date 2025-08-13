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
                <label className="block text-white/80 text-sm font-medium mb-2">Voice Guide</label>
                <select className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white">
                  <option value="amy">Amy (Calm)</option>
                  <option value="james">James (Deep)</option>
                  <option value="sarah">Sarah (Gentle)</option>
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
                onClick={() => setCurrentTime(0)}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300"
              >
                <RotateCcw className="w-6 h-6 text-white" />
              </button>
              
              <button
                onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300"
              >
                <SkipForward className="w-6 h-6 text-white transform rotate-180" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-6 rounded-full bg-gradient-to-r ${selectedSession.color} hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </button>

              <button
                onClick={() => setCurrentTime(Math.min(selectedSession.duration * 60, currentTime + 10))}
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