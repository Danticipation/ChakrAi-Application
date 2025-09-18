import React from 'react';
import { Palette, Check, X, Sparkles, Heart, Leaf, Sun } from 'lucide-react';
import { useTheme, themes } from '../contexts/ThemeContext';

interface ThemeSelectorProps {
  onClose?: () => void;
}

export default function ThemeSelector({ onClose }: ThemeSelectorProps) {
  const { currentTheme, changeTheme } = useTheme();

  const getThemeIcon = (themeId: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      blue: Sparkles,
      lavender: Heart,
      teal: Leaf,
      sage: Leaf,
      rose: Heart,
      amber: Sun
    };
    return icons[themeId] || Sparkles;
  };

  const getThemeDescription = (themeId: string) => {
    const descriptions: Record<string, string> = {
      blue: 'Classic therapeutic blue for calming wellness and deep reflection',
      lavender: 'Gentle lavender for peaceful relaxation and emotional healing',
      teal: 'Healing teal for renewal, growth, and mental clarity',
      sage: 'Natural sage for grounding, balance, and mindful presence',
      rose: 'Warm rose for comfort, compassion, and self-love',
      amber: 'Golden amber for warmth, energy, and positive transformation'
    };
    return descriptions[themeId] || 'Beautiful theme for your wellness journey';
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-purple-900/95 backdrop-blur-sm rounded-3xl border border-white/20 relative max-w-5xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
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
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Choose Your Theme</h2>
              <p className="text-blue-200">Personalize your wellness experience</p>
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
            Choose a theme that resonates with your mood and enhances your therapeutic journey. 
            Each theme is carefully designed to support different aspects of mental wellness.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes.map((theme) => {
              const ThemeIcon = getThemeIcon(theme.id);
              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    changeTheme(theme.id);
                    if (onClose) onClose();
                  }}
                  className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left transform hover:scale-105 ${
                    currentTheme.id === theme.id
                      ? 'border-white bg-white/20 shadow-2xl shadow-white/25 scale-105'
                      : 'border-white/30 bg-white/5 hover:border-white/50 hover:bg-white/10'
                  }`}
                >
                  {/* Selection Indicator */}
                  {currentTheme.id === theme.id && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  {/* Theme Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ 
                          background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryLight})` 
                        }}
                      >
                        <ThemeIcon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white">{theme.name}</h3>
                    </div>
                  </div>
                  
                  {/* Color Preview Circles */}
                  <div className="flex items-center space-x-2 mb-4">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white/30 shadow-lg"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white/30 shadow-lg"
                      style={{ backgroundColor: theme.colors.primaryLight }}
                    />
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white/30 shadow-lg"
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                    <div className="flex-1 text-white/60 text-sm ml-2">
                      Color Palette
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-white/80 text-sm leading-relaxed mb-4">
                    {getThemeDescription(theme.id)}
                  </p>
                  
                  {/* Theme Preview Gradient Bar */}
                  <div className="h-3 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full w-full"
                      style={{ 
                        background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.primaryLight}, ${theme.colors.accent})` 
                      }}
                    />
                  </div>
                  
                  {/* Selection Status */}
                  {currentTheme.id === theme.id && (
                    <div className="mt-3 flex items-center justify-center text-green-300 text-sm font-medium">
                      <Check className="w-4 h-4 mr-1" />
                      Currently Active
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Current Theme Info */}
          <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center space-x-3 mb-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${currentTheme.colors.primary}, ${currentTheme.colors.primaryLight})` 
                }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h4 className="text-white font-semibold">Current Theme: {currentTheme.name}</h4>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Theme changes apply instantly across your entire wellness platform. Each theme is designed to support different moods and therapeutic needs.
            </p>
          </div>
        </div>
        
        {/* Footer */}
        {onClose && (
          <div className="relative z-10 p-6 border-t border-white/20 text-center">
            <button
              onClick={onClose}
              className="px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Apply Theme
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
