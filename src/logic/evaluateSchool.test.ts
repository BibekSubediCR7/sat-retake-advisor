import { describe, expect, it } from 'vitest';
import { evaluateSchool, NOTES } from './evaluateSchool';
import { makeDate, makeInput, makeSchool, real, realDates, realSchools } from './fixtures';
import { LABEL_DISCLAIMER, type StudentInput } from './types';

const TODAY = '2026-11-25';
// One open, usable date for fall 2028 RD (deadline Jan 5, 2028).
const DATES = [makeDate('2027-10-09', { status: 'anticipated' })];
const OPTIONAL = [
  { fromEntryYear: 2027, domestic: 'optional', international: 'optional', source: 'https://example.edu/testing' },
] as const;

const withScore = (rw: number, math: number, extra: Partial<StudentInput> = {}) =>
  makeInput({ latest: { total: rw + math, rw, math }, ...extra });

describe('evaluateSchool: labels from the band table', () => {
  // fixture total range: 1400 / 1450 / 1500, admit rate 40%
  it.each([
    [690, 700, 'strongly', 'reach'],
    [700, 700, 'if-time', 'reach'],
    [720, 730, 'optional', 'target'],
    [750, 750, 'dont', 'safety'],
  ] as const)('%i + %i → %s / %s', (rw, math, label, fit) => {
    const r = evaluateSchool(makeSchool(), withScore(rw, math), DATES, TODAY);
    expect(r.status).toBe('labeled');
    expect(r.retakeLabel).toBe(label);
    expect(r.fitLabel).toBe(fit);
    expect(r.disclaimer).toBe(LABEL_DISCLAIMER);
  });

  it('uses the superscore at a superscoring school and the best sitting elsewhere', () => {
    const input = withScore(700, 690, { pastAttempts: [{ rw: 660, math: 760, testMonth: '2026-06' }] });
    // superscore 700 + 760 = 1460 (optional); best sitting 1420 (if-time)
    expect(evaluateSchool(makeSchool(), input, DATES, TODAY)).toMatchObject({
      scoreUsed: { total: 1460, basis: 'superscore' },
      retakeLabel: 'optional',
    });
    expect(evaluateSchool(makeSchool({ superscore: 'no' }), input, DATES, TODAY)).toMatchObject({
      scoreUsed: { total: 1420, basis: 'best-sitting' },
      retakeLabel: 'if-time',
    });
  });

  it('section gaps use the same basis as the total', () => {
    const input = withScore(700, 690, { pastAttempts: [{ rw: 660, math: 760, testMonth: '2026-06' }] });
    const r = evaluateSchool(makeSchool(), input, DATES, TODAY);
    expect(r.sectionGaps.map((g) => [g.section, g.score, g.pointsNeeded])).toEqual([
      ['rw', 700, 10],
      ['math', 760, 0],
    ]);
  });

  it('labels with an estimated median and says so', () => {
    const s = makeSchool({ sat: { total: { p25: 1400, p50: null, p75: 1530 }, rw: null, math: null } });
    const r = evaluateSchool(s, withScore(730, 730), DATES, TODAY); // 1460 < 1465
    expect(r.retakeLabel).toBe('if-time');
    expect(r.totalRange?.median).toEqual({ value: 1465, estimated: true });
    expect(r.notes).toContain(NOTES.estimatedMedian);
    expect(r.sectionGaps).toEqual([]);
  });
});

describe('evaluateSchool: adjustments in order', () => {
  it('1. test-blind: no label and no score notes, even with a low score', () => {
    const r = evaluateSchool(real('uc-berkeley'), withScore(300, 300, { entryYear: 2027 }), realDates, TODAY);
    expect(r).toMatchObject({
      status: 'test-blind',
      statusText: 'SAT not considered.',
      retakeLabel: null,
      fitLabel: null,
      disclaimer: null,
      sectionGaps: [],
    });
    expect(r.notes.join(' ')).not.toMatch(/retake|attempt|without a score|every SAT/i);
  });

  it('test-blind is judged by applicant type', () => {
    const s = makeSchool({
      testPolicy: [
        { fromEntryYear: 2027, domestic: 'test-blind', international: 'required', source: 'https://example.edu/testing' },
      ],
    });
    expect(evaluateSchool(s, withScore(700, 700), DATES, TODAY).status).toBe('test-blind');
    expect(evaluateSchool(s, withScore(700, 700, { applicantType: 'international' }), DATES, TODAY).status).toBe(
      'labeled',
    );
  });

  it('unverified scores: "Data not yet verified", no label', () => {
    const r = evaluateSchool(real('princeton'), withScore(700, 700), realDates, TODAY);
    expect(r).toMatchObject({ status: 'unverified', statusText: 'Data not yet verified.', retakeLabel: null });
  });

  it('no published total (Harvard): no label, section gaps still shown', () => {
    const r = evaluateSchool(real('harvard'), withScore(740, 760), realDates, TODAY);
    expect(r).toMatchObject({ status: 'no-total', retakeLabel: null, totalRange: null });
    expect(r.sectionGaps).toHaveLength(2);
  });

  it('2. highly selective at or above the 75th: Reach + Don\'t retake', () => {
    const s = makeSchool({ admissions: { applied: 1000, admitted: 100, admitRate: 0.1 } });
    const r = evaluateSchool(s, withScore(800, 800), DATES, TODAY);
    expect(r).toMatchObject({ retakeLabel: 'dont', fitLabel: 'reach' });
  });

  it('3. no usable dates replaces the label but keeps the attempts note', () => {
    const input = withScore(650, 650, {
      entryYear: 2027,
      pastAttempts: [
        { rw: 640, math: 640, testMonth: '2026-03' },
        { rw: 630, math: 650, testMonth: '2026-06' },
      ],
    });
    const r = evaluateSchool(makeSchool(), input, realDates, TODAY); // RD Jan 5, 2027
    expect(r.timeline.status).toBe('no-time');
    expect(r.band).toBe('strongly');
    expect(r.retakeLabel).toBe('no-time');
    expect(r.notes).toContain(NOTES.manyAttempts);
  });

  it('3. "Don\'t retake" is not replaced by "no time"', () => {
    const r = evaluateSchool(makeSchool(), withScore(780, 780, { entryYear: 2027 }), realDates, TODAY);
    expect(r.retakeLabel).toBe('dont');
  });

  it('3. an unknown deadline never triggers "no time"', () => {
    const s = makeSchool({ deadlines: { ED: null, EA: null, eaType: null, RD: null } });
    const r = evaluateSchool(s, withScore(650, 650, { entryYear: 2027 }), realDates, TODAY);
    expect(r.timeline.status).toBe('deadline-unknown');
    expect(r.retakeLabel).toBe('strongly');
  });

  it('4. the attempts note needs 3 sittings including the latest', () => {
    const one = { rw: 640, math: 640, testMonth: '2026-03' };
    expect(evaluateSchool(makeSchool(), withScore(700, 700, { pastAttempts: [one] }), DATES, TODAY).notes).not.toContain(
      NOTES.manyAttempts,
    );
    expect(
      evaluateSchool(makeSchool(), withScore(700, 700, { pastAttempts: [one, one] }), DATES, TODAY).notes,
    ).toContain(NOTES.manyAttempts);
  });

  it('5. test-optional and below the 25th: suggest applying without a score', () => {
    const s = makeSchool({ testPolicy: [...OPTIONAL] });
    expect(evaluateSchool(s, withScore(690, 700), DATES, TODAY).notes).toContain(NOTES.applyWithoutScore);
    expect(evaluateSchool(s, withScore(700, 700), DATES, TODAY).notes).not.toContain(NOTES.applyWithoutScore); // = p25
    expect(evaluateSchool(makeSchool(), withScore(690, 700), DATES, TODAY).notes).not.toContain(
      NOTES.applyWithoutScore,
    ); // required
  });

  it('5. not for a school whose policy is not announced for that year', () => {
    const r = evaluateSchool(real('maryland'), withScore(500, 500, { entryYear: 2028 }), realDates, TODAY);
    expect(r.policy.value).toBe('not-announced');
    expect(r.notes).not.toContain(NOTES.applyWithoutScore);
    expect(r.notes).toContain('Test-optional is announced through the fall 2027 cycle; later years are under assessment.');
  });
});

describe('evaluateSchool: score sending and superscore notes', () => {
  it.each([
    ['score-choice', NOTES.scoreChoice],
    ['all-scores-recommended', NOTES.allScores],
    ['all-scores-required', NOTES.allScores],
  ] as const)('%s', (scoreSending, note) => {
    expect(evaluateSchool(makeSchool({ scoreSending }), withScore(700, 700), DATES, TODAY).notes).toContain(note);
  });

  it('"not stated" score sending adds nothing; "not stated" superscore explains the basis', () => {
    const r = evaluateSchool(
      makeSchool({ scoreSending: 'not stated', superscore: 'not stated' }),
      withScore(700, 700),
      DATES,
      TODAY,
    );
    expect(r.notes).toEqual([NOTES.superscoreNotStated]);
  });
});

describe('evaluateSchool on real records', () => {
  it('MIT, 1500 international fall 2028 EA', () => {
    const r = evaluateSchool(
      real('mit'),
      withScore(740, 760, { applicantType: 'international', round: 'EA' }),
      realDates,
      TODAY,
    );
    expect(r).toMatchObject({ status: 'labeled', retakeLabel: 'strongly', fitLabel: 'reach' });
    expect(r.timeline.status).toBe('has-dates');
    expect(r.notes).toContain(NOTES.allScores);
  });

  it('every real school evaluates without throwing, for every year and applicant type', () => {
    for (const school of realSchools)
      for (const entryYear of [2027, 2028, 2029] as const)
        for (const applicantType of ['domestic', 'international'] as const)
          for (const round of ['ED', 'EA', 'RD'] as const)
            expect(() =>
              evaluateSchool(school, withScore(700, 700, { entryYear, applicantType, round }), realDates, TODAY),
            ).not.toThrow();
  });
});
