import { describe, expect, it } from 'vitest';
import { fitLabel, retakeBand } from './labels';
import type { RangeView } from './types';

const range: RangeView = { p25: 1400, p75: 1500, median: { value: 1450, estimated: false } };

describe('retakeBand', () => {
  it.each([
    [400, 'strongly'],
    [1390, 'strongly'],
    [1400, 'if-time'], // exactly p25
    [1440, 'if-time'],
    [1450, 'optional'], // exactly p50
    [1490, 'optional'],
    [1500, 'dont'], // exactly p75
    [1600, 'dont'],
  ] as const)('S=%i → %s', (s, label) => {
    expect(retakeBand(s, range)).toBe(label);
  });

  it('uses an estimated median the same way', () => {
    const est: RangeView = { p25: 1400, p75: 1530, median: { value: 1465, estimated: true } };
    expect(retakeBand(1460, est)).toBe('if-time');
    expect(retakeBand(1470, est)).toBe('optional');
  });
});

describe('fitLabel', () => {
  it('is Reach below the median, Target from median to below p75', () => {
    expect(fitLabel(1390, range, 0.5)).toBe('reach');
    expect(fitLabel(1440, range, 0.5)).toBe('reach');
    expect(fitLabel(1450, range, 0.5)).toBe('target');
    expect(fitLabel(1490, range, 0.5)).toBe('target');
  });

  it('at or above p75: Safety from a 30% admit rate, otherwise Target', () => {
    expect(fitLabel(1500, range, 0.3)).toBe('safety');
    expect(fitLabel(1600, range, 0.6)).toBe('safety');
    expect(fitLabel(1500, range, 0.299)).toBe('target');
    expect(fitLabel(1500, range, 0.15)).toBe('target');
  });

  it('is always Reach under a 15% admit rate', () => {
    expect(fitLabel(1600, range, 0.149)).toBe('reach');
    expect(fitLabel(1600, range, 0.0456)).toBe('reach');
  });

  it('is never Safety when the admit rate is unpublished', () => {
    expect(fitLabel(1600, range, null)).toBe('target');
    expect(fitLabel(1390, range, null)).toBe('reach');
  });
});
