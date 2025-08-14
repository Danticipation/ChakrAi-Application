import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
  waitForElement?: boolean;
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
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

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
      description: 'Click the Home button to see your daily affirmation, wellness statistics, and recent activities.',
      target: '[data-tour="home-button"]',
      position: 'top',
      action: () => onNavigate('home'),
      waitForElement: true
    },
    {
      id: 'chat',
      title: 'Chat with Chakrai',
      description: 'Click here to start a conversation with your AI wellness companion. You can type or use voice messages.',
      target: '[data-tour="chat-button"]',
      position: 'top',
      action: () => onNavigate('chat'),
      waitForElement: true
    },
    {
      id: 'journal',
      title: 'Reflection Journal',
      description: 'Click here to record your thoughts and feelings. Your entries help Chakrai provide personalized insights.',
      target: '[data-tour="journal-button"]',
      position: 'top',
      action: () => onNavigate('journal'),
      waitForElement: true
    },
    {
      id: 'meditation',
      title: 'Guided Meditation',
      description: 'Click here to access calming meditation sessions with AI-generated audio guidance.',
      target: '[data-tour="meditation-button"]',
      position: 'top',
      action: () => onNavigate('meditation'),
      waitForElement: true
    },
    {
      id: 'insights',
      title: 'Personal Insights',
      description: 'Click here to view your wellness analytics and personality reflections.',
      target: '[data-tour="analytics-button"]',
      position: 'top',
      action: () => onNavigate('analytics'),
      waitForElement: true
    },
    {
      id: 'mobile-menu',
      title: 'More Features',
      description: 'Click this menu button to access additional tools like goal setting, wellness rewards, and community support.',
      target: '[data-tour="mobile-menu"]',
      position: 'bottom'
    },
    {
      id: 'settings',
      title: 'Voice Settings',
      description: 'Click here to customize your experience by selecting different AI voices for conversations and meditations.',
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
    // Execute action for current step and find target element
    const currentStepData = tourSteps[currentStep];
    if (currentStepData?.action) {
      currentStepData.action();
    }
    
    // Find and highlight target element
    const findTargetElement = () => {
      const element = document.querySelector(currentStepData.target) as HTMLElement;
      if (element) {
        setTargetElement(element);
        calculateTooltipPosition(element, currentStepData.position);
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (currentStepData.waitForElement) {
        // Retry finding element after a short delay
        setTimeout(findTargetElement, 200);
      }
    };

    if (currentStepData) {
      // Small delay to allow navigation to complete
      setTimeout(findTargetElement, 100);
    }
  }, [currentStep]);

  const calculateTooltipPosition = (element: HTMLElement, position: string) => {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    let top = 0;
    let left = 0;
    
    switch (position) {
      case 'top':
        top = rect.top + scrollTop - 10;
        left = rect.left + scrollLeft + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + scrollTop + 10;
        left = rect.left + scrollLeft + rect.width / 2;
        break;
      case 'left':
        top = rect.top + scrollTop + rect.height / 2;
        left = rect.left + scrollLeft - 10;
        break;
      case 'right':
        top = rect.top + scrollTop + rect.height / 2;
        left = rect.right + scrollLeft + 10;
        break;
    }
    
    setTooltipPosition({ top, left });
  };

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

  const getSpotlightStyle = () => {
    if (!targetElement) return {};
    
    const rect = targetElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    return {
      position: 'absolute' as const,
      top: rect.top + scrollTop - 8,
      left: rect.left + scrollLeft - 8,
      width: rect.width + 16,
      height: rect.height + 16,
      borderRadius: '12px',
      border: '3px solid #3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.5)',
      animation: 'pulse 2s infinite',
      pointerEvents: 'none' as const,
      zIndex: 9999
    };
  };

  const currentStepData = tourSteps[currentStep];

  if (!isVisible || !currentStepData) return null;

  return (
    <>
      {/* Semi-transparent overlay */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-black/60 z-[9998] pointer-events-auto"
        style={{ backdropFilter: 'blur(2px)' }}
      >
        {/* Spotlight highlight */}
        {targetElement && (
          <div style={getSpotlightStyle()} />
        )}
        
        {/* Tooltip positioned relative to target */}
        <div 
          className="fixed z-[9999]"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            transform: currentStepData.position === 'top' ? 'translate(-50%, -100%)' :
                      currentStepData.position === 'bottom' ? 'translate(-50%, 0)' :
                      currentStepData.position === 'left' ? 'translate(-100%, -50%)' :
                      'translate(0, -50%)'
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm w-80 mx-4">
            {/* Arrow pointing to target */}
            <div 
              className={`absolute w-3 h-3 bg-white dark:bg-gray-800 border transform rotate-45 ${
                currentStepData.position === 'top' ? 'bottom-[-6px] left-1/2 -translate-x-1/2 border-b border-r border-gray-200 dark:border-gray-700' :
                currentStepData.position === 'bottom' ? 'top-[-6px] left-1/2 -translate-x-1/2 border-t border-l border-gray-200 dark:border-gray-700' :
                currentStepData.position === 'left' ? 'right-[-6px] top-1/2 -translate-y-1/2 border-t border-r border-gray-200 dark:border-gray-700' :
                'left-[-6px] top-1/2 -translate-y-1/2 border-b border-l border-gray-200 dark:border-gray-700'
              }`}
            />
            
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
      
      {/* Add CSS keyframes for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.2), 0 0 30px rgba(59, 130, 246, 0.7);
          }
        }
      `}</style>
    </>
  );
};

export default OnboardingTour;