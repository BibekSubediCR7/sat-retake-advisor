// Public usage counter (counters/usage): "2,418 score checks · 1,530 students".
// Every check adds 1 to `checks`; a browser's first check also adds 1 to `students`.
import { firestoreLite, getDb } from './firebase';

export interface Usage {
  checks: number;
  students: number;
}

const COUNTED_KEY = 'sra.counted';
const CACHE_KEY = 'sra.usage';
/** How long a visitor reuses the last count before asking Firestore again. */
export const USAGE_CACHE_MS = 6 * 60 * 60 * 1000;

type KV = Pick<Storage, 'getItem' | 'setItem'>;

function storage(): KV | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function safeGet(s: KV | null, key: string): string | null {
  try {
    return s?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeSet(s: KV | null, key: string, value: string): void {
  try {
    s?.setItem(key, value);
  } catch {
    // private mode or blocked storage: nothing to keep
  }
}

/** Adds this check to the counter. The browser is counted as a new student only once. */
export async function countCheck(s: KV | null = storage()): Promise<void> {
  const newStudent = safeGet(s, COUNTED_KEY) !== '1';
  const [db, { doc, setDoc, increment, serverTimestamp }] = await Promise.all([getDb(), firestoreLite()]);
  await setDoc(
    doc(db, 'counters', 'usage'),
    { checks: increment(1), students: increment(newStudent ? 1 : 0), updatedAt: serverTimestamp() },
    { merge: true },
  );
  if (newStudent) safeSet(s, COUNTED_KEY, '1');
}

/** Last count cached in this browser, if still fresh. */
export function cachedUsage(now = Date.now(), s: KV | null = storage()): Usage | null {
  const raw = safeGet(s, CACHE_KEY);
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { checks?: unknown; students?: unknown; at?: unknown };
    if (typeof v.checks !== 'number' || typeof v.students !== 'number' || typeof v.at !== 'number') return null;
    if (now - v.at > USAGE_CACHE_MS) return null;
    return { checks: v.checks, students: v.students };
  } catch {
    return null;
  }
}

/** Reads the counter from Firestore and caches it. Null if it doesn't exist yet. */
export async function readUsage(now = Date.now(), s: KV | null = storage()): Promise<Usage | null> {
  const [db, { doc, getDoc }] = await Promise.all([getDb(), firestoreLite()]);
  const snap = await getDoc(doc(db, 'counters', 'usage'));
  const data = snap.data();
  if (!data || typeof data['checks'] !== 'number' || typeof data['students'] !== 'number') return null;
  const usage = { checks: data['checks'] as number, students: data['students'] as number };
  safeSet(s, CACHE_KEY, JSON.stringify({ ...usage, at: now }));
  return usage;
}
