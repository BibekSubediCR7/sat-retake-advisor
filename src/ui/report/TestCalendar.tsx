import type { SatDate } from '../../data/schema';
import { formatDate, type SchoolResult } from '../../logic';
import { SourceLine } from '../parts/SourceLine';
import { Stamp } from '../parts/Stamp';
import { monoLabel } from '../parts/styles';
import { buildCalendar } from './calendar';

/** "IV. Test calendar" (FR-9). Dates come from data/sat-dates.json, never hard-coded. */
export function TestCalendar({
  results,
  dates,
  sourceUrl,
  checked,
}: {
  results: readonly SchoolResult[];
  dates: readonly SatDate[];
  sourceUrl: string;
  checked: string;
}) {
  const { rows, notAnnouncedAfter } = buildCalendar(results, dates);
  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <p className="text-base text-ink-soft">Test dates not announced yet.</p>
      ) : (
        <ol className="m-0 list-none divide-y divide-dashed divide-rule p-0">
          {rows.map((d) => (
            <li key={d.testDate} className="py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-scoreSerif text-lg font-bold text-ink">{formatDate(d.testDate)}</p>
                <div className="flex flex-wrap gap-2">
                  {d.anticipated && <Stamp tone="amber">Anticipated</Stamp>}
                  {d.registrationClosed && <Stamp tone="red">Registration closed</Stamp>}
                </div>
              </div>
              {d.anticipated && (
                <p className="text-sm text-ink-muted">Anticipated — not yet confirmed by College Board.</p>
              )}
              <dl className="mt-1 grid gap-x-4 text-sm text-ink-soft sm:grid-cols-2">
                <div>
                  <dt className={`${monoLabel} inline text-ink-muted`}>Register by </dt>
                  <dd className="inline">
                    {d.registrationDeadline ? formatDate(d.registrationDeadline) : 'TBD'}
                    {d.lateRegistrationDeadline ? ` (late: ${formatDate(d.lateRegistrationDeadline)})` : ''}
                  </dd>
                </div>
                <div>
                  <dt className={`${monoLabel} inline text-ink-muted`}>Scores out </dt>
                  <dd className="inline">
                    {d.scoreRelease ? formatDate(d.scoreRelease) : 'TBD'}
                  </dd>
                </div>
              </dl>
              <p className="mt-1 text-base text-ink">
                {d.usableFor.length ? (
                  <>
                    <span className={`${monoLabel} text-stamp-green`}>Usable for </span>
                    {d.usableFor.join(', ')}
                    {d.registrationClosed ? ' — only if you are already registered.' : ''}
                  </>
                ) : (
                  <span className="text-ink-muted">Too late for your deadlines.</span>
                )}
              </p>
            </li>
          ))}
        </ol>
      )}
      {notAnnouncedAfter && (
        <p className="text-base text-ink-soft">Test dates after {formatDate(notAnnouncedAfter)} not announced yet.</p>
      )}
      <p className="text-sm text-ink-muted">
        TBD means College Board has not published that date yet. Where the score release date is TBD, a date
        counts if the test itself is before your deadline.
      </p>
      <SourceLine label="College Board SAT dates" url={sourceUrl} detail={`checked ${formatDate(checked)}`} />
    </div>
  );
}
