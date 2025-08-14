import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
}

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
  currentSection: string;
  onNavigate: (section: string) => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({
  onComplete,
  onSkip,
  currentSection,
  onNavigate
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Chakrai',
      description: 'Your personal AI wellness companion. Let me show you around so you can make the most of your mental wellness journey.',
      target: '.chakrai-logo',
      position: 'bottom'
    },
    {
      id: 'home',
      title: 'Your Wellness Dashboard',
      description: 'This is your home base. Here you\'ll see your daily affirmation, wellness statistics, and recent activities.',
      target: '.wellness-dashboard',
      position: 'top',
      action: () => onNavigate('home')
    },
    {
      id: 'chat',
      title: 'Chat with Chakrai',
      description: 'Start a conversation with your AI wellness companion. You can type or use voice messages for a more personal experience.',
      target: '[data-tour="chat-button"]',
      position: 'top',
      action: () => onNavigate('chat')
    },
    {
      id: 'journal',
      title: 'Reflection Journal',
      description: 'Record your thoughts, feelings, and experiences. Your entries help Chakrai understand you better and provide personalized insights.',
      target: '[data-tour="journal-button"]',
      position: 'top',
      action: () => onNavigate('journal')
    },
    {
      id: 'meditation',
      title: 'Guided Meditation',
      description: 'Access calming meditation sessions with AI-generated audio guidance. Choose from different voices and session types.',
      target: '[data-tour="meditation-button"]',
      position: 'top',
      action: () => onNavigate('meditation')
    },
    {
      id: 'insights',
      title: 'Personal Insights',
      description: 'View your wellness analytics and personality reflections. Track your progress and discover patterns in your mental health journey.',
      target: '[data-tour="analytics-button"]',
      position: 'top',
      action: () => onNavigate('analytics')
    },
    {
      id: 'mobile-menu',
      title: 'More Features',
      description: 'Tap the menu button to access additional tools like goal setting, wellness rewards, community support, and settings.',
      target: '[data-tour="mobile-menu"]',
      position: 'bottom'
    },
    {
      id: 'settings',
      title: 'Voice Settings',
      description: 'Customize your experience by selecting different AI voices for conversations and meditations.',
      target: '[data-tour="settings-button"]',
      position: 'bottom'
    }
  ];

  useEffect(() => {
    // Small delay to ensure DOM elements are rendered
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Execute action for current step
    const currentStepData = tourSteps[currentStep];
    if (currentStepData?.action) {
      currentStepData.action();
    }
  }, [currentStep]);

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('chakrai_tour_completed', 'true');
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('chakrai_tour_completed', 'true');
    onSkip();
  };

  const getTooltipPosition = (position: string) => {
    switch (position) {
      case 'top':
        return 'bottom-full mb-2';
      case 'bottom':
        return 'top-full mt-2';
      case 'left':
        return 'right-full mr-2';
      case 'right':
        return 'left-full ml-2';
      default:
        return 'bottom-full mb-2';
    }
  };

  const currentStepData = tourSteps[currentStep];

  if (!isVisible || !currentStepData) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-50 pointer-events-auto">
        {/* Tooltip */}
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-60">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm w-80">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentStepData.title}
              </h3>
              <button
                onClick={handleSkip}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              {currentStepData.description}
            </p>

            {/* Progress */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-1">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index <= currentStep
                        ? 'bg-blue-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentStep + 1} of {tourSteps.length}
              </span>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm"
              >
                Skip Tour
              </button>
              <div className="flex space-x-2">
                {currentStep > 0 && (
                  <button
                    onClick={prevStep}
                    className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </button>
                )}
                <button
                  onClick={nextStep}
                  className="flex items-center px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  {currentStep === tourSteps.length - 1 ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Finish
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingTour;