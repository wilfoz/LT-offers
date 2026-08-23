import { camposPendentes, resolverVersaoVigente } from './vigencia';

const versao = (inicio: string) => ({ vigenciaInicio: new Date(inicio) });

describe('resolverVersaoVigente', () => {
  const versoes = [
    versao('2026-01-01'),
    versao('2026-06-01'),
    versao('2026-03-01'),
  ];

  it('retorna a versão com maior vigência menor ou igual à data de referência', () => {
    const vigente = resolverVersaoVigente(versoes, new Date('2026-04-15'));
    expect(vigente?.vigenciaInicio).toEqual(new Date('2026-03-01'));
  });

  it('retorna a versão mais recente quando a data é posterior a todas', () => {
    const vigente = resolverVersaoVigente(versoes, new Date('2026-12-31'));
    expect(vigente?.vigenciaInicio).toEqual(new Date('2026-06-01'));
  });

  it('retorna a versão vigente na data exata de início', () => {
    const vigente = resolverVersaoVigente(versoes, new Date('2026-06-01'));
    expect(vigente?.vigenciaInicio).toEqual(new Date('2026-06-01'));
  });

  it('retorna indefinido para data anterior à primeira vigência', () => {
    expect(resolverVersaoVigente(versoes, new Date('2025-12-31'))).toBeUndefined();
  });

  it('não modifica a lista de versões recebida', () => {
    const copia = [...versoes];
    resolverVersaoVigente(versoes, new Date('2026-04-15'));
    expect(versoes).toEqual(copia);
  });
});

describe('camposPendentes', () => {
  const completa = {
    descricao: 'CAA 636 MCM',
    pesoTonKm: '1.2',
    bobinaM: '2000',
    diametroMm: '25.15',
    utsKn: '125.5',
  };

  it('retorna vazio quando todos os campos obrigatórios estão informados', () => {
    expect(camposPendentes(completa)).toEqual([]);
  });

  it('aponta o campo não informado pelo rótulo', () => {
    expect(camposPendentes({ ...completa, utsKn: null })).toEqual(['UTS (kN)']);
  });

  it('distingue não informado (null) de zero informado', () => {
    expect(camposPendentes({ ...completa, pesoTonKm: '0' })).toEqual([]);
  });

  it('trata descrição em branco como não informada', () => {
    expect(camposPendentes({ ...completa, descricao: '   ' })).toEqual([
      'descrição',
    ]);
  });
});
