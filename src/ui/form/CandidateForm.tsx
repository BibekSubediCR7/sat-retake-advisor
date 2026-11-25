import { useRef, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { countries } from '../../data/countries';
import type { AppSchool } from '../../data/schema';
import { MAX_PAST_ATTEMPTS, validateInput, type FieldError, type StudentInput } from '../../logic';
import { Field } from '../parts/Field';
import { Section } from '../parts/Section';
import { fieldControl, linkButton, monoLabel, primaryButton, secondaryButton } from '../parts/styles';
import { emptyForm, toStudentInput, type AttemptDraft, type FormState } from './formState';
import { SchoolPicker } from './SchoolPicker';

interface CandidateFormProps {
  schools: readonly AppSchool[];
  knownIds: ReadonlySet<string>;
  today: string;
  onSubmit: (input: StudentInput) => void;
  /** Shown under the submit button (e.g. the anonymous-saving notice in M4). */
  notice?: string | null;
}

const SCORE_FIELDS = [
  { key: 'total', label: 'Total', min: 400, max: 1600 },
  { key: 'rw', label: 'R&W', min: 200, max: 800 },
  { key: 'math', label: 'Math', min: 200, max: 800 },
] as const;

const GRADE_OPTIONS = [
  ['9', '9th grade'],
  ['10', '10th grade'],
  ['11', '11th grade'],
  ['12', '12th grade'],
  ['gap-year', 'Gap year'],
] as const;

const ENTRY_OPTIONS = [
  ['2027', 'Fall 2027'],
  ['2028', 'Fall 2028'],
  ['2029', 'Fall 2029 or later'],
] as const;

const ROUND_OPTIONS = [
  ['ED', 'Early Decision (ED)'],
  ['EA', 'Early Action (EA)'],
  ['RD', 'Regular Decision (RD)'],
] as const;

const APPLICANT_OPTIONS = [
  ['domestic', 'Domestic (US citizen or permanent resident)'],
  ['international', 'International'],
] as const;

function errorMap(errors: FieldError[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const e of errors) if (!m.has(e.field)) m.set(e.field, e.message);
  return m;
}

/** "I. Candidate details": scores, past attempts, context and schools (FR-1, FR-2). */
export function CandidateForm({ schools, knownIds, today, onSubmit, notice }: CandidateFormProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const nextKey = useRef(1);
  const formRef = useRef<HTMLFormElement>(null);

  /** Clears inline errors for a field (and its children) as soon as the student edits it. */
  const clearErrors = (prefix: string) =>
    setErrors((m) => {
      const next = new Map([...m].filter(([k]) => k !== prefix && !k.startsWith(`${prefix}.`)));
      return next.size === m.size ? m : next;
    });
  const ERROR_KEY: Partial<Record<keyof FormState, string>> = { total: 'latest.total', rw: 'latest.rw', math: 'latest.math' };
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    clearErrors(ERROR_KEY[key] ?? key);
    if (key === 'rw' || key === 'math') clearErrors('latest.total');
  };
  const setAttempt = (key: number, patch: Partial<AttemptDraft>) => {
    setForm((f) => ({ ...f, attempts: f.attempts.map((a) => (a.key === key ? { ...a, ...patch } : a)) }));
    const i = form.attempts.findIndex((a) => a.key === key);
    for (const field of Object.keys(patch)) clearErrors(`pastAttempts.${i}.${field}`);
  };
  const err = (field: string) => errors.get(field);

  function submit(e: FormEvent) {
    e.preventDefault();
    const input = toStudentInput(form);
    const found = validateInput(input, knownIds, today);
    setErrors(errorMap(found));
    if (found.length) {
      // Focus the first invalid control once React has rendered the errors.
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }
    onSubmit(input);
  }

  const sum = Number(form.rw) + Number(form.math);
  const sumHint = form.rw && form.math && Number.isFinite(sum) ? `R&W + Math = ${sum}` : undefined;

  return (
    <Section id="candidate" numeral="I" title="Candidate details" kicker="Form SRA-1 · Should I retake?">
      <form ref={formRef} onSubmit={submit} noValidate className="space-y-7">
        <fieldset>
          <legend className={`${monoLabel} mb-3 text-seal-red`}>Latest SAT scores</legend>
          <p className="-mt-2 mb-3 text-sm text-ink-muted">
            Total 400–1600; R&amp;W (Reading and Writing) and Math 200–800 each.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {SCORE_FIELDS.map((f) => (
              <Field
                key={f.key}
                label={f.label}
                error={err(`latest.${f.key}`)}
                {...(f.key === 'total' && sumHint ? { hint: sumHint } : {})}
              >
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    type="number"
                    inputMode="numeric"
                    min={f.min}
                    max={f.max}
                    step={10}
                    value={form[f.key]}
                    onChange={(e) => set(f.key, e.target.value)}
                    aria-invalid={invalid}
                    aria-describedby={describedBy}
                    className={`${fieldControl} text-lg`}
                  />
                )}
              </Field>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className={`${monoLabel} mb-3 text-seal-red`}>Past attempts (optional, up to {MAX_PAST_ATTEMPTS})</legend>
          {err('pastAttempts') && <p className="mb-2 text-sm font-semibold text-seal-red">{err('pastAttempts')}</p>}
          <ol className="space-y-3">
            {form.attempts.map((a, i) => (
              <li key={a.key} className="border border-dashed border-rule p-3">
                <div className="flex items-center justify-between">
                  <p className={`${monoLabel} text-ink-soft`}>Attempt {i + 1}</p>
                  <button
                    type="button"
                    className={linkButton}
                    onClick={() => set('attempts', form.attempts.filter((x) => x.key !== a.key))}
                    aria-label={`Remove attempt ${i + 1}`}
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {(['rw', 'math'] as const).map((k) => (
                    <Field key={k} label={k === 'rw' ? 'R&W' : 'Math'} error={err(`pastAttempts.${i}.${k}`)}>
                      {({ id, describedBy, invalid }) => (
                        <input
                          id={id}
                          type="number"
                          inputMode="numeric"
                          min={200}
                          max={800}
                          step={10}
                          placeholder="200–800"
                          value={a[k]}
                          onChange={(e) => setAttempt(a.key, { [k]: e.target.value })}
                          aria-invalid={invalid}
                          aria-describedby={describedBy}
                          className={fieldControl}
                        />
                      )}
                    </Field>
                  ))}
                  <Field label="Test month" error={err(`pastAttempts.${i}.testMonth`)} className="col-span-2">
                    {({ id, describedBy, invalid }) => (
                      <input
                        id={id}
                        type="month"
                        max={today.slice(0, 7)}
                        value={a.testMonth}
                        onChange={(e) => setAttempt(a.key, { testMonth: e.target.value })}
                        aria-invalid={invalid}
                        aria-describedby={describedBy}
                        className={fieldControl}
                      />
                    )}
                  </Field>
                </div>
              </li>
            ))}
          </ol>
          {form.attempts.length < MAX_PAST_ATTEMPTS && (
            <button
              type="button"
              className={`${secondaryButton} mt-3 w-full border-dashed`}
              onClick={() =>
                set('attempts', [...form.attempts, { key: nextKey.current++, rw: '', math: '', testMonth: '' }])
              }
            >
              <Plus size={16} aria-hidden="true" /> Add a past attempt
            </button>
          )}
        </fieldset>

        <fieldset>
          <legend className={`${monoLabel} mb-3 text-seal-red`}>About you</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Current grade" error={err('grade')}>
              {({ id, describedBy, invalid }) => (
                <select
                  id={id}
                  value={form.grade}
                  onChange={(e) => set('grade', e.target.value as FormState['grade'])}
                  aria-invalid={invalid}
                  aria-describedby={describedBy}
                  className={fieldControl}
                >
                  <option value="">Choose…</option>
                  {GRADE_OPTIONS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Entry year" error={err('entryYear')}>
              {({ id, describedBy, invalid }) => (
                <select
                  id={id}
                  value={form.entryYear}
                  onChange={(e) => set('entryYear', e.target.value as FormState['entryYear'])}
                  aria-invalid={invalid}
                  aria-describedby={describedBy}
                  className={fieldControl}
                >
                  <option value="">Choose…</option>
                  {ENTRY_OPTIONS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Applicant type" error={err('applicantType')} className="sm:col-span-2">
              {({ id, describedBy, invalid }) => (
                <select
                  id={id}
                  value={form.applicantType}
                  onChange={(e) => set('applicantType', e.target.value as FormState['applicantType'])}
                  aria-invalid={invalid}
                  aria-describedby={describedBy}
                  className={fieldControl}
                >
                  <option value="">Choose…</option>
                  {APPLICANT_OPTIONS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Country" error={err('country')}>
              {({ id, describedBy, invalid }) => (
                <select
                  id={id}
                  value={form.country}
                  onChange={(e) => set('country', e.target.value)}
                  aria-invalid={invalid}
                  aria-describedby={describedBy}
                  className={fieldControl}
                >
                  <option value="">Choose…</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Application round" error={err('round')}>
              {({ id, describedBy, invalid }) => (
                <select
                  id={id}
                  value={form.round}
                  onChange={(e) => set('round', e.target.value as FormState['round'])}
                  aria-invalid={invalid}
                  aria-describedby={describedBy}
                  className={fieldControl}
                >
                  <option value="">Choose…</option>
                  {ROUND_OPTIONS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
        </fieldset>

        <fieldset>
          <legend className={`${monoLabel} mb-3 text-seal-red`}>Schools you are applying to</legend>
          <SchoolPicker
            schools={schools}
            selected={form.schoolIds}
            onChange={(ids) => set('schoolIds', ids)}
            error={err('schoolIds')}
          />
        </fieldset>

        <div>
          <button type="submit" className={`${primaryButton} w-full`}>
            Check my scores
          </button>
          {errors.size > 0 && (
            <p role="alert" className="mt-2 text-center text-sm font-semibold text-seal-red">
              Please fix the {errors.size === 1 ? 'field' : `${errors.size} fields`} marked above.
            </p>
          )}
          {notice && <p className="mt-2 text-center text-sm text-ink-muted">{notice}</p>}
        </div>
      </form>
    </Section>
  );
}
