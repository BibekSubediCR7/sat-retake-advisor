import { describe, expect, it } from 'vitest';
import { buildReport } from '../../logic';
import { makeDate, makeInput, makeSchool } from '../../logic/fixtures';
import { buildCalendar } from './calendar';

const TODAY = '2027-01-10';
const dates = [
  makeDate('2027-03-13', { registrationDeadline: '2027-02-26', scoreRelease: '2027-03-26' }),
  makeDate('2027-10-02', { registrationDeadline: '2027-09-17', scoreRelease: '2027-10-15' }),
  makeDate('2027-11-06', { registrationDeadline: '2027-10-22', scoreRelease: '2027-11-19' }),
  makeDate('2027-12-04', { registrationDeadline: '2027-11-19', scoreRelease: '2027-12-17' }),
  makeDate('2028-03-11', { registrationDeadline: '2028-02-25', scoreRelease: '2028-03-24' }),
  makeDate('2028-05-06', { registrationDeadline: '2028-04-21', scoreRelease: '2028-05-19' }),
];
const ED_ONLY = makeSchool({ id: 'ed-u', name: 'ED U', deadlines: { ED: ['11-01'], EA: null, eaType: 'not offered', RD: '01-05' } });
const BLIND = makeSchool({
  id: 'blind-u',
  name: 'Blind U',
  testPolicy: [{ fromEntryYear: 2027, domestic: 'test-blind', international: 'test-blind', source: 'https://example.edu/t' }],
});
const UNKNOWN = makeSchool({ id: 'unk-u', name: 'Unknown U', deadlines: { ED: null, EA: null, eaType: null, RD: null } });

function cal(schools: ReturnType<typeof makeSchool>[], round: 'ED' | 'RD') {
  const input = makeInput({ entryYear: 2028, round, schoolIds: schools.map((s) => s.id) });
  return buildCalendar(buildReport(input, schools, dates, TODAY).results, dates);
}

describe('test calendar', () => {
  it('lists no date after the deadline, and drops dates too late for every school', () => {
    // Fall 2028 entry, ED Nov 1, 2027: Oct 2 (scores Oct 15) is the last usable date.
    const c = cal([ED_ONLY], 'ED');
    expect(c.rows.map((d) => d.testDate)).toEqual(['2027-03-13', '2027-10-02']);
    expect(c.empty).toBeNull();
  });

  it('keeps RD dates up to the RD deadline and nothing from spring 2028', () => {
    const c = cal([ED_ONLY], 'RD'); // RD Jan 5, 2028
    expect(c.rows.map((d) => d.testDate)).toEqual(['2027-03-13', '2027-10-02', '2027-11-06', '2027-12-04']);
  });

  it('lists nothing when no chosen school considers the SAT', () => {
    const c = cal([BLIND], 'RD');
    expect(c.rows).toEqual([]);
    expect(c.empty).toBe('no-sat');
  });

  it('with no verified deadline, stops at the end of January of the entry year', () => {
    const c = cal([UNKNOWN], 'RD');
    expect(c.deadlinesUnknown).toBe(true);
    expect(c.rows.map((d) => d.testDate).at(-1)).toBe('2027-12-04');
  });
});
