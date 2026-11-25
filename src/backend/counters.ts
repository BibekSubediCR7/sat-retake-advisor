import { firestoreLite, getDb } from './firebase';

/** Adds 1 to the anonymous "Get help" click counter. Callers ignore failures. */
export async function countHelpClick(): Promise<void> {
  const [db, { doc, setDoc, increment, serverTimestamp }] = await Promise.all([getDb(), firestoreLite()]);
  await setDoc(doc(db, 'counters', 'helpClicks'), { count: increment(1), updatedAt: serverTimestamp() }, { merge: true });
}
