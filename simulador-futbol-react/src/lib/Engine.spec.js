import { clamp } from '../lib/Engine.js';

describe('Engine utils', () => {
  it('clamp limita por abajo', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });
  it('clamp limita por arriba', () => {
    expect(clamp(50, 0, 10)).toBe(10);
  });
  it('clamp mantiene valores intermedios', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
});
