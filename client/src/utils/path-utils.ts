type Point = { x: unknown; y: unknown; [k: string]: unknown };

/**
 * Sanitizes an array of points, converting coordinates to numbers and filtering out invalid points.
 * Throws an error if any coordinate is non-finite.
 */
export function sanitizePoints(raw: Point[]): Array<{ x: number; y: number; [k: string]: unknown }> {
  return raw.map((d, i) => {
    const rawX = d.x;
    const rawY = d.y;
    const x = Number(rawX);
    const y = Number(rawY);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error(`Non-finite coordinate at index ${i}: x=${String(rawX)}, y=${String(rawY)}`);
    }
    return { ...d, x, y };
  });
}

/**
 * Validates an SVG path d string for finite numbers and rejects formatted numbers.
 * Use in development builds to catch issues early.
 */
export function assertFinitePathNumbers(d: string): void {
  if (/\bNaN\b|\bundefined\b|\bInfinity\b/i.test(d)) {
    throw new Error('SVG path contains invalid tokens (NaN/undefined/Infinity)');
  }
  if (/,(?=\d)/.test(d)) {
    throw new Error('SVG path contains formatted numbers with commas');
  }
  const nums = d.match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi) || [];
  for (let i = 0; i < nums.length; i++) {
    const n = Number(nums[i]);
    if (!Number.isFinite(n)) {
      throw new Error(`Non-finite number at token ${i}: ${nums[i]}`);
    }
  }
}

/**
 * Dev-only: ensure each Q is followed by 4*k numbers
 */
export function assertQuadraticGrouping(d: string): void {
  const tokens = d.trim().split(/[\s,]+/);
  const isNum = (t: string) => /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(t);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === 'Q' || t === 'q') {
      let k = 0;
      i++;
      while (i < tokens.length && isNum(tokens[i])) {
        k++;
        i++;
      }
      if (k % 4 !== 0) {
        throw new Error(`Quadratic path grouping error: found ${k} numbers after 'Q' (must be 4*n).`);
      }
      i--; // step back because for-loop will i++
    }
  }
}

// Types for curve builders
export type SafePoint = { x: number; y: number };

/**
 * Checks if a point has finite coordinates.
 */
function isFinitePt(p: SafePoint): boolean {
  return Number.isFinite(p.x) && Number.isFinite(p.y);
}

/**
 * Builds a linear SVG path from an array of points.
 * Filters out non-finite points and validates the resulting path.
 */
export function buildLinearPath(points: SafePoint[]): string {
  const pts = points.filter(isFinitePt);
  if (pts.length === 0) return '';

  const segs: string[] = [`M ${pts[0].x} ${pts[0].y}`];
  for (let i = 1; i < pts.length; i++) {
    const { x, y } = pts[i];
    segs.push(`L ${x} ${y}`);
  }

  const d = segs.join(' ');
  assertFinitePathNumbers(d);
  return d;
}

/**
 * Builds a quadratic bezier curve path from an array of points.
 * Only use after data has been validated with sanitizePoints.
 */
export function buildQuadraticPath(points: SafePoint[]): string {
  const pts = points.filter(isFinitePt);
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

  const segs: string[] = [`M ${pts[0].x} ${pts[0].y}`];
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const cx = (p0.x + p1.x) / 2;
    const cy = (p0.y + p1.y) / 2;
    segs.push(`Q ${cx} ${cy} ${p1.x} ${p1.y}`);
  }
  const d = segs.join(' ');
  if (import.meta.env.DEV) {
    assertFinitePathNumbers(d);
    assertQuadraticGrouping(d);
  }
  return d;
}

/**
 * Builds a cubic bezier curve path from an array of points.
 * Only use after data has been validated with sanitizePoints.
 */
export function buildCubicPath(points: SafePoint[]): string {
  const pts = points.filter(isFinitePt);
  if (pts.length < 2) return '';

  const segs: string[] = [`M ${pts[0].x} ${pts[0].y}`];
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    // Simple control points - replace with your curve strategy
    const cp1x = p0.x + (p1.x - p0.x) * 0.3;
    const cp1y = p0.y;
    const cp2x = p1.x - (p1.x - p0.x) * 0.3;
    const cp2y = p1.y;
    segs.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p1.x} ${p1.y}`);
  }

  const d = segs.join(' ');
  assertFinitePathNumbers(d);
  return d;
}

/**
 * Safe wrapper for chart data sanitization.
 * Converts data to numbers and filters invalid entries.
 */
export function sanitizeChartData<T extends Record<string, unknown>>(
  rawData: T[],
  xKey: keyof T,
  yKey: keyof T
): Array<T & { x: number; y: number }> {
  return rawData
    .map((d, i) => {
      const x = Number(d[xKey]);
      const y = Number(d[yKey]);

      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        console.warn(`Filtering out invalid data point at index ${i}:`, d);
        return null;
      }

      return { ...d, x, y };
    })
    .filter((d): d is T & { x: number; y: number } => d !== null);
}

/**
 * Enhanced Recharts-compatible data sanitizer.
 * In production: uses 'drop' policy to remove items with invalid data.
 * In development: uses 'zero' fallback for debugging.
 */
type SanitizedRechartsData<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? (T[P] extends unknown[] ? number[] : number) : T[P];
};

export function sanitizeRechartsData<T extends Record<string, unknown>, K extends (keyof T)[]>(
  rawData: T[],
  keys: K
): Array<SanitizedRechartsData<T, K[number]>> {
  const policy = import.meta.env.PROD ? 'drop' : 'zero'; // 'drop' in prod, 'zero' in dev

  return rawData
    .map((d, i) => {
      let hasInvalidData = false;

      const sanitized: Record<string, unknown> = { ...d };

      keys.forEach(key => {
        const value = d[key];
        if (value !== null && value !== undefined) {
          // Handle arrays (like data for multiple lines)
          if (Array.isArray(value)) {
            const numArray = value.map((v, idx) => {
              const num = Number(v);
              if (!Number.isFinite(num)) {
                console.warn(`Invalid array value at ${String(key)}[${idx}] for item ${i}:`, v);
                hasInvalidData = true;
                if (policy === 'zero') {
                  return 0; // fallback to 0 in dev
                }
                return num; // invalid number, will cause filtering
              }
              return num;
            });
            sanitized[String(key)] = numArray;
          } else {
            // Handle single values
            const num = Number(value);
            if (!Number.isFinite(num)) {
              console.warn(`Invalid value at ${String(key)} for item ${i}:`, value);
              hasInvalidData = true;
              if (policy === 'zero') {
                sanitized[String(key)] = 0; // fallback to 0 in dev
              } // else keep original invalid value to trigger filter
            } else {
              sanitized[String(key)] = num;
            }
          }
        }
      });

      // Filter out items with invalid data (always in 'drop' mode, conditionally in 'zero')
      if (policy === 'drop' && hasInvalidData) {
        return null;
      } else if (policy === 'zero' && hasInvalidData) {
        // In 'zero' mode, check if all required keys now have valid finite numbers
        const allKeysValid = keys.every(key => {
          const val = sanitized[String(key)];
          if (Array.isArray(val)) {
            return val.every(n => Number.isFinite(n));
          }
          return Number.isFinite(val as number);
        });
        if (!allKeysValid) {
          return null;
        }
      }

      return sanitized as SanitizedRechartsData<T, K[number]>;
    })
    .filter((d): d is SanitizedRechartsData<T, K[number]> => d !== null);
}
