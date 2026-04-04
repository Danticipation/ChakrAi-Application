import React, { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { PlayCircle, AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

class MeditationErrorBoundary extends Component<Props, State> {
  private maxRetries = 2;
  
  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error });

    // Log meditation-specific error
    const errorData = {
      timestamp: new Date().toISOString(),
      component: 'MeditationComponent',
      error: error.message,
      stack: error.stack,
      audioContext: this.getAudioContextInfo(),
      userAgent: navigator.userAgent,
    };

    if (import.meta.env.DEV) {
      console.group('ðŸ§˜ Meditation Error Boundary');
      console.error('Meditation Error:', error);
      console.error('Audio Context Info:', errorData.audioContext);
      console.groupEnd();
    }

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private getAudioContextInfo = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const context = new AudioContext();
        return {
          state: context.state,
          sampleRate: context.sampleRate,
          supported: true,
        };
      }
      return { supported: false };
    } catch {
      return { supported: false, error: 'AudioContext creation failed' };
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        retryCount: this.state.retryCount + 1,
      });
    }
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 p-6 flex items-center justify-center">
          <div className="max-w-md w-full">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 text-center">
              {/* Meditation Icon */}
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-red-500/20">
                  <AlertTriangle className="w-10 h-10 text-red-400" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-4">
                Meditation Session Error
              </h2>
              
              <p className="text-white/70 mb-6">
                We encountered an issue with the meditation feature. This might be related to audio playback or browser permissions.
              </p>

              {/* Common Solutions */}
              <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
                <h3 className="text-white font-semibold mb-3">Quick Fixes to Try:</h3>
                <ul className="text-white/70 text-sm space-y-2">
                  <li>â€¢ Check if audio is enabled in your browser</li>
                  <li>â€¢ Ensure you've granted microphone permissions (if using voice features)</li>
                  <li>â€¢ Try using headphones or speakers</li>
                  <li>â€¢ Close other apps that might be using audio</li>
                </ul>
              </div>

              {/* Error Details (Development) */}
              {import.meta.env.DEV && this.state.error && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-6 text-left">
                  <h3 className="text-red-300 font-semibold mb-2">Dev Error:</h3>
                  <div className="text-red-200 text-xs font-mono">
                    {this.state.error.message}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {this.state.retryCount < this.maxRetries && (
                  <button
                    onClick={this.handleRetry}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors duration-300"
                  >
                    <PlayCircle className="w-5 h-5" />
                    <span>Try Meditation Again ({this.maxRetries - this.state.retryCount} left)</span>
                  </button>
                )}
                
                <button
                  onClick={this.handleReload}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors duration-300"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Reload Page</span>
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors duration-300"
                >
                  <Home className="w-5 h-5" />
                  <span>Back to Dashboard</span>
                </button>
              </div>

              {/* Help Text */}
              <p className="text-white/50 text-sm mt-6">
                Still having issues?{' '}
                <a 
                  href="mailto:support@chakrai.app?subject=Meditation%20Feature%20Error" 
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MeditationErrorBoundary;
