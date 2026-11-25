import type { ReactNode } from 'react';
import { Flag } from 'lucide-react';
import type { AppSchool, PercentileRange } from '../../data/schema';
import { type SchoolResult } from '../../logic';
import { ExternalLink } from '../parts/ExternalLink';
import { SourceLine } from '../parts/SourceLine';
import { Stamp } from '../parts/Stamp';
import { linkButton, monoLabel } from '../parts/styles';
import {
  admitRateText,
  deadlineText,
  fitStampText,
  fitTone,
  gapText,
  policyLine,
  retakeStampText,
  retakeTone,
  scoreSendingText,
  scoreUsedText,
  submittingText,
  superscoreText,
  timelineStatusText,
} from './cardText';
import { RangeChart } from './RangeChart';

function sectionChart(range: PercentileRange | null, score: number, title: string) {
  if (!range || range.p25 === null || range.p75 === null) return null;
  const median = range.p50 ?? (range.p25 + range.p75) / 2;
  return (
    <div>
      <p className={`${monoLabel} mb-1 text-ink-soft`}>{title}</p>
      <RangeChart
        title={title}
        data={{
          p25: range.p25,
          p75: range.p75,
          median,
          medianEstimated: range.p50 === null,
          score,
          scaleMin: 200,
          scaleMax: 800,
        }}
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 border-t border-dashed border-rule-light py-2">
      <dt className={`${monoLabel} pt-0.5 text-ink-muted`}>{label}</dt>
      <dd className="m-0 text-base text-ink-soft">{children}</dd>
    </div>
  );
}

/** One school's findings (FR-4 to FR-10, FR-12). */
export function SchoolCard({
  result,
  school,
  onReportError,
}: {
  result: SchoolResult;
  school: AppSchool;
  onReportError: (schoolId: string) => void;
}) {
  const r = result;
  const headingId = `school-${r.schoolId}`;
  const sat = r.status === 'labeled' || r.status === 'no-total';
  const ss = superscoreText(school.superscore);
  const sending = scoreSendingText(school.scoreSending);
  const submitting = submittingText(school);
  const status = timelineStatusText(r.timeline);

  return (
    <article aria-labelledby={headingId} className="flex min-w-0 flex-col border border-rule bg-paper-light">
      <header className="border-b border-dashed border-rule px-4 py-3">
        <h3 id={headingId} className="font-scoreSerif text-xl font-bold leading-snug text-ink">
          {r.name}
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {r.retakeLabel && <Stamp tone={retakeTone[r.retakeLabel]}>{retakeStampText(r.retakeLabel)}</Stamp>}
          {r.fitLabel && <Stamp tone={fitTone[r.fitLabel]}>{fitStampText(r.fitLabel)}</Stamp>}
          {r.statusText && (
            <Stamp tone={r.status === 'unverified' ? 'amber' : 'ink'}>{r.statusText.replace(/\.$/, '')}</Stamp>
          )}
        </div>
      </header>

      <div className="flex-1 space-y-3 px-4 py-4">
        {r.totalRange && (
          <RangeChart
            title={`${r.name} total score`}
            data={{
              p25: r.totalRange.p25,
              p75: r.totalRange.p75,
              median: r.totalRange.median.value,
              medianEstimated: r.totalRange.median.estimated,
              score: r.scoreUsed.total,
              scaleMin: 400,
              scaleMax: 1600,
            }}
          />
        )}
        {r.status === 'no-total' && (
          <div className="space-y-3">
            <p className="text-base text-ink-soft">
              This school does not publish a total score range, so there is no retake label. Section ranges:
            </p>
            {sectionChart(school.sat.rw, r.scoreUsed.rw, 'Reading & Writing')}
            {sectionChart(school.sat.math, r.scoreUsed.math, 'Math')}
          </div>
        )}

        <dl className="m-0">
          {sat && <Row label="Score used">{scoreUsedText(r.scoreUsed)}</Row>}
          {r.sectionGaps.length > 0 && (
            <Row label="Sections">
              <ul className="m-0 list-none p-0">
                {r.sectionGaps.map((g) => (
                  <li key={g.section}>{gapText(g)}</li>
                ))}
              </ul>
            </Row>
          )}
          <Row label="Test policy">
            {policyLine(r, school)}
            {r.policy.entry.source && (
              <>
                {' '}
                (<ExternalLink href={r.policy.entry.source}>source</ExternalLink>)
              </>
            )}
          </Row>
          {(ss || sending) && (
            <Row label="Scores">
              {ss && <span className="block">{ss}</span>}
              {sending && <span className="block">{sending}</span>}
            </Row>
          )}
          {r.status !== 'test-blind' && (
            <Row label="Admissions">
              <span className="block">{admitRateText(school)}</span>
              {submitting && <span className="block">{submitting}</span>}
            </Row>
          )}
          <Row label="Deadline">
            <span className="block">{deadlineText(r.timeline)}</span>
            {r.timeline.deadline.notes.map((n) => (
              <span key={n} className="block text-sm text-ink-muted">
                {n}
              </span>
            ))}
            {r.status !== 'test-blind' && status && <span className="block">{status}</span>}
            {r.status !== 'test-blind' &&
              r.timeline.notes
                .filter((n) => n !== 'Deadline not yet verified.' && n !== 'Test dates not announced yet.')
                .map((n) => (
                  <span key={n} className="block text-sm text-ink-muted">
                    {n}
                  </span>
                ))}
          </Row>
        </dl>

        {r.notes.length > 0 && (
          <ul className="m-0 space-y-1 border-l-0 p-0 text-base text-ink">
            {r.notes.map((n) => (
              <li key={n} className="flex gap-2">
                <span aria-hidden="true" className="text-seal-red">
                  ›
                </span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        )}
        {r.disclaimer && <p className="text-sm italic text-ink-muted">{r.disclaimer}</p>}
      </div>

      <footer className="space-y-1 border-t border-dashed border-rule px-4 py-3">
        {r.status === 'unverified' ? (
          <SourceLine label="Data not yet verified — Common Data Set" url={school.sources.cds} />
        ) : (
          sat && (
            <SourceLine
              label="Common Data Set"
              url={school.sources.cds}
              dataYear={school.dataYear}
              detail={school.entryTerm ? `Class: ${school.entryTerm}` : null}
            />
          )
        )}
        <button type="button" className={linkButton} onClick={() => onReportError(r.schoolId)}>
          <Flag size={14} className="mr-1.5" aria-hidden="true" /> Report an error
          <span className="sr-only"> for {r.name}</span>
        </button>
      </footer>
    </article>
  );
}
