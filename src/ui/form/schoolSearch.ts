import type { AppSchool } from '../../data/schema';

const STOP = new Set(['of', 'at', 'the', 'and', 'in']);

/** "University of California, Los Angeles" → "ucla"; "Massachusetts Institute of Technology" → "mit". */
export function acronym(name: string): string {
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !STOP.has(w))
    .map((w) => w[0])
    .join('');
}

/**
 * Every query word must match the start of a word in the name, part of the id,
 * or the start of the name's acronym. "georgia tech", "unc", "ucla", "mit" all work.
 */
export function matchesSchool(query: string, school: Pick<AppSchool, 'id' | 'name'>): boolean {
  const tokens = query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (!tokens.length) return true;
  const words = school.name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const abbr = acronym(school.name);
  return tokens.every((t) => words.some((w) => w.startsWith(t)) || school.id.includes(t) || abbr.startsWith(t));
}
