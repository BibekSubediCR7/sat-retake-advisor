import { describe, expect, it } from 'vitest';
import { cachedUsage, USAGE_CACHE_MS } from './usage';

function store(init: Record<string, string> = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}

describe('cachedUsage', () => {
  const now = 1_800_000_000_000;

  it('returns a fresh cached count', () => {
    const s = store({ 'sra.usage': JSON.stringify({ checks: 120, students: 80, at: now - 1000 }) });
    expect(cachedUsage(now, s)).toEqual({ checks: 120, students: 80 });
  });

  it('ignores a stale, broken or missing cache', () => {
    expect(cachedUsage(now, store({ 'sra.usage': JSON.stringify({ checks: 1, students: 1, at: now - USAGE_CACHE_MS - 1 }) }))).toBeNull();
    expect(cachedUsage(now, store({ 'sra.usage': '{not json' }))).toBeNull();
    expect(cachedUsage(now, store({ 'sra.usage': JSON.stringify({ checks: '5', students: 1, at: now }) }))).toBeNull();
    expect(cachedUsage(now, store())).toBeNull();
    expect(cachedUsage(now, null)).toBeNull();
  });
});
