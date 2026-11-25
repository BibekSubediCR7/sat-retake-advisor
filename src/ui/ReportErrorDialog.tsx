import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { sendErrorReport } from '../backend';
import { SAVING_ENABLED } from '../config/site';
import { ERROR_FIELDS, MAX_URL, MAX_VALUE, validateErrorReport, type ErrorReportDraft } from '../logic/errorReport';
import { Field } from './parts/Field';
import { fieldControl, monoLabel, primaryButton, secondaryButton } from './parts/styles';

type SendState = 'idle' | 'sending' | 'sent' | 'failed' | 'not-saving';

/** Report-an-error dialog (FR-12). Saves to Firestore when saving is configured. */
export function ReportErrorDialog({
  school,
  onClose,
}: {
  school: { id: string; name: string } | null;
  onClose: () => void;
}) {
  const schoolName = school?.name ?? null;
  const ref = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<ErrorReportDraft>({ field: '', correctValue: '', sourceUrl: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<SendState>('idle');

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (schoolName && !d.open) {
      setDraft({ field: '', correctValue: '', sourceUrl: '' });
      setErrors({});
      setState('idle');
      // showModal traps focus and restores it to the opener on close.
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
    } else if (!schoolName && d.open) {
      d.close();
    }
  }, [schoolName]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found = validateErrorReport(draft);
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    if (!SAVING_ENABLED || !school) {
      setState('not-saving');
      return;
    }
    setState('sending');
    try {
      await sendErrorReport(school.id, draft);
      setState('sent');
    } catch {
      setState('failed');
    }
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
      {state === 'sent' || state === 'not-saving' ? (
        <div className="space-y-4 px-5 py-5" role="status">
          <p className="text-base">
            {state === 'sent' ? 'Thank you — your report was sent.' : 'Error reports open soon — thank you.'}
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
          {state === 'failed' && (
            <p role="alert" className="text-sm font-semibold text-seal-red">
              Couldn&rsquo;t send right now — please try again later.
            </p>
          )}
          <button type="submit" className={`${primaryButton} w-full`} disabled={state === 'sending'}>
            {state === 'sending' ? 'Sending…' : 'Send report'}
          </button>
        </form>
      )}
    </dialog>
  );
}
