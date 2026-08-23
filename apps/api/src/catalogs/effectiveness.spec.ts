import { pendingFields, resolveEffectiveVersion } from './effectiveness';

const version = (start: string) => ({ effectiveFrom: new Date(start) });

describe('resolveEffectiveVersion', () => {
  const versions = [
    version('2026-01-01'),
    version('2026-06-01'),
    version('2026-03-01'),
  ];

  it('retorna a versão com maior vigência menor ou igual à data de referência', () => {
    const effective = resolveEffectiveVersion(versions, new Date('2026-04-15'));
    expect(effective?.effectiveFrom).toEqual(new Date('2026-03-01'));
  });

  it('retorna a versão mais recente quando a data é posterior a todas', () => {
    const effective = resolveEffectiveVersion(versions, new Date('2026-12-31'));
    expect(effective?.effectiveFrom).toEqual(new Date('2026-06-01'));
  });

  it('retorna a versão vigente na data exata de início', () => {
    const effective = resolveEffectiveVersion(versions, new Date('2026-06-01'));
    expect(effective?.effectiveFrom).toEqual(new Date('2026-06-01'));
  });

  it('retorna indefinido para data anterior à primeira vigência', () => {
    expect(
      resolveEffectiveVersion(versions, new Date('2025-12-31')),
    ).toBeUndefined();
  });

  it('não modifica a lista de versões recebida', () => {
    const copy = [...versions];
    resolveEffectiveVersion(versions, new Date('2026-04-15'));
    expect(versions).toEqual(copy);
  });
});

describe('pendingFields', () => {
  const complete = {
    description: 'CAA 636 MCM',
    weightTonPerKm: '1.2',
    reelLengthM: '2000',
    diameterMm: '25.15',
    utsKn: '125.5',
  };

  it('retorna vazio quando todos os campos obrigatórios estão informados', () => {
    expect(pendingFields(complete)).toEqual([]);
  });

  it('aponta o campo não informado pelo rótulo em pt-BR', () => {
    expect(pendingFields({ ...complete, utsKn: null })).toEqual(['UTS (kN)']);
  });

  it('distingue não informado (null) de zero informado', () => {
    expect(pendingFields({ ...complete, weightTonPerKm: '0' })).toEqual([]);
  });

  it('trata descrição em branco como não informada', () => {
    expect(pendingFields({ ...complete, description: '   ' })).toEqual([
      'descrição',
    ]);
  });
});
