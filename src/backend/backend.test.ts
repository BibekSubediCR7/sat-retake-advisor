import { describe, expect, it, beforeEach } from 'vitest';
import { getAnonId, resetAnonIdForTests } from './anonId';
import { toSubmissionRecord } from './submissions';
import { toErrorReportRecord } from './errorReports';
import { makeInput } from '../logic/fixtures';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function memoryStorage() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
}

describe('getAnonId', () => {
  beforeEach(() => resetAnonIdForTests());

  it('creates a UUID once and reuses it', () => {
    const s = memoryStorage();
    const a = getAnonId(s);
    expect(a).toMatch(UUID);
    expect(getAnonId(s)).toBe(a);
    expect(s.m.get('sra.anonId')).toBe(a);
  });

  it('replaces a tampered value', () => {
    const s = memoryStorage();
    s.setItem('sra.anonId', '<script>');
    expect(getAnonId(s)).toMatch(UUID);
  });

  it('keeps one in-memory id when storage is blocked', () => {
    const blocked = {
      getItem: (): string | null => {
        throw new Error('blocked');
      },
      setItem: (): void => {
        throw new Error('blocked');
      },
    };
    const a = getAnonId(blocked);
    expect(a).toMatch(UUID);
    expect(getAnonId(blocked)).toBe(a);
    expect(getAnonId(null)).toBe(a);
  });
});

describe('records', () => {
  it('maps the form to exactly the PRD submission fields, with sittings as attempts', () => {
    const input = makeInput({
      pastAttempts: [{ rw: 650, math: 700, testMonth: '2026-03' }],
      schoolIds: ['mit', 'duke'],
    });
    expect(toSubmissionRecord(input, 'id-1')).toEqual({
      anonId: 'id-1',
      total: 1420,
      rw: 700,
      math: 720,
      attempts: 2,
      grade: '11',
      entryYear: 2028,
      applicantType: 'domestic',
      country: 'NP',
      round: 'RD',
      schools: ['mit', 'duke'],
    });
  });

  it('trims error-report values and keeps only the four fields', () => {
    expect(
      toErrorReportRecord('mit', { field: 'Admit rate', correctValue: ' 4.5% ', sourceUrl: ' https://x.edu/cds ' }),
    ).toEqual({ schoolId: 'mit', field: 'Admit rate', correctValue: '4.5%', sourceUrl: 'https://x.edu/cds' });
  });
});
