import { describe, expect, it } from 'vitest';
import { cleanName, MAX_NAME, pdfTitle } from './SaveReport';

describe('save report', () => {
  it('cleans the printed name', () => {
    expect(cleanName('  Sita \n  Sharma\u0007 ')).toBe('Sita Sharma');
    expect(cleanName('x'.repeat(100))).toHaveLength(MAX_NAME);
    expect(cleanName('   ')).toBe('');
  });

  it('suggests a file name with or without a name', () => {
    expect(pdfTitle('Sita Sharma', '2026-11-27')).toBe('SAT report - Sita Sharma - 2026-11-27');
    expect(pdfTitle('', '2026-11-27')).toBe('SAT report - 2026-11-27');
  });
});
