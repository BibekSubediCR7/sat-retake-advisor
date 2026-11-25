// Hand-written, human-reviewed test-policy history (Milestone 1 conversion).
//
// Every entry here comes from a school's own `recentChange` text and one of its
// `sources.policy` URLs in data/schools.json. Nothing is inferred by parsing text.
// Schools not listed keep one open-ended entry from fall 2027 entry, sourced from
// their first `sources.policy` URL.
//
// `fromEntryYear` = fall entry year (2027 = applying in the 2026-27 cycle).

export type PolicyValue =
  | 'required'
  | 'optional'
  | 'test-blind'
  | 'required-with-alternatives'
  | 'not-announced';

export interface PlannedEntry {
  fromEntryYear: number;
  /** Same value for domestic and international unless `international` is given. */
  policy: PolicyValue;
  international?: PolicyValue;
  /** Index into the school's `sources.policy`; null only for `not-announced`. */
  sourceIndex: number | null;
  note?: string;
}

export interface SchoolPolicyPlan {
  /** Index into `sources.policy` for the fall 2027 entry (default 0). */
  currentSourceIndex?: number;
  /** Note shown with the fall 2027 entry. */
  currentNote?: string;
  /** Extra entries for later entry years. */
  later?: PlannedEntry[];
  /** Quote from `recentChange` the entries rely on (for the review table). */
  basis: string;
  /** Anything a human must confirm before launch. */
  flag?: string;
}

const UC_NOTE =
  'The University of California is reviewing its testing policy; a change could apply from fall 2028 entry at the earliest.';
const UC_BASIS =
  "No change for fall 2027. BOARS review; any change 'before the 2026-27 academic year concludes in June 2027' (fall 2028+ at earliest).";

const uc: SchoolPolicyPlan = { currentNote: UC_NOTE, basis: UC_BASIS };

export const policyHistory: Record<string, SchoolPolicyPlan> = {
  princeton: {
    later: [{ fromEntryYear: 2028, policy: 'required', sourceIndex: 0 }],
    basis:
      "Announced 2025-10-09: 'required again starting with the 2027-28 cycle (fall 2028 entry). Remains test-optional for fall 2026 and fall 2027 entry.'",
  },
  columbia: {
    later: [
      {
        fromEntryYear: 2028,
        policy: 'required',
        sourceIndex: 1,
        note: 'Applies to Columbia College and Columbia Engineering.',
      },
    ],
    basis:
      "Announced 2026-06-12: 'return to required SAT/ACT effective August 2027 for the 2027-28 cycle; remain test-optional for 2026-27.'",
  },
  'notre-dame': {
    later: [{ fromEntryYear: 2028, policy: 'required', sourceIndex: 0 }],
    basis:
      "Announced 2026-09-09: 'required starting with the 2027-28 cycle (fall 2028 entry); remains test-optional for fall 2027 applicants.'",
  },
  vanderbilt: {
    later: [{ fromEntryYear: 2029, policy: 'required', sourceIndex: 0 }],
    basis:
      "Announced 2026-07-23: 'required for applicants entering fall 2029 and beyond; test-optional continues for fall 2027 and fall 2028 entry.'",
  },
  'claremont-mckenna': {
    later: [{ fromEntryYear: 2028, policy: 'required', sourceIndex: 1 }],
    basis:
      "'return to a test-required policy for the Fall 2028 application cycle' (current: test-optional 'through the Fall 2027 entry term').",
    flag: "'Fall 2028 application cycle' read as fall 2028 entry because optional runs 'through the Fall 2027 entry term'. Confirm.",
  },
  'harvey-mudd': {
    later: [{ fromEntryYear: 2028, policy: 'required', sourceIndex: 0 }],
    basis:
      "'test-optional for students applying for Fall 2027. We will return to requiring standardized testing … for the Fall 2028 application cycle.'",
    flag: "'Fall 2028 application cycle' read as fall 2028 entry (follows 'applying for Fall 2027'). Confirm.",
  },
  nyu: {
    later: [
      {
        fromEntryYear: 2029,
        policy: 'not-announced',
        sourceIndex: null,
        note: 'Test-optional is announced through the 2027-28 cycle (fall 2028 entry) only.',
      },
    ],
    basis: "'test-optional through the 2027-2028 application cycle' (= fall 2028 entry).",
  },
  bu: {
    later: [
      {
        fromEntryYear: 2029,
        policy: 'not-announced',
        sourceIndex: null,
        note: 'Test-optional is announced through fall 2028 / spring 2029 entry only.',
      },
    ],
    basis: "'extended test-optional through fall 2028/spring 2029 for first-year applicants'.",
  },
  maryland: {
    later: [
      {
        fromEntryYear: 2028,
        policy: 'not-announced',
        sourceIndex: null,
        note: 'Test-optional is announced through the fall 2027 cycle; later years are under assessment.',
      },
    ],
    basis: "'extended this policy through to the Spring and Fall 2027 application cycles'; beyond fall 2027 under assessment.",
  },
  wellesley: {
    currentSourceIndex: 1,
    later: [
      {
        fromEntryYear: 2028,
        policy: 'not-announced',
        sourceIndex: null,
        note: 'Test-optional is announced for fall 2027 entry only; future cycles are under assessment.',
      },
    ],
    basis: "April 2026: 'continue to be test optional for those applying for entry in fall 2027'; future cycles under assessment.",
  },
  'washington-and-lee': {
    later: [
      {
        fromEntryYear: 2028,
        policy: 'not-announced',
        sourceIndex: null,
        note: 'Test-optional is announced for the 2026-27 cycle (fall 2027 entry) only.',
      },
    ],
    basis: "'SAT or ACT scores are not required … in the 2026-27 application cycle'.",
  },
  emory: {
    later: [
      {
        fromEntryYear: 2028,
        policy: 'not-announced',
        sourceIndex: null,
        note: 'Test-optional is announced for fall 2027 entry only.',
      },
    ],
    basis: "Dec 2025: 'extended test-optional to fall 2027 entry (2026-27 cycle)'.",
  },
  wisconsin: {
    later: [
      {
        fromEntryYear: 2028,
        policy: 'not-announced',
        sourceIndex: null,
        note: 'The test suspension runs through the 2027-28 academic year (to spring 2028). A vote on making test-optional permanent is pending.',
      },
    ],
    basis:
      "Apr 20, 2026 (Resolution 12464): suspension 'through the 2027-28 academic year (spring 2027, fall 2027 and spring 2028 terms)'; permanent policy vote pending.",
    flag: 'Fall 2028 entry is not covered by the resolution; re-check after the Regents vote.',
  },
  'uc-berkeley': uc,
  ucla: uc,
  'uc-san-diego': uc,
  'uc-davis': uc,
  'uc-irvine': uc,
  'uc-santa-barbara': uc,
  swarthmore: {
    currentNote: 'The official page gives no end date for test-optional admissions.',
    basis:
      "Official page: test-optional, no end date. 'Up to five more years' comes from the student newspaper only, so it is not used.",
  },
  unc: {
    currentNote: 'UNC System policy: test scores are required only for applicants with a weighted GPA below 2.8.',
    basis: 'UNC System Policy 700.1.1 (approved May 23, 2024), from 2026-27 onward.',
  },
  caltech: {
    currentNote:
      'Caltech reviews each section separately and does not consider the composite; high section scores are grouped into buckets.',
    basis: "New 'bucket system' (changes how scores are read, not the requirement).",
  },
  yale: {
    basis: 'Announced 2026-05-27: SAT or ACT required from the 2026-27 cycle (Class of 2031); test-flexible ended.',
  },
  penn: {
    basis: 'Announced 2025-02-14: requirement reinstated from the 2025-26 cycle; continues for 2026-27.',
  },
  'ohio-state': {
    basis: "2025-03-12: requirement reinstated 'in the 2026 admissions cycle and beyond'.",
  },
  'ut-austin': {
    basis: 'Requirement reinstated from Fall 2025 (announced Mar 11, 2024).',
  },
  georgetown: {
    basis: 'The 2026 change is to superscoring/score sending (superscore: no), not to the test requirement.',
  },
};
