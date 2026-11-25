import type { ReactNode } from 'react';
import { textLink } from './styles';

/** A link to an outside page, or plain "Link coming soon" when the URL isn't set yet. */
export function ExternalLink({
  href,
  children,
  className = textLink,
}: {
  href: string | null;
  children: ReactNode;
  className?: string;
}) {
  if (!href) {
    return (
      <span className="text-ink-muted">
        {children} <span className="italic">(link coming soon)</span>
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
