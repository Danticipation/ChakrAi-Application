import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'glass' | 'gradient' | 'shine';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'glass', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-xl font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background relative';
  
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 depth-shadow hover:depth-shadow-hover transition-all duration-300',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 depth-shadow hover:depth-shadow-hover transition-all duration-300',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground glass-button',
    glass: 'glass-button text-white hover-lift',
    gradient: 'gradient-blue text-white hover-lift button-shine',
    shine: 'glass-button button-shine text-white hover-lift'
  };
  
  const sizes = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 py-2 px-6 text-base',
    lg: 'h-12 px-8 text-lg'
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
