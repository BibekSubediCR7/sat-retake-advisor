import type { School } from '../data/schema';
import type { ApplicantType, EntryYear, PolicyLookup } from './types';

/**
 * Test policy for an applicant type and entry year (FR-10, FR-13): the entry with the
 * highest `fromEntryYear` that is <= the entry year. 2029 stands for "2029 or later".
 */
export function policyFor(
  school: Pick<School, 'id' | 'testPolicy'>,
  entryYear: EntryYear,
  applicantType: ApplicantType,
): PolicyLookup {
  let entry = undefined as School['testPolicy'][number] | undefined;
  for (const e of school.testPolicy) if (e.fromEntryYear <= entryYear) entry = e;
  if (!entry) throw new Error(`${school.id}: no test policy for fall ${entryYear} entry`);
  return {
    value: entry[applicantType],
    entry,
    entryYear,
    differs: entry.domestic !== entry.international,
  };
}

const POLICY_TEXT = {
  required: 'SAT or ACT required',
  optional: 'Test-optional',
  'test-blind': 'Test-blind: SAT not considered',
  'required-with-alternatives': 'Test required (some alternatives accepted)',
  'not-announced': 'Not yet announced',
} as const;

/** One-line description, e.g. "Test-optional (fall 2028 entry)". */
export function policyText(p: PolicyLookup): string {
  if (p.value === 'not-announced') {
    return `Policy for fall ${p.entryYear}${p.entryYear === 2029 ? ' or later' : ''} entry not yet announced`;
  }
  return POLICY_TEXT[p.value];
}

/** Notes that go with the policy line on a school card. */
export function policyNotes(p: PolicyLookup, applicantType: ApplicantType): string[] {
  const notes: string[] = [];
  if (p.entry.note) notes.push(p.entry.note);
  if (p.differs) {
    const other: ApplicantType = applicantType === 'domestic' ? 'international' : 'domestic';
    notes.push(`The policy for ${other} applicants is different: ${POLICY_TEXT[p.entry[other]]}.`);
  }
  return notes;
}
