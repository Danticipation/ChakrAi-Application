import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimationProps {
  children: React.ReactNode;
  className?: string;
  type?: 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn' | 'slideInUp' | 'slideInDown' | 'staggeredFadeIn';
  delay?: number;
  duration?: number;
  trigger?: 'onMount' | 'onView' | 'manual';
  triggerOnce?: boolean;
  threshold?: number;
  onAnimationComplete?: () => void;
}

const Animation: React.FC<AnimationProps> = ({
  children,
  className = '',
  type = 'fadeInUp',
  delay = 0,
  duration = 0.8,
  trigger = 'onMount',
  triggerOnce = true,
  threshold = 0.1,
  onAnimationComplete
}) => {
  const [isVisible, setIsVisible] = useState(trigger === 'onMount');
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for scroll-triggered animations
  useEffect(() => {
    if (trigger !== 'onView' || !elementRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && (!triggerOnce || !hasAnimated)) {
            setIsVisible(true);
            setHasAnimated(true);
          } else if (!triggerOnce && !entry.isIntersecting) {
            setIsVisible(false);
          }
        });
      },
      { threshold }
    );

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [trigger, triggerOnce, hasAnimated, threshold]);

  // Handle animation completion
  useEffect(() => {
    if (isVisible && onAnimationComplete) {
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, (delay + duration * 1000)); // delay is in ms, duration is in seconds, so convert duration to ms
      return () => clearTimeout(timer);
    }
  }, [isVisible, delay, duration, onAnimationComplete]);

  // Animation type to class mapping
  const animationClasses = {
    fadeInUp: 'animate-fade-in-up',
    fadeInDown: 'animate-fade-in-down',
    fadeInLeft: 'animate-fade-in-left',
    fadeInRight: 'animate-fade-in-right',
    scaleIn: 'animate-scale-in',
    slideInUp: 'animate-slide-in-up',
    slideInDown: 'animate-slide-in-down',
    staggeredFadeIn: 'animate-staggered-fade-in'
  };

  // Delay classes
  const getDelayClass = (delayMs: number) => {
    if (delayMs >= 1000) return 'animate-delay-1000';
    if (delayMs >= 700) return 'animate-delay-700';
    if (delayMs >= 500) return 'animate-delay-500';
    if (delayMs >= 300) return 'animate-delay-300';
    if (delayMs >= 200) return 'animate-delay-200';
    if (delayMs >= 150) return 'animate-delay-150';
    if (delayMs >= 100) return 'animate-delay-100';
    if (delayMs >= 75) return 'animate-delay-75';
    return '';
  };

  return (
    <div
      ref={elementRef}
      className={cn(
        isVisible && animationClasses[type],
        delay > 0 && isVisible && getDelayClass(delay),
        className
      )}
      style={{
        animationDuration: isVisible ? `${duration}s` : undefined,
        animationDelay: isVisible && delay > 0 ? `${delay / 1000}s` : undefined // Convert delay from ms to seconds for CSS
      }}
    >
      {children}
    </div>
  );
};

// Staggered animation wrapper for multiple children
interface StaggeredAnimationProps {
  children: React.ReactNode[];
  className?: string;
  type?: AnimationProps['type'];
  staggerDelay?: number;
  baseDelay?: number;
  trigger?: AnimationProps['trigger'];
}

export const StaggeredAnimation: React.FC<StaggeredAnimationProps> = ({
  children,
  className = '',
  type = 'fadeInUp',
  staggerDelay = 100,
  baseDelay = 0,
  trigger = 'onView'
}) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <Animation
          key={index}
          type={type}
          delay={baseDelay + (index * staggerDelay)}
          trigger={trigger}
        >
          {child}
        </Animation>
      ))}
    </div>
  );
};

// Preset animation components for common use cases
export const TherapeuticEntrance: React.FC<{ children: React.ReactNode; delay?: number }> = ({ 
  children, 
  delay = 0 
}) => (
  <Animation type="fadeInUp" delay={delay} duration={0.8} trigger="onView">
    {children}
  </Animation>
);

export const WellnessReveal: React.FC<{ children: React.ReactNode; delay?: number }> = ({ 
  children, 
  delay = 0 
}) => (
  <Animation type="scaleIn" delay={delay} duration={0.6} trigger="onView">
    {children}
  </Animation>
);

export const MindfulSlide: React.FC<{ children: React.ReactNode; delay?: number }> = ({ 
  children, 
  delay = 0 
}) => (
  <Animation type="slideInUp" delay={delay} duration={0.8} trigger="onView">
    {children}
  </Animation>
);

export default Animation;

