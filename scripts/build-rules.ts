// Builds firestore.rules from firestore.rules.template, filling in values from the data
// and the app's own constants so the rules can never drift from them.
// Usage: npm run rules:build            (writes firestore.rules)
//        npx tsx scripts/build-rules.ts --check   (exits 1 if firestore.rules is out of date)
import { readFileSync, writeFileSync } from 'node:fs';
import {
  APPLICANT_TYPES,
  ENTRY_YEARS,
  GRADES,
  MAX_PAST_ATTEMPTS,
  MAX_SCHOOLS,
  ROUNDS,
} from '../src/logic/types';
import { ERROR_FIELDS, MAX_URL, MAX_VALUE } from '../src/logic/errorReport';

export function renderRules(): string {
  const template = readFileSync('firestore.rules.template', 'utf8');
  const schools = JSON.parse(readFileSync('data/schools.json', 'utf8')) as { id: string }[];
  const list = (values: readonly (string | number)[]) =>
    `[${values.map((v) => (typeof v === 'number' ? String(v) : `'${v}'`)).join(', ')}]`;

  const values: Record<string, string> = {
    __SCHOOL_IDS__: list(schools.map((s) => s.id)),
    __GRADES__: list(GRADES),
    __ENTRY_YEARS__: list(ENTRY_YEARS),
    __APPLICANT_TYPES__: list(APPLICANT_TYPES),
    __ROUNDS__: list(ROUNDS),
    __ERROR_FIELDS__: list(ERROR_FIELDS),
    __MAX_SITTINGS__: String(MAX_PAST_ATTEMPTS + 1),
    __MAX_SCHOOLS__: String(MAX_SCHOOLS),
    __MAX_VALUE__: String(MAX_VALUE),
    __MAX_URL__: String(MAX_URL),
  };
  for (const v of [...schools.map((s) => s.id), ...GRADES, ...APPLICANT_TYPES, ...ROUNDS, ...ERROR_FIELDS]) {
    if (/['\\]/.test(v)) throw new Error(`Value can't be put in a rules string: ${v}`);
  }

  let out = template.replace(
    '// TEMPLATE for firestore.rules. Do not edit firestore.rules by hand:',
    '// GENERATED from firestore.rules.template. Do not edit by hand:',
  );
  for (const [key, value] of Object.entries(values)) out = out.replaceAll(key, value);
  const left = out.match(/__[A-Z_]+__/g);
  if (left) throw new Error(`Unfilled placeholders: ${left.join(', ')}`);
  return out;
}

const isMain = process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/build-rules.ts');
if (isMain) {
  const rules = renderRules();
  if (process.argv.includes('--check')) {
    const current = readFileSync('firestore.rules', 'utf8');
    if (current !== rules) {
      console.error('firestore.rules is out of date. Run `npm run rules:build`.');
      process.exit(1);
    }
    console.log('firestore.rules is up to date.');
  } else {
    writeFileSync('firestore.rules', rules);
    console.log('Wrote firestore.rules');
  }
}
