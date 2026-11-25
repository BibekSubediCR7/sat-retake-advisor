import type { SatDate, School } from '../data/schema';
import type { Deadline, EntryYear, Round, Timeline, TimelineDate } from './types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-12-05" → "Dec 5, 2026"; "01-04" → "Jan 4". */
export function formatDate(iso: string): string {
  const parts = iso.split('-').map(Number);
  if (parts.length === 2) return `${MONTHS[parts[0]! - 1]} ${parts[1]}`;
  return `${MONTHS[parts[1]! - 1]} ${parts[2]}, ${parts[0]}`;
}

/** Deadlines in July–December fall in the year before entry; January–June in the entry year. */
export function deadlineDate(monthDay: string, entryYear: EntryYear): string {
  const month = Number(monthDay.slice(0, 2));
  return `${month >= 7 ? entryYear - 1 : entryYear}-${monthDay}`;
}

const ROUND_NAME: Record<Round, string> = { ED: 'Early Decision', EA: 'Early Action', RD: 'Regular Decision' };

function regular(school: Pick<School, 'deadlines'>, entryYear: EntryYear, notes: string[]): Deadline {
  const rd = school.deadlines.RD;
  if (rd === null) notes.push('Regular Decision deadline not yet verified.');
  return { round: 'RD', date: rd === null ? null : deadlineDate(rd, entryYear), notes };
}

/**
 * Deadline for the student's round.
 * - ED with two deadlines: ED I, with a note about ED II.
 * - Round not offered (ED: [] or EA marked "not offered"): Regular Decision, with a note.
 * - Unknown deadline (null): date null → "Deadline not yet verified".
 */
export function deadlineFor(school: Pick<School, 'deadlines'>, round: Round, entryYear: EntryYear): Deadline {
  const { ED, EA, eaType } = school.deadlines;
  if (round === 'RD') return regular(school, entryYear, []);

  if (round === 'ED') {
    if (ED === null) return { round, date: null, notes: ['Early Decision deadline not yet verified.'] };
    const [first, second] = ED;
    if (first === undefined) {
      return regular(school, entryYear, [
        'This school does not offer Early Decision; using the Regular Decision deadline.',
      ]);
    }
    const notes = second ? [`This school also has Early Decision II (deadline ${formatDate(second)}).`] : [];
    return { round, date: deadlineDate(first, entryYear), notes };
  }

  if (EA !== null) return { round, date: deadlineDate(EA, entryYear), notes: [] };
  if (eaType?.toLowerCase().startsWith('not offered')) {
    return regular(school, entryYear, [
      'This school does not offer Early Action; using the Regular Decision deadline.',
    ]);
  }
  return { round, date: null, notes: [`${ROUND_NAME[round]} deadline not yet verified.`] };
}

/**
 * Upcoming SAT dates and whether each can be used before the deadline (FR-9, CLAUDE.md rules).
 * A date is usable when its score release is on or before the deadline; when the release
 * date isn't published, the test date itself is compared (and a note says so).
 * Dates whose late registration has closed are listed but don't count for "time to retake".
 * `today` is "YYYY-MM-DD".
 */
export function buildTimeline(dates: readonly SatDate[], deadline: Deadline, today: string): Timeline {
  const notes: string[] = [];
  const upcoming: TimelineDate[] = dates
    .filter((d) => d.testDate >= today)
    .map((d) => {
      const lastChance = d.lateRegistrationDeadline ?? d.registrationDeadline;
      const comparedByTestDate = d.scoreRelease === null;
      const usable =
        deadline.date !== null && (d.scoreRelease ?? d.testDate) <= deadline.date;
      return {
        testDate: d.testDate,
        registrationDeadline: d.registrationDeadline,
        lateRegistrationDeadline: d.lateRegistrationDeadline,
        scoreRelease: d.scoreRelease,
        anticipated: d.status === 'anticipated',
        registrationClosed: lastChance !== null && today > lastChance,
        usable,
        comparedByTestDate,
      };
    });

  if (deadline.date === null) {
    return { deadline, status: 'deadline-unknown', dates: upcoming, notes: ['Deadline not yet verified.'] };
  }

  const usable = upcoming.filter((d) => d.usable);
  const open = usable.filter((d) => !d.registrationClosed);
  const closed = usable.filter((d) => d.registrationClosed);
  const lastKnown = dates.at(-1)?.testDate ?? null;
  const beyondKnownDates = lastKnown === null || deadline.date > lastKnown;

  if (deadline.date < today) notes.push('This deadline has passed.');
  if (usable.some((d) => d.comparedByTestDate)) {
    notes.push('Score release date not announced — compared using the test date.');
  }
  if (closed.length) {
    notes.push(
      `Only usable if you are already registered: ${closed.map((d) => formatDate(d.testDate)).join(', ')}.`,
    );
  }

  let status: Timeline['status'];
  if (open.length) {
    status = 'has-dates';
    if (beyondKnownDates && lastKnown) {
      notes.push(`Test dates after ${formatDate(lastKnown)} not announced yet.`);
    }
  } else if (beyondKnownDates) {
    status = 'dates-not-announced';
    notes.push('Test dates not announced yet.');
  } else {
    status = 'no-time';
  }

  return { deadline, status, dates: upcoming, notes };
}
