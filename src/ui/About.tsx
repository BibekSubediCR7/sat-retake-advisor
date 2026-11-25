import { HeartHandshake } from 'lucide-react';
import { SAVING_ENABLED, site } from '../config/site';
import { ExternalLink } from './parts/ExternalLink';
import { Tutors } from './Tutors';
import { Section } from './parts/Section';
import { monoLabel, secondaryButton } from './parts/styles';

export const DISCLAIMER =
  'Not affiliated with or endorsed by College Board or any university. SAT is a trademark of College Board.';

/** "V. About" (FR-14). Links come from src/config/site.ts; unset ones say "link coming soon". */
export function About() {
  return (
    <Section id="about" numeral="V" title="About this tool" kicker="Colophon">
      <div className="space-y-5 text-base leading-relaxed text-ink-soft">
        <div>
          <p className="font-scoreSerif text-lg font-bold text-ink">{site.creatorName}</p>
          <p className="italic">Moderator of the {site.groupName} group</p>
        </div>
        <p>
          &ldquo;Should I retake the SAT?&rdquo; is one of the questions asked most often in our group. The usual answers
          are general articles or score ranges with no source. This free tool answers it school by school, using each
          school&rsquo;s own published score ranges, test policy and deadlines, plus the official SAT dates.
        </p>
        <div>
          <h3 className={`${monoLabel} text-ink`}>How the data is collected and checked</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              SAT ranges and admit rates come from each school&rsquo;s Common Data Set (sections C9 and C1); deadlines
              from sections C21–C22.
            </li>
            <li>Test policy, superscoring and score sending come from the school&rsquo;s official admissions website.</li>
            <li>SAT dates come from the College Board website.</li>
            <li>
              Every value shows its source link and data year. A value with no official source stays empty and is
              marked &ldquo;Not published&rdquo; or &ldquo;Data not yet verified&rdquo; — nothing is estimated or filled
              in.
            </li>
            <li>Labels are based on published score ranges only. They are not a chance of admission.</li>
          </ul>
        </div>
        <p className="text-sm text-ink-muted">
          {SAVING_ENABLED
            ? 'We keep an anonymous count of checks (scores and chosen schools, no names or emails) to improve the tool.'
            : 'Nothing you enter is stored. Your report is worked out in your browser.'}
        </p>
        <Tutors />
        <div>
          <h3 className={`${monoLabel} text-ink`}>Links</h3>
          <ul className="mt-2 space-y-1">
            <li>
              <ExternalLink href={site.groupUrl}>{site.groupName} group</ExternalLink>
            </li>
            <li>
              <ExternalLink href={site.linkedinUrl}>LinkedIn</ExternalLink>
            </li>
            <li>
              <ExternalLink href={site.githubUrl}>GitHub</ExternalLink>
            </li>
            <li>
              Contact: <span className="text-ink">{site.contactEmail ?? 'email coming soon'}</span>
            </li>
          </ul>
        </div>
        <ExternalLink href={site.patreonUrl} className={secondaryButton}>
          <HeartHandshake size={18} aria-hidden="true" /> Support this tool on Patreon
        </ExternalLink>
        <p className="border-t border-dashed border-rule pt-4 text-sm text-ink-muted">{DISCLAIMER}</p>
      </div>
    </Section>
  );
}
