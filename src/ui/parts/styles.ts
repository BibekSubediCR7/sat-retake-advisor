// Shared class strings for the "official score report" look.

/** Courier label: uppercase, tracked, 12px minimum. */
export const monoLabel = 'font-scoreMono text-xs font-bold uppercase tracking-[0.2em]';

/** Text inputs and selects: underlined field, 44px tap target, seal-red focus. */
export const fieldControl =
  'w-full min-h-[44px] border-0 border-b-2 border-ink bg-paper-light px-2 py-2 font-scoreSerif text-base text-ink ' +
  'focus:border-seal-red focus:outline-none focus-visible:outline-3 focus-visible:outline-seal-red ' +
  'aria-[invalid=true]:border-seal-red';

export const primaryButton =
  'inline-flex min-h-[48px] items-center justify-center gap-2 bg-ink px-5 py-3 font-scoreMono text-sm font-bold ' +
  'uppercase tracking-[0.2em] text-paper-light hover:bg-seal-red disabled:opacity-60';

export const secondaryButton =
  'inline-flex min-h-[44px] items-center justify-center gap-2 border-2 border-ink px-4 py-2 font-scoreMono text-sm ' +
  'font-bold uppercase tracking-[0.15em] text-ink hover:bg-paper';

export const linkButton =
  'inline-flex min-h-[44px] items-center font-scoreMono text-xs font-bold uppercase tracking-[0.15em] text-seal-red ' +
  'underline underline-offset-4 hover:text-ink';

/** Inline link. Vertical padding on an inline element grows the tap area to 44px without moving text. */
export const textLink = 'py-4 text-seal-red underline underline-offset-2 hover:text-ink break-words';
