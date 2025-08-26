// Full AppLayout migrated from original App file.
import React, { Suspense, useState } from 'react';
import { getSectionComponentMap } from './sectionComponentMap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
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
  const handleMobileModalNavigation = (section) => {
    console.log('Navigating to mobile modal section:', section);
    setActiveSection(section);
  };

  const fallback = <div className="text-white/60 p-6">Loading section...</div>;
  const sectionMap = getSectionComponentMap({ fetchStreakStats, setActiveSection, handleMobileModalNavigation });

  return (
    <div className="min-h-screen bg-black">
      <ErrorBoundary>
        <Suspense fallback={fallback}>
          {sectionMap[activeSection] || <div className="text-white p-6">Feature not available</div>}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
