// Public entry point for the retake logic. Everything here is pure and runs in the browser.
import type { AppSchool, SatDate } from '../data/schema';
import { evaluateSchool } from './evaluateSchool';
import { overallVerdict } from './verdict';
import type { SchoolResult, StudentInput, Verdict } from './types';

export interface Report {
  results: SchoolResult[];
  verdict: Verdict;
}

/** Builds the full report for validated input. `today` is "YYYY-MM-DD". */
export function buildReport(
  input: StudentInput,
  schools: readonly AppSchool[],
  dates: readonly SatDate[],
  today: string,
): Report {
  const byId = new Map(schools.map((s) => [s.id, s]));
  const results = input.schoolIds.map((id) => {
    const school = byId.get(id);
    if (!school) throw new Error(`Unknown school id: ${id}`);
    return evaluateSchool(school, input, dates, today);
  });
  return { results, verdict: overallVerdict(results) };
}

export { validateInput } from './validate';
export { policyText } from './policy';
export { formatDate } from './timeline';
export * from './types';
