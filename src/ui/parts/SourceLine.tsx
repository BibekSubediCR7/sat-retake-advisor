import { FileText } from 'lucide-react';
import { ExternalLink } from './ExternalLink';

/** "Source: Common Data Set 2025-26 · Fall 2025 class" with a link. */
export function SourceLine({
  label,
  url,
  dataYear,
  detail,
}: {
  label: string;
  url: string | null;
  dataYear?: string | null;
  detail?: string | null;
}) {
  return (
    <p className="flex items-start gap-1.5 font-scoreMono text-xs leading-relaxed text-ink-muted">
      <FileText size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>
        Source:{' '}
        <ExternalLink href={url}>
          {label}
          {dataYear ? ` ${dataYear}` : ''}
        </ExternalLink>
        {detail ? ` · ${detail}` : ''}
      </span>
    </p>
  );
}
