import React from 'react';
import {
  sanitizeRechartsData,
  sanitizePoints,
  buildLinearPath,
  assertFinitePathNumbers
} from '../utils/path-utils';

/**
 * مثال: Example usage of chart data sanitization utilities
 * for preventing SVG path "Expected number" errors
 */

// Example usage with Recharts
export function SafeChartExample() {
  // Raw data that might contain null, undefined, or NaN values
  const rawData = [
    { date: '2023-01', value: '100' },
    { date: '2023-02', value: null },
    { date: '2023-03', value: 'NaN' },
    { date: '2023-04', value: undefined },
    { date: '2023-05', value: 250 }
  ];

  // Sanitize data before passing to charts
  const cleanData = sanitizeRechartsData(rawData, ['value']);

  return (
    <div>
      <h3>Clean Data (safe for charts):</h3>
      <pre>{JSON.stringify(cleanData, null, 2)}</pre>
    </div>
  );
}

// Example usage for custom SVG paths
export function SafePathExample() {
  // Data points that might be invalid
  const rawPoints = [
    { x: 0, y: 0 },
    { x: '100', y: '50' }, // string coordinates
    { x: NaN, y: 75 }, // invalid coordinates
    { x: 200, y: 100 }
  ];

  try {
    // Sanitize points - this will throw if any coordinates are invalid
    const cleanPoints = sanitizePoints(rawPoints);

    // Build safe SVG path
    const pathD = buildLinearPath(cleanPoints);

    // Validate final path (in dev builds)
    if (process.env.NODE_ENV === 'development') {
      assertFinitePathNumbers(pathD);
    }

    return (
      <svg width="300" height="150">
        <path
          d={pathD}
          stroke="blue"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    );
  } catch (error) {
    console.error('Path generation failed:', error);
    return <div>Error: Invalid chart data</div>;
  }
}

// Example of handling potential Recharts issues
export function RechartsSafeWrapper() {
  // This example shows how to wrap Recharts components safely
  const rawData = [
    { name: 'Jan', visits: 400, revenue: '1000' },
    { name: 'Feb', visits: null, revenue: 2000 },
    { name: 'Mar', visits: 800, revenue: NaN }
  ];

  // Always sanitize data before passing to Recharts
  const sanitizedData = sanitizeRechartsData(rawData, ['visits', 'revenue']);

  return (
    <div>
      <h3>Data sanitization prevents chart errors</h3>
      <p>
        Before sanitation: {JSON.stringify(rawData)}
      </p>
      <p>
        After sanitation: {JSON.stringify(sanitizedData)}
      </p>
      {/*
      Safe to use in charts now:

      <LineChart data={sanitizedData}>
        <Line
          type="linear"
          dataKey="visits"
          isAnimationActive={false}
          connectNulls={false}
        />
        <Line
          type="linear"
          dataKey="revenue"
          isAnimationActive={false}
          connectNulls={false}
        />
      </LineChart>
      */}
    </div>
  );
}

// Type-safe data transformation
export function TypeSafeTransformation() {
  // Raw API data with unknown types
  const apiData: unknown[] = [
    { timestamp: '2023-01', metric: 100 },
    { timestamp: '2023-02', metric: '200' },
    { timestamp: '2023-03', metric: null }
  ];

  // Transform to safely typed data
  const chartData = (apiData as Array<{ timestamp: string; metric: unknown }>)
    .map(item => ({
      timestamp: item.timestamp,
      metric: item.metric
    }));

  // Apply standard sanitization
  const safeChartData = sanitizeRechartsData(chartData, ['metric']);

  return (
    <div>
      <h3>Type-safe data transformation</h3>
      <p>This ensures no runtime errors during chart rendering</p>
      <pre>{JSON.stringify(safeChartData, null, 2)}</pre>
    </div>
  );
}

// Container dimension validation
export function SafeContainer() {
  const [hasValidDimensions, setHasValidDimensions] = React.useState(false);

  React.useEffect(() => {
    // Check if container has valid dimensions before rendering chart
    const container = document.getElementById('chart-container');
    if (container) {
      const { width, height } = container.getBoundingClientRect();
      setHasValidDimensions(width > 0 && height > 0);
    }
  }, []);

  return (
    <div
      id="chart-container"
      style={{
        width: '100%',
        height: '300px',
        minHeight: '200px' // Ensure non-zero height
      }}
    >
      {hasValidDimensions ? (
        <div>Chart would render here with valid dimensions</div>
      ) : (
        <div>Please wait for container to be properly sized</div>
      )}
    </div>
  );
}

export default function ChartExamples() {
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Chart Data Sanitization Examples</h1>
      <p className="text-gray-600">
        These examples demonstrate how to prevent SVG path "Expected number" errors
        by properly sanitizing chart data before rendering.
      </p>

      <SafeChartExample />
      <SafePathExample />
      <RechartsSafeWrapper />
      <TypeSafeTransformation />
      <SafeContainer />
    </div>
  );
}
