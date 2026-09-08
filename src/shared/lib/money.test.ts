import { describe, expect, it } from 'vitest';

import { formatMinorMoney } from './money';

describe('minor-unit money formatting', () => {
  it('formats integer minor units without component-side arithmetic', () => {
    expect(formatMinorMoney(89000)).toBe('890');
    expect(formatMinorMoney(219000)).toMatch(/2\s190/);
  });

  it('rejects negative, fractional and unsafe values', () => {
    expect(() => formatMinorMoney(-1)).toThrow(RangeError);
    expect(() => formatMinorMoney(10.5)).toThrow(RangeError);
    expect(() => formatMinorMoney(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });
});
