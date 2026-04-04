import React, { useState, useEffect } from 'react';
import { User, Sparkles, Check, RefreshCw } from 'lucide-react';

export type AvatarConfig = {
  style: string;
  seed: string;
  backgroundColor: string;
};

interface AvatarCustomizerProps {
  onAvatarSelect: (avatar: AvatarConfig) => void;
  currentAvatar?: AvatarConfig;
}

// Avatar styles with descriptions
const AVATAR_STYLES = [
  { id: 'adventurer', name: 'Adventurer', description: 'Playful & Friendly' },
  { id: 'adventurer-neutral', name: 'Adventurer Neutral', description: 'Calm & Balanced' },
  { id: 'avataaars', name: 'Avataaars', description: 'Classic & Expressive' },
  { id: 'big-ears', name: 'Big Ears', description: 'Cute & Whimsical' },
  { id: 'big-smile', name: 'Big Smile', description: 'Joyful & Warm' },
  { id: 'bottts', name: 'Bottts', description: 'Robotic & Fun' },
  { id: 'croodles', name: 'Croodles', description: 'Artistic & Creative' },
  { id: 'fun-emoji', name: 'Fun Emoji', description: 'Cheerful & Simple' },
  { id: 'lorelei', name: 'Lorelei', description: 'Elegant & Peaceful' },
  { id: 'micah', name: 'Micah', description: 'Modern & Professional' },
  { id: 'miniavs', name: 'Miniavs', description: 'Minimalist & Clean' },
  { id: 'notionists', name: 'Notionists', description: 'Thoughtful & Kind' },
  { id: 'open-peeps', name: 'Open Peeps', description: 'Diverse & Inclusive' },
  { id: 'personas', name: 'Personas', description: 'Professional & Polished' },
  { id: 'pixel-art', name: 'Pixel Art', description: 'Retro & Nostalgic' },
];

const BACKGROUND_COLORS = [
  { id: 'blue', color: '#3b82f6', name: 'Ocean Blue' },
  { id: 'purple', color: '#a855f7', name: 'Royal Purple' },
  { id: 'pink', color: '#ec4899', name: 'Rose Pink' },
  { id: 'green', color: '#10b981', name: 'Forest Green' },
  { id: 'orange', color: '#f59e0b', name: 'Sunset Orange' },
  { id: 'teal', color: '#14b8a6', name: 'Teal Wave' },
  { id: 'indigo', color: '#6366f1', name: 'Deep Indigo' },
  { id: 'transparent', color: 'transparent', name: 'Transparent' },
];

// Generate diverse seeds for variety
const SEED_OPTIONS = [
  'wellness1', 'companion2', 'friend3', 'guide4', 'helper5',
  'buddy6', 'partner7', 'support8', 'care9', 'harmony10',
  'peace11', 'joy12', 'calm13', 'zen14', 'flow15'
];

const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({ onAvatarSelect, currentAvatar }) => {
  const [selectedStyle, setSelectedStyle] = useState(currentAvatar?.style || 'adventurer');
  const [selectedSeed, setSelectedSeed] = useState(currentAvatar?.seed || 'wellness1');
  const [selectedBg, setSelectedBg] = useState(currentAvatar?.backgroundColor || '#3b82f6');
  const [previewSeeds, setPreviewSeeds] = useState<string[]>([]);

  useEffect(() => {
    // Generate random preview seeds
    const randomSeeds = Array.from({ length: 8 }, () => 
      SEED_OPTIONS[Math.floor(Math.random() * SEED_OPTIONS.length)] + Math.random().toString(36).substring(7)
    );
    setPreviewSeeds(randomSeeds);
  }, [selectedStyle]);

  const getAvatarUrl = (style: string, seed: string, size = 100) => {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&size=${size}`;
  };

  const handleStyleChange = (style: string) => {
    setSelectedStyle(style);
  };

  const handleSeedSelect = (seed: string) => {
    setSelectedSeed(seed);
  };

  const handleBgChange = (color: string) => {
    setSelectedBg(color);
  };

  const handleRandomize = () => {
    const randomStyle = AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)].id;
    const randomSeed = SEED_OPTIONS[Math.floor(Math.random() * SEED_OPTIONS.length)] + Math.random().toString(36).substring(7);
    const randomBg = BACKGROUND_COLORS[Math.floor(Math.random() * BACKGROUND_COLORS.length)].color;
    
    setSelectedStyle(randomStyle);
    setSelectedSeed(randomSeed);
    setSelectedBg(randomBg);
  };

  const handleSave = () => {
    onAvatarSelect({
      style: selectedStyle,
      seed: selectedSeed,
      backgroundColor: selectedBg
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-blue-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">Create Your Wellness Companion</h1>
          </div>
          <p className="text-blue-200 text-lg">Design an avatar that resonates with your wellness journey</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Preview Section */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Your Companion
              </h2>
              
              {/* Large Preview */}
              <div 
                className="w-full aspect-square rounded-2xl mb-4 flex items-center justify-center overflow-hidden shadow-2xl"
                style={{ backgroundColor: selectedBg }}
              >
                <img 
                  src={getAvatarUrl(selectedStyle, selectedSeed, 300)}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Randomize Button */}
              <button
                onClick={handleRandomize}
                className="w-full mb-3 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/50 text-purple-200 rounded-xl font-medium transition-all duration-300 flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Surprise Me!
              </button>

              {/* Save Button */}
              <button
                onClick={handleSave}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all duration-300 flex items-center justify-center"
              >
                <Check className="w-5 h-5 mr-2" />
                Save Companion
              </button>
            </div>
          </div>

          {/* Customization Section */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Style Selection */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Choose a Style</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {AVATAR_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => handleStyleChange(style.id)}
                    className={`p-3 rounded-xl transition-all duration-300 ${
                      selectedStyle === style.id
                        ? 'bg-blue-500/30 border-2 border-blue-400 shadow-lg'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                    title={`${style.name} - ${style.description}`}
                  >
                    <img
                      src={getAvatarUrl(style.id, 'preview', 80)}
                      alt={style.name}
                      className="w-full h-auto rounded-lg mb-2"
                    />
                    <p className="text-white text-xs text-center truncate">{style.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Appearance Selection */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Choose an Appearance</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {previewSeeds.map((seed, index) => (
                  <button
                    key={index}
                    onClick={() => handleSeedSelect(seed)}
                    className={`p-2 rounded-xl transition-all duration-300 ${
                      selectedSeed === seed
                        ? 'bg-purple-500/30 border-2 border-purple-400 shadow-lg'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <img
                      src={getAvatarUrl(selectedStyle, seed, 80)}
                      alt={`Option ${index + 1}`}
                      className="w-full h-auto rounded-lg"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Background Color */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Background Color</h3>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {BACKGROUND_COLORS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => handleBgChange(bg.color)}
                    className={`p-1 rounded-xl transition-all duration-300 ${
                      selectedBg === bg.color
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                        : 'hover:scale-105'
                    }`}
                    title={bg.name}
                  >
                    <div
                      className="w-12 h-12 rounded-lg shadow-md"
                      style={{ 
                        backgroundColor: bg.color,
                        border: bg.color === 'transparent' ? '2px dashed white' : 'none'
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarCustomizer;
