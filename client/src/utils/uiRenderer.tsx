import React, { Suspense, Component, ReactNode } from 'react';
import { getCurrentUserId as fetchCurrentUserId } from '@/utils/userSession';
import { getSectionComponentMap } from './sectionComponentMap';

interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("UI Renderer ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-red-400 p-4">Something went wrong loading this feature. Please try again later.</div>;
    }
    return this.props.children;
  }
}

export const renderMainContent = (
  section: string, 
  fetchStreakStats: () => void, 
  setActiveSection: (section: string) => void, 
  handleMobileModalNavigation: (section: string) => void
): ReactNode => {
  const Fallback = <div className="text-white/60 p-8 text-center">Loading...</div>;
  const components = getSectionComponentMap({ fetchStreakStats, setActiveSection, handleMobileModalNavigation });

  return (
    <ErrorBoundary>
      <Suspense fallback={Fallback}>
        {components[section] || <div className="flex items-center justify-center h-64 text-white/60">Feature coming soon...</div>}
      </Suspense>
    </ErrorBoundary>
  );
};

export const renderActiveSection = renderMainContent;