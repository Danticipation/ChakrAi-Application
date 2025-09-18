import React, { useState } from 'react';
import { X, Settings, RefreshCw, Volume2, Palette, Database, Download, Info, User, LogIn, LogOut } from 'lucide-react';
import { getCurrentUserId } from '../utils/userSession';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

interface SettingsPanelProps {
  onClose: () => void;
  onReset: () => void;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  onClose,
  onReset,
  selectedVoice,
  onVoiceChange,
  currentTheme,
  onThemeChange
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { user, isAuthenticated, logout } = useAuth();

  const voices = [
    { id: 'james', name: 'James', description: 'Professional & Calming' },
    { id: 'brian', name: 'Brian', description: 'Deep & Resonant' },
    { id: 'alexandra', name: 'Alexandra', description: 'Clear & Articulate' },
    { id: 'carla', name: 'Carla', description: 'Warm & Empathetic' },
    { id: 'hope', name: 'Hope', description: 'Warm & Encouraging' },
    { id: 'charlotte', name: 'Charlotte', description: 'Gentle & Empathetic' },
    { id: 'bronson', name: 'Bronson', description: 'Confident & Reassuring' },
    { id: 'marcus', name: 'Marcus', description: 'Smooth & Supportive' }
  ];

  const themes = [
    { id: 'blue', name: 'Midnight Luxury', description: 'Deep blues and purples' },
    { id: 'lavender', name: 'Soft Lavender', description: 'Gentle purple tones' },
    { id: 'teal', name: 'Ocean Depths', description: 'Calming sea blues' },
    { id: 'sage', name: 'Forest Luxury', description: 'Natural green tones' },
    { id: 'rose', name: 'Sunset Rose', description: 'Warm pink hues' },
    { id: 'amber', name: 'Warm Gold', description: 'Rich golden tones' }
  ];

  const handleDataExport = async () => {
    const userId = getCurrentUserId();
    try {
      const response = await fetch(`/api/users/${userId}/export`);
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trai-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'account', name: 'Account', icon: User },
    { id: 'audio', name: 'Audio', icon: Volume2 },
    { id: 'theme', name: 'Theme', icon: Palette },
    { id: 'data', name: 'Data', icon: Database },
    { id: 'about', name: 'About', icon: Info }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
      <div className="theme-surface rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] md:max-h-[90vh] overflow-hidden border-2 border-silver">
        {/* Header */}
        <div className="theme-primary p-4 md:p-6 border-b border-[var(--theme-accent)]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-3">
              <Settings className="w-5 h-5 md:w-6 md:h-6 theme-text" />
              <h2 className="text-xl md:text-2xl font-bold theme-text">Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Mobile Tab Bar */}
          <div className="block md:hidden theme-card border-b border-[var(--theme-accent)]/30">
            <div className="flex overflow-x-auto px-2 py-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors mx-1 ${
                    activeTab === tab.id
                      ? 'bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
                      : 'theme-text-secondary hover:theme-text hover:bg-[var(--theme-surface)]'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="font-medium text-sm whitespace-nowrap">{tab.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden md:block w-64 theme-card border-r border-[var(--theme-accent)]/30">
            <div className="p-4 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
                      : 'theme-text-secondary hover:theme-text hover:bg-[var(--theme-surface)]'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto max-h-[calc(95vh-120px)] md:max-h-[calc(90vh-100px)]">
            {activeTab === 'general' && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h3 className="text-lg md:text-xl font-semibold theme-text mb-3 md:mb-4">General Settings</h3>
                  <div className="space-y-3 md:space-y-4">
                    <div className="theme-card p-3 md:p-4 rounded-lg border border-[var(--theme-accent)]/30">
                      <h4 className="font-semibold theme-text mb-2">Reset Application Data</h4>
                      <p className="theme-text-secondary text-sm mb-3 md:mb-4">
                        This will permanently delete all your data including chat history, journal entries, mood tracking, and preferences.
                      </p>
                      <button
                        onClick={onReset}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 md:px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm md:text-base border-2 border-silver"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Reset All Data</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h3 className="text-lg md:text-xl font-semibold theme-text mb-3 md:mb-4">Account Settings</h3>
                  <div className="space-y-3 md:space-y-4">
                    <div className="theme-card p-3 md:p-4 rounded-lg border border-[var(--theme-accent)]/30">
                      <h4 className="font-semibold theme-text mb-2">Account Status</h4>
                      {isAuthenticated ? (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="theme-text font-medium">{user?.email}</p>
                              <p className="text-sm theme-text-secondary">Account verified</p>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-white/20">
                            <button
                              onClick={() => logout()}
                              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Sign Out</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="theme-text font-medium">Anonymous User</p>
                              <p className="text-sm theme-text-secondary">Using device-based storage</p>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-white/20">
                            <p className="text-sm theme-text-secondary mb-4">
                              Sign in to sync your data across devices and access advanced features.
                            </p>
                            <div className="flex space-x-3">
                              <button
                                onClick={() => {
                                  setAuthMode('login');
                                  setShowAuthModal(true);
                                }}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                              >
                                <LogIn className="w-4 h-4" />
                                <span>Sign In</span>
                              </button>
                              <button
                                onClick={() => {
                                  setAuthMode('register');
                                  setShowAuthModal(true);
                                }}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                              >
                                <User className="w-4 h-4" />
                                <span>Sign Up</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h3 className="text-lg md:text-xl font-semibold theme-text mb-3 md:mb-4">Audio Settings</h3>
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <h4 className="font-semibold theme-text mb-3">Voice Selection</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                        {voices.map((voice) => (
                          <button
                            key={voice.id}
                            onClick={() => {
                              console.log('Voice selection clicked:', voice.id);
                              onVoiceChange(voice.id);
                            }}
                            className={`p-3 md:p-4 rounded-lg border-2 transition-all ${
                              selectedVoice === voice.id
                                ? 'border-white bg-white/20 ring-2 ring-white/50'
                                : 'border-white/30 hover:border-white/50 hover:bg-white/10'
                            }`}
                          >
                            <div className="text-left">
                              <div className="flex items-center justify-between">
                                <h5 className="font-semibold theme-text text-sm md:text-base">{voice.name}</h5>
                                {selectedVoice === voice.id && (
                                  <div className="w-3 h-3 bg-white rounded-full"></div>
                                )}
                              </div>
                              <p className="text-xs md:text-sm theme-text-secondary">{voice.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'theme' && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h3 className="text-lg md:text-xl font-semibold theme-text mb-3 md:mb-4">Theme Settings</h3>
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <h4 className="font-semibold theme-text mb-3">Color Theme</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                        {themes.map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => onThemeChange(theme.id)}
                            className={`p-3 md:p-4 rounded-lg border-2 transition-all ${
                              currentTheme === theme.id
                                ? 'border-silver-light bg-[var(--theme-accent)]/10 ring-2 ring-silver/30'
                                : 'border-silver hover:border-silver-light hover:bg-[var(--theme-surface)]/20'
                            }`}
                          >
                            <div className="text-left">
                              <h5 className="font-semibold theme-text text-sm md:text-base">{theme.name}</h5>
                              <p className="text-xs md:text-sm theme-text-secondary">{theme.description}</p>
                              {currentTheme === theme.id && (
                                <div className="flex items-center mt-2">
                                  <div className="w-2 h-2 bg-[var(--theme-accent)] rounded-full mr-2"></div>
                                  <span className="text-xs text-[var(--theme-accent)] font-medium">Currently Active</span>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h3 className="text-lg md:text-xl font-semibold theme-text mb-3 md:mb-4">Data Management</h3>
                  <div className="space-y-3 md:space-y-4">
                    <div className="theme-card p-3 md:p-4 rounded-lg border border-[var(--theme-accent)]/30">
                      <h4 className="font-semibold theme-text mb-2">Export Data</h4>
                      <p className="theme-text-secondary text-sm mb-3 md:mb-4">
                        Download all your TraI data including journal entries, chat history, and preferences.
                      </p>
                      <button
                        onClick={handleDataExport}
                        className="bg-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/80 text-white px-4 md:px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm md:text-base"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export Data</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h3 className="text-lg md:text-xl font-semibold theme-text mb-3 md:mb-4">About TraI</h3>
                  <div className="space-y-3 md:space-y-4">
                    <div className="theme-card p-3 md:p-4 rounded-lg border border-[var(--theme-accent)]/30">
                      <h4 className="font-semibold theme-text mb-2 text-sm md:text-base">TraI Mental Wellness Companion</h4>
                      <p className="theme-text-secondary text-xs md:text-sm mb-3 md:mb-4">
                        Version 1.0.0 - A comprehensive mental wellness companion designed to support your journey with AI-powered insights, 
                        voice interactions, mood tracking, and personalized therapeutic guidance.
                      </p>
                      <div className="space-y-2 text-xs md:text-sm theme-text-secondary">
                        <p><strong>Privacy:</strong> All data is stored locally and anonymously</p>
                        <p><strong>AI Technology:</strong> Powered by OpenAI GPT-4 and ElevenLabs Voice</p>
                        <p><strong>Features:</strong> 8-voice system, mood tracking, journaling, personality insights</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
};

export default SettingsPanel;
