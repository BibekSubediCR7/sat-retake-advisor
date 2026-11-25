// One random id per browser, so a student's resubmissions update one record.
// Not linked to any personal data. Falls back to an in-memory id when storage is blocked.
const KEY = 'sra.anonId';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
let memoryId: string | null = null;

export function getAnonId(storage: Pick<Storage, 'getItem' | 'setItem'> | null = safeStorage()): string {
  try {
    const existing = storage?.getItem(KEY);
    if (existing && UUID.test(existing)) return existing;
  } catch {
    // storage blocked: fall through
  }
  const id = memoryId ?? crypto.randomUUID();
  memoryId = id;
  try {
    storage?.setItem(KEY, id);
  } catch {
    // private mode or blocked: keep the in-memory id for this visit
  }
  return id;
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Test helper. */
export function resetAnonIdForTests() {
  memoryId = null;
}
