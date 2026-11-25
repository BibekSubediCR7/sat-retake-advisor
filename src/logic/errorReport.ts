// The short "report an error" form (FR-12). Shared by the dialog and the Firestore rules generator.

export const ERROR_FIELDS = [
  'Total score range',
  'Section score ranges',
  'Admit rate',
  'Test policy',
  'Superscore policy',
  'Score sending',
  'Deadline',
  'Other',
] as const;

export const MAX_VALUE = 100;
export const MAX_URL = 300;

export interface ErrorReportDraft {
  field: string;
  correctValue: string;
  sourceUrl: string;
}

/** Validates the short error-report form (FR-12). Returns field → message. */
export function validateErrorReport(d: ErrorReportDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!(ERROR_FIELDS as readonly string[]).includes(d.field)) errors['field'] = 'Choose which value is wrong.';
  const value = d.correctValue.trim();
  if (!value) errors['correctValue'] = 'Enter the correct value.';
  else if (value.length > MAX_VALUE) errors['correctValue'] = `Keep it under ${MAX_VALUE} characters.`;
  const url = d.sourceUrl.trim();
  if (!url) errors['sourceUrl'] = 'Add a link to the official source.';
  else if (url.length > MAX_URL) errors['sourceUrl'] = `Keep the link under ${MAX_URL} characters.`;
  else {
    try {
      const u = new URL(url);
      if (u.protocol !== 'https:') errors['sourceUrl'] = 'Use an https:// link.';
    } catch {
      errors['sourceUrl'] = 'Enter a full link starting with https://';
    }
  }
  return errors;
}
