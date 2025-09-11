import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface GradientButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'therapy' | 'wellness' | 'journal' | 'mood' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  glass?: boolean;
}

const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  glass = false
}) => {
  // Gradient styles based on variant
  const variantStyles = {
    primary: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-purple-500/25',
    therapy: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-blue-500/25',
    wellness: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-green-500/25',
    journal: 'bg-gradient-to-r from-pink-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600 shadow-pink-500/25',
    mood: 'bg-gradient-to-r from-teal-400 to-pink-400 hover:from-teal-500 hover:to-pink-500 shadow-teal-400/25',
    success: 'bg-gradient-to-r from-green-600 to-lime-500 hover:from-green-700 hover:to-lime-600 shadow-green-500/25',
    warning: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-orange-500/25'
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  };

  // Glass overlay when glass prop is true
  const glassOverlay = glass ? 'glass-button' : '';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        // Base styles
        'relative inline-flex items-center justify-center',
        'font-semibold text-white',
        'rounded-xl border-0',
        'transition-all duration-300 ease-out',
        'transform active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500',
        
        // Variant and size
        !glass && variantStyles[variant],
        sizeStyles[size],
        
        // Glass effect
        glass && glassOverlay,
        
        // Hover effects
        !disabled && !loading && 'hover:scale-105 hover:shadow-2xl',
        
        // Disabled state
        (disabled || loading) && 'opacity-50 cursor-not-allowed transform-none',
        
        // Custom shimmer effect
        'overflow-hidden',
        
        className
      )}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}
        {children}
      </div>
      
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
};

export default GradientButton;