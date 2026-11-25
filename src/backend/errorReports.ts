import type { ErrorReportDraft } from '../logic/errorReport';
import { firestoreLite, getDb } from './firebase';

export function toErrorReportRecord(schoolId: string, d: ErrorReportDraft) {
  return { schoolId, field: d.field, correctValue: d.correctValue.trim(), sourceUrl: d.sourceUrl.trim() };
}

/** Stores one error report (create-only). Throws on failure so the dialog can say so. */
export async function sendErrorReport(schoolId: string, draft: ErrorReportDraft): Promise<void> {
  const [db, { addDoc, collection, serverTimestamp }] = await Promise.all([getDb(), firestoreLite()]);
  await addDoc(collection(db, 'errorReports'), { ...toErrorReportRecord(schoolId, draft), createdAt: serverTimestamp() });
}
