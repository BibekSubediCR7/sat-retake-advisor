import type { SatDate } from '../../data/schema';
import { formatDate, type SchoolResult, type TimelineDate } from '../../logic';

export interface CalendarRow extends TimelineDate {
  /** "MIT (RD Jan 1)" for each chosen school this date works for. */
  usableFor: string[];
}

export interface Calendar {
  rows: CalendarRow[];
  /** Set when the student's latest deadline is after the last date College Board has listed. */
  notAnnouncedAfter: string | null;
}

const ROUND = { ED: 'ED', EA: 'EA', RD: 'RD' } as const;

/**
 * "IV. Test calendar": upcoming SAT dates up to the latest of the student's verified
 * deadlines (all upcoming dates when no deadline is known), with the schools each one works for.
 */
export function buildCalendar(results: readonly SchoolResult[], allDates: readonly SatDate[]): Calendar {
  const considered = results.filter((r) => r.status !== 'test-blind');
  const deadlines = considered.map((r) => r.timeline.deadline.date).filter((d): d is string => d !== null);
  const latest = deadlines.length ? deadlines.reduce((a, b) => (a > b ? a : b)) : null;
  const upcoming = results[0]?.timeline.dates ?? [];
  const lastKnown = allDates.at(-1)?.testDate ?? null;

  const rows = upcoming
    .filter((d) => latest === null || d.testDate <= latest)
    .map((d) => ({
      ...d,
      usableFor: considered
        .filter((r) => r.timeline.dates.find((x) => x.testDate === d.testDate)?.usable)
        .map((r) => {
          const dl = r.timeline.deadline;
          return `${r.name} (${ROUND[dl.round]} ${dl.date ? formatDate(dl.date) : ''})`;
        }),
    }));

  return { rows, notAnnouncedAfter: latest && lastKnown && latest > lastKnown ? lastKnown : null };
}
