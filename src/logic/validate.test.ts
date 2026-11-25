import { describe, expect, it } from 'vitest';
import { validateInput } from './validate';
import { makeInput } from './fixtures';

const known = new Set(['test-u', 'mit', 'yale']);
const TODAY = '2026-11-25';
const fields = (input = makeInput()) => validateInput(input, known, TODAY).map((e) => e.field);

describe('validateInput', () => {
  it('accepts a valid input', () => {
    expect(validateInput(makeInput(), known, TODAY)).toEqual([]);
  });

  it('requires total = R&W + Math', () => {
    const errs = validateInput(makeInput({ latest: { total: 1430, rw: 700, math: 720 } }), known, TODAY);
    expect(errs).toEqual([{ field: 'latest.total', message: 'Total must equal Reading and Writing + Math (1420).' }]);
  });

  it.each([
    [{ total: 1605, rw: 800, math: 805 }, ['latest.total', 'latest.math']],
    [{ total: 1610, rw: 810, math: 800 }, ['latest.total', 'latest.rw']],
    [{ total: 395, rw: 195, math: 200 }, ['latest.total', 'latest.rw']],
    [{ total: 405, rw: 205, math: 200 }, ['latest.total', 'latest.rw']],
    [{ total: Number.NaN, rw: 700, math: 720 }, ['latest.total']],
  ])('rejects out-of-range or off-step scores %j', (latest, expected) => {
    expect(fields(makeInput({ latest }))).toEqual(expected);
  });

  it('accepts the scale edges 400/200 and 1600/800', () => {
    expect(fields(makeInput({ latest: { total: 400, rw: 200, math: 200 } }))).toEqual([]);
    expect(fields(makeInput({ latest: { total: 1600, rw: 800, math: 800 } }))).toEqual([]);
  });

  it('allows up to 5 past attempts, not 6', () => {
    const a = { rw: 650, math: 700, testMonth: '2026-03' };
    expect(fields(makeInput({ pastAttempts: Array(5).fill(a) }))).toEqual([]);
    expect(fields(makeInput({ pastAttempts: Array(6).fill(a) }))).toEqual(['pastAttempts']);
  });

  it('checks each past attempt: scores, month present, month not in the future', () => {
    const f = fields(
      makeInput({
        pastAttempts: [
          { rw: 655, math: 700, testMonth: '2026-03' },
          { rw: 650, math: 700 },
          { rw: 650, math: 700, testMonth: '2026-12' },
          { rw: 650, math: 700, testMonth: '2026-11' },
        ],
      }),
    );
    expect(f).toEqual(['pastAttempts.0.rw', 'pastAttempts.1.testMonth', 'pastAttempts.2.testMonth']);
  });

  it('requires 1 to 15 known, unique schools', () => {
    expect(fields(makeInput({ schoolIds: [] }))).toEqual(['schoolIds']);
    expect(fields(makeInput({ schoolIds: Array.from({ length: 16 }, (_, i) => `s${i}`) }))).toEqual(['schoolIds']);
    expect(fields(makeInput({ schoolIds: ['mit', 'mit'] }))).toEqual(['schoolIds']);
    expect(fields(makeInput({ schoolIds: ['mit', 'nowhere'] }))).toEqual(['schoolIds']);
    expect(fields(makeInput({ schoolIds: ['mit', 'yale', 'test-u'] }))).toEqual([]);
  });

  it('checks the context fields', () => {
    const bad = makeInput({
      grade: '8' as never,
      entryYear: 2026 as never,
      applicantType: 'other' as never,
      round: 'REA' as never,
      country: 'Nepal',
    });
    expect(fields(bad)).toEqual(['grade', 'entryYear', 'applicantType', 'round', 'country']);
  });
});
