import { describe, expect, it } from 'vitest';
import { colors } from './tokens';
import { contrastRatio } from './contrast';

const textColors = ['ink', 'inkSoft', 'inkMuted', 'sealRed', 'stampGreen', 'stampAmber'] as const;
const backgrounds = ['paper', 'paperLight'] as const;

describe('text colour contrast (WCAG AA, 4.5:1)', () => {
  for (const fg of textColors) {
    for (const bg of backgrounds) {
      it(`${fg} on ${bg}`, () => {
        expect(contrastRatio(colors[fg], colors[bg])).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
