import { useId } from 'react';
import { Printer } from 'lucide-react';
import { formatDate, type StudentInput } from '../../logic';
import { fieldControl, monoLabel, primaryButton } from '../parts/styles';

export const MAX_NAME = 60;

/** Keeps a name printable: no control characters, single spaces, at most MAX_NAME characters. */
export function cleanName(raw: string): string {
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
}

/** Title used as the suggested PDF file name. */
export function pdfTitle(name: string, today: string): string {
  return name ? `SAT report - ${name} - ${today}` : `SAT report - ${today}`;
}

/**
 * "Save this report": an optional name printed on the PDF, then the browser's own print dialog
 * (choose "Save as PDF"). The name stays in this component's state only: it is never sent or stored.
 */
export function SaveReport({
  name,
  onNameChange,
  today,
}: {
  name: string;
  onNameChange: (name: string) => void;
  today: string;
}) {
  const inputId = useId();
  const hintId = useId();

  function save() {
    const before = document.title;
    document.title = pdfTitle(cleanName(name), today);
    const restore = () => {
      document.title = before;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.print();
  }

  return (
    <div className="space-y-3 border-4 border-double border-ink bg-paper-light p-4 sm:p-6 print:hidden">
      <h2 className="font-scoreDisplay text-2xl font-bold text-ink">Save this report</h2>
      <p className="text-base text-ink-soft">
        Keep a copy as a PDF, or share it with a parent, counselor or the group.
      </p>
      <div>
        <label htmlFor={inputId} className={`${monoLabel} block text-ink`}>
          Name to print on the report (optional)
        </label>
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          maxLength={MAX_NAME}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          aria-describedby={hintId}
          className={`${fieldControl} mt-1 max-w-md`}
        />
        <p id={hintId} className="mt-1 text-sm text-ink-muted">
          Only printed on your PDF. It is never sent or saved anywhere.
        </p>
      </div>
      <button type="button" onClick={save} className={`${primaryButton} bg-seal-red hover:bg-ink`}>
        <Printer size={18} aria-hidden="true" /> Save as PDF
      </button>
      <p className="text-sm text-ink-muted">
        In the print window, choose &ldquo;Save as PDF&rdquo; as the printer or destination. On a phone, tap Print and
        then the save or share option.
      </p>
    </div>
  );
}

/** Shown only on the printed page, above section II. */
export function PrintHeader({ name, input, today }: { name: string; input: StudentInput; today: string }) {
  const clean = cleanName(name);
  const { total, rw, math } = input.latest;
  return (
    <div className="hidden border-b-4 border-double border-ink pb-3 print:block">
      <p className={`${monoLabel} text-ink-muted`}>SAT Retake Advisor · app.satretake.workers.dev</p>
      <p className="mt-1 font-scoreDisplay text-3xl font-black text-ink">
        {clean ? `Score report for ${clean}` : 'Score report'}
      </p>
      <p className="mt-1 text-base text-ink-soft">
        Made on {formatDate(today)}. Latest SAT {total} ({rw} Reading &amp; Writing / {math} Math), fall {' '}
        {input.entryYear === 2029 ? '2029 or later' : input.entryYear} entry, {input.applicantType} applicant,{' '}
        {input.round} round.
      </p>
    </div>
  );
}
