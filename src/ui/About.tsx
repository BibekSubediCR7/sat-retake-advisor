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
          &ldquo;Should I retake the SAT?&rdquo; is one of the questions asked most often in our group, along with
          &ldquo;Is this school a reach for me?&rdquo; The usual answers are general articles, or score ranges copied from
          site to site with no year and no source. This free tool answers both questions for each school on your list,
          using that school&rsquo;s own published numbers.
        </p>
        <div>
          <h3 className={`${monoLabel} text-ink`}>What you get for each school</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong className="text-ink">Your score against admitted students:</strong> where your score sits against
              the school&rsquo;s 25th, 50th and 75th percentile SAT scores, as a chart and in words.
            </li>
            <li>
              <strong className="text-ink">Reach, target or safety by score:</strong> worked out from the school&rsquo;s
              published range and admit rate (rules below).
            </li>
            <li>
              <strong className="text-ink">Retake advice:</strong> &ldquo;Retake strongly recommended&rdquo;,
              &ldquo;Retake if you have time&rdquo;, &ldquo;Optional&rdquo;, &ldquo;Don&rsquo;t retake&rdquo;, or
              &ldquo;No time to retake&rdquo; if no SAT score would arrive before that school&rsquo;s deadline.
            </li>
            <li>
              <strong className="text-ink">How much test scores count:</strong> the school&rsquo;s own rating of
              standardized test scores in its Common Data Set (section C7): very important, important, considered or
              not considered.
            </li>
            <li>
              <strong className="text-ink">Your score as each school counts it:</strong> superscore if the school
              superscores, otherwise your best single test date.
            </li>
            <li>
              <strong className="text-ink">Test policy for your entry year:</strong> required, optional or not
              considered, for domestic and international applicants.
            </li>
            <li>
              <strong className="text-ink">Deadlines and test dates:</strong> Early Decision, Early Action and Regular
              Decision dates, plus which official SAT dates still get your scores there in time.
            </li>
          </ul>
        </div>
        <div>
          <h3 className={`${monoLabel} text-ink`}>How reach, target and safety are worked out</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong className="text-ink">Reach:</strong> your score is below the school&rsquo;s median, or the school
              admits fewer than 15% of applicants (any score).
            </li>
            <li>
              <strong className="text-ink">Target:</strong> your score is between the median and the 75th percentile.
            </li>
            <li>
              <strong className="text-ink">Safety:</strong> your score is at or above the 75th percentile and the school
              admits at least 30% of applicants. Otherwise it stays a Target.
            </li>
          </ul>
          <p className="mt-2">
            These labels are based on score ranges only. They are not a chance of admission. Essays, grades, activities
            and recommendations matter too.
          </p>
        </div>
        <div>
          <h3 className={`${monoLabel} text-ink`}>Where the data comes from</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong className="text-ink">SAT ranges, admit rates and how much test scores count:</strong> each
              school&rsquo;s latest Common Data Set (sections C1, C7 and C9), the standard report schools publish
              themselves. The year is shown on each
              school.
            </li>
            <li>
              <strong className="text-ink">Deadlines, test policy, superscoring and score sending:</strong> the
              school&rsquo;s official admissions website. Deadlines were checked for the 2026–27 cycle.
            </li>
            <li>
              <strong className="text-ink">SAT dates and score release dates:</strong> College Board. Dates it
              hasn&rsquo;t published yet show as &ldquo;TBD&rdquo;.
            </li>
            <li>Every number shows its source link and data year, so you can check it yourself.</li>
            <li>
              Nothing is copied from other websites or guessed. If a school doesn&rsquo;t publish a value, the site says
              &ldquo;Not published&rdquo; or &ldquo;Data not yet verified&rdquo;. If it publishes no median, the
              midpoint of its 25th and 75th percentiles is shown, marked &ldquo;estimated&rdquo;.
            </li>
            <li>Found a mistake? Every school card has a &ldquo;Report an error&rdquo; button.</li>
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
        {site.supportUrl && (
          <div className="space-y-3">
            <h3 className={`${monoLabel} text-ink`}>Support this tool</h3>
            <p>
              The tool is free and has no ads. If it helped you, you can support it with a small donation on{' '}
              {site.supportPlatform}, which accepts payments from Nepal and abroad. Donations help keep the data
              checked every year.
            </p>
            <ExternalLink href={site.supportUrl} className={secondaryButton}>
              <HeartHandshake size={18} aria-hidden="true" /> Donate on {site.supportPlatform}
            </ExternalLink>
          </div>
        )}
        <p className="border-t border-dashed border-rule pt-4 text-sm text-ink-muted">{DISCLAIMER}</p>
      </div>
    </Section>
  );
}
