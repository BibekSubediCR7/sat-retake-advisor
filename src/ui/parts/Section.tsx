import type { ReactNode } from 'react';
import { monoLabel } from './styles';

interface SectionProps {
  id: string;
  numeral: string;
  title: string;
  /** Small Courier line above the title. */
  kicker?: string;
  children: ReactNode;
  className?: string;
}

/** A document panel with a double rule and a Roman-numeral heading. */
export function Section({ id, numeral, title, kicker, children, className = '' }: SectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} aria-labelledby={headingId} className={`border-4 border-double border-ink bg-paper-light ${className}`}>
      <header className="border-b-4 border-double border-ink px-4 py-4 sm:px-6">
        {kicker && <p className={`${monoLabel} text-ink-muted`}>{kicker}</p>}
        <h2 id={headingId} tabIndex={-1} className="mt-1 font-scoreDisplay text-2xl font-bold text-ink focus:outline-none">
          <span className="text-seal-red">{numeral}.</span> {title}
        </h2>
      </header>
      <div className="px-4 py-5 sm:px-6">{children}</div>
    </section>
  );
}
