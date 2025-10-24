import { periodLabel } from '../lib/matchUtils'; // Si la tienes ahí. Si no, copia la función a un helper.

describe('periodLabel', () => {
  it('1T antes del medio', () => expect(periodLabel(10, 90, false)).toBe('1T'));
  it('2T después del medio', () => expect(periodLabel(60, 90, false)).toBe('2T'));
  it('ET1 con alargue', () => expect(periodLabel(95, 90, true)).toBe('ET1'));
  it('ET2 con alargue', () => expect(periodLabel(110, 90, true)).toBe('ET2'));
  it('FT al final', () => expect(periodLabel(120, 90, true)).toBe('FT'));
});