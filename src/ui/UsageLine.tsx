import { useEffect, useState } from 'react';
import { cachedUsage, readUsage, type Usage } from '../backend';
import { SAVING_ENABLED } from '../config/site';
import { monoLabel } from './parts/styles';

/** The counter stays hidden until it reaches this many checks, so it never looks empty. */
export const MIN_CHECKS_SHOWN = 100;
/** Wait for the page to settle before loading Firebase, so the form is never slowed down. */
const READ_DELAY_MS = 2500;

const fmt = (n: number) => n.toLocaleString('en-US');

/** "2,418 score checks · 1,530 students", in the header. */
export function UsageLine() {
  const [usage, setUsage] = useState<Usage | null>(() => (SAVING_ENABLED ? cachedUsage() : null));

  useEffect(() => {
    if (!SAVING_ENABLED || usage) return;
    const timer = window.setTimeout(() => {
      readUsage()
        .then((u) => u && setUsage(u))
        .catch(() => {});
    }, READ_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [usage]);

  if (!usage || usage.checks < MIN_CHECKS_SHOWN) return null;
  return (
    <p className={`${monoLabel} mt-3 text-stamp-green`}>
      {fmt(usage.checks)} score checks · {fmt(usage.students)} students
    </p>
  );
}
