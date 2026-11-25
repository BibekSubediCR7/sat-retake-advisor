// Small hand-made schools and inputs for logic tests. Not real data.
import type { SatDate, School } from '../data/schema';
import type { StudentInput } from './types';

const SRC = 'https://example.edu/testing';

export function makeSchool(overrides: Partial<School> = {}): School {
  return {
    id: 'test-u',
    name: 'Test University',
    category: 'national-university',
    usNewsRank2027: 20,
    admissions: { applied: 10000, admitted: 4000, admitRate: 0.4 },
    sat: {
      total: { p25: 1400, p50: 1450, p75: 1500 },
      rw: { p25: 680, p50: 710, p75: 740 },
      math: { p25: 710, p50: 740, p75: 770 },
    },
    pctSubmittingSAT: 50,
    dataYear: '2025-26',
    entryTerm: 'Fall 2025',
    testPolicy: [{ fromEntryYear: 2027, domestic: 'required', international: 'required', source: SRC }],
    superscore: 'yes',
    scoreSending: 'score-choice',
    selfReporting: 'yes',
    deadlines: { ED: ['11-01'], EA: null, eaType: 'not offered', RD: '01-05' },
    sources: { cds: 'https://example.edu/cds.pdf', policy: [{ url: SRC, appliesTo: 'test' }] },
    status: { scores: 'official-cds-read', policy: 'official-site-read' },
    verified: false,
    meta: { policyCycle: null, recentChange: null, superscoreQuote: null, scoreSendingQuote: null, notes: null },
    ...overrides,
  };
}

export function makeInput(overrides: Partial<StudentInput> = {}): StudentInput {
  return {
    latest: { total: 1420, rw: 700, math: 720 },
    pastAttempts: [],
    grade: '11',
    entryYear: 2028,
    applicantType: 'domestic',
    country: 'NP',
    round: 'RD',
    schoolIds: ['test-u'],
    ...overrides,
  };
}

export function makeDate(testDate: string, overrides: Partial<SatDate> = {}): SatDate {
  return {
    testDate,
    registrationDeadline: null,
    lateRegistrationDeadline: null,
    scoreRelease: null,
    status: 'confirmed',
    ...overrides,
  };
}
