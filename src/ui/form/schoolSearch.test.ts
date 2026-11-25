import { describe, expect, it } from 'vitest';
import { acronym, matchesSchool } from './schoolSearch';
import { realSchools } from '../../logic/fixtures';

const find = (q: string) => realSchools.filter((s) => matchesSchool(q, s)).map((s) => s.id);

describe('school search', () => {
  it('builds acronyms without filler words', () => {
    expect(acronym('Massachusetts Institute of Technology')).toBe('mit');
    expect(acronym('University of California, Los Angeles')).toBe('ucla');
  });

  it('finds schools by short form, words or id', () => {
    expect(find('mit')).toContain('mit');
    expect(find('ucla')).toEqual(['ucla']);
    expect(find('unc')).toContain('unc');
    expect(find('georgia tech')).toEqual(['gatech']);
    expect(find('Johns')).toEqual(['jhu']);
  });

  it('matches everything for an empty query and nothing for nonsense', () => {
    expect(find('')).toHaveLength(realSchools.length);
    expect(find('zzzz')).toEqual([]);
  });
});
