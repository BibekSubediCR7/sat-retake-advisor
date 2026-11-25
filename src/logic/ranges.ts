import type { PercentileRange } from '../data/schema';
import type { Median, RangeView } from './types';

/**
 * Median of a published range. When p50 isn't published but p25 and p75 are, the
 * midpoint is computed here (never stored) and marked estimated. Null otherwise.
 */
export function medianFor(range: PercentileRange | null): Median | null {
  if (!range) return null;
  if (range.p50 !== null) return { value: range.p50, estimated: false };
  if (range.p25 !== null && range.p75 !== null) {
    return { value: (range.p25 + range.p75) / 2, estimated: true };
  }
  return null;
}

/** A range usable for labels: needs p25 and p75 (and a published or estimated median). */
export function rangeView(range: PercentileRange | null): RangeView | null {
  if (!range || range.p25 === null || range.p75 === null) return null;
  const median = medianFor(range);
  if (!median) return null;
  return { p25: range.p25, p75: range.p75, median };
}
