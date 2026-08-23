import { Identificador } from './dominio';

describe('dominio', () => {
  it('exporta o contrato placeholder Identificador', () => {
    const id: Identificador = 'oferta-001';
    expect(typeof id).toBe('string');
  });
});
