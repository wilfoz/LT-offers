import { Identifier } from './identifier';

describe('domain', () => {
  it('exporta o contrato placeholder Identifier', () => {
    const id: Identifier = 'oferta-001';
    expect(typeof id).toBe('string');
  });
});
