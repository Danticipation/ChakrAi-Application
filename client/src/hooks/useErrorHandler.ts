import { useState, useCallback } from 'react';

interface ErrorState {
  error: Error | null;
  hasError: boolean;
  errorId: string | null;
}

interface UseErrorHandlerReturn {
  error: Error | null;
  hasError: boolean;
  errorId: string | null;
  reportError: (error: Error, context?: string) => void;
  clearError: () => void;
  handleAsyncError: <T>(
    asyncFn: () => Promise<T>,
    context?: string,
    fallbackValue?: T
  ) => Promise<T | undefined>;
}

const useErrorHandler = (): UseErrorHandlerReturn => {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    hasError: false,
    errorId: null,
  });

  const reportError = useCallback((error: Error, context?: string) => {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setErrorState({
      error,
      hasError: true,
      errorId,
    });

    // Log error for monitoring
    const errorData = {
      errorId,
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context: context || 'Unknown',
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 useErrorHandler - ${context || 'Error'}`);
      console.error('Error:', error);
      console.error('Context:', context);
      console.error('Error Data:', errorData);
      console.groupEnd();
    }

    // Send to error monitoring (production)
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorId: errorData.errorId,
          timestamp: errorData.timestamp,
          message: errorData.message,
          context: errorData.context,
        }),
      }).catch(() => {
        // Silently handle error reporting failures
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      hasError: false,
      errorId: null,
    });
  }, []);

  const handleAsyncError = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      context?: string,
      fallbackValue?: T
    ): Promise<T | undefined> => {
      try {
        const result = await asyncFn();
        return result;
      } catch (error) {
        const errorInstance = error instanceof Error ? error : new Error(String(error));
        reportError(errorInstance, context);
        return fallbackValue;
      }
    },
    [reportError]
  );

  return {
    error: errorState.error,
    hasError: errorState.hasError,
    errorId: errorState.errorId,
    reportError,
    clearError,
    handleAsyncError,
  };
};

export default useErrorHandler;