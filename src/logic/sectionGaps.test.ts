import { describe, expect, it } from 'vitest';
import { sectionGaps } from './sectionGaps';
import { makeSchool, real } from './fixtures';
import type { ScoreUsed } from './types';

const score = (rw: number, math: number): ScoreUsed => ({ rw, math, total: rw + math, basis: 'best-sitting' });

describe('sectionGaps', () => {
  it('gives points to each section median, or already above', () => {
    // fixture medians: rw 710, math 740
    expect(sectionGaps(makeSchool(), score(680, 760))).toEqual([
      { section: 'rw', score: 680, median: { value: 710, estimated: false }, pointsNeeded: 30, aboveMedian: false },
      { section: 'math', score: 760, median: { value: 740, estimated: false }, pointsNeeded: 0, aboveMedian: true },
    ]);
  });

  it('counts exactly at the median as above', () => {
    expect(sectionGaps(makeSchool(), score(710, 740)).every((g) => g.aboveMedian)).toBe(true);
  });

  it('rounds an estimated median gap up to a multiple of 10', () => {
    const s = makeSchool({
      sat: { total: null, rw: { p25: 700, p50: null, p75: 750 }, math: null },
    });
    const [rw] = sectionGaps(s, score(700, 700));
    expect(rw).toMatchObject({ median: { value: 725, estimated: true }, pointsNeeded: 30 });
  });

  it('hides sections with no data', () => {
    expect(sectionGaps(makeSchool({ sat: { total: null, rw: null, math: null } }), score(700, 700))).toEqual([]);
  });

  it('works for Harvard, which publishes sections but no total', () => {
    expect(sectionGaps(real('harvard'), score(740, 790)).map((g) => g.pointsNeeded)).toEqual([10, 0]);
  });
});
