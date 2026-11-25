import { useRef, useState } from 'react';
import { SAVING_ENABLED } from './config/site';
import { satDates, schoolById, schoolIds, schools } from './data/appData';
import { buildReport, type Report as ReportData, type StudentInput } from './logic';
import { About, DISCLAIMER } from './ui/About';
import { CandidateForm } from './ui/form/CandidateForm';
import { monoLabel } from './ui/parts/styles';
import { Report } from './ui/report/Report';
import { ReportErrorDialog } from './ui/ReportErrorDialog';
import { todayLocal } from './ui/today';

interface Result {
  input: StudentInput;
  report: ReportData;
}

function scrollAndFocus(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  el.focus({ preventScroll: true });
}

export default function App() {
  const [result, setResult] = useState<Result | null>(null);
  const [errorSchool, setErrorSchool] = useState<string | null>(null);
  const today = useRef(todayLocal()).current;

  function onSubmit(input: StudentInput) {
    setResult({ input, report: buildReport(input, schools, satDates.dates, today) });
    requestAnimationFrame(() => scrollAndFocus('report-heading'));
  }

  return (
    <div className="min-h-screen">
      <a
        href="#candidate"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-paper-light focus:p-3"
      >
        Skip to the form
      </a>
      <header className="mx-auto max-w-[1200px] px-4 pb-4 pt-6 sm:pt-8">
        <p className={`${monoLabel} text-ink-muted`}>Free tool · Digital SAT Questions</p>
        <h1 className="mt-1 font-scoreDisplay text-3xl font-black text-ink sm:text-4xl">SAT Retake Advisor</h1>
        <p className="mt-2 max-w-2xl text-base text-ink-soft">
          Enter your SAT scores and the schools you are applying to. You get a school-by-school answer to &ldquo;Should
          I retake?&rdquo; using each school&rsquo;s published score ranges, test policy and deadlines.
        </p>
      </header>

      <main className="mx-auto grid max-w-[1200px] gap-8 px-4 pb-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
        <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <CandidateForm
            schools={schools}
            knownIds={schoolIds}
            today={today}
            onSubmit={onSubmit}
            notice={SAVING_ENABLED ? 'Your scores are saved anonymously for group statistics. No name or email.' : null}
          />
        </div>
        <div className="min-w-0 space-y-8">
          {result ? (
            <Report
              report={result.report}
              input={result.input}
              schools={schools}
              satDates={satDates}
              onEdit={() => scrollAndFocus('candidate-heading')}
              onReportError={setErrorSchool}
            />
          ) : (
            <div className="border-2 border-dashed border-rule p-6 text-base text-ink-soft">
              <p className={`${monoLabel} text-ink-muted`}>II. Score particulars</p>
              <p className="mt-2">
                Your report will appear here after you press &ldquo;Check my scores&rdquo;. It shows an overall verdict,
                one card per school, and the SAT dates you can still use.
              </p>
            </div>
          )}
          <About />
        </div>
      </main>

      <footer className="border-t border-rule bg-paper">
        <p className="mx-auto max-w-[1200px] px-4 py-6 text-base text-ink-soft">{DISCLAIMER}</p>
      </footer>

      <ReportErrorDialog
        schoolName={errorSchool ? (schoolById.get(errorSchool)?.name ?? null) : null}
        onClose={() => setErrorSchool(null)}
      />
    </div>
  );
}
