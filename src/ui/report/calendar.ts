import type { SatDate } from '../../data/schema';
import { formatDate, type SchoolResult, type TimelineDate } from '../../logic';

export interface CalendarRow extends TimelineDate {
  /** "MIT (RD Jan 1)" for each chosen school this date works for. */
  usableFor: string[];
}

/** Why the calendar has no rows (null when it has some). */
export type CalendarEmpty = 'no-sat' | 'too-late' | 'not-announced' | null;

export interface Calendar {
  rows: CalendarRow[];
  /** Set when the student's latest deadline is after the last date College Board has listed. */
  notAnnouncedAfter: string | null;
  /** No school has a verified deadline: rows run to the end of January of the entry year. */
  deadlinesUnknown: boolean;
  empty: CalendarEmpty;
}

const ROUND = { ED: 'ED', EA: 'EA', RD: 'RD' } as const;

/**
 * "IV. Test calendar": only the SAT dates that matter for the student's list.
 * - Schools that don't consider the SAT are ignored; if none does, no dates are listed.
 * - With verified deadlines: dates that reach at least one of them in time (nothing after).
 * - With no verified deadline: dates up to January 31 of the entry year, the end of the
 *   usual application season, labeled so the student knows the deadlines aren't verified.
 */
export function buildCalendar(results: readonly SchoolResult[], allDates: readonly SatDate[]): Calendar {
  const considered = results.filter((r) => r.status !== 'test-blind');
  const none = { notAnnouncedAfter: null, deadlinesUnknown: false };
  if (considered.length === 0) return { rows: [], ...none, empty: 'no-sat' };

  const deadlines = considered.map((r) => r.timeline.deadline.date).filter((d): d is string => d !== null);
  const latest = deadlines.length ? deadlines.reduce((a, b) => (a > b ? a : b)) : null;
  const upcoming = considered[0]!.timeline.dates;
  const lastKnown = allDates.at(-1)?.testDate ?? null;
  const entryYear = considered[0]!.policy.entryYear;
  const cutoff = latest ?? `${entryYear}-01-31`;

  const rows = upcoming
    .filter((d) => d.testDate <= cutoff)
    .map((d) => ({
      ...d,
      usableFor: considered
        .filter((r) => r.timeline.dates.find((x) => x.testDate === d.testDate)?.usable)
        .map((r) => {
          const dl = r.timeline.deadline;
          return `${r.name} (${ROUND[dl.round]} ${dl.date ? formatDate(dl.date) : ''})`;
        }),
    }))
    // With verified deadlines, a date that reaches none of them is left out.
    .filter((d) => latest === null || d.usableFor.length > 0);

  const notAnnouncedAfter = lastKnown && cutoff > lastKnown ? lastKnown : null;
  let empty: CalendarEmpty = null;
  if (rows.length === 0) empty = upcoming.length === 0 || notAnnouncedAfter ? 'not-announced' : 'too-late';
  return { rows, notAnnouncedAfter, deadlinesUnknown: latest === null, empty };
}
