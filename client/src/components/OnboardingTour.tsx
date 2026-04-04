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
    
    // Add keyboard escape handler
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleSkip();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    // Execute action for current step and find target element
    const currentStepData = tourSteps[currentStep];
    if (currentStepData?.action) {
      currentStepData.action();
    }
    
    // Use closure variable for retry count to avoid state timing issues
    let localRetryCount = 0;
    
    // Find and highlight target element
    const findTargetElement = () => {
      if (!currentStepData) return;
      
      localRetryCount++;
      console.log(`ðŸ” Looking for target: ${currentStepData.target} (attempt ${localRetryCount})`);
      const element = document.querySelector(currentStepData.target) as HTMLElement;
      
      if (element) {
        console.log('âœ… Target element found:', element);
        
        // Check if element is actually visible
        const rect = element.getBoundingClientRect();
        console.log('Element rect:', rect);
        
        const isVisible = rect.width > 0 && rect.height > 0 && 
                         getComputedStyle(element).visibility !== 'hidden' &&
                         getComputedStyle(element).display !== 'none';
        
        console.log('Element is visible:', isVisible);
        
        if (isVisible) {
          setTargetElement(element);
          
          // Simple positioning: always put tooltip to the right and down from element
          const simpleTop = rect.bottom + window.scrollY + 20;
          const simpleLeft = Math.max(20, rect.left + window.scrollX);
          
          console.log('Setting tooltip position to:', { top: simpleTop, left: simpleLeft });
          setTooltipPosition({ top: simpleTop, left: simpleLeft });
          
          // Scroll element into view
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          console.log('âš ï¸ Element found but not visible, retrying...');
          
          // After 3 retries, give up and position tooltip in a safe location
          if (localRetryCount >= 3) {
            console.log('ðŸš« Max retries reached, using fallback positioning');
            setTargetElement(null);
            
            // Position tooltip in a predictable location based on step
            const stepOffset = currentStep * 80;
            const fallbackTop = 200 + stepOffset;
            const fallbackLeft = 100;
            
            console.log('Using fallback position:', { top: fallbackTop, left: fallbackLeft });
            setTooltipPosition({ top: fallbackTop, left: fallbackLeft });
          } else {
            // Element exists but not visible yet, retry with longer delay
            setTimeout(findTargetElement, 1000);
          }
        }
      } else {
        console.log(`âŒ Tour target not found: ${currentStepData.target}`);
        
        if (localRetryCount >= 2) {
          console.log('ðŸš« Element not found after retries, using center position');
          // Fallback: center tooltip
          const centerTop = window.innerHeight / 2 + window.scrollY;
          const centerLeft = window.innerWidth / 2 - 160; // Account for tooltip width
          console.log('Using center position:', { top: centerTop, left: centerLeft });
          setTooltipPosition({ top: centerTop, left: centerLeft });
        } else if (currentStepData.waitForElement) {
          setTimeout(findTargetElement, 1000);
        }
      }
    };

    if (currentStepData) {
      // Longer delay to allow navigation and UI to complete
      setTimeout(findTargetElement, 500);
    }
  }, [currentStep]);

  const calculateTooltipPosition = (element: HTMLElement, position: string) => {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = 320;
    const tooltipHeight = 300;
    
    // Get element's absolute position on page
    const elementTop = rect.top + scrollTop;
    const elementLeft = rect.left + scrollLeft;
    const elementRight = elementLeft + rect.width;
    const elementBottom = elementTop + rect.height;
    const elementCenterX = elementLeft + rect.width / 2;
    const elementCenterY = elementTop + rect.height / 2;
    
    let top = elementBottom + 20; // Default: below element
    let left = elementCenterX - tooltipWidth / 2; // Default: centered horizontally
    
    // Keep tooltip on screen horizontally
    if (left < 20) {
      left = 20;
    } else if (left + tooltipWidth > viewportWidth - 20) {
      left = viewportWidth - tooltipWidth - 20;
    }
    
    // Keep tooltip on screen vertically
    if (top + tooltipHeight > viewportHeight + scrollTop - 20) {
      // If no room below, put above
      top = elementTop - tooltipHeight - 20;
      
      // If still no room, force it to fit
      if (top < scrollTop + 20) {
        top = scrollTop + 20;
      }
    }
    
    console.log('Tooltip positioning:', {
      element: { top: elementTop, left: elementLeft, width: rect.width, height: rect.height },
      tooltip: { top, left, width: tooltipWidth, height: tooltipHeight },
      viewport: { width: viewportWidth, height: viewportHeight }
    });
    
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
    if (!targetElement) return { display: 'none' };
    
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
      animation: 'tourPulse 2s infinite',
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
        className="fixed inset-0 bg-black/60 z-[9998] pointer-events-auto cursor-pointer"
        style={{ backdropFilter: 'blur(2px)' }}
        onClick={handleSkip}
        title="Click anywhere to skip tour or press ESC"
      >
        {/* Spotlight highlight */}
        {targetElement && (
          <div style={getSpotlightStyle()} />
        )}
        
        {/* Tooltip positioned relative to target - IMPROVED POSITIONING */}
        <div 
          className="fixed z-[9999]"
          style={{
            // Use the calculated position directly
            top: tooltipPosition.top,
            left: tooltipPosition.left
          }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking tooltip
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 max-w-xs sm:max-w-sm w-72 sm:w-80 mx-2 sm:mx-4 relative">
            {/* Simple arrow pointing up to target element */}
            <div className="absolute w-3 h-3 bg-white dark:bg-gray-800 border transform rotate-45 -top-1.5 left-1/2 -translate-x-1/2 border-t border-l border-gray-200 dark:border-gray-700" />
            
            {/* Emergency close button - always visible */}
            <button
              onClick={handleSkip}
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg z-10 transition-colors"
              title="Close tour (or press ESC)"
            >
              <X className="w-4 h-4" />
            </button>
            
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
            <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              {currentStepData.description}
            </p>
            
            {/* Help text */}
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 p-2 bg-gray-50 dark:bg-gray-700 rounded">
              ðŸ’¡ Tip: Press ESC or click anywhere outside this box to skip the tour
            </div>

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
