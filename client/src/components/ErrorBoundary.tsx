import React, { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'app' | 'component' | 'feature';
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  
  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error for debugging and monitoring
    this.logError(error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      component: this.props.componentName || 'Unknown',
      level: this.props.level || 'component',
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount,
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.group('ðŸš¨ Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Error Data:', errorData);
      console.groupEnd();
    }

    // In production, you could send this to an error monitoring service
    void this.sendErrorToMonitoring(errorData);
  };

  private sendErrorToMonitoring = async (errorData: any) => {
    try {
      // Only send non-sensitive error data to monitoring
      const sanitizedData = {
        errorId: errorData.errorId,
        timestamp: errorData.timestamp,
        message: errorData.error.message,
        component: errorData.component,
        level: errorData.level,
        retryCount: errorData.retryCount,
      };

      // Send to your error monitoring endpoint
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      }).catch(() => {
        // Silently fail if error reporting fails
      });
    } catch {
      // Don't throw errors from error handling
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: this.state.retryCount + 1,
      });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const subject = encodeURIComponent(`Bug Report - ${this.props.componentName || 'Unknown Component'}`);
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Component: ${this.props.componentName || 'Unknown'}
Time: ${new Date().toISOString()}
Error: ${this.state.error?.message || 'Unknown error'}

Please describe what you were doing when this error occurred:
[Your description here]
    `);
    
    window.open(`mailto:support@chakrai.app?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Enhanced error UI based on error level
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 p-6">
          <div className="max-w-2xl w-full">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 text-center">
              {/* Error Icon */}
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-red-500/20">
                  <AlertTriangle className="w-12 h-12 text-red-400" />
                </div>
              </div>

              {/* Error Message */}
              <h1 className="text-3xl font-bold text-white mb-4">
                {this.props.level === 'app' ? 'Oops! Something went wrong' : 'Component Error'}
              </h1>
              
              <p className="text-white/70 text-lg mb-6">
                {this.props.level === 'app' 
                  ? 'We encountered an unexpected error. Our team has been notified and is working on a fix.'
                  : `There was an issue with the ${this.props.componentName || 'component'}. Don't worry, the rest of the app should still work.`
                }
              </p>

              {/* Error Details (Development Only) */}
              {import.meta.env.DEV && this.state.error && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-6 text-left">
                  <h3 className="text-red-300 font-semibold mb-2">Development Error Details:</h3>
                  <div className="text-red-200 text-sm font-mono space-y-2">
                    <div><strong>Error:</strong> {this.state.error.message}</div>
                    <div><strong>Component:</strong> {this.props.componentName || 'Unknown'}</div>
                    <div><strong>Error ID:</strong> {this.state.errorId}</div>
                    {this.state.error.stack && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-red-300 hover:text-red-200">
                          Stack Trace
                        </summary>
                        <pre className="mt-2 text-xs whitespace-pre-wrap overflow-auto max-h-32">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {/* Error ID for Production */}
              {import.meta.env.PROD && (
                <div className="bg-white/5 rounded-lg p-3 mb-6">
                  <div className="text-white/60 text-sm">
                    Error ID: <span className="text-white font-mono">{this.state.errorId}</span>
                  </div>
                  <div className="text-white/50 text-xs mt-1">
                    Please include this ID when reporting the issue
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {/* Retry Button (if retries available) */}
                {this.state.retryCount < this.maxRetries && (
                  <button
                    onClick={this.handleRetry}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors duration-300"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>Try Again ({this.maxRetries - this.state.retryCount} left)</span>
                  </button>
                )}

                {/* Reload Button */}
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors duration-300"
                  >
                  <RefreshCw className="w-5 h-5" />
                  <span>Reload Page</span>
                  </button>

                {/* Go Home Button */}
                {this.props.level !== 'app' && (
                  <button
                    onClick={this.handleGoHome}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors duration-300"
                  >
                    <Home className="w-5 h-5" />
                    <span>Go Home</span>
                  </button>
                )}

                {/* Report Bug Button */}
                <button
                  onClick={this.handleReportBug}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors duration-300"
                >
                  <Bug className="w-5 h-5" />
                  <span>Report Bug</span>
                </button>
              </div>

              {/* Additional Help */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-white/50 text-sm">
                  If this problem persists, please contact{' '}
                  <a 
                    href="mailto:support@chakrai.app" 
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    support@chakrai.app
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
