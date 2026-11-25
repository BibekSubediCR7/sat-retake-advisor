import type { StudentInput } from '../logic';
import { getAnonId } from './anonId';
import { firestoreLite, getDb } from './firebase';

/** The stored record (PRD "Submission record"), minus the server timestamp. No personal data. */
export function toSubmissionRecord(input: StudentInput, anonId: string) {
  return {
    anonId,
    total: input.latest.total,
    rw: input.latest.rw,
    math: input.latest.math,
    attempts: 1 + input.pastAttempts.length,
    grade: input.grade,
    entryYear: input.entryYear,
    applicantType: input.applicantType,
    country: input.country,
    round: input.round,
    schools: [...input.schoolIds],
  };
}

/** Saves (or overwrites) this browser's one anonymous record. Callers ignore failures. */
export async function saveSubmission(input: StudentInput): Promise<void> {
  const [db, { doc, setDoc, serverTimestamp }] = await Promise.all([getDb(), firestoreLite()]);
  const anonId = getAnonId();
  await setDoc(doc(db, 'submissions', anonId), { ...toSubmissionRecord(input, anonId), updatedAt: serverTimestamp() });
}
