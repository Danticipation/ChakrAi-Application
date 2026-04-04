# Chart Data Sanitization - SVG Path Fixes

This implementation addresses the SVG path "Expected number" errors that occur when invalid data reaches chart rendering components.

## Problem

Browser logs showing errors like:
```
Error: <path> attribute d: Expected number, "... 900 383 Q 900.5 383 901 …"
```

This indicates NaN, undefined, Infinity, or formatted numbers (with commas) are being included in SVG path data.

## Root Causes

1. Non-numeric data reaching geometry (strings, null/undefined)
2. Formatted numbers with commas (toLocaleString)
3. Zero/NaN layout dimensions
4. Curve builders receiving invalid coordinates

## Solution Implemented

### Core Utilities (`src/utils/path-utils.ts`)

```typescript
import {
  sanitizeRechartsData,
  sanitizePoints,
  buildLinearPath,
  assertFinitePathNumbers
} from '../utils/path-utils';
```

### Data Sanitization

**For Recharts and similar libraries:**
```typescript
const rawData = [
  { name: 'Jan', value: '100' },
  { name: 'Feb', value: null },
  { name: 'Mar', value: NaN }
];

const cleanData = sanitizeRechartsData(rawData, ['value']);
// Result: [{ name: 'Jan', value: 100 }, { name: 'Feb', value: 0 }, { name: 'Mar', value: 0 }]
```

**For custom SVG paths:**
```typescript
const points = sanitizePoints(rawPoints); // Throws on invalid coordinates
const pathD = buildLinearPath(points);
assertFinitePathNumbers(pathD); // Validates in dev builds
```

### Key Functions

#### `sanitizeRechartsData<T>(rawData: T[], keys: (keyof T)[])`
- Converts all specified keys to finite numbers
- Falls back to 0 for invalid values
- Filters out entries with non-convertible data
- Safe for Recharts dataKey properties

#### `sanitizePoints(raw: Point[])`
- Converts coordinates to numbers
- Throws detailed error on invalid coordinates
- Preserves additional properties on points

#### `assertFinitePathNumbers(d: string)`
- Validates SVG path strings for finite numbers
- Rejects formatted numbers with commas
- Catches NaN/Infinity/undefined tokens
- Use in development builds for early detection

#### Path Builders
- `buildLinearPath()`: Creates L commands between points
- `buildQuadraticPath()`: Adds Q (quadratic) curves
- `buildCubicPath()`: Adds C (cubic) curves
- All filter invalid points and validate results

### Usage in Components

```tsx
import { sanitizeRechartsData } from '../utils/path-utils';

export function MyChart() {
  const rawData = useFetchData(); // Might contain null/undefined/NaN

  // Always sanitize before passing to chart libraries
  const data = sanitizeRechartsData(rawData, ['value', 'metric']);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <Line
          type="linear"           // Avoid smooth curves initially
          dataKey="value"
          isAnimationActive={false} // Disable animations during debugging
          connectNulls={false}   // Don't attempt to connect missing data
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### Container Safety

```tsx
function SafeChartContainer() {
  const [isVisible, setIsVisible] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container) {
      const { width, height } = container.getBoundingClientRect();
      setIsVisible(width > 0 && height > 0);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: 300, minHeight: 200 }}
    >
      {isVisible && <ChartComponent />}
    </div>
  );
}
```

## Prevention Checklist

- ✅ **Data Boundary Sanitization**: Use `sanitizeRechartsData()` immediately after fetching
- ✅ **Finite Number Validation**: All geometry values are finite numbers
- ✅ **No Formatted Strings**: Keep formatting in tooltips/labels only
- ✅ **Container Dimensions**: Ensure non-zero height and stable width
- ✅ **Path Validation**: Use `assertFinitePathNumbers()` in development
- ✅ **Safe Fallbacks**: Invalid data falls back to 0, not breaking the chart
- ✅ **Error Boundaries**: Wrap charts to catch and handle rendering errors

## Testing

Run the test suite:
```bash
npm test
```

The test file (`src/__tests__/path-utils.test.ts`) covers:
- Coordinate sanitization
- Path validation
- Invalid data rejection
- Safe fallback behaviors

## Examples

See `src/examples/chart-sanitization-example.tsx` for complete usage examples demonstrating safe chart implementation patterns.

## Migration Guide

When adding charts to existing components:

1. Import sanitization utilities
2. Sanitize data immediately after fetch/API calls
3. Test with intentionally invalid data to verify safety
4. Keep animations disabled initially
5. Add proper error boundaries

This implementation ensures production-ready chart rendering without the "Expected number" SVG path errors.
