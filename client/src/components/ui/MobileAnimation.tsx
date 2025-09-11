import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface MobileAnimationProps {
  children: React.ReactNode;
  className?: string;
  type?: 'mobileFadeInUp' | 'mobileScaleIn' | 'mobileSlideUp' | 'swipeReveal' | 'touchFeedback';
  delay?: number;
  duration?: number;
  trigger?: 'onMount' | 'onView' | 'onTouch' | 'manual';
  triggerOnce?: boolean;
  threshold?: number;
  onAnimationComplete?: () => void;
  touchEnabled?: boolean;
  swipeDirection?: 'left' | 'right' | 'up' | 'down';
  onSwipe?: (direction: string) => void;
}

const MobileAnimation: React.FC<MobileAnimationProps> = ({
  children,
  className = '',
  type = 'mobileFadeInUp',
  delay = 0,
  duration = 0.6,
  trigger = 'onView',
  triggerOnce = true,
  threshold = 0.1,
  onAnimationComplete,
  touchEnabled = false,
  swipeDirection,
  onSwipe
}) => {
  const [isVisible, setIsVisible] = useState(trigger === 'onMount');
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Detect mobile device
  const isMobile = useCallback(() => {
    return window.innerWidth <= 768 || 'ontouchstart' in window;
  }, []);

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

  // Touch event handlers for mobile interactions
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!touchEnabled && !onSwipe) return;

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    if (trigger === 'onTouch' && !hasAnimated) {
      setIsVisible(true);
      setHasAnimated(true);
    }

    setIsTouched(true);
  }, [touchEnabled, onSwipe, trigger, hasAnimated]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !onSwipe) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Check if it's a swipe (minimum distance and speed)
    const minDistance = 50;
    const maxTime = 300;

    if (deltaTime < maxTime) {
      if (Math.abs(deltaX) > minDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        const direction = deltaX > 0 ? 'right' : 'left';
        if (!swipeDirection || swipeDirection === direction) {
          onSwipe(direction);
        }
      } else if (Math.abs(deltaY) > minDistance && Math.abs(deltaY) > Math.abs(deltaX)) {
        // Vertical swipe
        const direction = deltaY > 0 ? 'down' : 'up';
        if (!swipeDirection || swipeDirection === direction) {
          onSwipe(direction);
        }
      }
    }

    setIsTouched(false);
    touchStartRef.current = null;
  }, [onSwipe, swipeDirection]);

  // Handle animation completion
  useEffect(() => {
    if (isVisible && onAnimationComplete) {
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, (delay + duration * 1000));

      return () => clearTimeout(timer);
    }
  }, [isVisible, delay, duration, onAnimationComplete]);

  // Animation type to class mapping
  const animationClasses = {
    mobileFadeInUp: 'mobile-fade-in-up',
    mobileScaleIn: 'mobile-scale-in', 
    mobileSlideUp: 'mobile-slide-up',
    swipeReveal: 'mobile-swipe-reveal',
    touchFeedback: 'mobile-touch-feedback'
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
        'mobile-optimized mobile-gpu-acceleration',
        isVisible && animationClasses[type],
        delay > 0 && isVisible && getDelayClass(delay),
        touchEnabled && 'touch-element',
        isTouched && type === 'touchFeedback' && 'mobile-touch-feedback',
        isMobile() && 'mobile-reduce-motion',
        className
      )}
      style={{
        animationDuration: isVisible ? `${duration}s` : undefined,
        animationDelay: isVisible && delay > 0 ? `${delay / 1000}s` : undefined // Convert delay from ms to seconds for CSS
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};

// Mobile-specific staggered animation wrapper
interface MobileStaggeredAnimationProps {
  children: React.ReactNode[];
  className?: string;
  type?: MobileAnimationProps['type'];
  staggerDelay?: number;
  baseDelay?: number;
  trigger?: MobileAnimationProps['trigger'];
  mobileOptimized?: boolean;
}

export const MobileStaggeredAnimation: React.FC<MobileStaggeredAnimationProps> = ({
  children,
  className = '',
  type = 'mobileFadeInUp',
  staggerDelay = 100,
  baseDelay = 0,
  trigger = 'onView',
  mobileOptimized = true
}) => {
  const isMobile = window.innerWidth <= 768;
  
  // Reduce stagger delay on mobile for better performance
  const mobileStaggenDelay = isMobile && mobileOptimized ? Math.max(staggerDelay * 0.7, 50) : staggerDelay;

  return (
    <div className={cn('mobile-container', className)}>
      {React.Children.map(children, (child, index) => (
        <MobileAnimation
          key={index}
          type={type}
          delay={baseDelay + (index * mobileStaggenDelay)}
          trigger={trigger}
          duration={isMobile && mobileOptimized ? 0.4 : 0.6}
        >
          {child}
        </MobileAnimation>
      ))}
    </div>
  );
};

// Pull-to-refresh component
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshing?: boolean;
  threshold?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  refreshing = false,
  threshold = 80
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - touchStartY.current);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  }, [isPulling, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !refreshing) {
      await onRefresh();
    }
    
    setIsPulling(false);
    setPullDistance(0);
  }, [pullDistance, threshold, refreshing, onRefresh]);

  return (
    <div 
      ref={containerRef}
      className="pull-refresh-container ios-smooth-scroll"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {(isPulling || refreshing) && (
        <div 
          className="pull-refresh-indicator mobile-pull-refresh"
          style={{
            top: `${Math.min(pullDistance - 60, 20)}px`,
            opacity: pullDistance > 20 ? 1 : pullDistance / 20
          }}
        >
          <div className={cn(
            "w-6 h-6 border-2 border-white border-t-transparent rounded-full",
            refreshing ? "animate-spin" : ""
          )} />
        </div>
      )}
      
      <div 
        style={{
          transform: `translateY(${isPulling ? Math.min(pullDistance * 0.5, 40) : 0}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease'
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Swipeable card component
interface SwipeableCardProps {
  children: React.ReactNode;
  className?: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number;
  disabled?: boolean;
  onClick?: () => void; // Added onClick prop
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  className = '',
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 100,
  disabled = false,
  onClick // Destructure onClick
}) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    dragStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    
    const currentX = e.touches[0].clientX;
    const offset = currentX - dragStartX.current;
    setDragOffset(offset);
  }, [isDragging, disabled]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || disabled) return;

    if (Math.abs(dragOffset) > swipeThreshold) {
      if (dragOffset > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (dragOffset < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    setIsDragging(false);
    setDragOffset(0);
  }, [isDragging, disabled, dragOffset, swipeThreshold, onSwipeLeft, onSwipeRight]);

  return (
    <div
      className={cn(
        'mobile-card touch-element swipe-indicator',
        isDragging && 'mobile-reduce-motion',
        className
      )}
      style={{
        transform: `translateX(${dragOffset}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease',
        opacity: isDragging ? Math.max(0.7, 1 - Math.abs(dragOffset) / 200) : 1
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={onClick} // Pass onClick to the div
    >
      {children}
    </div>
  );
};

// Touch-optimized button with ripple effect
interface TouchButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  rippleColor?: string;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  className = '',
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  rippleColor = 'rgba(255, 255, 255, 0.3)'
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const createRipple = useCallback((e: React.TouchEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || disabled) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const x = (e as any).clientX - rect.left;
    const y = (e as any).clientY - rect.top;

    const newRipple = { id: Date.now(), x, y };
    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  }, [disabled]);

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white',
    secondary: 'bg-gray-500 text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    danger: 'bg-red-500 text-white'
  };

  return (
    <button
      ref={buttonRef}
      className={cn(
        'touch-button mobile-optimized relative overflow-hidden rounded-xl font-semibold',
        'transition-all duration-200 ios-no-select',
        'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      onClick={onClick}
      onTouchStart={createRipple}
      onMouseDown={createRipple}
      disabled={disabled}
      style={{ '--touch-color': rippleColor } as React.CSSProperties}
    >
      {children}
      
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="mobile-ripple absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: '20px',
            height: '20px',
            backgroundColor: rippleColor,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}
    </button>
  );
};

// Mobile preset animation components
export const MobileTherapeuticEntrance: React.FC<{ 
  children: React.ReactNode; 
  delay?: number 
}> = ({ children, delay = 0 }) => (
  <MobileAnimation type="mobileFadeInUp" delay={delay} duration={0.5} trigger="onView" touchEnabled>
    {children}
  </MobileAnimation>
);

export const MobileWellnessReveal: React.FC<{ 
  children: React.ReactNode; 
  delay?: number 
}> = ({ children, delay = 0 }) => (
  <MobileAnimation type="mobileScaleIn" delay={delay} duration={0.4} trigger="onView" touchEnabled>
    {children}
  </MobileAnimation>
);

export const MobileMindfulSlide: React.FC<{ 
  children: React.ReactNode; 
  delay?: number 
}> = ({ children, delay = 0 }) => (
  <MobileAnimation type="mobileSlideUp" delay={delay} duration={0.5} trigger="onView" touchEnabled>
    {children}
  </MobileAnimation>
);

export default MobileAnimation;
