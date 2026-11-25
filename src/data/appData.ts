// Data as the browser loads it. Shapes are checked by `npm run check:data` before every
// build, so these casts only restore the literal types JSON imports lose.
import type { AppSchool, SatDatesFile } from './schema';
import schoolsJson from './generated/schools.app.json';
import satDatesJson from '../../data/sat-dates.json';

export const schools = schoolsJson as unknown as AppSchool[];
export const satDates = satDatesJson as unknown as SatDatesFile;
export const schoolIds: ReadonlySet<string> = new Set(schools.map((s) => s.id));
export const schoolById: ReadonlyMap<string, AppSchool> = new Map(schools.map((s) => [s.id, s]));
