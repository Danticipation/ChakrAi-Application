import React from 'react';
import { Sun, Moon, Heart, Star, Brain, Shield } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeDemo: React.FC = () => {
  const { isLightMode, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen p-6 space-y-8" style={{ background: 'var(--theme-background)', color: 'var(--theme-text)' }}>
      {/* Theme Toggle Demo */}
      <div className="text-center space-y-6 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold" style={{ color: 'var(--theme-text)' }}>
          Chakrai {' '}
          <span className="text-blue-600">
            {isLightMode ? 'Light Mode' : 'Dark Mode'}
          </span>
        </h1>
        <p className="text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
          Experience your mental wellness platform in both light and dark modes.
          Click the toggle button to switch themes instantly!
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <button 
            onClick={toggleTheme}
            className="clean-btn-primary px-8 py-4 text-lg flex items-center gap-3"
          >
            {isLightMode ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
            Switch to {isLightMode ? 'Dark' : 'Light'} Mode
          </button>
        </div>
      </div>

      {/* Feature Cards - Themed */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'var(--theme-text)' }}>
          Beautiful in Any Mode
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Wellness Card */}
          <div className="clean-card">
            <div className="icon-circle icon-circle-green mb-6">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--theme-text)' }}>
              Mental Wellness
            </h3>
            <p className="mb-4" style={{ color: 'var(--theme-text-secondary)' }}>
              Track your emotional health with beautiful, adaptive interfaces that work perfectly in both light and dark modes.
            </p>
            <div className="clean-progress">
              <div className="clean-progress-fill" style={{ width: '85%' }}></div>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="clean-card">
            <div className="icon-circle icon-circle-blue mb-6">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--theme-text)' }}>
              AI-Powered Insights
            </h3>
            <p className="mb-4" style={{ color: 'var(--theme-text-secondary)' }}>
              Get personalized recommendations through advanced AI analysis, beautifully presented in your preferred theme.
            </p>
            <div className="clean-badge-success">
              <Star className="w-4 h-4" />
              Active Learning
            </div>
          </div>

          {/* Security Card */}
          <div className="clean-card">
            <div className="icon-circle icon-circle-purple mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--theme-text)' }}>
              Privacy & Security
            </h3>
            <p className="mb-4" style={{ color: 'var(--theme-text-secondary)' }}>
              Healthcare-grade security that looks professional in both light and dark interfaces.
            </p>
            <div className="clean-badge-primary">
              <Shield className="w-4 h-4" />
              HIPAA Compliant
            </div>
          </div>
        </div>
      </div>

      {/* Current Mode Display */}
      <div className="max-w-2xl mx-auto text-center">
        <div className="clean-card">
          <h3 className="text-2xl font-semibold mb-4" style={{ color: 'var(--theme-text)' }}>
            Current Mode: {isLightMode ? 'Light' : 'Dark'}
          </h3>
          <p className="mb-6" style={{ color: 'var(--theme-text-secondary)' }}>
            {isLightMode 
              ? 'Clean, professional light mode perfect for daytime use'
              : 'Elegant dark mode that reduces eye strain in low-light environments'
            }
          </p>
          <div className="flex justify-center">
            <div className={`p-4 rounded-full ${isLightMode ? 'bg-yellow-100' : 'bg-slate-700'}`}>
              {isLightMode ? (
                <Sun className="w-8 h-8 text-yellow-600" />
              ) : (
                <Moon className="w-8 h-8 text-blue-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="max-w-2xl mx-auto text-center">
        <div className="clean-card-subtle">
          <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--theme-text)' }}>
            ðŸ’¡ How to Toggle Themes
          </h4>
          <div className="space-y-2 text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
            <p>ðŸ–¥ï¸ <strong>Desktop:</strong> Click the theme toggle button in the top-right of the sidebar</p>
            <p>ðŸ“± <strong>Mobile:</strong> Click the theme toggle button in the top navigation bar</p>
            <p>âš¡ <strong>Quick Toggle:</strong> Use the button above to switch modes instantly</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeDemo;

