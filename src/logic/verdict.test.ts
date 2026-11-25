import { describe, expect, it } from 'vitest';
import { overallVerdict } from './verdict';
import type { RetakeLabel, SchoolResult, SchoolStatus } from './types';

function result(retakeLabel: RetakeLabel | null, status: SchoolStatus = 'labeled'): SchoolResult {
  return { status, retakeLabel } as SchoolResult;
}
const labels = (...ls: RetakeLabel[]) => ls.map((l) => result(l));

describe('overallVerdict', () => {
  it('Retake when half or more are below the median (exactly half)', () => {
    const v = overallVerdict(labels('strongly', 'if-time', 'optional', 'dont'));
    expect(v).toMatchObject({ kind: 'retake', sentence: 'Retake: below the median at 2 of 4 schools' });
  });

  it('Retake at 5 of 7 (PRD example)', () => {
    const v = overallVerdict(labels('strongly', 'strongly', 'if-time', 'if-time', 'if-time', 'dont', 'optional'));
    expect(v.sentence).toBe('Retake: below the median at 5 of 7 schools');
  });

  it('Optional when at least one but fewer than half', () => {
    const v = overallVerdict(labels('if-time', 'optional', 'dont', 'dont', 'dont', 'dont', 'dont'));
    expect(v).toMatchObject({ kind: 'optional', sentence: 'Optional: below the median at 1 of 7 schools' });
  });

  it("Don't retake when none are below the median", () => {
    expect(overallVerdict(labels('optional', 'dont')).sentence).toBe(
      "Don't retake: at or above the median at all 2 schools",
    );
    expect(overallVerdict(labels('dont')).sentence).toBe("Don't retake: at or above the median at your school");
  });

  it('"No time" labels are not retake labels; all no-time gives a no-time verdict', () => {
    expect(overallVerdict(labels('no-time', 'no-time', 'dont'))).toMatchObject({
      kind: 'no-time',
      sentence: 'No time to retake: no usable test date before the deadline at 2 of 3 schools',
    });
    expect(overallVerdict(labels('no-time', 'if-time', 'dont', 'dont')).kind).toBe('optional');
  });

  it('a single school', () => {
    expect(overallVerdict(labels('strongly')).sentence).toBe('Retake: below the median at 1 of 1 school');
  });

  it('only counts labeled schools and explains the rest', () => {
    const v = overallVerdict([
      ...labels('strongly', 'dont'),
      result(null, 'test-blind'),
      result(null, 'test-blind'),
      result(null, 'unverified'),
      result(null, 'no-total'),
    ]);
    expect(v).toMatchObject({ kind: 'retake', counted: 2, belowMedian: 1 });
    expect(v.excludedText).toBe(
      '4 schools not counted: 2 do not consider the SAT; 1 has data not yet verified; 1 does not publish a total score range.',
    );
  });

  it('no verdict when no school can be labeled', () => {
    const v = overallVerdict([result(null, 'unverified'), result(null, 'unverified')]);
    expect(v).toMatchObject({ kind: 'none', counted: 0 });
    expect(v.excludedText).toBe('2 schools not counted: 2 have data not yet verified.');
    expect(overallVerdict([]).kind).toBe('none');
  });
});
