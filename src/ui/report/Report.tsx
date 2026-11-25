import { HeartHandshake, MessageCircleQuestion, PencilLine } from 'lucide-react';
import { countHelpClick } from '../../backend';
import { SAVING_ENABLED, site } from '../../config/site';
import type { AppSchool, SatDatesFile } from '../../data/schema';
import { LABEL_DISCLAIMER, type StudentInput, type Verdict as VerdictData } from '../../logic';
import type { Report as ReportData } from '../../logic';
import { sortResults } from '../../logic/order';
import { bestSitting, superscore, allSittings } from '../../logic/superscore';
import { ExternalLink } from '../parts/ExternalLink';
import { Section } from '../parts/Section';
import { SourceLine } from '../parts/SourceLine';
import { Stamp } from '../parts/Stamp';
import { monoLabel, primaryButton, secondaryButton } from '../parts/styles';
import { Tutors } from '../Tutors';
import { SchoolCard } from './SchoolCard';
import { TestCalendar } from './TestCalendar';

const VERDICT_TONE = { retake: 'red', optional: 'amber', 'no-time': 'ink', dont: 'green', none: 'ink' } as const;
const VERDICT_STAMP = {
  retake: 'Action advised',
  optional: 'Retake optional',
  'no-time': 'No time to retake',
  dont: "Don't retake",
  none: 'No verdict',
} as const;

function Verdict({ verdict, input }: { verdict: VerdictData; input: StudentInput }) {
  const { total, rw, math } = input.latest;
  return (
    <div className="border-y-4 border-double border-ink py-6 text-center">
      <p className={`${monoLabel} text-ink-muted`}>Overall verdict</p>
      <p id="verdict-headline" className="mt-3 font-scoreDisplay text-3xl font-black leading-tight text-ink sm:text-4xl">
        {verdict.sentence}
      </p>
      <p className="mt-3 text-lg text-ink-soft">
        Based on your latest total of <strong>{total}</strong> ({rw} Reading &amp; Writing / {math} Math)
        {input.pastAttempts.length > 0 ? ' and your past attempts' : ''}.
      </p>
      {verdict.excludedText && <p className="mt-2 text-base text-ink-soft">{verdict.excludedText}</p>}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Stamp tone={VERDICT_TONE[verdict.kind]}>{VERDICT_STAMP[verdict.kind]}</Stamp>
      </div>
      <p className="mx-auto mt-4 max-w-prose text-sm italic text-ink-muted">{LABEL_DISCLAIMER}</p>
    </div>
  );
}

function SuperscoreSummary({ input, schools }: { input: StudentInput; schools: readonly AppSchool[] }) {
  if (input.pastAttempts.length === 0) return null;
  const sittings = allSittings(input);
  const best = bestSitting(sittings);
  const sup = superscore(sittings);
  const chosen = input.schoolIds.map((id) => schools.find((s) => s.id === id)).filter((s): s is AppSchool => !!s);
  const superscorers = chosen.filter((s) => s.superscore === 'yes').map((s) => s.name);
  const others = chosen.filter((s) => s.superscore !== 'yes' && s.superscore !== 'n/a').map((s) => s.name);
  return (
    <div className="border border-dashed border-rule p-4">
      <h3 className="font-scoreDisplay text-xl font-bold text-ink">Your superscore</h3>
      <dl className="mt-2 grid gap-2 sm:grid-cols-2">
        <div>
          <dt className={`${monoLabel} text-ink-muted`}>Superscore</dt>
          <dd className="m-0 text-lg text-ink">
            <strong>{sup.total}</strong> ({sup.rw} R&amp;W + {sup.math} Math)
          </dd>
        </div>
        <div>
          <dt className={`${monoLabel} text-ink-muted`}>Best single test date</dt>
          <dd className="m-0 text-lg text-ink">
            <strong>{best.total}</strong> ({best.rw} R&amp;W + {best.math} Math)
          </dd>
        </div>
      </dl>
      {superscorers.length > 0 && (
        <p className="mt-2 text-base text-ink-soft">Superscore used for: {superscorers.join(', ')}.</p>
      )}
      {others.length > 0 && (
        <p className="mt-1 text-base text-ink-soft">Best single test date used for: {others.join(', ')}.</p>
      )}
    </div>
  );
}

interface ReportProps {
  report: ReportData;
  input: StudentInput;
  schools: readonly AppSchool[];
  satDates: SatDatesFile;
  onEdit: () => void;
  onReportError: (schoolId: string) => void;
}

/** Sections II–IV of the report, plus next steps. */
export function Report({ report, input, schools, satDates, onEdit, onReportError }: ReportProps) {
  const byId = new Map(schools.map((s) => [s.id, s]));
  const ordered = sortResults(report.results);
  return (
    <div className="space-y-8">
      <Section id="report" numeral="II" title="Score particulars" kicker="Advisory report">
        <div className="space-y-6">
          <Verdict verdict={report.verdict} input={input} />
          <SuperscoreSummary input={input} schools={schools} />
        </div>
      </Section>

      <Section id="findings" numeral="III" title="School-by-school findings" kicker="Most urgent first">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {ordered.map((r) => {
            const school = byId.get(r.schoolId);
            return school ? (
              <SchoolCard key={r.schoolId} result={r} school={school} onReportError={onReportError} />
            ) : null;
          })}
        </div>
      </Section>

      <Section id="calendar" numeral="IV" title="Test calendar" kicker="SAT dates you can still use">
        <TestCalendar
          results={report.results}
          dates={satDates.dates}
          sourceUrl={satDates.sources.dates}
          checked={satDates.checked}
        />
        {satDates.sources.scoreRelease && (
          <div className="mt-1">
            <SourceLine label="College Board score release dates" url={satDates.sources.scoreRelease} />
          </div>
        )}
      </Section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <ExternalLink
          href={site.groupUrl}
          className={`${primaryButton} flex-1 bg-seal-red hover:bg-ink`}
          onClick={() => {
            if (SAVING_ENABLED) countHelpClick().catch(() => {});
          }}
        >
          <MessageCircleQuestion size={18} aria-hidden="true" /> Ask a question in the group
        </ExternalLink>
        <button type="button" onClick={onEdit} className={`${secondaryButton} flex-1`}>
          <PencilLine size={18} aria-hidden="true" /> Edit inputs
        </button>
        <ExternalLink href={site.patreonUrl} className={`${secondaryButton} flex-1`}>
          <HeartHandshake size={18} aria-hidden="true" /> Support this tool
        </ExternalLink>
      </div>
      <Tutors />
    </div>
  );
}
