import { BadgeCheck, HeartHandshake, GraduationCap, FileText, Printer, Award, Landmark, Building2, Globe2 } from 'lucide-react';
import {
  SCHOOLS, STUDENT, TEST_DATES, sectionGaps, policyLine, evaluate, barPct, BAR_MIN, BAR_MAX,
  useAttempts, useUniSearch, type School,
} from './shared';

function Stamp({ children, tone = 'ink' }: { children: string; tone?: 'ink' | 'red' | 'green' | 'amber' }) {
  const tones = {
    ink: 'border-[#1a1611] text-[#1a1611]',
    red: 'border-[#8c2f24] text-[#8c2f24]',
    green: 'border-[#3c5a3c] text-[#3c5a3c]',
    amber: 'border-[#7a5b1e] text-[#7a5b1e]',
  } as const;
  return (
    <span className={`inline-flex items-center border-2 px-2 py-0.5 font-scoreMono text-[11px] font-bold uppercase tracking-[0.12em] rotate-[-1.5deg] ${tones[tone]}`}>
      {children}
    </span>
  );
}

function stampTone(label: string) {
  if (label.includes('strongly')) return 'red' as const;
  if (label.includes('have time')) return 'amber' as const;
  if (label === 'Optional') return 'ink' as const;
  return 'green' as const;
}

function Verdict({ below }: { below: number }) {
  return (
    <div className="text-center py-8 border-y-4 border-double border-[#1a1611]">
      <p className="font-scoreMono text-[12px] uppercase tracking-[0.3em] text-[#6b6154]">Official Advisory Notice</p>
      <h1 className="mt-3 font-scoreDisplay text-4xl font-black leading-[115%] text-[#1a1611] md:text-5xl">
        Retake: you're below the median at {below} of 7 schools
      </h1>
      <p className="mt-4 font-scoreSerif text-lg text-[#3d362c]">
        Based on a total score of <strong>{STUDENT.total}</strong> ({STUDENT.rw} R&amp;W / {STUDENT.m} Math)
      </p>
      <div className="mt-5 flex justify-center gap-3 flex-wrap">
        <Stamp tone="red">Action advised</Stamp>
        <Stamp>Reviewed by the community</Stamp>
        <Stamp tone="green">Free tool</Stamp>
      </div>
    </div>
  );
}

function SchoolCard({ school }: { school: School }) {
  const r = evaluate(school, STUDENT);
  return (
    <article className="border border-[#c9bfae] bg-[#fdfcf9]">
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-dashed border-[#c9bfae] px-4 py-3">
        <h3 className="font-scoreSerif text-xl font-bold text-[#1a1611]">{school.name}</h3>
        <span className="font-scoreMono text-[11px] uppercase tracking-[0.15em] text-[#6b6154]">{r.admit}</span>
      </header>
      <div className="px-4 py-4">
        <div className="relative h-12">
          <div className="absolute top-4 left-0 right-0 h-[3px] bg-[#e2dacc]" />
          <div className="absolute top-4 h-[3px] bg-[#8c2f24]" style={{ left: `${barPct(r.total25)}%`, width: `${barPct(r.total75) - barPct(r.total25)}%` }} />
          {[
            { v: r.total25, l: '25th' },
            { v: r.total50, l: 'Median' },
            { v: r.total75, l: '75th' },
          ].map((t) => (
            <div key={t.l} className="absolute top-0 flex flex-col items-center -translate-x-1/2" style={{ left: `${barPct(t.v)}%` }}>
              <div className="w-[2px] h-4 bg-[#1a1611]" />
              <span className="mt-0.5 font-scoreMono text-[10px] text-[#6b6154]">{t.v}</span>
            </div>
          ))}
          <div className="absolute top-1 flex flex-col items-center -translate-x-1/2" style={{ left: `${barPct(STUDENT.total)}%` }}>
            <span className="border border-[#8c2f24] bg-[#fdfcf9] px-1.5 py-0.5 font-scoreMono text-[10px] font-bold text-[#8c2f24]">You {STUDENT.total}</span>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2 justify-between border-y border-[#e2dacc] py-2">
          <Stamp tone={stampTone(r.label)}>{r.label}</Stamp>
          <span className="font-scoreSerif text-sm italic text-[#3d362c]">{sectionGaps(school, STUDENT)}</span>
        </div>
        <p className="mt-3 font-scoreSerif text-sm text-[#3d362c]">{policyLine(school)}</p>
        <p className="mt-3 font-scoreMono text-[11px] text-[#6b6154] flex items-center gap-1.5">
          <FileText size={13} aria-hidden="true" /> Source: {school.source} · Sample data
        </p>
      </div>
    </article>
  );
}

export function ScoreReportForm() {
  const uni = useUniSearch();
  const att = useAttempts();
  return (
    <section className="border-4 border-double border-[#1a1611] bg-[#fdfcf9]">
      <header className="border-b-4 border-double border-[#1a1611] px-5 py-4">
        <p className="font-scoreMono text-[11px] uppercase tracking-[0.25em] text-[#6b6154]">Form SRA-1 · Application for Advisory</p>
        <h2 className="mt-1 font-scoreDisplay text-2xl font-bold text-[#1a1611]">Candidate Score Particulars</h2>
      </header>
      <div className="p-5 space-y-6">
        <fieldset>
          <legend className="font-scoreMono text-[11px] font-bold uppercase tracking-[0.2em] text-[#8c2f24] mb-3">I. Current Scores</legend>
          <div className="grid grid-cols-3 gap-3">
            {[
              { l: 'Total', v: '1410' },
              { l: 'R&W', v: '690' },
              { l: 'Math', v: '720' },
            ].map((f) => (
              <label key={f.l} className="block">
                <span className="mb-1 block font-scoreMono text-[11px] uppercase tracking-wider text-[#3d362c]">{f.l}</span>
                <input readOnly value={f.v} className="w-full border-b-2 border-[#1a1611] bg-transparent px-1 py-2 font-scoreSerif text-lg text-[#1a1611] focus:outline-none focus:border-[#8c2f24] min-h-[44px]" />
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="font-scoreMono text-[11px] font-bold uppercase tracking-[0.2em] text-[#8c2f24] mb-3">II. Prior Attempts (optional, max 5)</legend>
          <div className="space-y-2">
            {att.attempts.map((a, i) => (
              <div key={i} className="flex items-center justify-between border border-dashed border-[#c9bfae] px-3 py-2.5">
                <span className="font-scoreSerif text-sm text-[#3d362c]">{a.when} — {a.total} ({a.rw}/{a.m})</span>
                <button onClick={() => att.remove(i)} className="font-scoreMono text-[11px] uppercase text-[#8c2f24] underline underline-offset-2 min-h-[44px] px-1">Remove</button>
              </div>
            ))}
            {att.attempts.length < 5 && (
              <button onClick={att.add} className="w-full border border-dashed border-[#1a1611] py-3 font-scoreMono text-[12px] uppercase tracking-[0.15em] text-[#1a1611] hover:bg-[#f3ede1] min-h-[44px]">
                + Add a past attempt
              </button>
            )}
          </div>
        </fieldset>
        <fieldset>
          <legend className="font-scoreMono text-[11px] font-bold uppercase tracking-[0.2em] text-[#8c2f24] mb-3">III. Candidate Details</legend>
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: 'Current grade', opts: ['11th grade', '10th grade', '12th grade'] },
              { l: 'Entry year', opts: ['2027', '2028', '2029', '2030'] },
              { l: 'Applicant type', opts: ['Domestic', 'International'] },
              { l: 'Country', opts: ['United States', 'India', 'Canada', 'Other'] },
              { l: 'Application round', opts: ['ED — Early Decision', 'EA — Early Action', 'RD — Regular Decision'] },
            ].map((f) => (
              <label key={f.l} className={f.l === 'Application round' ? 'col-span-2' : ''}>
                <span className="mb-1 block font-scoreMono text-[11px] uppercase tracking-wider text-[#3d362c]">{f.l}</span>
                <select className="w-full border-b-2 border-[#1a1611] bg-transparent px-1 py-2.5 font-scoreSerif text-[15px] text-[#1a1611] focus:outline-none focus:border-[#8c2f24] min-h-[44px]">
                  {f.opts.map((o) => <option key={o}>{o}</option>)}
                </select>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="font-scoreMono text-[11px] font-bold uppercase tracking-[0.2em] text-[#8c2f24] mb-3">IV. Institutions Under Consideration</legend>
          <div className="border border-[#c9bfae] bg-white">
            <div className="border-b border-[#e2dacc] p-2">
              <input
                value={uni.query}
                onChange={(e) => { uni.setQuery(e.target.value); uni.setOpen(true); }}
                onFocus={() => uni.setOpen(true)}
                placeholder="Search 60 US universities…"
                aria-label="Search universities"
                className="w-full border-b border-[#c9bfae] px-2 py-2.5 font-scoreSerif text-[15px] focus:outline-none focus:border-[#8c2f24] min-h-[44px]"
              />
            </div>
            {uni.open && uni.filtered.length > 0 && (
              <ul className="max-h-44 overflow-y-auto divide-y divide-[#f0e9dc]">
                {uni.filtered.map((u) => (
                  <li key={u}>
                    <button onClick={() => { uni.toggle(u); uni.setQuery(''); uni.setOpen(false); }} className="w-full px-3 py-2.5 text-left font-scoreSerif text-[14px] text-[#3d362c] hover:bg-[#f3ede1] min-h-[44px]">
                      + {u}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-[#e2dacc] p-2 flex flex-wrap gap-1.5">
              {uni.selected.slice(0, 5).map((u) => (
                <span key={u} className="border border-[#c9bfae] px-2 py-1 font-scoreMono text-[11px] text-[#3d362c]">
                  {u.length > 26 ? u.slice(0, 26) + '…' : u}
                  <button onClick={() => uni.toggle(u)} aria-label={`Remove ${u}`} className="ml-1.5 font-bold text-[#8c2f24]">×</button>
                </span>
              ))}
              {uni.selected.length > 5 && <span className="px-1 py-1 font-scoreMono text-[11px] text-[#6b6154]">+{uni.selected.length - 5} more</span>}
            </div>
          </div>
        </fieldset>
        <button className="w-full bg-[#1a1611] py-4 font-scoreMono text-[13px] font-bold uppercase tracking-[0.25em] text-[#fdfcf9] hover:bg-[#8c2f24] min-h-[48px]">
          Check my scores
        </button>
        <p className="text-center font-scoreMono text-[11px] text-[#6b6154]">Sample data shown · No registration required</p>
      </div>
    </section>
  );
}

export function ScoreReportResults() {
  const below = SCHOOLS.filter((s) => evaluate(s, STUDENT).diff < 0).length;
  return (
    <div className="space-y-10">
      <div>
        <div className="mb-5 flex items-center justify-between border-b-4 border-double border-[#1a1611] pb-2">
          <h2 className="font-scoreDisplay text-2xl font-bold text-[#1a1611]">Advisory Report</h2>
          <span className="hidden md:inline-flex items-center gap-1.5 font-scoreMono text-[11px] uppercase tracking-widest text-[#6b6154]"><Printer size={14} aria-hidden="true" /> Print-friendly</span>
        </div>
        <Verdict below={below} />
        <div className="mt-8 space-y-5">
          {SCHOOLS.map((s) => <SchoolCard key={s.id} school={s} />)}
        </div>
      </div>
      <section className="border border-[#c9bfae] bg-[#fdfcf9] p-5">
        <h3 className="font-scoreDisplay text-xl font-bold text-[#1a1611]">Upcoming SAT Dates You Can Still Use</h3>
        <ul className="mt-4 divide-y divide-dashed divide-[#c9bfae]">
          {TEST_DATES.map((d) => (
            <li key={d.date} className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 py-3">
              <span className="font-scoreSerif text-lg font-bold text-[#1a1611]">{d.date}</span>
              <span className="font-scoreSerif text-sm text-[#3d362c] sm:text-right">{d.note}</span>
            </li>
          ))}
        </ul>
      </section>
      <div className="flex flex-col sm:flex-row gap-3">
        <button className="flex-1 flex items-center justify-center gap-2 bg-[#8c2f24] py-4 font-scoreMono text-[12px] font-bold uppercase tracking-[0.2em] text-[#fdfcf9] hover:bg-[#1a1611] min-h-[48px]">
          <GraduationCap size={18} aria-hidden="true" /> Get help from our tutors
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 border-2 border-[#1a1611] py-4 font-scoreMono text-[12px] font-bold uppercase tracking-[0.2em] text-[#1a1611] hover:bg-[#f3ede1] min-h-[48px]">
          <HeartHandshake size={18} aria-hidden="true" /> Support this tool
        </button>
      </div>
    </div>
  );
}

export function ScoreReportPage({ children }: { children: React.ReactNode }) {
  return <div className="min-h-full bg-[#f3ede1] p-4 sm:p-8 md:p-10">{children}</div>;
}

export function ScoreReportAbout() {
  return (
    <section className="border-4 border-double border-[#1a1611] bg-[#fdfcf9] p-6 md:p-8">
      <p className="font-scoreMono text-[11px] uppercase tracking-[0.25em] text-[#6b6154]">Section V · Colophon</p>
      <h2 className="mt-2 font-scoreDisplay text-3xl font-bold text-[#1a1611]">About This Tool</h2>
      <div className="mt-5 grid gap-5 md:grid-cols-[auto,1fr] md:items-start">
        <div className="mx-auto flex h-20 w-20 items-center justify-center border-2 border-[#1a1611] font-scoreDisplay text-3xl font-black text-[#1a1611] rotate-[-2deg]">
          AM
        </div>
        <div>
          <p className="font-scoreSerif text-lg font-bold text-[#1a1611]">Aarav Mehta</p>
          <p className="font-scoreSerif italic text-[#3d362c]">Student moderator, Digital SAT Questions (160,000+ members)</p>
          <p className="mt-3 font-scoreSerif leading-[155%] text-[#3d362c]">
            I moderate the largest Digital SAT community on the internet, and the same question
            arrives daily: "Is a 1410 good enough for MIT?" Percentile tables are public — but nobody
            was answering the real question, per school, per round. This tool does exactly that, with
            the same transparency I'd want as an applicant.
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3 font-scoreSerif text-sm">
        {[
          { icon: Award, t: 'Community-built', d: 'Maintained by volunteer moderators and tutors' },
          { icon: Landmark, t: 'Public data only', d: 'Every figure cites its Common Data Set source' },
          { icon: Globe2, t: 'Free forever', d: 'No account, no paywall, no score required' },
        ].map((c) => (
          <div key={c.t} className="border border-dashed border-[#c9bfae] p-3">
            <c.icon size={18} className="text-[#8c2f24]" aria-hidden="true" />
            <p className="mt-1.5 font-bold text-[#1a1611]">{c.t}</p>
            <p className="mt-0.5 text-[#3d362c]">{c.d}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 flex items-start gap-2 border-t border-dashed border-[#c9bfae] pt-4 font-scoreMono text-[11px] uppercase tracking-[0.1em] text-[#6b6154]">
        <Building2 size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
        Not affiliated with College Board or any university.
      </p>
    </section>
  );
}
