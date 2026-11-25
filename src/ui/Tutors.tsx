import { site } from '../config/site';
import { monoLabel } from './parts/styles';

/** "Need tutoring help?" block. Renders nothing until tutors are listed in src/config/site.ts. */
export function Tutors({ className = '' }: { className?: string }) {
  if (site.tutors.length === 0) return null;
  return (
    <div className={`border border-dashed border-rule p-4 ${className}`}>
      <h3 className={`${monoLabel} text-ink`}>Need tutoring help?</h3>
      <p className="mt-1 text-base text-ink-soft">Email one of our expert SAT tutors:</p>
      <ul className="mt-2 list-none space-y-1 p-0 text-base">
        {site.tutors.map((t) => (
          <li key={t.email}>
            <span className="text-ink">{t.name}</span> — <span className="text-ink-soft">{t.email}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
