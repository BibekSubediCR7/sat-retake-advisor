import { useId, type ReactNode } from 'react';
import { monoLabel } from './styles';

interface FieldProps {
  label: string;
  error?: string | undefined;
  hint?: string;
  /** Renders the control; receives the ids it must use. */
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
  className?: string;
}

/** Label + control + hint + inline error, wired with aria-describedby. */
export function Field({ label, error, hint, children, className = '' }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className={`mb-1 block ${monoLabel} text-ink-soft`}>
        {label}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm font-semibold text-seal-red">
          {error}
        </p>
      )}
    </div>
  );
}
