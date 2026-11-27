import { useEffect, useRef, useState } from 'react';
import { cachedUsage, readUsage, type Usage } from '../backend';
import { SAVING_ENABLED } from '../config/site';
import { monoLabel } from './parts/styles';

/** The counter stays hidden until this many students have used the tool, so it never looks empty. */
export const MIN_STUDENTS_SHOWN = 30;
/** Wait for the page to settle before loading Firebase, so the form is never slowed down. */
const READ_DELAY_MS = 2500;

const fmt = (n: number) => n.toLocaleString('en-US');

/** "2,418 score checks · 1,530 students", in the header. */
export function UsageLine() {
  const [usage, setUsage] = useState<Usage | null>(() => (SAVING_ENABLED ? cachedUsage() : null));
  const read = useRef(false);

  useEffect(() => {
    // A cached count under the threshold may be stale, so read the live count once per page load.
    if (!SAVING_ENABLED || read.current || (usage && usage.students >= MIN_STUDENTS_SHOWN)) return;
    const timer = window.setTimeout(() => {
      read.current = true;
      readUsage()
        .then((u) => u && setUsage(u))
        .catch(() => {});
    }, READ_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [usage]);

  if (!usage || usage.students < MIN_STUDENTS_SHOWN) return null;
  return (
    <p className={`${monoLabel} mt-3 text-stamp-green`}>
      {fmt(usage.checks)} score checks · {fmt(usage.students)} students
    </p>
  );
}
