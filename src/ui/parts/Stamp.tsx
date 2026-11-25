export type StampTone = 'ink' | 'red' | 'green' | 'amber';

const TONES: Record<StampTone, string> = {
  ink: 'border-ink text-ink',
  red: 'border-seal-red text-seal-red',
  green: 'border-stamp-green text-stamp-green',
  amber: 'border-stamp-amber text-stamp-amber',
};

/** Outlined, slightly rotated stamp. Always has words; colour is never the only signal. */
export function Stamp({ children, tone = 'ink' }: { children: string; tone?: StampTone }) {
  return (
    <span
      className={`stamp inline-block max-w-full rotate-[-1.5deg] border-2 px-2 py-0.5 text-center font-scoreMono text-xs font-bold uppercase leading-snug tracking-[0.12em] break-words ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
