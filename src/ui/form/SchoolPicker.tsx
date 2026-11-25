import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import type { AppSchool } from '../../data/schema';
import { MAX_SCHOOLS } from '../../logic';
import { fieldControl, monoLabel } from '../parts/styles';
import { matchesSchool } from './schoolSearch';

interface SchoolPickerProps {
  schools: readonly AppSchool[];
  selected: string[];
  onChange: (ids: string[]) => void;
  error?: string | undefined;
}

/** Searchable multi-select (ARIA combobox + listbox). Up to MAX_SCHOOLS schools. */
export function SchoolPicker({ schools, selected, onChange, error }: SchoolPickerProps) {
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const listId = `${baseId}-list`;
  const errorId = `${baseId}-error`;
  const countId = `${baseId}-count`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const full = selected.length >= MAX_SCHOOLS;
  const byId = useMemo(() => new Map(schools.map((s) => [s.id, s])), [schools]);
  const options = useMemo(
    () => schools.filter((s) => !selected.includes(s.id) && matchesSchool(query, s)),
    [schools, selected, query],
  );
  const expanded = open && !full && options.length > 0;
  const activeOption = expanded ? options[Math.min(active, options.length - 1)] : undefined;

  function add(id: string) {
    if (full || selected.includes(id)) return;
    onChange([...selected, id]);
    setQuery('');
    setActive(0);
    inputRef.current?.focus();
  }

  function remove(id: string) {
    onChange(selected.filter((s) => s !== id));
    inputRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (options.length ? (a + 1) % options.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (options.length ? (a - 1 + options.length) % options.length : 0));
    } else if (e.key === 'Enter') {
      if (activeOption) {
        e.preventDefault();
        add(activeOption.id);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Backspace' && query === '' && selected.length) {
      const last = selected[selected.length - 1];
      if (last) remove(last);
    }
  }

  const describedBy = [countId, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div>
      <label htmlFor={inputId} className={`mb-1 block ${monoLabel} text-ink-soft`}>
        Schools (1–{MAX_SCHOOLS})
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeOption ? `${listId}-${activeOption.id}` : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          autoComplete="off"
          placeholder={full ? 'Most schools chosen' : 'Search, e.g. MIT, UCLA, Georgia Tech'}
          value={query}
          disabled={full}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className={fieldControl}
        />
        <ul
          id={listId}
          role="listbox"
          aria-label="Matching schools"
          hidden={!expanded}
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto border border-ink bg-paper-light shadow-[3px_3px_0_0_var(--color-rule)]"
        >
          {options.map((s) => (
            <li
              key={s.id}
              id={`${listId}-${s.id}`}
              role="option"
              aria-selected={s.id === activeOption?.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => add(s.id)}
              className={`min-h-[44px] cursor-pointer border-b border-dashed border-rule-light px-3 py-2.5 text-base ${
                s.id === activeOption?.id ? 'bg-paper text-ink' : 'text-ink-soft'
              }`}
            >
              {s.name}
            </li>
          ))}
        </ul>
      </div>
      <p id={countId} className="mt-1 text-sm text-ink-muted" aria-live="polite">
        {selected.length} of {MAX_SCHOOLS} chosen
        {full ? ' — that is the most you can compare at once.' : ''}
      </p>
      {error && (
        <p id={errorId} className="mt-1 text-sm font-semibold text-seal-red">
          {error}
        </p>
      )}
      {selected.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2" aria-label="Chosen schools">
          {selected.map((id) => {
            const name = byId.get(id)?.name ?? id;
            return (
              <li key={id} className="flex max-w-full items-center border border-rule bg-paper-light pl-3 text-sm text-ink">
                <span className="py-1">{name}</span>
                <button
                  type="button"
                  onClick={() => remove(id)}
                  aria-label={`Remove ${name}`}
                  className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center text-seal-red hover:bg-paper"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
