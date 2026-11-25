import { describe, expect, it } from 'vitest';
import { policyFor, policyNotes, policyText } from './policy';
import { makeSchool, real } from './fixtures';

describe('policyFor (real data)', () => {
  it.each([
    ['princeton', 2027, 'optional'],
    ['princeton', 2028, 'required'],
    ['princeton', 2029, 'required'],
    ['vanderbilt', 2027, 'optional'],
    ['vanderbilt', 2028, 'optional'],
    ['vanderbilt', 2029, 'required'],
    ['nyu', 2028, 'optional'],
    ['nyu', 2029, 'not-announced'],
    ['maryland', 2028, 'not-announced'],
    ['uc-berkeley', 2027, 'test-blind'],
    ['uc-berkeley', 2029, 'test-blind'],
    ['mit', 2029, 'required'],
  ] as const)('%s fall %i → %s', (id, year, expected) => {
    expect(policyFor(real(id), year, 'domestic').value).toBe(expected);
  });

  it('looks up by applicant type and flags a difference (Dartmouth)', () => {
    const d = real('dartmouth');
    expect(policyFor(d, 2027, 'domestic').value).toBe('required');
    expect(policyFor(d, 2027, 'international').value).toBe('required-with-alternatives');
    expect(policyFor(d, 2027, 'domestic').differs).toBe(true);
    expect(policyFor(real('mit'), 2027, 'domestic').differs).toBe(false);
  });

  it('throws if no entry covers the year (bad data)', () => {
    const s = makeSchool({
      testPolicy: [{ fromEntryYear: 2028, domestic: 'optional', international: 'optional', source: 'https://x.edu' }],
    });
    expect(() => policyFor(s, 2027, 'domestic')).toThrow(/no test policy/);
  });
});

describe('policyText and policyNotes', () => {
  it('says when a policy is not announced yet, naming the entry year', () => {
    expect(policyText(policyFor(real('nyu'), 2029, 'domestic'))).toBe(
      'Policy for fall 2029 or later entry not yet announced',
    );
    expect(policyText(policyFor(real('maryland'), 2028, 'domestic'))).toBe(
      'Policy for fall 2028 entry not yet announced',
    );
  });

  it('includes the entry note and the other applicant type when different', () => {
    const p = policyFor(real('dartmouth'), 2027, 'international');
    expect(policyNotes(p, 'international')).toEqual([
      'The policy for domestic applicants is different: SAT or ACT required.',
    ]);
    const unc = policyFor(real('unc'), 2027, 'domestic');
    expect(policyNotes(unc, 'domestic')[0]).toMatch(/weighted GPA below 2\.8/);
  });
});
