// Data schema check. Fails (exit 1) if any record breaks a rule in src/data/schema.ts,
// e.g. a value without an official source URL or data year.
// Usage: npm run check:data   (add --quiet to hide warnings)

import { readFileSync } from 'node:fs';
import { checkSatDates, checkSchools, type DataIssue } from '../src/data/schema';

const quiet = process.argv.includes('--quiet');

function load(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const results: [string, { errors: DataIssue[]; warnings: DataIssue[] }][] = [
  ['data/schools.json', checkSchools(load('data/schools.json'))],
  ['data/sat-dates.json', checkSatDates(load('data/sat-dates.json'))],
];

let errorCount = 0;
for (const [file, { errors, warnings }] of results) {
  errorCount += errors.length;
  console.log(`${file}: ${errors.length} error(s), ${warnings.length} warning(s)`);
  for (const e of errors) console.log(`  ERROR  ${e.where}: ${e.message}`);
  if (!quiet) for (const w of warnings) console.log(`  warn   ${w.where}: ${w.message}`);
}

if (errorCount > 0) {
  console.error(`\nData check failed with ${errorCount} error(s).`);
  process.exit(1);
}
console.log('\nData check passed.');
