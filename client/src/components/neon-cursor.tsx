import { useNeonCursorTrail } from '@/hooks/useNeonCursorTrail';
import React from 'react';

const NeonCursor: React.FC = () => {
  const points = useNeonCursorTrail();

  if (points.length < 2) {
    return null;
  }

  // Create smooth curved path
  const pathData = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    
    const prevPoint = points[index - 1];
    // Type guard to ensure prevPoint exists
    if (!prevPoint) {
      return path;
    }
    
    const controlPoint = {
      x: (prevPoint.x + point.x) / 2,
      y: (prevPoint.y + point.y) / 2,
    };
    
    return path + ` Q ${prevPoint.x} ${prevPoint.y} ${controlPoint.x} ${controlPoint.y}`;
  }, '');

  return (
    <svg
      className="neon-cursor-trail"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
      viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
    >
      <defs>
        <radialGradient id="neon-gradient" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(0, 255, 255, 0.8)" />
          <stop offset="50%" stopColor="rgba(0, 255, 255, 0.5)" />
          <stop offset="100%" stopColor="rgba(0, 255, 255, 0)" />
        </radialGradient>
        <linearGradient id="trail-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(0, 255, 255, 0)" />
          <stop offset="50%" stopColor="rgba(0, 255, 255, 0.6)" />
          <stop offset="100%" stopColor="rgba(0, 255, 255, 0.9)" />
        </linearGradient>
      </defs>
      <path
        d={pathData}
        fill="none"
        strokeWidth="8"
        stroke="url(#trail-gradient)"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: `drop-shadow(0 0 8px rgba(0, 255, 255, 0.8)) drop-shadow(0 0 16px rgba(0, 255, 255, 0.4))`,
        }}
      />
    </svg>
  );
};

export default NeonCursor;