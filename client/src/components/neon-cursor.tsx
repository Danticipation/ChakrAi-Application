import { useNeonCursorTrail } from '@/hooks/useNeonCursorTrail';
import React from 'react';

const NeonCursor: React.FC = () => {
  const points = useNeonCursorTrail();

  if (points.length === 0) {
    return null;
  }

  const pathData =
    "M" +
    points
      .map((point, i) => {
        const nextPoint = points[i + 1];
        if (!nextPoint) return `${point.x} ${point.y}`;
        const midPoint = {
          x: (point.x + nextPoint.x) / 2,
          y: (point.y + nextPoint.y) / 2,
        };
        return ` ${point.x} ${point.y} Q ${midPoint.x} ${midPoint.y} ${nextPoint.x} ${nextPoint.y}`;
      })
      .join(" ");

  return (
    <svg
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
          <stop offset="0%" stopColor="rgba(0, 255, 255, 0.7)" />
          <stop offset="100%" stopColor="rgba(0, 255, 255, 0)" />
        </radialGradient>
      </defs>
      <path
        d={pathData}
        fill="none"
        strokeWidth="12"
        stroke="url(#neon-gradient)"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: `drop-shadow(0 0 5px rgba(0, 255, 255, 0.8)) drop-shadow(0 0 15px rgba(0, 255, 255, 0.5))`,
        }}
      />
    </svg>
  );
};

export default NeonCursor;