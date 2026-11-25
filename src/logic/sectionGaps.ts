import type { School } from '../data/schema';
import { medianFor } from './ranges';
import type { ScoreUsed, SectionGap } from './types';

/**
 * Points needed in each section to reach the school's median (FR-6), using the same
 * basis as the total (superscore sections or the best sitting's sections).
 * A section with no published range is left out; the UI hides gaps when empty.
 * Points are rounded up to a multiple of 10, since section scores move in steps of 10.
 */
export function sectionGaps(school: Pick<School, 'sat'>, score: ScoreUsed): SectionGap[] {
  const gaps: SectionGap[] = [];
  for (const section of ['rw', 'math'] as const) {
    const median = medianFor(school.sat[section]);
    if (!median) continue;
    const value = score[section];
    const missing = median.value - value;
    gaps.push({
      section,
      score: value,
      median,
      pointsNeeded: missing > 0 ? Math.ceil(missing / 10) * 10 : 0,
      aboveMedian: missing <= 0,
    });
  }
  return gaps;
}
