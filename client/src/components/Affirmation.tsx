import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface AffirmationProps {
  isOpen: boolean;
  onClose: () => void;
  animate?: boolean;
  affirmationText?: string;
  title?: string;
}

// Focus trap utility for modal accessibility
const useFocusTrap = (isOpen: boolean, onClose: () => void) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Focus the modal container
      if (modalRef.current) {
        modalRef.current.focus();
      }
    } else {
      // Restore focus to the previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return modalRef;
};

export default function Affirmation({ 
  isOpen, 
  onClose, 
  animate = true,
  affirmationText = "Today is a new opportunity to grow and shine. You have the strength within you to overcome any challenge.",
  title = "Daily Affirmation"
}: AffirmationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const modalRef = useFocusTrap(isOpen, onClose);

  // Animation state management
  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false);
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, animate ? 200 : 0);
      return () => clearTimeout(timer);
    }

    setShouldRender(true);
    // Small delay to ensure DOM is ready for transition
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
    return;
  }, [isOpen, animate]);

  // Handle overlay click to close modal
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevent event propagation from modal content
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!shouldRender) return null;

  const modalContent = (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${
        animate 
          ? `transition-all duration-200 ease-out ${
              isVisible 
                ? 'bg-black/50 backdrop-blur-sm' 
                : 'bg-black/0 backdrop-blur-none'
            }`
          : 'bg-black/50 backdrop-blur-sm'
      }`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="affirmation-title"
      aria-describedby="affirmation-content"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-blue-200 dark:border-slate-700 ${
          animate
            ? `transition-all duration-200 ease-out ${
                isVisible
                  ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-0 scale-95 translate-y-4'
              }`
            : 'opacity-100 scale-100'
        }`}
        onClick={handleContentClick}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 transition-colors shadow-sm"
          aria-label={`Close ${title} modal`}
          type="button"
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-300" aria-hidden="true" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 pr-10">
          <h2 
            id="affirmation-title"
            className="text-2xl font-bold text-gray-800 dark:text-white mb-2 font-serif"
          >
            {title}
          </h2>
          <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
        </div>

        {/* Affirmation Content */}
        <div className="mb-6">
          <p 
            id="affirmation-content"
            className="text-gray-700 dark:text-gray-200 text-lg leading-relaxed font-medium"
          >
            {affirmationText}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            type="button"
          >
            Embrace the Day
          </button>
          <button
            onClick={onClose}
            className="sm:w-auto px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800 rounded-xl"
            type="button"
          >
            Close
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-br from-yellow-200 to-pink-200 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-20 blur-xl"></div>
      </div>
    </div>
  );

  // Render modal in a portal attached to document.body
  return createPortal(modalContent, document.body);
}

