import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { SAVING_ENABLED } from '../config/site';
import { Field } from './parts/Field';
import { fieldControl, monoLabel, primaryButton, secondaryButton } from './parts/styles';

export const ERROR_FIELDS = [
  'Total score range',
  'Section score ranges',
  'Admit rate',
  'Test policy',
  'Superscore policy',
  'Score sending',
  'Deadline',
  'Other',
] as const;

export const MAX_VALUE = 100;
export const MAX_URL = 300;

export interface ErrorReportDraft {
  field: string;
  correctValue: string;
  sourceUrl: string;
}

/** Validates the short error-report form (FR-12). Returns field → message. */
export function validateErrorReport(d: ErrorReportDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!(ERROR_FIELDS as readonly string[]).includes(d.field)) errors['field'] = 'Choose which value is wrong.';
  const value = d.correctValue.trim();
  if (!value) errors['correctValue'] = 'Enter the correct value.';
  else if (value.length > MAX_VALUE) errors['correctValue'] = `Keep it under ${MAX_VALUE} characters.`;
  const url = d.sourceUrl.trim();
  if (!url) errors['sourceUrl'] = 'Add a link to the official source.';
  else if (url.length > MAX_URL) errors['sourceUrl'] = `Keep the link under ${MAX_URL} characters.`;
  else {
    try {
      const u = new URL(url);
      if (u.protocol !== 'https:') errors['sourceUrl'] = 'Use an https:// link.';
    } catch {
      errors['sourceUrl'] = 'Enter a full link starting with https://';
    }
  }
  return errors;
}

/** Report-an-error dialog. In Milestone 3 nothing is sent or stored. */
export function ReportErrorDialog({ schoolName, onClose }: { schoolName: string | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<ErrorReportDraft>({ field: '', correctValue: '', sourceUrl: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (schoolName && !d.open) {
      setDraft({ field: '', correctValue: '', sourceUrl: '' });
      setErrors({});
      setDone(false);
      // showModal traps focus and restores it to the opener on close.
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
    } else if (!schoolName && d.open) {
      d.close();
    }
  }, [schoolName]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const found = validateErrorReport(draft);
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    // Saving arrives with Firestore in Milestone 4 (SAVING_ENABLED). Nothing is stored now.
    setDone(true);
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="report-error-title"
      onClose={onClose}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] border-4 border-double border-ink bg-paper-light p-0 text-ink backdrop:bg-ink/50"
    >
      <div className="flex items-start justify-between gap-3 border-b-4 border-double border-ink px-5 py-4">
        <div>
          <p className={`${monoLabel} text-ink-muted`}>Report an error</p>
          <h2 id="report-error-title" className="mt-1 font-scoreDisplay text-xl font-bold">
            {schoolName}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label="Close"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-ink hover:bg-paper"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      {done ? (
        <div className="space-y-4 px-5 py-5" role="status">
          <p className="text-base">
            {SAVING_ENABLED ? 'Thank you — your report was sent.' : 'Error reports open soon — thank you.'}
          </p>
          <button type="button" className={secondaryButton} onClick={() => ref.current?.close()}>
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4 px-5 py-5">
          <Field label="Which value is wrong?" error={errors['field']}>
            {({ id, describedBy, invalid }) => (
              <select
                id={id}
                value={draft.field}
                onChange={(e) => setDraft({ ...draft, field: e.target.value })}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                className={fieldControl}
              >
                <option value="">Choose…</option>
                {ERROR_FIELDS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Correct value" error={errors['correctValue']} hint={`Up to ${MAX_VALUE} characters, e.g. "1510–1570".`}>
            {({ id, describedBy, invalid }) => (
              <input
                id={id}
                type="text"
                maxLength={MAX_VALUE}
                value={draft.correctValue}
                onChange={(e) => setDraft({ ...draft, correctValue: e.target.value })}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                className={fieldControl}
              />
            )}
          </Field>
          <Field label="Official source link" error={errors['sourceUrl']} hint="The school's Common Data Set or admissions page.">
            {({ id, describedBy, invalid }) => (
              <input
                id={id}
                type="url"
                inputMode="url"
                maxLength={MAX_URL}
                placeholder="https://"
                value={draft.sourceUrl}
                onChange={(e) => setDraft({ ...draft, sourceUrl: e.target.value })}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                className={fieldControl}
              />
            )}
          </Field>
          <p className="text-sm text-ink-muted">Please don&rsquo;t include your name or any personal details.</p>
          <button type="submit" className={`${primaryButton} w-full`}>
            Send report
          </button>
        </form>
      )}
    </dialog>
  );
}
