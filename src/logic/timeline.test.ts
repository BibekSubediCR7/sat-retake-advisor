import { describe, expect, it } from 'vitest';
import { buildTimeline, deadlineDate, deadlineFor, formatDate } from './timeline';
import { makeDate, makeSchool, real, realDates } from './fixtures';
import type { Deadline } from './types';

const dl = (date: string | null): Deadline => ({ round: 'RD', date, notes: [] });

describe('deadlineDate and formatDate', () => {
  it('puts Jul-Dec deadlines in the year before entry, Jan-Jun in the entry year', () => {
    expect(deadlineDate('11-01', 2027)).toBe('2026-11-01');
    expect(deadlineDate('07-01', 2027)).toBe('2026-07-01');
    expect(deadlineDate('06-30', 2027)).toBe('2027-06-30');
    expect(deadlineDate('01-05', 2029)).toBe('2029-01-05');
  });
  it('formats dates', () => {
    expect(formatDate('2026-12-05')).toBe('Dec 5, 2026');
    expect(formatDate('01-04')).toBe('Jan 4');
  });
});

describe('deadlineFor', () => {
  it('uses the chosen round when offered', () => {
    expect(deadlineFor(real('mit'), 'EA', 2028)).toEqual({ round: 'EA', date: '2027-11-01', notes: [] });
    expect(deadlineFor(real('mit'), 'RD', 2028).date).toBe('2028-01-01');
  });

  it('uses ED I and mentions ED II', () => {
    expect(deadlineFor(real('rice'), 'ED', 2028)).toEqual({
      round: 'ED',
      date: '2027-11-01',
      notes: ['This school also has Early Decision II (deadline Jan 4).'],
    });
  });

  it('falls back to RD when ED is not offered ([])', () => {
    const d = deadlineFor(real('mit'), 'ED', 2028);
    expect(d).toMatchObject({ round: 'RD', date: '2028-01-01' });
    expect(d.notes[0]).toMatch(/does not offer Early Decision/);
  });

  it('falls back to RD when EA is marked not offered', () => {
    const d = deadlineFor(real('duke'), 'EA', 2027);
    expect(d).toMatchObject({ round: 'RD', date: '2027-01-02' });
    expect(d.notes[0]).toMatch(/does not offer Early Action/);
  });

  it('returns a null date when the deadline is unknown', () => {
    expect(deadlineFor(real('uchicago'), 'RD', 2028).date).toBeNull();
    expect(deadlineFor(real('uchicago'), 'ED', 2028)).toEqual({
      round: 'ED',
      date: null,
      notes: ['Early Decision deadline not yet verified.'],
    });
    const noEa = makeSchool({ deadlines: { ED: null, EA: null, eaType: null, RD: '01-01' } });
    expect(deadlineFor(noEa, 'EA', 2028).date).toBeNull();
  });
});

describe('buildTimeline', () => {
  const dates = [
    makeDate('2027-03-06', { lateRegistrationDeadline: '2027-02-23', scoreRelease: '2027-03-19' }),
    makeDate('2027-05-01', { lateRegistrationDeadline: '2027-04-20', scoreRelease: '2027-05-14' }),
    makeDate('2027-10-09', { status: 'anticipated' }),
  ];

  it('drops past dates; a release on the deadline day counts as usable', () => {
    const t = buildTimeline(dates, dl('2027-05-14'), '2027-03-10');
    expect(t.dates.map((d) => d.testDate)).toEqual(['2027-05-01', '2027-10-09']);
    expect(t.dates.map((d) => d.usable)).toEqual([true, false]);
    expect(t.status).toBe('has-dates');
  });

  it('a release one day after the deadline is not usable', () => {
    expect(buildTimeline(dates, dl('2027-05-13'), '2027-03-10').status).toBe('no-time');
  });

  it('compares by test date when the score release is unknown, with a note', () => {
    const t = buildTimeline(dates, dl('2027-11-01'), '2027-06-01');
    expect(t.dates[0]).toMatchObject({
      testDate: '2027-10-09',
      usable: true,
      comparedByTestDate: true,
      anticipated: true,
    });
    expect(t.notes).toContain('Score release date not announced — compared using the test date.');
  });

  it('marks registration closed and does not count it as time to retake', () => {
    const t = buildTimeline(dates, dl('2027-05-20'), '2027-04-25');
    expect(t.dates[0]).toMatchObject({ testDate: '2027-05-01', registrationClosed: true, usable: true });
    expect(t.status).toBe('no-time');
    expect(t.notes).toContain('Only usable if you are already registered: May 1, 2027.');
  });

  it('says test dates are not announced when the deadline is after the last known date', () => {
    const t = buildTimeline(dates, dl('2028-01-05'), '2027-10-20');
    expect(t.status).toBe('dates-not-announced');
    expect(t.notes).toContain('Test dates not announced yet.');
  });

  it('notes unannounced later dates when some known dates are usable', () => {
    const t = buildTimeline(dates, dl('2028-01-05'), '2027-06-01');
    expect(t.status).toBe('has-dates');
    expect(t.notes).toContain('Test dates after Oct 9, 2027 not announced yet.');
  });

  it('is deadline-unknown when the deadline is null', () => {
    const t = buildTimeline(dates, dl(null), '2027-01-01');
    expect(t.status).toBe('deadline-unknown');
    expect(t.dates.every((d) => !d.usable)).toBe(true);
  });

  it('notes a deadline that has passed', () => {
    const t = buildTimeline(dates, dl('2027-01-01'), '2027-02-01');
    expect(t.status).toBe('no-time');
    expect(t.notes).toContain('This deadline has passed.');
  });

  describe('with real dates (today 2026-11-25)', () => {
    const TODAY = '2026-11-25';

    it('fall 2027 RD (Jan 1, 2027): Dec 5 counts only for registered students, so no time', () => {
      const t = buildTimeline(realDates, deadlineFor(real('mit'), 'RD', 2027), TODAY);
      expect(t.status).toBe('no-time');
      expect(t.notes).toContain('Only usable if you are already registered: Dec 5, 2026.');
    });

    it('fall 2028 EA (Nov 1, 2027): spring dates and anticipated fall dates count', () => {
      const t = buildTimeline(realDates, deadlineFor(real('mit'), 'EA', 2028), TODAY);
      expect(t.status).toBe('has-dates');
      expect(t.dates.filter((d) => d.usable).map((d) => d.testDate)).toEqual([
        '2026-12-05',
        '2027-03-06',
        '2027-05-01',
        '2027-06-05',
        '2027-08-28',
        '2027-09-18',
        '2027-10-09',
      ]);
    });

    it('fall 2029 RD: known dates usable, later dates not announced yet', () => {
      const t = buildTimeline(realDates, deadlineFor(real('mit'), 'RD', 2029), TODAY);
      expect(t.status).toBe('has-dates');
      expect(t.notes).toContain('Test dates after Jun 3, 2028 not announced yet.');
    });
  });
});
