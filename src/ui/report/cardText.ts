// Wording for school cards. Pure functions, so the text is easy to test and keep consistent.
import type { AppSchool } from '../../data/schema';
import {
  FIT_LABEL_TEXT,
  RETAKE_LABEL_TEXT,
  formatDate,
  policyText,
  type FitLabel,
  type RetakeLabel,
  type SchoolResult,
  type ScoreUsed,
  type SectionGap,
  type Timeline,
} from '../../logic';
import type { StampTone } from '../parts/Stamp';

export const retakeTone: Record<RetakeLabel, StampTone> = {
  strongly: 'red',
  'if-time': 'amber',
  'no-time': 'ink',
  optional: 'ink',
  dont: 'green',
};

export const fitTone: Record<FitLabel, StampTone> = { reach: 'red', target: 'ink', safety: 'green' };

export const retakeStampText = (l: RetakeLabel) => RETAKE_LABEL_TEXT[l].replace(/[.;].*$/, '');
export const fitStampText = (f: FitLabel) => FIT_LABEL_TEXT[f];

export function scoreUsedText(s: ScoreUsed): string {
  const parts = `${s.rw} R&W + ${s.math} Math`;
  return s.basis === 'superscore' ? `${s.total} — superscore (${parts})` : `${s.total} — best single test date (${parts})`;
}

const SECTION_NAME = { rw: 'Reading & Writing', math: 'Math' } as const;

export function gapText(g: SectionGap): string {
  const est = g.median.estimated ? ' (estimated)' : '';
  return g.aboveMedian
    ? `${SECTION_NAME[g.section]}: ${g.score}, at or above the median${est}`
    : `${SECTION_NAME[g.section]}: ${g.score}, +${g.pointsNeeded} to reach the median${est}`;
}

export function superscoreText(v: AppSchool['superscore']): string | null {
  switch (v) {
    case 'yes':
      return 'Superscores: combines your best section scores across test dates.';
    case 'no':
      return 'Does not superscore: uses your best single test date.';
    case 'not stated':
      return 'Superscore policy not stated by the school.';
    case 'n/a':
      return null;
  }
}

export function scoreSendingText(v: AppSchool['scoreSending']): string | null {
  switch (v) {
    case 'score-choice':
      return 'Score Choice: you choose which test dates to send.';
    case 'all-scores-required':
      return 'Requires all SAT scores.';
    case 'all-scores-recommended':
      return 'Recommends sending all SAT scores.';
    case 'not stated':
      return 'Score-sending policy not stated by the school.';
    case 'n/a':
      return null;
  }
}

export function admitRateText(s: AppSchool): string {
  const r = s.admissions.admitRate;
  if (r === null) return 'Admit rate: not published';
  return `Admit rate ${(r * 100).toFixed(1)}%${s.dataYear ? ` (${s.dataYear})` : ''}`;
}

export function submittingText(s: AppSchool): string | null {
  return s.pctSubmittingSAT === null ? null : `${s.pctSubmittingSAT}% of enrolled students sent SAT scores`;
}

const TEST_IMPORTANCE_TEXT: Record<NonNullable<AppSchool['testImportance']>, string> = {
  'very-important': 'Very important',
  important: 'Important',
  considered: 'Considered',
  'not-considered': 'Not considered',
};

/** CDS C7 rating of "Standardized test scores"; null when it hasn't been read yet. */
export function testImportanceText(s: AppSchool): string | null {
  if (s.testImportance === null) return null;
  const year = s.dataYear ? ` ${s.dataYear}` : '';
  return `${TEST_IMPORTANCE_TEXT[s.testImportance]} in admission decisions (Common Data Set${year}, section C7)`;
}

/** Policy line; a single open-ended entry says which cycle it was published for. */
export function policyLine(result: SchoolResult, school: AppSchool): string {
  const p = result.policy;
  const text = policyText(p);
  const last = school.testPolicy[school.testPolicy.length - 1];
  const carried = p.value !== 'not-announced' && p.entry === last && p.entryYear > p.entry.fromEntryYear;
  return carried ? `${text} — as published for the fall ${p.entry.fromEntryYear} cycle` : text;
}

const ROUND_NAME = { ED: 'Early Decision', EA: 'Early Action', RD: 'Regular Decision' } as const;

export function deadlineText(t: Timeline): string {
  const name = ROUND_NAME[t.deadline.round];
  return t.deadline.date ? `${name} deadline: ${formatDate(t.deadline.date)}` : `${name} deadline not yet verified`;
}

export function timelineStatusText(t: Timeline): string | null {
  const open = t.dates.filter((d) => d.usable && !d.registrationClosed).length;
  switch (t.status) {
    case 'has-dates':
      return `${open} SAT ${open === 1 ? 'date' : 'dates'} you can still use before this deadline.`;
    case 'no-time':
      return 'Too late for another SAT: scores from every date you can still register for would come out after this deadline.';
    case 'dates-not-announced':
      return 'Test dates not announced yet.';
    case 'deadline-unknown':
      return null;
  }
}
