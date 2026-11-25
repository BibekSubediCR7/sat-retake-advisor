import { describe, expect, it } from 'vitest';
import { buildReport } from './index';
import { makeInput, realDates, realSchools } from './fixtures';

describe('buildReport (real data)', () => {
  it('builds results in the chosen order with a verdict', () => {
    const input = makeInput({
      latest: { total: 1450, rw: 700, math: 750 },
      entryYear: 2028,
      applicantType: 'international',
      round: 'RD',
      schoolIds: ['mit', 'harvard', 'ucla', 'princeton', 'gatech', 'uw'],
    });
    const r = buildReport(input, realSchools, realDates, '2026-11-25');
    expect(r.results.map((x) => [x.schoolId, x.status, x.retakeLabel])).toMatchSnapshot();
    expect(r.verdict).toMatchSnapshot();
  });

  it('throws on an unknown id (input must be validated first)', () => {
    expect(() => buildReport(makeInput({ schoolIds: ['nope'] }), realSchools, realDates, '2026-11-25')).toThrow();
  });
});
