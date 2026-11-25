import {
  APPLICANT_TYPES,
  ENTRY_YEARS,
  GRADES,
  MAX_PAST_ATTEMPTS,
  MAX_SCHOOLS,
  ROUNDS,
  type FieldError,
  type StudentInput,
} from './types';

function scoreError(value: unknown, min: number, max: number, label: string): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return `Enter your ${label} score.`;
  if (!Number.isInteger(value) || value % 10 !== 0) return `${label} scores go up in steps of 10.`;
  if (value < min || value > max) return `${label} must be between ${min} and ${max}.`;
  return null;
}

/**
 * Validates the form input (FR-1, FR-2). Returns an empty list when valid.
 * `today` is "YYYY-MM-DD"; past attempts can't be in a later month.
 */
export function validateInput(
  input: StudentInput,
  knownSchoolIds: ReadonlySet<string>,
  today: string,
): FieldError[] {
  const errors: FieldError[] = [];
  const add = (field: string, message: string | null) => {
    if (message) errors.push({ field, message });
  };

  const { total, rw, math } = input.latest;
  add('latest.total', scoreError(total, 400, 1600, 'Total'));
  add('latest.rw', scoreError(rw, 200, 800, 'Reading and Writing'));
  add('latest.math', scoreError(math, 200, 800, 'Math'));
  if (!errors.length && total !== rw + math) {
    add('latest.total', `Total must equal Reading and Writing + Math (${rw + math}).`);
  }

  if (input.pastAttempts.length > MAX_PAST_ATTEMPTS) {
    add('pastAttempts', `You can add up to ${MAX_PAST_ATTEMPTS} past attempts.`);
  }
  const thisMonth = today.slice(0, 7);
  input.pastAttempts.forEach((a, i) => {
    add(`pastAttempts.${i}.rw`, scoreError(a.rw, 200, 800, 'Reading and Writing'));
    add(`pastAttempts.${i}.math`, scoreError(a.math, 200, 800, 'Math'));
    if (!a.testMonth || !/^\d{4}-(0[1-9]|1[0-2])$/.test(a.testMonth)) {
      add(`pastAttempts.${i}.testMonth`, 'Choose the month you took this test.');
    } else if (a.testMonth > thisMonth) {
      add(`pastAttempts.${i}.testMonth`, 'A past attempt cannot be in a future month.');
    }
  });

  if (!GRADES.includes(input.grade)) add('grade', 'Choose your current grade.');
  if (!ENTRY_YEARS.includes(input.entryYear)) add('entryYear', 'Choose your entry year.');
  if (!APPLICANT_TYPES.includes(input.applicantType)) add('applicantType', 'Choose domestic or international.');
  if (!ROUNDS.includes(input.round)) add('round', 'Choose an application round.');
  if (!/^[A-Z]{2}$/.test(input.country)) add('country', 'Choose your country.');

  const ids = input.schoolIds;
  if (ids.length === 0) add('schoolIds', 'Choose at least one school.');
  else if (ids.length > MAX_SCHOOLS) add('schoolIds', `Choose up to ${MAX_SCHOOLS} schools.`);
  else if (new Set(ids).size !== ids.length) add('schoolIds', 'Each school can be chosen only once.');
  else if (ids.some((id) => !knownSchoolIds.has(id))) add('schoolIds', 'One of the chosen schools is not in our list.');

  return errors;
}
