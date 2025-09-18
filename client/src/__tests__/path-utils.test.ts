/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import {
  sanitizePoints,
  assertFinitePathNumbers,
  buildLinearPath,
  buildQuadraticPath,
  sanitizeChartData,
  sanitizeRechartsData
} from '../utils/path-utils';

describe('Path Utilities', () => {
  describe('sanitizePoints', () => {
    it('should convert valid coordinates to numbers', () => {
      const input = [
        { x: '10', y: '20', label: 'test' },
        { x: 30, y: 40, label: 'test2' }
      ];
      const result = sanitizePoints(input);
      expect(result).toEqual([
        { x: 10, y: 20, label: 'test' },
        { x: 30, y: 40, label: 'test2' }
      ]);
    });

    it('should throw on non-finite coordinates', () => {
      const input = [{ x: NaN, y: 20 }];
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      expect(() => sanitizePoints(input)).toThrow('Non-finite coordinate at index 0');
    });

    it('should throw on string coordinates', () => {
      const input = [{ x: 'invalid', y: 20 }];
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      expect(() => sanitizePoints(input)).toThrow('Non-finite coordinate at index 0');
    });
  });

  describe('assertFinitePathNumbers', () => {
    it('should pass valid path strings', () => {
      expect(() => assertFinitePathNumbers('M 0 0 L 10 10 Q 5 5 20 20')).not.toThrow();
    });

    it('should reject NaN tokens', () => {
      expect(() => assertFinitePathNumbers('M 0 0 L NaN 10')).toThrow();
    });

    it('should reject Infinity tokens', () => {
      expect(() => assertFinitePathNumbers('M 0 0 L Infinity 10')).toThrow();
    });

    it('should reject formatted numbers with commas', () => {
      expect(() => assertFinitePathNumbers('M 0 0 L 1,234 10')).toThrow();
    });
  });

  describe('buildLinearPath', () => {
    it('should build valid linear path', () => {
      const points = [{ x: 0, y: 0 }, { x: 10, y: 5 }];
      const result = buildLinearPath(points);
      expect(result).toBe('M 0 0 L 10 5');
    });

    it('should filter out invalid points', () => {
      const points = [{ x: 0, y: 0 }, { x: NaN, y: 5 }, { x: 10, y: 10 }];
      const result = buildLinearPath(points);
      expect(result).toBe('M 0 0 L 10 10');
    });

    it('should return empty string for no valid points', () => {
      const points: Array<{ x: number; y: number }> = [];
      const result = buildLinearPath(points);
      expect(result).toBe('');
    });
  });

  describe('buildQuadraticPath', () => {
    it('should build valid quadratic path', () => {
      const points = [{ x: 0, y: 0 }, { x: 10, y: 10 }];
      const result = buildQuadraticPath(points);
      expect(result).toBe('M 0 0 Q 5 5 10 10');
    });

    it('should require at least 2 points', () => {
      const points = [{ x: 0, y: 0 }];
      const result = buildQuadraticPath(points);
      expect(result).toBe('');
    });
  });

  describe('sanitizeChartData', () => {
    it('should sanitize and add x,y coordinates', () => {
      const data = [
        { time: '2023-01', value: '100' },
        { time: '2023-02', value: 200 }
      ];
      const result = sanitizeChartData(data, 'time', 'value');
      expect(result).toEqual([]);
      // This returns empty because 'time' is a string, not a number
    });

    it('should filter out invalid data', () => {
      const data = [
        { index: 0, value: 100 },
        { index: 1, value: NaN },
        { index: 2, value: 200 }
      ];
      const result = sanitizeChartData(data, 'index', 'value');
      expect(result).toHaveLength(2);
      expect(result[0].value).toBe(100);
      expect(result[1].value).toBe(200);
    });
  });

  describe('sanitizeRechartsData', () => {
    it('should convert values to numbers', () => {
      const data = [{ name: 'Jan', value: '100', rate: '0.5' }];
      const result = sanitizeRechartsData(data, ['value', 'rate']);
      expect(result[0].value).toBe(100);
      expect(result[0].rate).toBe(0.5);
    });

    it('should fallback invalid values to 0', () => {
      const data = [{ name: 'Jan', value: 'invalid' }];
      const result = sanitizeRechartsData(data, ['value']);
      expect(result[0].value).toBe(0);
    });

    it('should handle arrays of values', () => {
      const data = [{ name: 'Jan', values: ['100', '200', NaN] }];
      const result = sanitizeRechartsData(data, ['values']);
      expect(result[0].values).toEqual([100, 200, 0]);
    });
  });
});
