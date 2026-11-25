import type { School } from '../data/schema';
import type { ScoreUsed, Sitting, StudentInput } from './types';

/** The latest score plus every past attempt. */
export function allSittings(input: Pick<StudentInput, 'latest' | 'pastAttempts'>): Sitting[] {
  return [{ rw: input.latest.rw, math: input.latest.math }, ...input.pastAttempts];
}

/**
 * Best single sitting by total. On a tie, the sitting with the higher Math score wins
 * (then the earlier one in the list, i.e. the latest score).
 */
export function bestSitting(sittings: readonly Sitting[]): ScoreUsed {
  const first = sittings[0];
  if (!first) throw new Error('bestSitting needs at least one sitting');
  let best = first;
  for (const s of sittings.slice(1)) {
    const t = s.rw + s.math;
    const bt = best.rw + best.math;
    if (t > bt || (t === bt && s.math > best.math)) best = s;
  }
  return { total: best.rw + best.math, rw: best.rw, math: best.math, basis: 'best-sitting' };
}

/** Best Reading and Writing + best Math across all sittings (FR-7). */
export function superscore(sittings: readonly Sitting[]): ScoreUsed {
  if (!sittings.length) throw new Error('superscore needs at least one sitting');
  const rw = Math.max(...sittings.map((s) => s.rw));
  const math = Math.max(...sittings.map((s) => s.math));
  return { total: rw + math, rw, math, basis: 'superscore' };
}

/**
 * Score used for a school (S): the superscore only when the school says it superscores.
 * "no", "not stated" and "n/a" all use the best single sitting.
 */
export function scoreForSchool(school: Pick<School, 'superscore'>, sittings: readonly Sitting[]): ScoreUsed {
  return school.superscore === 'yes' ? superscore(sittings) : bestSitting(sittings);
}
