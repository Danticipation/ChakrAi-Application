import React, { Component, Suspense, useEffect, useState } from "react";
import type { ReactNode, ComponentType } from "react";
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

  override componentDidCatch(error: Error, errorInfo: any) {
    console.error("UI Renderer ErrorBoundary caught an error:", error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return <div className="text-red-400 p-4">Something went wrong loading this feature. Please try again later.</div>;
    }
    return this.props.children;
  }
}

interface MainContentProps {
  section: string;
  fetchStreakStats: () => void;
  setActiveSection: (section: string) => void;
  handleMobileModalNavigation: (section: string) => void;
}

const MainContent: React.FC<MainContentProps> = ({ section, fetchStreakStats, setActiveSection, handleMobileModalNavigation }) => {
  const [components, setComponents] = useState<Record<string, ComponentType<any>> | null>(null);

  useEffect(() => {
    getSectionComponentMap({ fetchStreakStats, setActiveSection, handleMobileModalNavigation })
      .then(setComponents);
  }, [fetchStreakStats, setActiveSection, handleMobileModalNavigation]);

  const Fallback = <div className="text-white/60 p-8 text-center">Loading...</div>;

  if (!components) {
    return Fallback;
  }

  const Component = components[section];

  return (
    <ErrorBoundary>
      <Suspense fallback={Fallback}>
        {Component ? <Component /> : <div className="flex items-center justify-center h-64 text-white/60">Feature coming soon...</div>}
      </Suspense>
    </ErrorBoundary>
  );
};

export const renderMainContent = (
  section: string, 
  fetchStreakStats: () => void, 
  setActiveSection: (section: string) => void, 
  handleMobileModalNavigation: (section: string) => void
): ReactNode => {
  return <MainContent 
    section={section}
    fetchStreakStats={fetchStreakStats}
    setActiveSection={setActiveSection}
    handleMobileModalNavigation={handleMobileModalNavigation}
  />;
};

export const renderActiveSection = renderMainContent;
