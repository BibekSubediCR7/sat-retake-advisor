import { describe, expect, it } from 'vitest';
import { sortResults } from './order';
import type { RetakeLabel, SchoolResult, SchoolStatus } from './types';

const r = (schoolId: string, retakeLabel: RetakeLabel | null, status: SchoolStatus = 'labeled') =>
  ({ schoolId, retakeLabel, status }) as SchoolResult;

describe('sortResults', () => {
  it('puts the most urgent first and unlabeled schools last', () => {
    const sorted = sortResults([
      r('a', 'dont'),
      r('b', null, 'test-blind'),
      r('c', 'optional'),
      r('d', null, 'unverified'),
      r('e', 'no-time'),
      r('f', 'if-time'),
      r('g', null, 'no-total'),
      r('h', 'strongly'),
    ]);
    expect(sorted.map((x) => x.schoolId)).toEqual(['h', 'f', 'e', 'c', 'a', 'd', 'g', 'b']);
  });

  it('keeps the chosen order for equal labels and does not mutate the input', () => {
    const input = [r('x', 'if-time'), r('y', 'strongly'), r('z', 'if-time')];
    expect(sortResults(input).map((x) => x.schoolId)).toEqual(['y', 'x', 'z']);
    expect(input.map((x) => x.schoolId)).toEqual(['x', 'y', 'z']);
  });
});
