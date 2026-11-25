import { describe, expect, it } from 'vitest';
import { allSittings, bestSitting, scoreForSchool, superscore } from './superscore';
import { makeInput } from './fixtures';

const sittings = [
  { rw: 700, math: 720 }, // 1420 (latest)
  { rw: 740, math: 680 }, // 1420
  { rw: 690, math: 760 }, // 1450
];

describe('superscore', () => {
  it('combines the best R&W and best Math across sittings', () => {
    expect(superscore(sittings)).toEqual({ total: 1500, rw: 740, math: 760, basis: 'superscore' });
  });

  it('with one sitting equals that sitting', () => {
    expect(superscore([{ rw: 600, math: 650 }])).toEqual({ total: 1250, rw: 600, math: 650, basis: 'superscore' });
  });

  it('throws on no sittings', () => {
    expect(() => superscore([])).toThrow();
    expect(() => bestSitting([])).toThrow();
  });
});

describe('bestSitting', () => {
  it('picks the highest total', () => {
    expect(bestSitting(sittings)).toEqual({ total: 1450, rw: 690, math: 760, basis: 'best-sitting' });
  });

  it('breaks a tie on total by the higher Math score', () => {
    expect(bestSitting(sittings.slice(0, 2))).toMatchObject({ rw: 700, math: 720 });
    expect(bestSitting([{ rw: 740, math: 680 }, { rw: 700, math: 720 }])).toMatchObject({ math: 720 });
  });

  it('keeps the first (latest) sitting on an exact tie', () => {
    const r = bestSitting([{ rw: 700, math: 700, testMonth: 'a' }, { rw: 700, math: 700, testMonth: 'b' }]);
    expect(r.total).toBe(1400);
  });
});

describe('scoreForSchool', () => {
  it('uses the superscore only when the school superscores', () => {
    expect(scoreForSchool({ superscore: 'yes' }, sittings).total).toBe(1500);
    expect(scoreForSchool({ superscore: 'no' }, sittings).total).toBe(1450);
    expect(scoreForSchool({ superscore: 'not stated' }, sittings).total).toBe(1450);
    expect(scoreForSchool({ superscore: 'n/a' }, sittings).basis).toBe('best-sitting');
  });
});

describe('allSittings', () => {
  it('puts the latest score first, then past attempts', () => {
    const input = makeInput({ pastAttempts: [{ rw: 650, math: 690, testMonth: '2026-05' }] });
    expect(allSittings(input)).toEqual([{ rw: 700, math: 720 }, { rw: 650, math: 690, testMonth: '2026-05' }]);
  });
});
