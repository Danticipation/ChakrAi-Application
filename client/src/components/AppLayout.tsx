import React, { Suspense, useState, Component, ReactNode } from 'react';
import { getSectionComponentMap } from '@/utils/sectionComponentMap';

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
    console.error("AppLayout ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-red-400 p-4">Something went wrong. Please try again later.</div>;
    }
    return this.props.children;
  }
}

export default function AppLayout() {
  const [activeSection, setActiveSection] = useState('daily');
  const [contentLoading, setContentLoading] = useState(false);

  const fetchStreakStats = () => console.log('fetchStreakStats triggered');
  const handleMobileModalNavigation = (section: string) => {
    console.log('Navigating to mobile modal section:', section);
    setActiveSection(section);
  };

  const fallback = <div className="text-white/60 p-6">Loading section...</div>;
  const sectionMap = getSectionComponentMap({ fetchStreakStats, setActiveSection, handleMobileModalNavigation });

  return (
    <div className="min-h-screen bg-black">
      <ErrorBoundary>
        <Suspense fallback={fallback}>
          {sectionMap[activeSection as keyof typeof sectionMap] || <div className="text-white p-6">Feature not available</div>}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}