// Firestore security rules, tested against the emulator (npm run test:rules).
// App Check is enforced in the Firebase console and can't be tested here.
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const PROJECT = 'demo-sat-retake-advisor';
const ID = '3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b';
const OTHER_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const now = () => firebase.firestore.FieldValue.serverTimestamp();
const inc = (n: number) => firebase.firestore.FieldValue.increment(n);

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
afterAll(async () => env?.cleanup());
beforeEach(async () => env.clearFirestore());

const db = () => env.unauthenticatedContext().firestore();

function submission(overrides: Record<string, unknown> = {}) {
  return {
    anonId: ID,
    total: 1450,
    rw: 700,
    math: 750,
    attempts: 2,
    grade: '11',
    entryYear: 2028,
    applicantType: 'international',
    country: 'NP',
    round: 'RD',
    schools: ['mit', 'columbia', 'duke'],
    updatedAt: now(),
    ...overrides,
  };
}

function report(overrides: Record<string, unknown> = {}) {
  return {
    schoolId: 'mit',
    field: 'Admit rate',
    correctValue: '4.5%',
    sourceUrl: 'https://ir.mit.edu/cds',
    createdAt: now(),
    ...overrides,
  };
}

async function seed(path: string, data: Record<string, unknown>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(path).set(data);
  });
}

describe('submissions', () => {
  const ref = (id = ID) => db().collection('submissions').doc(id);

  it('allows creating and updating your own anonymous record', async () => {
    await assertSucceeds(ref().set(submission()));
    await assertSucceeds(ref().set(submission({ total: 1500, rw: 740, math: 760, attempts: 3 })));
  });

  it('accepts the scale edges and the largest allowed lists', async () => {
    await assertSucceeds(ref().set(submission({ total: 400, rw: 200, math: 200, attempts: 6 })));
    const fifteen = ['mit', 'princeton', 'harvard', 'yale', 'caltech', 'stanford', 'penn', 'duke', 'jhu',
      'northwestern', 'uchicago', 'columbia', 'dartmouth', 'cmu', 'cornell'];
    await assertSucceeds(ref().set(submission({ schools: fifteen })));
  });

  it('rejects a document id that is not the record anonId, or not a UUID', async () => {
    await assertFails(ref(OTHER_ID).set(submission()));
    await assertFails(ref('not-a-uuid').set(submission({ anonId: 'not-a-uuid' })));
  });

  it('rejects extra or missing fields (no names, emails or free text)', async () => {
    await assertFails(ref().set(submission({ name: 'Someone' })));
    await assertFails(ref().set(submission({ email: 'a@b.c' })));
    const { country: _c, ...missing } = submission();
    await assertFails(ref().set(missing));
  });

  it('rejects scores off the scale, off-step, or not adding up', async () => {
    await assertFails(ref().set(submission({ total: 1460 })));
    await assertFails(ref().set(submission({ total: 1605, rw: 805, math: 800 })));
    await assertFails(ref().set(submission({ total: 405, rw: 205, math: 200 })));
    await assertFails(ref().set(submission({ total: 1465, rw: 715, math: 750 })));
    await assertFails(ref().set(submission({ total: '1450' })));
  });

  it('rejects bad attempts and enum values', async () => {
    await assertFails(ref().set(submission({ attempts: 0 })));
    await assertFails(ref().set(submission({ attempts: 7 })));
    await assertFails(ref().set(submission({ grade: '8' })));
    await assertFails(ref().set(submission({ entryYear: 2030 })));
    await assertFails(ref().set(submission({ applicantType: 'other' })));
    await assertFails(ref().set(submission({ round: 'REA' })));
    await assertFails(ref().set(submission({ country: 'np' })));
    await assertFails(ref().set(submission({ country: 'Nepal' })));
  });

  it('rejects unknown, duplicate, too few or too many schools', async () => {
    await assertFails(ref().set(submission({ schools: ['mit', 'nowhere-u'] })));
    await assertFails(ref().set(submission({ schools: ['mit', 'mit'] })));
    await assertFails(ref().set(submission({ schools: [] })));
    const sixteen = ['mit', 'princeton', 'harvard', 'yale', 'caltech', 'stanford', 'penn', 'duke', 'jhu',
      'northwestern', 'uchicago', 'columbia', 'dartmouth', 'cmu', 'cornell', 'vanderbilt'];
    await assertFails(ref().set(submission({ schools: sixteen })));
  });

  it('rejects a timestamp set by the client', async () => {
    await assertFails(ref().set(submission({ updatedAt: new Date() })));
  });

  it('blocks reading, listing and deleting', async () => {
    await seed(`submissions/${ID}`, { anonId: ID });
    await assertFails(ref().get());
    await assertFails(db().collection('submissions').get());
    await assertFails(ref().delete());
  });
});

describe('errorReports', () => {
  const col = () => db().collection('errorReports');

  it('allows creating a valid report', async () => {
    await assertSucceeds(col().add(report()));
  });

  it('rejects bad links, lengths, fields, schools and extra keys', async () => {
    await assertFails(col().add(report({ sourceUrl: 'http://ir.mit.edu/cds' })));
    await assertFails(col().add(report({ sourceUrl: 'javascript:alert(1)' })));
    await assertFails(col().add(report({ sourceUrl: `https://x.edu/${'a'.repeat(300)}` })));
    await assertFails(col().add(report({ correctValue: '' })));
    await assertFails(col().add(report({ correctValue: 'x'.repeat(101) })));
    await assertFails(col().add(report({ field: 'Something else' })));
    await assertFails(col().add(report({ schoolId: 'nowhere-u' })));
    await assertFails(col().add(report({ email: 'a@b.c' })));
    await assertFails(col().add(report({ createdAt: new Date() })));
  });

  it('blocks reading, updating and deleting', async () => {
    await seed('errorReports/r1', { schoolId: 'mit' });
    await assertFails(col().doc('r1').get());
    await assertFails(col().get());
    await assertFails(col().doc('r1').update({ schoolId: 'yale' }));
    await assertFails(col().doc('r1').delete());
  });
});

describe('counters/helpClicks', () => {
  const ref = () => db().collection('counters').doc('helpClicks');

  it('starts at 1 and goes up by exactly 1 (the way the app writes it)', async () => {
    await assertSucceeds(ref().set({ count: inc(1), updatedAt: now() }, { merge: true }));
    await assertSucceeds(ref().set({ count: inc(1), updatedAt: now() }, { merge: true }));
  });

  it('rejects other starting values, jumps, resets and extra keys', async () => {
    await assertFails(ref().set({ count: 5, updatedAt: now() }));
    await seed('counters/helpClicks', { count: 10, updatedAt: new Date() });
    await assertFails(ref().set({ count: inc(2), updatedAt: now() }, { merge: true }));
    await assertFails(ref().set({ count: 0, updatedAt: now() }));
    await assertFails(ref().set({ count: inc(1), updatedAt: now(), note: 'x' }, { merge: true }));
    await assertFails(ref().set({ count: inc(1), updatedAt: new Date() }, { merge: true }));
  });

  it('only allows the helpClicks counter, and blocks reads and deletes', async () => {
    await assertFails(db().collection('counters').doc('other').set({ count: 1, updatedAt: now() }));
    await seed('counters/helpClicks', { count: 3, updatedAt: new Date() });
    await assertFails(ref().get());
    await assertFails(ref().delete());
  });
});

describe('counters/usage (public usage counter)', () => {
  const ref = () => db().collection('counters').doc('usage');
  const bump = (students: number) => ({ checks: inc(1), students: inc(students), updatedAt: now() });

  it('starts at 1 check, with 0 or 1 student', async () => {
    await assertSucceeds(ref().set(bump(1), { merge: true }));
    await env.clearFirestore();
    await assertSucceeds(ref().set(bump(0), { merge: true }));
  });

  it('adds 1 check each time, and 0 or 1 student', async () => {
    await assertSucceeds(ref().set(bump(1), { merge: true }));
    await assertSucceeds(ref().set(bump(0), { merge: true }));
    await assertSucceeds(ref().set(bump(1), { merge: true }));
  });

  it('rejects jumps, decreases, resets, extra keys and client timestamps', async () => {
    await seed('counters/usage', { checks: 50, students: 20, updatedAt: new Date() });
    await assertFails(ref().set({ checks: inc(2), students: inc(0), updatedAt: now() }, { merge: true }));
    await assertFails(ref().set({ checks: inc(1), students: inc(2), updatedAt: now() }, { merge: true }));
    await assertFails(ref().set({ checks: inc(1), students: inc(-1), updatedAt: now() }, { merge: true }));
    await assertFails(ref().set({ checks: 0, students: 0, updatedAt: now() }));
    await assertFails(ref().set({ ...bump(0), note: 'x' }, { merge: true }));
    await assertFails(ref().set({ checks: inc(1), students: inc(0), updatedAt: new Date() }, { merge: true }));
    await assertFails(ref().delete());
  });

  it('is readable by anyone, but the counters collection cannot be listed', async () => {
    await seed('counters/usage', { checks: 120, students: 80, updatedAt: new Date() });
    await assertSucceeds(ref().get());
    await assertFails(db().collection('counters').get());
  });
});

describe('everything else', () => {
  it('no longer exposes stats/summary (group statistics were dropped)', async () => {
    await seed('stats/summary', { totalChecks: 0 });
    await assertFails(db().doc('stats/summary').get());
    await assertFails(db().doc('stats/summary').set({ totalChecks: 99 }));
  });

  it('denies unknown collections', async () => {
    await assertFails(db().collection('anything').doc('x').set({ a: 1 }));
    await assertFails(db().collection('anything').get());
  });
});
