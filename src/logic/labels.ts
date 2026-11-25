import type { FitLabel, RangeView, RetakeLabel } from './types';

export const HIGHLY_SELECTIVE_ADMIT_RATE = 0.15;
export const SAFETY_MIN_ADMIT_RATE = 0.3;

/** PRD "Retake logic" band table. Boundaries belong to the higher band (S = p25 is "if you have time"). */
export function retakeBand(score: number, range: RangeView): Exclude<RetakeLabel, 'no-time'> {
  if (score < range.p25) return 'strongly';
  if (score < range.median.value) return 'if-time';
  if (score < range.p75) return 'optional';
  return 'dont';
}

/**
 * Reach / target / safety.
 * - Admit rate under 15%: always Reach (PRD adjustment 2).
 * - Below the median: Reach. Median to below 75th: Target.
 * - 75th or above: Safety if the admit rate is 30% or more, otherwise Target.
 *   Unpublished admit rate: Target (never Safety).
 */
export function fitLabel(score: number, range: RangeView, admitRate: number | null): FitLabel {
  if (admitRate !== null && admitRate < HIGHLY_SELECTIVE_ADMIT_RATE) return 'reach';
  if (score < range.median.value) return 'reach';
  if (score < range.p75) return 'target';
  return admitRate !== null && admitRate >= SAFETY_MIN_ADMIT_RATE ? 'safety' : 'target';
}
