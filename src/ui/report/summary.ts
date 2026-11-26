// Text for the "Summary of results" block at the top of the report. Pure functions over the
// results the cards already use: no new data and no new rules.
import type { AppSchool, SatDate } from '../../data/schema';
import { FIT_LABEL_TEXT, formatDate, type FitLabel, type SchoolResult } from '../../logic';
import { buildCalendar, type CalendarRow } from './calendar';
import { retakeStampText } from './cardText';

export interface SummaryRow {
  schoolId: string;
  name: string;
  /** Where the score sits against the school's total range, e.g. "40 below the median". */
  position: string;
  fit: string;
  advice: string;
  weight: string;
  deadline: string;
}

const NOT_LABELED_REASON = {
  'test-blind': 'SAT not considered',
  unverified: 'data not yet verified',
  'no-total': 'no total range published',
} as const;

const WEIGHT_TEXT: Record<NonNullable<AppSchool['testImportance']>, string> = {
  'very-important': 'Very important',
  important: 'Important',
  considered: 'Considered',
  'not-considered': 'Not considered',
};

export function positionText(r: SchoolResult): string {
  if (r.status !== 'labeled' || !r.totalRange) {
    return r.status === 'labeled' ? '—' : NOT_LABELED_REASON[r.status].replace(/^./, (c) => c.toUpperCase());
  }
  const { p75, median } = r.totalRange;
  const s = r.scoreUsed.total;
  const est = median.estimated ? ' (estimated)' : '';
  if (s >= p75) return 'At or above the 75th percentile';
  if (s === median.value) return `At the median${est}`;
  const diff = Math.round(Math.abs(s - median.value));
  return s < median.value ? `${diff} below the median${est}` : `${diff} above the median${est}`;
}

export function deadlineShort(r: SchoolResult): string {
  const d = r.timeline.deadline;
  return d.date ? `${d.round} ${formatDate(d.date)}` : `${d.round} not yet verified`;
}

export function summaryRow(r: SchoolResult, school: AppSchool | undefined): SummaryRow {
  const blind = r.status === 'test-blind';
  return {
    schoolId: r.schoolId,
    name: r.name,
    position: positionText(r),
    fit: r.fitLabel ? FIT_LABEL_TEXT[r.fitLabel] : '—',
    advice: r.retakeLabel ? retakeStampText(r.retakeLabel) : (r.statusText ?? '—').replace(/\.$/, ''),
    weight: !blind && school?.testImportance ? WEIGHT_TEXT[school.testImportance] : '—',
    deadline: deadlineShort(r),
  };
}

export interface Balance {
  counts: { fit: FitLabel; count: number }[];
  notLabeled: { reason: string; count: number }[];
}

/** Reach / target / safety counts, plus schools with no fit label and why. */
export function balance(results: readonly SchoolResult[]): Balance {
  const fits: FitLabel[] = ['reach', 'target', 'safety'];
  const counts = fits.map((fit) => ({ fit, count: results.filter((r) => r.fitLabel === fit).length }));
  const reasons = new Map<string, number>();
  for (const r of results) {
    if (r.fitLabel || r.status === 'labeled') continue;
    const reason = NOT_LABELED_REASON[r.status];
    reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
  }
  return { counts, notLabeled: [...reasons].map(([reason, count]) => ({ reason, count })) };
}

export type NextTest =
  | { kind: 'date'; row: CalendarRow; reaches: number; of: number }
  | { kind: 'none' }
  | { kind: 'not-announced' }
  | { kind: 'not-needed' };

/** The earliest SAT date the student can still register for that arrives before at least one deadline. */
export function nextTest(results: readonly SchoolResult[], dates: readonly SatDate[]): NextTest {
  const considered = results.filter((r) => r.status !== 'test-blind');
  if (considered.length === 0) return { kind: 'not-needed' };
  const { rows } = buildCalendar(results, dates);
  if (rows.length === 0) {
    return considered.some((r) => r.timeline.status === 'dates-not-announced') ? { kind: 'not-announced' } : { kind: 'none' };
  }
  const row = rows.find((d) => !d.registrationClosed && d.usableFor.length > 0);
  if (!row) return { kind: 'none' };
  return { kind: 'date', row, reaches: row.usableFor.length, of: considered.length };
}
