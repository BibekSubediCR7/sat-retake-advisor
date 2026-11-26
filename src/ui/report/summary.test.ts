import { describe, expect, it } from 'vitest';
import { buildReport } from '../../logic';
import { makeDate, makeInput, makeSchool } from '../../logic/fixtures';
import { balance, nextTest, positionText, summaryRow } from './summary';

const TODAY = '2027-03-01';
const dates = [
  makeDate('2027-03-13', { registrationDeadline: '2027-02-26', lateRegistrationDeadline: '2027-03-02', scoreRelease: '2027-03-26' }),
  makeDate('2027-05-01', { registrationDeadline: '2027-04-17', scoreRelease: '2027-05-14' }),
  makeDate('2027-06-05', { registrationDeadline: '2027-05-22', scoreRelease: '2027-06-18' }),
];

const reach = makeSchool({ id: 'reach-u', name: 'Reach U', admissions: { applied: 10000, admitted: 800, admitRate: 0.08 } });
const safety = makeSchool({
  id: 'safe-u',
  name: 'Safe U',
  sat: { total: { p25: 1300, p50: 1350, p75: 1400 }, rw: null, math: null },
  testImportance: 'very-important',
});
const blind = makeSchool({
  id: 'blind-u',
  name: 'Blind U',
  testPolicy: [{ fromEntryYear: 2027, domestic: 'test-blind', international: 'test-blind', source: 'https://example.edu/t' }],
});
const estimated = makeSchool({ id: 'est-u', name: 'Est U', sat: { total: { p25: 1400, p50: null, p75: 1500 }, rw: null, math: null } });

function report(schools = [reach, safety, blind, estimated], today = TODAY) {
  const input = makeInput({ entryYear: 2028 });
  return buildReport({ ...input, schoolIds: schools.map((s) => s.id) }, schools, dates, today);
}

describe('results summary', () => {
  it('describes where the score sits against each range', () => {
    const r = report();
    const byId = new Map(r.results.map((x) => [x.schoolId, x]));
    expect(positionText(byId.get('reach-u')!)).toBe('30 below the median'); // 1420 vs 1450
    expect(positionText(byId.get('safe-u')!)).toBe('At or above the 75th percentile');
    expect(positionText(byId.get('est-u')!)).toBe('30 below the median (estimated)');
    expect(positionText(byId.get('blind-u')!)).toBe('SAT not considered');
  });

  it('builds one row per school with fit, advice, test weight and deadline', () => {
    const r = report();
    const byId = new Map(r.results.map((x) => [x.schoolId, x]));
    expect(summaryRow(byId.get('safe-u')!, safety)).toMatchObject({
      name: 'Safe U',
      fit: 'Safety',
      advice: "Don't retake",
      weight: 'Very important',
      deadline: 'RD Jan 5, 2028',
    });
    expect(summaryRow(byId.get('reach-u')!, reach)).toMatchObject({ fit: 'Reach', advice: 'Retake if you have time' });
    // Test-blind: no fit, no weight, the status as advice.
    expect(summaryRow(byId.get('blind-u')!, blind)).toMatchObject({ fit: '—', advice: 'SAT not considered', weight: '—' });
  });

  it('counts reach, target and safety, and says why a school has no label', () => {
    const b = balance(report().results);
    expect(b.counts).toEqual([
      { fit: 'reach', count: 2 },
      { fit: 'target', count: 0 },
      { fit: 'safety', count: 1 },
    ]);
    expect(b.notLabeled).toEqual([{ reason: 'SAT not considered', count: 1 }]);
  });

  it('picks the next SAT date you can still register for, skipping closed registration', () => {
    const open = nextTest(report().results, dates);
    expect(open).toMatchObject({ kind: 'date', reaches: 3, of: 3, row: { testDate: '2027-03-13' } });
    // On March 5 the March 13 late registration (Mar 2) has closed, so May 1 is next.
    const later = nextTest(report(undefined, '2027-03-05').results, dates);
    expect(later).toMatchObject({ kind: 'date', row: { testDate: '2027-05-01' } });
  });

  it('says so when no school considers the SAT', () => {
    expect(nextTest(report([blind]).results, dates)).toEqual({ kind: 'not-needed' });
  });
});
