// One-time Milestone 1 conversion of data/schools.json to the PRD target format.
// Usage: npx tsx scripts/convert-schools.ts
//
// - testPolicy object -> per-entry-year list (from scripts/policy-history.ts)
// - evidence fields (quotes, notes, recentChange, old cycle text) -> meta
// - dataYear "2025-2026" -> "2025-26" (format only)
// - deadlines.ED labels stripped ("ED I: 11-01" -> "11-01")
// No score, rate, deadline or policy value is changed or added beyond the table.
// Writes data/schools.json and docs/policy-conversion.md. Refuses to run twice.

import { readFileSync, writeFileSync } from 'node:fs';
import { policyHistory, type PolicyValue } from './policy-history';

const SCHOOLS = 'data/schools.json';
const REVIEW = 'docs/policy-conversion.md';
const FIRST_ENTRY_YEAR = 2027;

interface OldSchool {
  id: string;
  name: string;
  testPolicy: { domestic: PolicyValue; international: PolicyValue; cycle: string };
  superscoreQuote: unknown;
  scoreSendingQuote: unknown;
  recentChange: string | null;
  notes: unknown;
  dataYear: string | null;
  deadlines: { ED: string[] | null; EA: string | null; eaType: string | null; RD: string | null };
  sources: { cds: string | null; policy: { url: string; appliesTo: string }[] };
  [key: string]: unknown;
}

const raw = JSON.parse(readFileSync(SCHOOLS, 'utf8')) as OldSchool[];
if (raw.some((s) => Array.isArray(s.testPolicy))) {
  throw new Error('schools.json is already converted; refusing to run again.');
}

const unknownIds = Object.keys(policyHistory).filter((id) => !raw.some((s) => s.id === id));
if (unknownIds.length) throw new Error(`policy-history has unknown ids: ${unknownIds.join(', ')}`);

function normalizeDataYear(y: string | null): string | null {
  if (y === null) return null;
  const m = /^(\d{4})-(\d{4})$/.exec(y);
  if (m && Number(m[2]) === Number(m[1]) + 1) return `${m[1]}-${m[2]!.slice(2)}`;
  return y;
}

function stripEdLabel(d: string): string {
  return d.replace(/^ED(\s+I{1,2})?:\s*/, '');
}

function sourceAt(s: OldSchool, index: number): string {
  const src = s.sources.policy[index];
  if (!src) throw new Error(`${s.id}: no sources.policy[${index}]`);
  return src.url;
}

type Entry = {
  fromEntryYear: number;
  domestic: PolicyValue;
  international: PolicyValue;
  source: string | null;
  note?: string;
};

const reviewRows: string[] = [];

const converted = raw.map((s) => {
  const plan = policyHistory[s.id];
  const current: Entry = {
    fromEntryYear: FIRST_ENTRY_YEAR,
    domestic: s.testPolicy.domestic,
    international: s.testPolicy.international,
    source: sourceAt(s, plan?.currentSourceIndex ?? 0),
    ...(plan?.currentNote ? { note: plan.currentNote } : {}),
  };
  const later: Entry[] = (plan?.later ?? []).map((e) => ({
    fromEntryYear: e.fromEntryYear,
    domestic: e.policy,
    international: e.international ?? e.policy,
    source: e.sourceIndex === null ? null : sourceAt(s, e.sourceIndex),
    ...(e.note ? { note: e.note } : {}),
  }));
  const testPolicy = [current, ...later].sort((a, b) => a.fromEntryYear - b.fromEntryYear);

  const fmt = (e: Entry) =>
    e.domestic === e.international ? e.domestic : `D ${e.domestic} / I ${e.international}`;
  reviewRows.push(
    `| ${s.name} | ${fmt(current)} | ${
      later.length ? later.map((e) => `**${e.fromEntryYear}: ${fmt(e)}**`).join('<br>') : 'none (open-ended)'
    } | ${(plan?.basis ?? (s.recentChange ? s.recentChange : '`recentChange` is null')).replace(/\|/g, '\\|')} | ${
      plan?.flag ? `⚠ ${plan.flag}` : current.domestic !== current.international ? 'Domestic and international differ' : '—'
    } |`,
  );

  const {
    testPolicy: oldPolicy,
    superscoreQuote,
    scoreSendingQuote,
    recentChange,
    notes,
    dataYear,
    deadlines,
    ...rest
  } = s;

  return {
    id: rest.id,
    name: rest.name,
    category: rest['category'],
    usNewsRank2027: rest['usNewsRank2027'],
    admissions: rest['admissions'],
    sat: rest['sat'],
    pctSubmittingSAT: rest['pctSubmittingSAT'],
    dataYear: normalizeDataYear(dataYear),
    entryTerm: rest['entryTerm'],
    testPolicy,
    superscore: rest['superscore'],
    scoreSending: rest['scoreSending'],
    selfReporting: rest['selfReporting'],
    deadlines: {
      ED: deadlines.ED === null ? null : deadlines.ED.map(stripEdLabel),
      EA: deadlines.EA,
      eaType: deadlines.eaType,
      RD: deadlines.RD,
    },
    sources: rest.sources,
    status: rest['status'],
    verified: rest['verified'],
    meta: {
      policyCycle: oldPolicy.cycle,
      recentChange,
      superscoreQuote,
      scoreSendingQuote,
      notes,
    },
  };
});

// Every original key must survive somewhere in the new record.
const kept = new Set([...Object.keys(converted[0]!), 'superscoreQuote', 'scoreSendingQuote', 'recentChange', 'notes']);
for (const s of raw) {
  for (const k of Object.keys(s)) if (!kept.has(k)) throw new Error(`${s.id}: field "${k}" would be dropped`);
}

writeFileSync(SCHOOLS, JSON.stringify(converted, null, 2) + '\n');

const review = `# Test-policy conversion review

Generated by \`scripts/convert-schools.ts\` from \`scripts/policy-history.ts\` (Milestone 1).
Entry year = fall entry (2027 = applying in the 2026-27 cycle). D = domestic, I = international.
"Open-ended" means the fall 2027 entry applies to later years until a change is announced;
the UI shows it as "policy as published for the fall 2027 cycle". \`not-announced\` means the
school's announced policy ends before that year.

| School | Fall 2027 | Added entries | Based on | Flag |
| --- | --- | --- | --- | --- |
${reviewRows.join('\n')}
`;
writeFileSync(REVIEW, review);

console.log(`Converted ${converted.length} schools. Review table: ${REVIEW}`);
