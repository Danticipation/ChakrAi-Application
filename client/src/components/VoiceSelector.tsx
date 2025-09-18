import React, { useState } from 'react';
import { Check, X, Volume2, Play, Pause, Settings } from 'lucide-react';

interface Voice {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female';
  accent: string;
  mood: string[];
}

const voices: Voice[] = [
  { 
    id: 'james', 
    name: 'Jonathan', 
    description: 'Professional and calming voice perfect for therapeutic conversations',
    gender: 'male',
    accent: 'American',
    mood: ['Professional', 'Calming', 'Reliable']
  },
  { 
    id: 'brian', 
    name: 'Brian', 
    description: 'Deep and resonant voice that conveys strength and stability',
    gender: 'male',
    accent: 'American',
    mood: ['Deep', 'Stable', 'Confident']
  },
  { 
    id: 'alexandra', 
    name: 'Alexandra', 
    description: 'Clear and articulate voice with excellent pronunciation',
    gender: 'female',
    accent: 'American',
    mood: ['Clear', 'Articulate', 'Intelligent']
  },
  { 
    id: 'carla', 
    name: 'Carla', 
    description: 'Warm and empathetic voice that creates emotional connection',
    gender: 'female',
    accent: 'American',
    mood: ['Warm', 'Empathetic', 'Caring']
  },
  { 
    id: 'hope', 
    name: 'Nova', 
    description: 'Warm and encouraging voice that inspires positivity',
    gender: 'female',
    accent: 'American',
    mood: ['Encouraging', 'Uplifting', 'Positive']
  },
  { 
    id: 'charlotte', 
    name: 'Charlotte', 
    description: 'Gentle and empathetic voice perfect for sensitive topics',
    gender: 'female',
    accent: 'British',
    mood: ['Gentle', 'Empathetic', 'Soothing']
  },
  { 
    id: 'bronson', 
    name: 'Bronson', 
    description: 'Confident and reassuring voice that builds trust',
    gender: 'male',
    accent: 'American',
    mood: ['Confident', 'Reassuring', 'Trustworthy']
  },
  { 
    id: 'marcus', 
    name: 'Peter', 
    description: 'Smooth and supportive voice with a modern edge',
    gender: 'male',
    accent: 'American',
    mood: ['Smooth', 'Supportive', 'Modern']
  }
];

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
  onClose?: () => void;
}

export default function VoiceSelector({ selectedVoice, onVoiceChange, onClose }: VoiceSelectorProps) {
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

  const handlePreview = async (voiceId: string) => {
    if (previewingVoice === voiceId) {
      setPreviewingVoice(null);
      return;
    }

    setPreviewingVoice(voiceId);
    
    try {
      // Generate preview audio
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: "Hello, I'm here to support your wellness journey. How are you feeling today?",
          voice: voiceId
        }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.addEventListener('ended', () => {
          setPreviewingVoice(null);
        });
        
        await audio.play();
      }
    } catch (error) {
      console.error('Voice preview failed:', error);
      setPreviewingVoice(null);
    }
  };

  const getVoiceIcon = (gender: string) => {
    return gender === 'male' ? 'ðŸ‘¨' : 'ðŸ‘©';
  };

  const getMoodColor = (mood: string) => {
    const colors: Record<string, string> = {
      Professional: 'text-blue-300',
      Calming: 'text-green-300',
      Reliable: 'text-blue-400',
      Deep: 'text-purple-300',
      Stable: 'text-gray-300',
      Confident: 'text-yellow-300',
      Clear: 'text-cyan-300',
      Articulate: 'text-indigo-300',
      Intelligent: 'text-blue-300',
      Warm: 'text-orange-300',
      Empathetic: 'text-pink-300',
      Caring: 'text-rose-300',
      Encouraging: 'text-yellow-300',
      Uplifting: 'text-green-300',
      Positive: 'text-lime-300',
      Gentle: 'text-purple-300',
      Soothing: 'text-blue-300',
      Reassuring: 'text-emerald-300',
      Trustworthy: 'text-teal-300',
      Smooth: 'text-slate-300',
      Supportive: 'text-green-300',
      Modern: 'text-violet-300'
    };
    return colors[mood] || 'text-gray-300';
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900/90 via-blue-900/90 to-purple-900/90 backdrop-blur-sm rounded-3xl border border-white/20 relative max-w-6xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-400/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-8 border-b border-white/20">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Volume2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Voice Selection</h2>
              <p className="text-blue-200">Choose your AI wellness companion's voice</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-3 hover:bg-red-500/20 rounded-xl transition-all duration-300 transform hover:scale-105"
              title="Close"
            >
              <X className="w-6 h-6 text-red-400" />
            </button>
          )}
        </div>
        
        {/* Content */}
        <div className="relative z-10 p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
          <p className="text-white/70 mb-8 text-lg leading-relaxed">
            Each voice has been carefully selected to provide the most therapeutic and supportive experience. 
            Click the preview button to hear how each voice sounds.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {voices.map((voice) => (
              <div
                key={voice.id}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                  selectedVoice === voice.id
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 border-blue-400 shadow-2xl shadow-blue-500/25'
                    : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 hover:shadow-xl'
                }`}
                onClick={() => onVoiceChange(voice.id)}
              >
                {/* Selection Indicator */}
                {selectedVoice === voice.id && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {/* Voice Info Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getVoiceIcon(voice.gender)}</div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{voice.name}</h3>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-white/60">{voice.gender}</span>
                        <span className="text-white/40">â€¢</span>
                        <span className="text-white/60">{voice.accent}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Preview Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(voice.id);
                    }}
                    className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                      previewingVoice === voice.id
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                    }`}
                    title={previewingVoice === voice.id ? 'Stop preview' : 'Preview voice'}
                  >
                    {previewingVoice === voice.id ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                {/* Description */}
                <p className="text-white/80 mb-4 leading-relaxed">{voice.description}</p>
                
                {/* Mood Tags */}
                <div className="flex flex-wrap gap-2">
                  {voice.mood.map((mood, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getMoodColor(mood)} bg-white/10`}
                    >
                      {mood}
                    </span>
                  ))}
                </div>
                
                {/* Selection Overlay */}
                {selectedVoice === voice.id && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-600/10 pointer-events-none" />
                )}
              </div>
            ))}
          </div>
          
          {/* Footer Info */}
          <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center space-x-3 mb-3">
              <Settings className="w-5 h-5 text-blue-400" />
              <h4 className="text-white font-semibold">Voice Settings</h4>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              You can change your voice preference at any time in the settings. Each conversation will use your selected voice for a consistent therapeutic experience.
            </p>
          </div>
        </div>
        
        {/* Close Button Footer */}
        {onClose && (
          <div className="relative z-10 p-6 border-t border-white/20 text-center">
            <button
              onClick={onClose}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Save Voice Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
