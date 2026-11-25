import type { AppSchool, SatDate } from '../data/schema';
import { fitLabel, retakeBand } from './labels';
import { policyFor, policyNotes } from './policy';
import { rangeView } from './ranges';
import { sectionGaps } from './sectionGaps';
import { allSittings, scoreForSchool } from './superscore';
import { buildTimeline, deadlineFor } from './timeline';
import { LABEL_DISCLAIMER, type RetakeLabel, type SchoolResult, type StudentInput } from './types';

export const NOTES = {
  manyAttempts: 'Score gains usually shrink after 2–3 attempts.',
  applyWithoutScore: "Consider applying without a score if this school's policy allows it for your applicant type.",
  allScores: 'This school sees every SAT you take, so make your next attempt count.',
  scoreChoice: 'You can send only your best test dates.',
  superscoreNotStated: 'Superscore policy not stated — using your best single test date.',
  estimatedMedian: 'Median not published — estimated from the 25th and 75th percentiles.',
} as const;

export const STATUS_TEXT = {
  'test-blind': 'SAT not considered.',
  unverified: 'Data not yet verified.',
  'no-total': 'Total score range not published.',
} as const;

/** Labels the "no time" rule replaces. "Don't retake" stays: it already says not to retake. */
const RETAKE_ADVICE: ReadonlySet<RetakeLabel> = new Set(['strongly', 'if-time', 'optional']);

/**
 * One school's result, applying the PRD "Retake logic" adjustments in order:
 * 1. Test-blind → no label, "SAT not considered".
 *    (Then: scores not verified → "Data not yet verified"; no published total → no label.)
 * 2. Admit rate under 15% → Reach (inside fitLabel).
 * 3. No usable test dates before the deadline → "No time to retake".
 * 4. 3 or more sittings (latest included) → diminishing-returns note.
 * 5. Test-optional and S below the 25th → "consider applying without a score".
 * Then the score-sending note and the "score ranges only" disclaimer.
 * `today` is "YYYY-MM-DD".
 */
export function evaluateSchool(
  school: AppSchool,
  input: StudentInput,
  dates: readonly SatDate[],
  today: string,
): SchoolResult {
  const sittings = allSittings(input);
  const scoreUsed = scoreForSchool(school, sittings);
  const policy = policyFor(school, input.entryYear, input.applicantType);
  const timeline = buildTimeline(dates, deadlineFor(school, input.round, input.entryYear), today);
  const notes = policyNotes(policy, input.applicantType);

  const base = {
    schoolId: school.id,
    name: school.name,
    scoreUsed,
    policy,
    timeline,
    band: null,
    retakeLabel: null,
    fitLabel: null,
    disclaimer: null,
  } as const;

  // 1. Test-blind for this applicant type and entry year.
  if (policy.value === 'test-blind') {
    return {
      ...base,
      status: 'test-blind',
      statusText: STATUS_TEXT['test-blind'],
      totalRange: null,
      sectionGaps: [],
      notes,
    };
  }

  if (school.superscore === 'not stated') notes.push(NOTES.superscoreNotStated);
  if (school.scoreSending === 'score-choice') notes.push(NOTES.scoreChoice);
  if (school.scoreSending === 'all-scores-required' || school.scoreSending === 'all-scores-recommended') {
    notes.push(NOTES.allScores);
  }

  if (school.status.scores === 'needs-official-check') {
    return {
      ...base,
      status: 'unverified',
      statusText: STATUS_TEXT.unverified,
      totalRange: null,
      sectionGaps: [],
      notes,
    };
  }

  const gaps = sectionGaps(school, scoreUsed);
  const totalRange = rangeView(school.sat.total);
  if (!totalRange) {
    return { ...base, status: 'no-total', statusText: STATUS_TEXT['no-total'], totalRange: null, sectionGaps: gaps, notes };
  }

  const S = scoreUsed.total;
  const band = retakeBand(S, totalRange);
  const fit = fitLabel(S, totalRange, school.admissions.admitRate);

  // 3. No usable test dates (only when dates are known and the deadline is verified).
  const retakeLabel: RetakeLabel = timeline.status === 'no-time' && RETAKE_ADVICE.has(band) ? 'no-time' : band;

  if (totalRange.median.estimated) notes.push(NOTES.estimatedMedian);
  // 4. Many attempts (all sittings, latest included).
  if (sittings.length >= 3) notes.push(NOTES.manyAttempts);
  // 5. Test-optional and below the 25th percentile.
  if (policy.value === 'optional' && S < totalRange.p25) notes.push(NOTES.applyWithoutScore);

  return {
    ...base,
    status: 'labeled',
    statusText: null,
    totalRange,
    band,
    retakeLabel,
    fitLabel: fit,
    sectionGaps: gaps,
    notes,
    disclaimer: LABEL_DISCLAIMER,
  };
}
