import type { PercentileRange, TestPolicyEntry, TestPolicyValue } from '../data/schema';

export type ApplicantType = 'domestic' | 'international';
export type Round = 'ED' | 'EA' | 'RD';
export type Grade = '9' | '10' | '11' | '12' | 'gap-year';
/** 2029 stands for "2029 or later". */
export type EntryYear = 2027 | 2028 | 2029;

export const GRADES: readonly Grade[] = ['9', '10', '11', '12', 'gap-year'];
export const ENTRY_YEARS: readonly EntryYear[] = [2027, 2028, 2029];
export const ROUNDS: readonly Round[] = ['ED', 'EA', 'RD'];
export const APPLICANT_TYPES: readonly ApplicantType[] = ['domestic', 'international'];
export const MAX_PAST_ATTEMPTS = 5;
export const MAX_SCHOOLS = 15;

/** One SAT sitting. The total is always rw + math. */
export interface Sitting {
  rw: number;
  math: number;
  /** "YYYY-MM"; absent for the latest score if the student didn't give a month. */
  testMonth?: string;
}

export interface StudentInput {
  latest: { total: number; rw: number; math: number };
  pastAttempts: Sitting[];
  grade: Grade;
  entryYear: EntryYear;
  applicantType: ApplicantType;
  /** ISO 3166-1 alpha-2 code, e.g. "NP". */
  country: string;
  round: Round;
  schoolIds: string[];
}

export interface FieldError {
  field: string;
  message: string;
}

export type ScoreBasis = 'superscore' | 'best-sitting';

export interface ScoreUsed {
  total: number;
  rw: number;
  math: number;
  basis: ScoreBasis;
}

export type RetakeLabel = 'strongly' | 'if-time' | 'optional' | 'dont' | 'no-time';
export type FitLabel = 'reach' | 'target' | 'safety';

export const RETAKE_LABEL_TEXT: Record<RetakeLabel, string> = {
  strongly: 'Retake strongly recommended',
  'if-time': 'Retake if you have time',
  optional: 'Optional; essays may matter more',
  dont: "Don't retake; focus on your application",
  'no-time': 'No time to retake; focus on your application.',
};

export const FIT_LABEL_TEXT: Record<FitLabel, string> = {
  reach: 'Reach',
  target: 'Target',
  safety: 'Safety',
};

export const LABEL_DISCLAIMER =
  'Based on published score ranges only. This is not a chance of admission.';

export interface Median {
  value: number;
  estimated: boolean;
}

export interface RangeView {
  p25: number;
  p75: number;
  median: Median;
}

export interface PolicyLookup {
  value: TestPolicyValue;
  entry: TestPolicyEntry;
  /** The entry year that was looked up (2029 = 2029 or later). */
  entryYear: EntryYear;
  /** Domestic and international policies differ for this entry (FR-10). */
  differs: boolean;
}

export interface SectionGap {
  section: 'rw' | 'math';
  score: number;
  median: Median;
  /** 0 when already at or above the median; rounded up to a multiple of 10. */
  pointsNeeded: number;
  aboveMedian: boolean;
}

export interface Deadline {
  round: Round;
  /** ISO date, or null when the school's deadline isn't verified. */
  date: string | null;
  notes: string[];
}

export interface TimelineDate {
  testDate: string;
  registrationDeadline: string | null;
  lateRegistrationDeadline: string | null;
  scoreRelease: string | null;
  anticipated: boolean;
  registrationClosed: boolean;
  /** Usable before the deadline (by score release, or by test date when release is unknown). */
  usable: boolean;
  comparedByTestDate: boolean;
}

export type TimelineStatus =
  | 'has-dates'
  | 'no-time'
  | 'dates-not-announced'
  | 'deadline-unknown';

export interface Timeline {
  deadline: Deadline;
  status: TimelineStatus;
  dates: TimelineDate[];
  notes: string[];
}

export type SchoolStatus = 'labeled' | 'test-blind' | 'unverified' | 'no-total';

export interface SchoolResult {
  schoolId: string;
  name: string;
  status: SchoolStatus;
  /** Message shown instead of a label when status isn't "labeled". */
  statusText: string | null;
  scoreUsed: ScoreUsed;
  totalRange: RangeView | null;
  /** Band from the percentile table, before the "no time" adjustment. */
  band: Exclude<RetakeLabel, 'no-time'> | null;
  retakeLabel: RetakeLabel | null;
  fitLabel: FitLabel | null;
  policy: PolicyLookup;
  sectionGaps: SectionGap[];
  timeline: Timeline;
  notes: string[];
  disclaimer: string | null;
}

export type VerdictKind = 'retake' | 'optional' | 'dont' | 'none';

export interface Verdict {
  kind: VerdictKind;
  sentence: string;
  /** Schools with a retake label (they consider the SAT and have verified ranges). */
  counted: number;
  belowMedian: number;
  excluded: { status: Exclude<SchoolStatus, 'labeled'>; count: number }[];
  excludedText: string | null;
}

export type { PercentileRange };
