import type { ReactNode } from 'react';
import { textLink } from './styles';

/**
 * A link to an outside page. When the URL isn't set yet (see src/config/site.ts),
 * renders the same content as plain text with "(link coming soon)" — never a fake link.
 */
export function ExternalLink({
  href,
  children,
  className = textLink,
  onClick,
}: {
  href: string | null;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  if (!href) {
    return (
      <span className={className === textLink ? 'text-ink-muted' : `${className} cursor-default opacity-75`}>
        {children}
        <span className="ml-1 normal-case tracking-normal italic">(link coming soon)</span>
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
