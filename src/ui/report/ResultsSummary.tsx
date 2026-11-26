import type { AppSchool, SatDate } from '../../data/schema';
import { FIT_LABEL_TEXT, formatDate, type SchoolResult } from '../../logic';
import { monoLabel, textLink } from '../parts/styles';
import { balance, nextTest, summaryRow, type NextTest, type SummaryRow } from './summary';

const COLUMNS: { key: Exclude<keyof SummaryRow, 'schoolId' | 'name'>; label: string }[] = [
  { key: 'position', label: 'Score vs. range' },
  { key: 'fit', label: 'Fit' },
  { key: 'advice', label: 'Advice' },
  { key: 'weight', label: 'Test weight' },
  { key: 'deadline', label: 'Deadline' },
];

function SchoolLink({ row }: { row: SummaryRow }) {
  return (
    <a href={`#school-${row.schoolId}`} className={`${textLink} font-scoreSerif font-bold`}>
      {row.name}
    </a>
  );
}

function NextTestLine({ next }: { next: NextTest }) {
  if (next.kind === 'not-needed') return null;
  let body;
  if (next.kind === 'date') {
    const d = next.row;
    body = (
      <>
        <strong className="text-ink">{formatDate(d.testDate)}</strong>
        {d.anticipated ? ' (anticipated — not yet confirmed by College Board)' : ''}: register by{' '}
        {d.registrationDeadline ? formatDate(d.registrationDeadline) : 'TBD'}, scores out{' '}
        {d.scoreRelease ? formatDate(d.scoreRelease) : 'TBD'}. In time for {next.reaches} of your {next.of}{' '}
        {next.of === 1 ? 'school' : 'schools'} that consider the SAT.
      </>
    );
  } else if (next.kind === 'not-announced') {
    body = 'Test dates not announced yet.';
  } else {
    body = 'None. Scores from every SAT you can still register for would come out after your deadlines.';
  }
  return (
    <p className="text-base text-ink-soft">
      <span className={`${monoLabel} text-ink-muted`}>Next SAT you can use: </span>
      {body}
    </p>
  );
}

/** At-a-glance overview above the cards: list balance, one row per school, next usable SAT date. */
export function ResultsSummary({
  ordered,
  schools,
  dates,
}: {
  /** Results in card order (most urgent first). */
  ordered: readonly SchoolResult[];
  schools: ReadonlyMap<string, AppSchool>;
  dates: readonly SatDate[];
}) {
  const rows = ordered.map((r) => summaryRow(r, schools.get(r.schoolId)));
  const { counts, notLabeled } = balance(ordered);
  const next = nextTest(ordered, dates);

  return (
    <div aria-labelledby="summary-heading" role="region" className="@container space-y-4 border border-dashed border-rule p-4">
      <h3 id="summary-heading" className="font-scoreDisplay text-xl font-bold text-ink">
        Summary of results
      </h3>

      <p id="summary-balance" className="text-lg text-ink">
        {counts.map((c, i) => (
          <span key={c.fit}>
            {i > 0 && <span aria-hidden="true"> · </span>}
            {i > 0 && <span className="sr-only">, </span>}
            <strong>{FIT_LABEL_TEXT[c.fit]}</strong> {c.count}
          </span>
        ))}
        {notLabeled.map((n) => (
          <span key={n.reason} className="block text-base text-ink-soft">
            Not labeled: {n.count} ({n.reason})
          </span>
        ))}
      </p>

      {/* Table when the summary is at least 38rem wide; a stacked list otherwise. Only one is displayed. */}
      <table className="hidden w-full border-collapse text-left text-base @min-[38rem]:table">
        <caption className="sr-only">Your schools, most urgent first</caption>
        <thead>
          <tr className="border-b-2 border-ink">
            <th scope="col" className={`${monoLabel} py-2 pr-3 align-bottom text-ink-muted`}>
              School
            </th>
            {COLUMNS.map((c) => (
              <th key={c.key} scope="col" className={`${monoLabel} py-2 pr-3 align-bottom text-ink-muted`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.schoolId} className="border-b border-dashed border-rule-light align-top">
              <th scope="row" className="py-1 pr-3 font-normal">
                <SchoolLink row={row} />
              </th>
              {COLUMNS.map((c) => (
                <td key={c.key} className="py-2 pr-3 text-ink-soft">
                  {row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="m-0 list-none divide-y divide-dashed divide-rule-light p-0 @min-[38rem]:hidden">
        {rows.map((row) => (
          <li key={row.schoolId} className="py-2">
            <SchoolLink row={row} />
            <dl className="m-0 mt-1 grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] gap-x-3 gap-y-1 text-base">
              {COLUMNS.map((c) => (
                <div key={c.key} className="contents">
                  <dt className={`${monoLabel} pt-1 text-ink-muted`}>{c.label}</dt>
                  <dd className="m-0 text-ink-soft">{row[c.key]}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      <NextTestLine next={next} />
      <p className="text-sm italic text-ink-muted">
        Fit and advice are based on published score ranges only, not a chance of admission. Select a school for its
        full card.
      </p>
    </div>
  );
}
