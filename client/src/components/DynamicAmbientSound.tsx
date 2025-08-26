import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Play, Pause, Volume2, VolumeX, Brain, Wind, TreePine, 
  Waves, Heart, Zap, Sun, Droplets 
} from 'lucide-react';

interface AmbientSound {
  id: string;
  name: string;
  category: 'nature' | 'meditation' | 'binaural' | 'white-noise';
  moodTags: string[];
  description: string;
  audioUrl: string;
  recommendedFor: string[];
  volume: number;
  score?: number;
}

interface UserMoodData {
  currentMood: string;
  energy: number;
  stress: number;
  anxiety: number;
  focus: number;
}

interface DynamicAmbientSoundProps {
  adaptiveMode?: boolean;
}

const DynamicAmbientSound: React.FC<DynamicAmbientSoundProps> = ({ 
  adaptiveMode = false 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentSound, setCurrentSound] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<{ [key: string]: boolean }>({});
  const [volume, setVolume] = useState<{ [key: string]: number }>({});
  const [isMuted, setIsMuted] = useState<{ [key: string]: boolean }>({});
  
  // Audio management refs
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const fadeIntervals = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Fetch user's current mood data for adaptive recommendations
  const { data: moodData } = useQuery<UserMoodData>({
    queryKey: ['/api/user-mood-current'],
    enabled: adaptiveMode
  });

  // Fetch ambient sounds from server-based configuration
  const { data: ambientSounds = [] } = useQuery({
    queryKey: ['ambient-sounds'],
    queryFn: async () => {
      const response = await axios.get('/api/ambient-sounds/available');
      return response.data;
    },
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes
  });

  const ambientSoundsArray: AmbientSound[] = ambientSounds || [];

  // Get icon component based on sound category/id
  const getAmbientIcon = (soundId: string, category: string) => {
    switch(soundId) {
      case 'rain-forest': return <TreePine className="w-5 h-5" />;
      case 'ocean-waves': return <Waves className="w-5 h-5" />;
      case 'white-noise': return <Zap className="w-5 h-5" />;
      case 'morning-birds': return <Sun className="w-5 h-5" />;
      case 'water-drops': return <Droplets className="w-5 h-5" />;
      default:
        switch(category) {
          case 'nature': return <TreePine className="w-5 h-5" />;
          case 'binaural': return <Brain className="w-5 h-5" />;
          case 'meditation': return <Wind className="w-5 h-5" />;
          default: return <Heart className="w-5 h-5" />;
        }
    }
  };

  // Sound categories for filtering
  const categories = [
    { id: 'all', name: 'All Sounds', icon: <Heart className="w-4 h-4" /> },
    { id: 'nature', name: 'Nature', icon: <TreePine className="w-4 h-4" /> },
    { id: 'meditation', name: 'Meditation', icon: <Wind className="w-4 h-4" /> },
    { id: 'binaural', name: 'Focus', icon: <Brain className="w-4 h-4" /> },
    { id: 'white-noise', name: 'White Noise', icon: <Zap className="w-4 h-4" /> }
  ];

  // Get AI-recommended sounds based on current mood
  const getRecommendedSounds = (): AmbientSound[] => {
    if (!moodData || !adaptiveMode) return ambientSoundsArray;

    const { currentMood, energy, stress, anxiety, focus } = moodData;
    
    // Score sounds based on mood alignment
    return ambientSoundsArray
      .map(sound => {
        let score = 0;
        
        // Mood tag matching
        if (sound.moodTags && sound.moodTags.includes(currentMood?.toLowerCase())) score += 3;
        
        // Stress-based recommendations
        if (stress > 7 && sound.category === 'nature') score += 2;
        if (stress > 8 && sound.id === 'heart-rhythm') score += 3;
        
        // Anxiety-based recommendations
        if (anxiety > 6 && sound.moodTags && sound.moodTags.includes('anxious')) score += 2;
        
        // Energy-based recommendations
        if (energy < 4 && sound.id === 'morning-birds') score += 2;
        if (energy > 7 && sound.category === 'binaural') score += 1;
        
        // Focus-based recommendations
        if (focus < 5 && sound.category === 'binaural') score += 2;
        if (focus < 3 && sound.id === 'white-noise') score += 2;
        
        return { ...sound, score };
      })
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  };

  const filteredSounds = selectedCategory === 'all' 
    ? getRecommendedSounds()
    : getRecommendedSounds().filter(sound => sound.category === selectedCategory);

  const initializeAudio = (sound: AmbientSound) => {
    if (audioRefs.current[sound.id]) return;
    
    const audio = new Audio(sound.audioUrl);
    audio.loop = true;
    audio.volume = sound.volume;
    audioRefs.current[sound.id] = audio;
    setVolume(prev => ({ ...prev, [sound.id]: sound.volume }));
  };

  const handlePlayPause = (sound: AmbientSound) => {
    initializeAudio(sound);
    
    const audio = audioRefs.current[sound.id];
    if (!audio) return;
    
    const playing = isPlaying[sound.id];
    
    if (playing) {
      audio.pause();
      setIsPlaying(prev => ({ ...prev, [sound.id]: false }));
    } else {
      // Stop other sounds when starting a new one
      Object.keys(audioRefs.current).forEach(soundId => {
        if (soundId !== sound.id && isPlaying[soundId]) {
          const otherAudio = audioRefs.current[soundId];
          if (otherAudio) {
            otherAudio.pause();
            setIsPlaying(prev => ({ ...prev, [soundId]: false }));
          }
        }
      });
      
      audio.play();
      setIsPlaying(prev => ({ ...prev, [sound.id]: true }));
      setCurrentSound(sound.id);
    }
  };

  const handleVolumeChange = (soundId: string, newVolume: number) => {
    if (audioRefs.current[soundId]) {
      audioRefs.current[soundId].volume = newVolume;
    }
    setVolume(prev => ({ ...prev, [soundId]: newVolume }));
  };

  const toggleMute = (soundId: string) => {
    const audio = audioRefs.current[soundId];
    if (audio) {
      const muted = isMuted[soundId];
      audio.volume = muted ? (volume[soundId] || 0.5) : 0;
      setIsMuted(prev => ({ ...prev, [soundId]: !muted }));
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      Object.values(fadeIntervals.current).forEach(interval => {
        clearInterval(interval);
      });
    };
  }, []);

  if (!ambientSoundsArray.length) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <Wind className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Loading Ambient Sounds
          </h3>
          <p className="text-gray-500">
            Preparing your therapeutic sound environment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Ambient Sounds</h2>
          <p className="text-gray-600">
            {adaptiveMode ? 'AI-recommended based on your mood' : 'Choose sounds to enhance your wellness'}
          </p>
        </div>
        <Wind className="w-8 h-8 text-blue-500" />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
              selectedCategory === category.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            {category.icon}
            <span className="text-sm font-medium">{category.name}</span>
          </button>
        ))}
      </div>

      {/* Mood-based recommendations */}
      {adaptiveMode && moodData && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">
            Recommended for your current mood
          </h3>
          <p className="text-sm text-blue-600">
            Based on your mood: {moodData.currentMood} • Stress: {moodData.stress}/10
          </p>
        </div>
      )}

      {/* Sound Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSounds.map((sound) => (
          <div
            key={sound.id}
            className={`border-2 rounded-lg p-4 transition-all duration-200 ${
              currentSound === sound.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getAmbientIcon(sound.id, sound.category)}
                <h3 className="font-semibold text-gray-800">{sound.name}</h3>
              </div>
              {adaptiveMode && sound.score && sound.score > 0 && (
                <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  Recommended
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-3">{sound.description}</p>

            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => handlePlayPause(sound)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                  isPlaying[sound.id]
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isPlaying[sound.id] ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>{isPlaying[sound.id] ? 'Stop' : 'Play'}</span>
              </button>

              {isPlaying[sound.id] && (
                <button
                  onClick={() => toggleMute(sound.id)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  {isMuted[sound.id] ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>

            {/* Volume Control */}
            {isPlaying[sound.id] && (
              <div className="space-y-2">
                <label className="text-xs text-gray-500">Volume</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted[sound.id] ? 0 : (volume[sound.id] || sound.volume)}
                  onChange={(e) => handleVolumeChange(sound.id, parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}

            {/* Recommended For Tags */}
            <div className="flex flex-wrap gap-1 mt-3">
              {sound.recommendedFor.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredSounds.length === 0 && (
        <div className="text-center py-8">
          <Wind className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No sounds found
          </h3>
          <p className="text-gray-500">
            Try selecting a different category or check back later.
          </p>
        </div>
      )}
    </div>
  );
};

export default DynamicAmbientSound;