import { describe, expect, it } from 'vitest';
import { medianFor, rangeView } from './ranges';

describe('medianFor', () => {
  it('uses the published median', () => {
    expect(medianFor({ p25: 1400, p50: 1460, p75: 1500 })).toEqual({ value: 1460, estimated: false });
  });
  it('estimates the midpoint when p50 is missing', () => {
    expect(medianFor({ p25: 1400, p50: null, p75: 1530 })).toEqual({ value: 1465, estimated: true });
  });
  it('returns null without p25 or p75, or with no range', () => {
    expect(medianFor({ p25: null, p50: null, p75: 1500 })).toBeNull();
    expect(medianFor(null)).toBeNull();
  });
});

describe('rangeView', () => {
  it('needs both p25 and p75', () => {
    expect(rangeView({ p25: null, p50: 1450, p75: 1500 })).toBeNull();
    expect(rangeView({ p25: 1400, p50: 1450, p75: null })).toBeNull();
    expect(rangeView(null)).toBeNull();
  });
  it('carries the estimated flag', () => {
    expect(rangeView({ p25: 1400, p50: null, p75: 1500 })).toEqual({
      p25: 1400,
      p75: 1500,
      median: { value: 1450, estimated: true },
    });
  });
});
