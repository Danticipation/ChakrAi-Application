import React, { useState } from 'react';
import { Check, X } from 'lucide-react';

interface Voice {
  id: string;
  name: string;
  description: string;
}

const voices: Voice[] = [
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
];

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
  onClose?: () => void;
}

export default function VoiceSelector({ selectedVoice, onVoiceChange, onClose }: VoiceSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 relative max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-2xl font-bold text-white">Voice Selection</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-red-400" />
            </button>
          )}
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-white/70 mb-6">Choose your preferred AI voice companion. Each voice has unique characteristics for different moods and conversations.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {voices.map((voice) => (
              <button
                key={voice.id}
                onClick={() => {
                  onVoiceChange(voice.id);
                  if (onClose) onClose();
                }}
                className={`p-4 rounded-xl border transition-all duration-200 text-left relative ${
                  selectedVoice === voice.id
                    ? 'bg-blue-500/30 border-blue-400 text-white shadow-lg ring-2 ring-blue-400/50'
                    : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30'
                }`}
              >
                {selectedVoice === voice.id && (
                  <div className="absolute top-2 right-2">
                    <Check size={16} className="text-blue-400" />
                  </div>
                )}
                <h3 className="font-semibold mb-1">{voice.name}</h3>
                <p className="text-sm opacity-80">{voice.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}