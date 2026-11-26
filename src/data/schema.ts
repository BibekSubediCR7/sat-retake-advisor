// Data schema for data/schools.json and data/sat-dates.json.
// Used by scripts/check-data.ts and src/data/data.test.ts only. The app imports
// the types (type-only imports are erased), so zod never ships in the bundle.

import { z } from 'zod';

/**
 * Printed CDS values that are not multiples of 10. Kept exactly as printed and
 * listed in docs/CHECKLIST.md §2 for a human to confirm. Key: `${id}.${section}.${pct}`.
 */
export const knownOddValues: ReadonlySet<string> = new Set([
  'columbia.rw.p75',
  'uw.total.p75',
  'boston-college.rw.p50',
  'uiuc.total.p50',
  'georgetown.total.p25',
  'pomona.rw.p50',
  'jhu.total.p75',
]);

export const testPolicyValue = z.enum([
  'required',
  'optional',
  'test-blind',
  'required-with-alternatives',
  'not-announced',
]);
export const superscoreValue = z.enum(['yes', 'no', 'not stated', 'n/a']);
export const scoreSendingValue = z.enum([
  'score-choice',
  'all-scores-required',
  'all-scores-recommended',
  'not stated',
  'n/a',
]);
export const selfReportingValue = z.enum(['yes', 'no', 'not stated', 'n/a']);

// http:// is accepted (some official pages still use it) but reported as a warning.
const httpsUrl = z.string().regex(/^https?:\/\/\S+$/, 'must be an http(s):// URL');
const monthDay = z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, 'must be MM-DD');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');
const dataYear = z.string().regex(/^\d{4}-\d{2}$/, 'must look like 2025-26');

const percentileRange = z.object({
  p25: z.number().int().nullable(),
  p50: z.number().int().nullable(),
  p75: z.number().int().nullable(),
});

const testPolicyEntry = z.object({
  fromEntryYear: z.number().int().min(2027),
  domestic: testPolicyValue,
  international: testPolicyValue,
  source: httpsUrl.nullable(),
  note: z.string().min(1).optional(),
});

export const schoolSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  category: z.enum(['national-university', 'liberal-arts-college']),
  usNewsRank2027: z.number().int().positive(),
  admissions: z.object({
    applied: z.number().int().nonnegative().nullable(),
    admitted: z.number().int().nonnegative().nullable(),
    admitRate: z.number().min(0).max(1).nullable(),
  }),
  sat: z.object({
    total: percentileRange.nullable(),
    rw: percentileRange.nullable(),
    math: percentileRange.nullable(),
  }),
  pctSubmittingSAT: z.number().min(0).max(100).nullable(),
  dataYear: dataYear.nullable(),
  entryTerm: z.string().nullable(),
  testPolicy: z.array(testPolicyEntry).min(1),
  superscore: superscoreValue,
  scoreSending: scoreSendingValue,
  selfReporting: selfReportingValue,
  deadlines: z.object({
    ED: z.array(monthDay).nullable(),
    EA: monthDay.nullable(),
    eaType: z.string().nullable(),
    RD: monthDay.nullable(),
  }),
  sources: z.object({
    cds: httpsUrl.nullable(),
    policy: z.array(z.object({ url: httpsUrl, appliesTo: z.string() })).min(1),
  }),
  status: z.object({
    scores: z.enum(['official-cds-read', 'needs-official-check']),
    policy: z.enum(['official-site-read', 'needs-official-check']),
  }),
  verified: z.boolean(),
  meta: z.object({
    policyCycle: z.string().nullable(),
    recentChange: z.string().nullable(),
    superscoreQuote: z.unknown(),
    scoreSendingQuote: z.unknown(),
    notes: z.unknown(),
  }),
});

export const satDateSchema = z.object({
  testDate: isoDate,
  registrationDeadline: isoDate.nullable(),
  lateRegistrationDeadline: isoDate.nullable(),
  scoreRelease: isoDate.nullable(),
  status: z.enum(['confirmed', 'anticipated']),
  note: z.string().optional(),
});

export const satDatesFileSchema = z.object({
  checked: isoDate,
  appliesTo: z.string(),
  note: z.string(),
  sources: z.object({ dates: httpsUrl, scoreRelease: httpsUrl.optional() }),
  dates: z.array(satDateSchema).min(1),
});

export type School = z.infer<typeof schoolSchema>;
/** A school as the app loads it: evidence fields (meta) are stripped at build time. */
export type AppSchool = Omit<School, 'meta'>;
export type TestPolicyValue = z.infer<typeof testPolicyValue>;
export type TestPolicyEntry = z.infer<typeof testPolicyEntry>;
export type PercentileRange = z.infer<typeof percentileRange>;
export type SatDate = z.infer<typeof satDateSchema>;
export type SatDatesFile = z.infer<typeof satDatesFileSchema>;

export interface DataIssue {
  where: string;
  message: string;
}

const SCALE = { total: [400, 1600], rw: [200, 800], math: [200, 800] } as const;

function hasAnyScore(s: School): boolean {
  return (['total', 'rw', 'math'] as const).some((k) => {
    const r = s.sat[k];
    return r !== null && (r.p25 !== null || r.p50 !== null || r.p75 !== null);
  });
}

/** Rules zod can't express on one record: cross-field and cross-record checks. */
export function checkSchools(input: unknown): { errors: DataIssue[]; warnings: DataIssue[] } {
  const errors: DataIssue[] = [];
  const warnings: DataIssue[] = [];

  const parsed = z.array(z.unknown()).safeParse(input);
  if (!parsed.success) return { errors: [{ where: 'schools.json', message: 'must be an array' }], warnings };

  const seen = new Set<string>();
  parsed.data.forEach((raw, i) => {
    const r = schoolSchema.safeParse(raw);
    const label = (raw as { id?: unknown })?.id ?? `#${i}`;
    if (!r.success) {
      for (const issue of r.error.issues) {
        errors.push({ where: `${String(label)}.${issue.path.join('.')}`, message: issue.message });
      }
      return;
    }
    const s = r.data;
    const at = (path: string) => `${s.id}.${path}`;

    if (seen.has(s.id)) errors.push({ where: at('id'), message: 'duplicate id' });
    seen.add(s.id);

    const anyAdmissions = Object.values(s.admissions).some((v) => v !== null);
    if ((hasAnyScore(s) || anyAdmissions) && s.dataYear === null) {
      errors.push({ where: at('dataYear'), message: 'required when any score or admissions value is present' });
    }
    if (hasAnyScore(s) && s.sources.cds === null) {
      errors.push({ where: at('sources.cds'), message: 'required when any score is present' });
    }

    for (const k of ['total', 'rw', 'math'] as const) {
      const range = s.sat[k];
      if (!range) continue;
      const [lo, hi] = SCALE[k];
      for (const p of ['p25', 'p50', 'p75'] as const) {
        const v = range[p];
        if (v === null) continue;
        if (v < lo || v > hi) errors.push({ where: at(`sat.${k}.${p}`), message: `${v} outside ${lo}-${hi}` });
        if (v % 10 !== 0) {
          if (knownOddValues.has(`${s.id}.${k}.${p}`)) {
            warnings.push({ where: at(`sat.${k}.${p}`), message: `${v} kept as printed (CHECKLIST §2)` });
          } else {
            errors.push({ where: at(`sat.${k}.${p}`), message: `${v} is not a multiple of 10` });
          }
        }
      }
      const ordered = [range.p25, range.p50, range.p75].filter((v): v is number => v !== null);
      if (ordered.some((v, j) => j > 0 && v < ordered[j - 1]!)) {
        errors.push({ where: at(`sat.${k}`), message: 'percentiles out of order (p25 <= p50 <= p75)' });
      }
    }

    const policyUrls = new Set(s.sources.policy.map((p) => p.url));
    s.testPolicy.forEach((e, j) => {
      const where = at(`testPolicy.${j}`);
      if (j === 0 && e.fromEntryYear !== 2027) errors.push({ where, message: 'first entry must start at 2027' });
      const prev = s.testPolicy[j - 1];
      if (prev && e.fromEntryYear <= prev.fromEntryYear) {
        errors.push({ where, message: 'entries must be sorted by fromEntryYear, no duplicates' });
      }
      const announced = e.domestic !== 'not-announced' || e.international !== 'not-announced';
      if (announced) {
        if (e.source === null) errors.push({ where, message: 'announced policy needs a source URL' });
        else if (!policyUrls.has(e.source)) {
          errors.push({ where, message: 'source must be one of this school\'s sources.policy URLs' });
        }
      } else if (!e.note) {
        errors.push({ where, message: 'not-announced entry needs a note' });
      }
    });

    for (const u of new Set([s.sources.cds, ...s.sources.policy.map((p) => p.url)])) {
      if (u?.startsWith('http://')) warnings.push({ where: at('sources'), message: `insecure URL kept as recorded: ${u}` });
    }

    if (!s.verified) warnings.push({ where: at('verified'), message: 'not yet checked by a tutor-admin' });
    if (s.status.scores === 'needs-official-check') {
      warnings.push({ where: at('status.scores'), message: 'scores need an official CDS check' });
    }
  });

  return { errors, warnings };
}

export function checkSatDates(input: unknown): { errors: DataIssue[]; warnings: DataIssue[] } {
  const errors: DataIssue[] = [];
  const warnings: DataIssue[] = [];
  const r = satDatesFileSchema.safeParse(input);
  if (!r.success) {
    for (const issue of r.error.issues) {
      errors.push({ where: `sat-dates.${issue.path.join('.')}`, message: issue.message });
    }
    return { errors, warnings };
  }
  r.data.dates.forEach((d, i) => {
    const where = `sat-dates.dates.${i} (${d.testDate})`;
    const prev = r.data.dates[i - 1];
    if (prev && d.testDate <= prev.testDate) errors.push({ where, message: 'dates must be sorted, no duplicates' });
    if (d.status === 'confirmed' && (d.registrationDeadline === null || d.lateRegistrationDeadline === null)) {
      errors.push({ where, message: 'confirmed date needs registration deadlines' });
    }
    if (d.registrationDeadline && d.registrationDeadline >= d.testDate) {
      errors.push({ where, message: 'registration deadline must be before the test date' });
    }
    if (d.scoreRelease && d.scoreRelease <= d.testDate) {
      errors.push({ where, message: 'score release must be after the test date' });
    }
    if (d.status === 'anticipated') warnings.push({ where, message: 'anticipated, not yet confirmed' });
  });
  return { errors, warnings };
}
