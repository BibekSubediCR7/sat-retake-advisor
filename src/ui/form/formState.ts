import type { ApplicantType, EntryYear, Grade, Round, StudentInput } from '../../logic';

export interface AttemptDraft {
  key: number;
  rw: string;
  math: string;
  testMonth: string;
}

/** What the form holds: raw strings, so half-typed values survive editing. */
export interface FormState {
  total: string;
  rw: string;
  math: string;
  attempts: AttemptDraft[];
  grade: Grade | '';
  entryYear: `${EntryYear}` | '';
  applicantType: ApplicantType | '';
  country: string;
  round: Round | '';
  schoolIds: string[];
}

export const emptyForm: FormState = {
  total: '',
  rw: '',
  math: '',
  attempts: [],
  grade: '',
  entryYear: '',
  applicantType: '',
  country: '',
  round: '',
  schoolIds: [],
};

/** Empty or non-numeric text becomes NaN, which validateInput reports as "Enter your … score". */
function num(s: string): number {
  return s.trim() === '' ? Number.NaN : Number(s);
}

export function toStudentInput(f: FormState): StudentInput {
  return {
    latest: { total: num(f.total), rw: num(f.rw), math: num(f.math) },
    pastAttempts: f.attempts.map((a) => ({ rw: num(a.rw), math: num(a.math), testMonth: a.testMonth })),
    grade: f.grade as Grade,
    entryYear: Number(f.entryYear) as EntryYear,
    applicantType: f.applicantType as ApplicantType,
    country: f.country,
    round: f.round as Round,
    schoolIds: f.schoolIds,
  };
}
