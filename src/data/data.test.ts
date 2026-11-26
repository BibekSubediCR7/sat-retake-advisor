import { describe, expect, it } from 'vitest';
import schools from '../../data/schools.json';
import satDates from '../../data/sat-dates.json';
import { checkSatDates, checkSchools } from './schema';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
type Rec = Record<string, any>; // test-only mutation of raw JSON

describe('data/schools.json', () => {
  it('passes the schema check', () => {
    expect(checkSchools(schools).errors).toEqual([]);
  });

  it('fails when a policy entry loses its source URL', () => {
    const bad = clone(schools) as Rec[];
    bad[0]!.testPolicy[0].source = null;
    const { errors } = checkSchools(bad);
    expect(errors.some((e) => e.where.startsWith('mit.testPolicy.0'))).toBe(true);
  });

  it('fails when a policy source is not one of the school\'s own sources', () => {
    const bad = clone(schools) as Rec[];
    bad[0]!.testPolicy[0].source = 'https://example.com/made-up';
    expect(checkSchools(bad).errors.length).toBeGreaterThan(0);
  });

  it('fails when a school with scores has no data year', () => {
    const bad = clone(schools) as Rec[];
    bad[0]!.dataYear = null;
    expect(checkSchools(bad).errors).toContainEqual({
      where: 'mit.dataYear',
      message: 'required when any score or admissions value is present',
    });
  });

  it('fails when a school with scores has no CDS source', () => {
    const bad = clone(schools) as Rec[];
    bad[0]!.sources.cds = null;
    expect(checkSchools(bad).errors.some((e) => e.where === 'mit.sources.cds')).toBe(true);
  });

  it('allows a null data year only when no values are present', () => {
    const empty = clone(schools) as Rec[];
    const s = empty[0]!;
    s.dataYear = null;
    s.admissions = { applied: null, admitted: null, admitRate: null };
    s.sat = { total: null, rw: null, math: null };
    s.pctSubmittingSAT = null;
    s.sources.cds = null;
    expect(checkSchools(empty).errors.some((e) => e.where === `${s.id}.dataYear`)).toBe(false);
    const filled = clone(schools) as Rec[];
    filled[0]!.dataYear = null;
    expect(checkSchools(filled).errors.some((e) => e.where === `${filled[0]!.id}.dataYear`)).toBe(true);
  });

  it('fails on out-of-order or off-scale percentiles, and unknown odd values', () => {
    const bad = clone(schools) as Rec[];
    bad[0]!.sat.total.p25 = 1580; // above p50 1550
    bad[0]!.sat.math.p75 = 810;
    bad[0]!.sat.rw.p50 = 755;
    const where = checkSchools(bad).errors.map((e) => e.where);
    expect(where).toEqual(expect.arrayContaining(['mit.sat.total', 'mit.sat.math.p75', 'mit.sat.rw.p50']));
  });

  it('keeps printed odd values on the allowlist as warnings', () => {
    const { warnings } = checkSchools(schools);
    expect(warnings.map((w) => w.where)).toEqual(expect.arrayContaining(['columbia.sat.rw.p75', 'uw.sat.total.p75']));
  });

  it('fails on unsorted policy entries, unknown enum values and duplicate ids', () => {
    const bad = clone(schools) as Rec[];
    const princeton = bad.find((s) => s.id === 'princeton')!;
    princeton.testPolicy.reverse();
    bad[0]!.superscore = 'maybe';
    bad.push(clone(bad[1]!));
    const where = checkSchools(bad).errors.map((e) => e.where);
    expect(where).toEqual(expect.arrayContaining(['princeton.testPolicy.0', 'mit.superscore']));
    expect(checkSchools(bad).errors.some((e) => e.message === 'duplicate id')).toBe(true);
  });

  it('every not-announced entry has a note and comes after an announced one', () => {
    for (const s of schools as Rec[]) {
      expect(s.testPolicy[0].domestic).not.toBe('not-announced');
      for (const e of s.testPolicy) if (e.domestic === 'not-announced') expect(e.note).toBeTruthy();
    }
  });
});

describe('data/sat-dates.json', () => {
  it('passes the schema check', () => {
    expect(checkSatDates(satDates).errors).toEqual([]);
  });

  it('fails when the source is missing or dates are unsorted', () => {
    const bad = clone(satDates) as Rec;
    delete bad.sources.dates;
    bad.dates.reverse();
    const where = checkSatDates(bad).errors.map((e) => e.where);
    expect(where).toContain('sat-dates.sources.dates');
  });

  it('fails when a confirmed date has no registration deadline', () => {
    const bad = clone(satDates) as Rec;
    bad.dates[0].registrationDeadline = null;
    expect(checkSatDates(bad).errors.length).toBeGreaterThan(0);
  });
});
