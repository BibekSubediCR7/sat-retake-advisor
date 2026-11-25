import { describe, expect, it } from 'vitest';
import { describeRange, rangeChartGeometry, MIN_LABEL_GAP, type RangeChartInput } from './rangeChartGeometry';

const mit: RangeChartInput = {
  p25: 1520,
  p75: 1570,
  median: 1550,
  medianEstimated: false,
  score: 1450,
  scaleMin: 400,
  scaleMax: 1600,
};

describe('rangeChartGeometry', () => {
  it('fits the range and the score with padding, clamped to the scale', () => {
    const g = rangeChartGeometry(mit);
    expect(g.lo).toBeLessThanOrEqual(1450 - 40);
    expect(g.hi).toBe(1600); // 1570 + pad clamps at the top of the scale
    expect(g.you.x).toBeGreaterThan(0);
    expect(g.barStart).toBeLessThan(g.barEnd);
    for (const t of g.ticks) expect(t.x).toBeGreaterThanOrEqual(0);
    for (const t of g.ticks) expect(t.x).toBeLessThanOrEqual(100);
  });

  it('keeps everything inside 0–100 at the very edges of the scale', () => {
    const g = rangeChartGeometry({ ...mit, score: 1600, p25: 1560, median: 1580, p75: 1600 });
    expect(g.hi).toBe(1600);
    expect(g.you.x).toBe(100);
    const low = rangeChartGeometry({ ...mit, score: 400 });
    expect(low.lo).toBe(400);
    expect(low.you.x).toBe(0);
  });

  it('puts close labels on a second row so they do not overlap', () => {
    const g = rangeChartGeometry({ ...mit, score: 1100 }); // wide domain squeezes 1520/1550/1570 together
    const [p25, median, p75] = g.ticks;
    expect(median!.x - p25!.x).toBeLessThan(MIN_LABEL_GAP);
    expect([p25!.row, median!.row, p75!.row]).toEqual([0, 1, 2]);
    // No two labels on the same row are closer than the minimum gap.
    for (const a of g.ticks) for (const b of g.ticks) {
      if (a !== b && a.row === b.row) expect(Math.abs(a.x - b.x)).toBeGreaterThanOrEqual(MIN_LABEL_GAP);
    }
  });

  it('keeps one row when there is room', () => {
    const g = rangeChartGeometry({ ...mit, p25: 1300, median: 1450, p75: 1560, score: 1450 });
    expect(g.ticks.every((t) => t.row === 0)).toBe(true);
  });

  it('marks an estimated median in its label', () => {
    const g = rangeChartGeometry({ ...mit, median: 1545, medianEstimated: true, score: 1550 });
    expect(g.ticks[1]!.label).toBe('Median est. 1545');
  });

  it('works on the section scale', () => {
    const g = rangeChartGeometry({ p25: 720, median: 750, medianEstimated: false, p75: 770, score: 800, scaleMin: 200, scaleMax: 800 });
    expect(g.hi).toBe(800);
    expect(g.you.x).toBe(100);
  });
});

describe('describeRange', () => {
  it('gives a full text alternative', () => {
    expect(describeRange(mit, 'Total score')).toBe(
      'Total score: middle 50% of enrolled students scored 1520 to 1570, median 1550. Your score, 1450, is below the 25th percentile.',
    );
    expect(describeRange({ ...mit, score: 1570, medianEstimated: true }, 'Total')).toMatch(
      /estimated median 1550\. Your score, 1570, is at or above the 75th percentile\.$/,
    );
  });
});
