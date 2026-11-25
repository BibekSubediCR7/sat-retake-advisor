// Pure geometry and wording for the range chart (FR-5). No React here.

export interface RangeChartInput {
  p25: number;
  p75: number;
  median: number;
  medianEstimated: boolean;
  score: number;
  /** Scale bounds: 400–1600 for the total, 200–800 for a section. */
  scaleMin: number;
  scaleMax: number;
}

export interface ChartTick {
  key: 'p25' | 'median' | 'p75';
  value: number;
  /** Position along the bar, 0–100. */
  x: number;
  /** Label row under the bar: 0 first, 1 and 2 used only when labels would overlap. */
  row: 0 | 1 | 2;
  label: string;
}

export interface ChartGeometry {
  lo: number;
  hi: number;
  barStart: number;
  barEnd: number;
  ticks: ChartTick[];
  you: { x: number; value: number };
}

/**
 * Labels closer than this (in % of the chart width) go on separate rows. A label such as
 * "Median 1550" is about 80px wide; a school card can be ~300px, so 28% keeps them apart.
 */
export const MIN_LABEL_GAP = 28;

const floorTo = (v: number, step: number) => Math.floor(v / step) * step;
const ceilTo = (v: number, step: number) => Math.ceil(v / step) * step;

export function rangeChartGeometry(c: RangeChartInput): ChartGeometry {
  const minPad = c.scaleMax - c.scaleMin >= 1000 ? 40 : 20;
  const low = Math.min(c.p25, c.score);
  const high = Math.max(c.p75, c.score);
  const pad = Math.max(minPad, (high - low) * 0.15);
  let lo = Math.max(c.scaleMin, floorTo(low - pad, 10));
  let hi = Math.min(c.scaleMax, ceilTo(high + pad, 10));
  if (hi <= lo) {
    lo = c.scaleMin;
    hi = c.scaleMax;
  }
  const x = (v: number) => ((v - lo) / (hi - lo)) * 100;

  const raw = [
    { key: 'p25' as const, value: c.p25, label: `25th ${c.p25}` },
    { key: 'median' as const, value: c.median, label: `${c.medianEstimated ? 'Median est.' : 'Median'} ${c.median}` },
    { key: 'p75' as const, value: c.p75, label: `75th ${c.p75}` },
  ];
  const ticks: ChartTick[] = [];
  for (const t of raw) {
    const tx = x(t.value);
    // First row whose last label is far enough to the left; ticks are in increasing order.
    const row = ([0, 1, 2] as const).find((r) => {
      const last = ticks.filter((k) => k.row === r).at(-1);
      return !last || tx - last.x >= MIN_LABEL_GAP;
    }) ?? 2;
    ticks.push({ key: t.key, value: t.value, x: tx, row, label: t.label });
  }

  return { lo, hi, barStart: x(c.p25), barEnd: x(c.p75), ticks, you: { x: x(c.score), value: c.score } };
}

export function positionPhrase(score: number, p25: number, median: number, p75: number): string {
  if (score < p25) return 'below the 25th percentile';
  if (score < median) return 'between the 25th percentile and the median';
  if (score < p75) return 'between the median and the 75th percentile';
  return 'at or above the 75th percentile';
}

/** Screen-reader text alternative for the chart. */
export function describeRange(c: RangeChartInput, what: string): string {
  const median = `${c.medianEstimated ? 'estimated median' : 'median'} ${c.median}`;
  return `${what}: middle 50% of enrolled students scored ${c.p25} to ${c.p75}, ${median}. Your score, ${c.score}, is ${positionPhrase(c.score, c.p25, c.median, c.p75)}.`;
}
