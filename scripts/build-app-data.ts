// Writes src/data/generated/schools.app.json: data/schools.json without the `meta`
// evidence fields, which reviewers need but the app never shows (34.6 KB -> 10.3 KB gzipped).
// Runs before dev, build and test. The output is gitignored; data/schools.json stays the source.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const schools = JSON.parse(readFileSync('data/schools.json', 'utf8')) as Record<string, unknown>[];
const app = schools.map(({ meta: _meta, ...rest }) => rest);
mkdirSync('src/data/generated', { recursive: true });
writeFileSync('src/data/generated/schools.app.json', JSON.stringify(app));
console.log(`App data: ${app.length} schools -> src/data/generated/schools.app.json`);
