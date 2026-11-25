import { describeRange, rangeChartGeometry, type RangeChartInput } from './rangeChartGeometry';

/** Edge-aware alignment so labels never spill outside the card at 360px. */
function anchor(x: number): string {
  if (x < 12) return 'translate-x-0';
  if (x > 88) return '-translate-x-full';
  return '-translate-x-1/2';
}

/** Horizontal 25th–75th bar with median tick and the student's marker (FR-5). */
export function RangeChart({ data, title }: { data: RangeChartInput; title: string }) {
  const g = rangeChartGeometry(data);
  const rows = Math.max(...g.ticks.map((t) => t.row)) + 1;
  const ROW = 18;
  const BAR_Y = 30;
  return (
    <figure className="m-0">
      <figcaption className="sr-only">{describeRange(data, title)}</figcaption>
      <div aria-hidden="true" className="relative" style={{ height: BAR_Y + 14 + rows * ROW }}>
        {/* Student marker label above the bar */}
        <span
          className={`absolute top-0 whitespace-nowrap border border-seal-red bg-paper-light px-1.5 font-scoreMono text-xs font-bold text-seal-red ${anchor(g.you.x)}`}
          style={{ left: `${g.you.x}%` }}
        >
          You {g.you.value}
        </span>
        <svg className="absolute left-0 w-full overflow-visible" style={{ top: BAR_Y - 8, height: 22 }} preserveAspectRatio="none" viewBox="0 0 100 22">
          <line x1="0" x2="100" y1="8" y2="8" stroke="var(--color-rule-light)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
          <line
            x1={g.barStart}
            x2={g.barEnd}
            y1="8"
            y2="8"
            stroke="var(--color-seal-red)"
            strokeWidth="6"
            vectorEffect="non-scaling-stroke"
          />
          {g.ticks.map((t) => (
            <line
              key={t.key}
              x1={t.x}
              x2={t.x}
              y1="1"
              y2="15"
              stroke="var(--color-ink)"
              strokeWidth="2"
              strokeDasharray={t.key === 'median' && data.medianEstimated ? '3 2' : undefined}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <line x1={g.you.x} x2={g.you.x} y1="-6" y2="22" stroke="var(--color-seal-red)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        {g.ticks.map((t) => (
          <span
            key={t.key}
            className={`absolute whitespace-nowrap font-scoreMono text-xs text-ink-muted ${anchor(t.x)}`}
            style={{ left: `${t.x}%`, top: BAR_Y + 14 + t.row * ROW }}
          >
            {t.label}
          </span>
        ))}
      </div>
    </figure>
  );
}
