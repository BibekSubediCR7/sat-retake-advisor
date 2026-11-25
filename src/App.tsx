// Placeholder page for Milestone 1: confirms fonts and colour tokens render.
// The real interface is built in Milestone 3.
export default function App() {
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10">
      <div className="border-4 border-double border-ink bg-paper-light p-6">
        <p className="font-scoreMono text-xs font-bold uppercase tracking-[0.2em] text-seal-red">
          I. Candidate details
        </p>
        <h1 className="mt-2 font-scoreDisplay text-4xl font-bold">SAT Retake Advisor</h1>
        <p className="mt-4 text-base">
          A free, school-by-school answer to &ldquo;Should I retake the SAT?&rdquo; Coming soon.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 border-t border-dashed border-rule pt-4">
          <span className="inline-flex rotate-[-1.5deg] border-2 border-seal-red px-2 py-0.5 font-scoreMono text-xs font-bold uppercase tracking-[0.12em] text-seal-red">
            Retake strongly recommended
          </span>
          <span className="inline-flex rotate-[-1.5deg] border-2 border-stamp-amber px-2 py-0.5 font-scoreMono text-xs font-bold uppercase tracking-[0.12em] text-stamp-amber">
            Retake if you have time
          </span>
          <span className="inline-flex rotate-[-1.5deg] border-2 border-stamp-green px-2 py-0.5 font-scoreMono text-xs font-bold uppercase tracking-[0.12em] text-stamp-green">
            Don&rsquo;t retake
          </span>
        </div>
      </div>
      <footer className="mt-8 border-t border-rule-light pt-4 text-base">
        Not affiliated with or endorsed by College Board or any university. SAT is a trademark of
        College Board.
      </footer>
    </main>
  );
}
