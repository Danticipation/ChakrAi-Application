
import { useState, useEffect, useCallback, useRef } from 'react';

interface Point {
  x: number;
  y: number;
}

// Configuration for the trail
const TRAIL_LENGTH = 20; // Slightly longer trail
const UPDATE_INTERVAL = 16; // ~60fps update throttle

/**
 * Custom hook to track the mouse position and generate a series of points
 * representing the cursor's recent path, suitable for creating a trail effect.
 *
 * Uses requestAnimationFrame for smooth, throttled updates and maintains
 * a fixed-length array for trail points.
 */
export const useNeonCursorTrail = (): Point[] => {
  const [points, setPoints] = useState<Point[]>([]);
  const lastUpdateTime = useRef(0);
  const animationFrameId = useRef<number | null>(null);
  const lastPosition = useRef<Point>({ x: 0, y: 0 }); // Store last known position

  // Mouse move handler - captures the latest position
  const handleMouseMove = useCallback((event: MouseEvent) => {
    lastPosition.current = { x: event.clientX, y: event.clientY };
    console.log('Mouse moved to:', lastPosition.current);
  }, []);

  // Animation loop function
  const updateTrail = useCallback(() => {
    const now = performance.now();
    const timeDelta = now - lastUpdateTime.current;

    // Update only if enough time has passed or if it's the first frame
    if (timeDelta >= UPDATE_INTERVAL || lastUpdateTime.current === 0) {
      setPoints(prevPoints => {
        const newPoints = [...prevPoints, { x: lastPosition.current.x, y: lastPosition.current.y }];
        console.log('Updating trail points:', newPoints.length, 'latest position:', lastPosition.current);
        // Keep only the last TRAIL_LENGTH points
        return newPoints.slice(Math.max(newPoints.length - TRAIL_LENGTH, 0));
      });
      lastUpdateTime.current = now;
    }

    // Request the next frame
    animationFrameId.current = requestAnimationFrame(updateTrail);
  }, []); // Dependencies: updateTrail depends on itself implicitly via requestAnimationFrame

  useEffect(() => {
    console.log('useNeonCursorTrail hook mounted - setting up mouse listener');
    window.addEventListener('mousemove', handleMouseMove, { passive: true }); // Use passive listener for performance

    // Start the animation loop
    animationFrameId.current = requestAnimationFrame(updateTrail);

    // Cleanup function
    return () => {
      console.log('useNeonCursorTrail hook unmounted - cleaning up');
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [handleMouseMove, updateTrail]); // Add dependencies

  return points;
};