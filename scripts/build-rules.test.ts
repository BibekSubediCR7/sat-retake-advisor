import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderRules } from './build-rules';

describe('firestore.rules', () => {
  it('matches a fresh build from the template and data (run `npm run rules:build` if this fails)', () => {
    expect(readFileSync('firestore.rules', 'utf8')).toBe(renderRules());
  });

  it('lists every school id and no placeholders', () => {
    const rules = readFileSync('firestore.rules', 'utf8');
    const ids = (JSON.parse(readFileSync('data/schools.json', 'utf8')) as { id: string }[]).map((s) => s.id);
    for (const id of ids) expect(rules).toContain(`'${id}'`);
    expect(rules).not.toMatch(/__[A-Z_]+__/);
  });
});
