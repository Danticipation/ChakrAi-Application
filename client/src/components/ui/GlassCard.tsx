import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'strong' | 'subtle';
  gradient?: 'primary' | 'therapy' | 'wellness' | 'journal' | 'mood' | 'insights' | 'none';
  hover?: boolean;
  onClick?: () => void;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'default',
  gradient = 'none',
  hover = true,
  onClick,
  padding = 'md'
}) => {
  // Base glass styles based on variant
  const variantStyles = {
    default: 'glass-card',
    strong: 'glass-card-strong',
    subtle: 'glass-card-subtle'
  };

  // Gradient overlay styles
  const gradientStyles = {
    primary: 'bg-gradient-to-br from-purple-500/10 to-blue-600/10',
    therapy: 'bg-gradient-to-br from-blue-400/10 to-cyan-400/10',
    wellness: 'bg-gradient-to-br from-green-400/10 to-emerald-400/10',
    journal: 'bg-gradient-to-br from-pink-400/10 to-yellow-400/10',
    mood: 'bg-gradient-to-br from-teal-300/10 to-pink-300/10',
    insights: 'bg-gradient-to-br from-purple-300/10 to-yellow-200/10',
    none: ''
  };

  // Padding styles
  const paddingStyles = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  return (
    <div
      className={cn(
        variantStyles[variant],
        gradient !== 'none' && gradientStyles[gradient],
        paddingStyles[padding],
        hover && 'hover:scale-[1.02] hover:shadow-2xl',
        onClick && 'cursor-pointer',
        'relative group',
        className
      )}
      onClick={onClick}
    >
      {/* Shimmer effect on hover */}
      {hover && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default GlassCard;
