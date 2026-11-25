import type { SchoolResult } from './types';

const RANK: Record<string, number> = {
  strongly: 0,
  'if-time': 1,
  'no-time': 2,
  optional: 3,
  dont: 4,
  unverified: 5,
  'no-total': 6,
  'test-blind': 7,
};

/**
 * Most urgent first: strongly → if you have time → no time → optional → don't retake,
 * then schools without a label (not verified, no total, SAT not considered).
 * Equal ranks keep the student's order (Array.prototype.sort is stable).
 */
export function sortResults(results: readonly SchoolResult[]): SchoolResult[] {
  const rank = (r: SchoolResult) => RANK[r.retakeLabel ?? r.status] ?? 99;
  return [...results].sort((a, b) => rank(a) - rank(b));
}
