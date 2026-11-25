import type { SchoolResult, SchoolStatus, Verdict } from './types';

const EXCLUDED_TEXT: Record<Exclude<SchoolStatus, 'labeled'>, (n: number) => string> = {
  'test-blind': (n) => `${n} ${n === 1 ? 'does' : 'do'} not consider the SAT`,
  unverified: (n) => `${n} ${n === 1 ? 'has' : 'have'} data not yet verified`,
  'no-total': (n) => `${n} ${n === 1 ? 'does' : 'do'} not publish a total score range`,
};

const plural = (n: number) => (n === 1 ? 'school' : 'schools');

/**
 * Overall verdict (FR-3). Counts only schools with a retake label: they consider the SAT
 * and have a published total range. Uses the final labels, after the "no time" rule:
 * - Retake: half or more are "strongly recommended" or "if you have time".
 * - Optional: at least one, but fewer than half.
 * - No time: none, but at least one school has no usable test date left.
 * - Don't retake: none.
 */
export function overallVerdict(results: readonly SchoolResult[]): Verdict {
  const labeled = results.filter((r) => r.status === 'labeled');
  const counted = labeled.length;
  const belowMedian = labeled.filter((r) => r.retakeLabel === 'strongly' || r.retakeLabel === 'if-time').length;
  const noTime = labeled.filter((r) => r.retakeLabel === 'no-time').length;

  const excluded = (['test-blind', 'unverified', 'no-total'] as const)
    .map((status) => ({ status, count: results.filter((r) => r.status === status).length }))
    .filter((e) => e.count > 0);
  const excludedTotal = excluded.reduce((n, e) => n + e.count, 0);
  const excludedText = excludedTotal
    ? `${excludedTotal} ${plural(excludedTotal)} not counted: ${excluded
        .map((e) => EXCLUDED_TEXT[e.status](e.count))
        .join('; ')}.`
    : null;

  if (counted === 0) {
    return {
      kind: 'none',
      sentence: 'No verdict: none of your schools has a verified SAT range to compare with.',
      counted,
      belowMedian,
      excluded,
      excludedText,
    };
  }

  const at = `at ${belowMedian} of ${counted} ${plural(counted)}`;
  if (belowMedian * 2 >= counted) {
    return { kind: 'retake', sentence: `Retake: below the median ${at}`, counted, belowMedian, excluded, excludedText };
  }
  if (belowMedian > 0) {
    return { kind: 'optional', sentence: `Optional: below the median ${at}`, counted, belowMedian, excluded, excludedText };
  }
  if (noTime > 0) {
    return {
      kind: 'no-time',
      sentence: `No time to retake: no usable test date before the deadline at ${noTime} of ${counted} ${plural(counted)}`,
      counted,
      belowMedian,
      excluded,
      excludedText,
    };
  }
  return {
    kind: 'dont',
    sentence: `Don't retake: at or above the median at ${counted === 1 ? 'your school' : `all ${counted} schools`}`,
    counted,
    belowMedian,
    excluded,
    excludedText,
  };
}
