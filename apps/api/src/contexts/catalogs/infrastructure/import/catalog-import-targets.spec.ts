import {
  CatalogImportUseCaseSet,
  buildCatalogImportTargets,
} from './catalog-import-targets';

// Adaptadores de destino com validação real (DTO + entidade) e casos de uso
// mockados: garante que a prévia reprova o que o cadastro manual reprovaria.
function useCaseSet(): jest.Mocked<
  Record<keyof CatalogImportUseCaseSet, { list: jest.Mock; create: jest.Mock }>
> {
  const mock = () => ({
    list: jest.fn().mockResolvedValue([{ code: 'EXISTENTE' }]),
    create: jest.fn().mockResolvedValue({}),
  });
  return {
    conductorCables: mock(),
    groundWires: mock(),
    guyWires: mock(),
    insulators: mock(),
    soilTypes: mock(),
    laborRoles: mock(),
    equipment: mock(),
    fixedCosts: mock(),
  };
}

describe('buildCatalogImportTargets', () => {
  it('lista os códigos existentes pelo caso de uso do catálogo', async () => {
    const set = useCaseSet();
    const targets = buildCatalogImportTargets(
      set as unknown as CatalogImportUseCaseSet,
    );
    await expect(targets.insulators.listCodes()).resolves.toEqual([
      'EXISTENTE',
    ]);
    expect(set.insulators.list).toHaveBeenCalled();
  });

  it('cria pelo caso de uso existente com a vigência da importação e o autor', async () => {
    const set = useCaseSet();
    const targets = buildCatalogImportTargets(
      set as unknown as CatalogImportUseCaseSet,
    );
    await targets['fixed-costs'].create(
      { code: 'EPI-01', description: 'Capacete', category: 'EPI' },
      '2026-01-01',
      'maria',
    );
    expect(set.fixedCosts.create).toHaveBeenCalledWith(
      {
        code: 'EPI-01',
        description: 'Capacete',
        category: 'EPI',
        effectiveFrom: '2026-01-01',
      },
      'maria',
    );
  });

  it('valida pelo DTO do cadastro, com as mensagens em português', async () => {
    const targets = buildCatalogImportTargets(
      useCaseSet() as unknown as CatalogImportUseCaseSet,
    );
    await expect(
      targets['labor-roles'].validate({ code: 'ELE' }),
    ).resolves.toEqual([
      'O nome do cargo deve ter no máximo 100 caracteres',
      'O nome do cargo é obrigatório',
      'O nome do cargo deve ser um texto',
    ]);
    await expect(
      targets['labor-roles'].validate({ code: 'ELE', name: 'Eletricista' }),
    ).resolves.toEqual([]);
  });

  it('regra entre campos do DTO vale na importação (faixa de NSPT invertida)', async () => {
    const targets = buildCatalogImportTargets(
      useCaseSet() as unknown as CatalogImportUseCaseSet,
    );
    await expect(
      targets['soil-types'].validate({ code: 'S1', nsptMin: 10, nsptMax: 5 }),
    ).resolves.toEqual(['O NSPT mínimo deve ser menor que o NSPT máximo']);
  });

  it('cabo de guarda STEEL com campo de OPGW é reprovado pela regra da entidade', async () => {
    const targets = buildCatalogImportTargets(
      useCaseSet() as unknown as CatalogImportUseCaseSet,
    );
    await expect(
      targets['ground-wires'].validate({
        code: 'CG-1',
        type: 'STEEL',
        fiberCount: 24,
      }),
    ).resolves.toEqual([
      'Os campos a seguir não se aplicam ao tipo aço (cabo de guarda padrão): número de fibras',
    ]);
    await expect(
      targets['ground-wires'].validate({
        code: 'OPGW-1',
        type: 'OPGW',
        fiberCount: 24,
        manufacturer: 'FURUKAWA',
      }),
    ).resolves.toEqual([]);
  });

  it('chave fora do DTO é descartada como no ValidationPipe (whitelist), sem erro', async () => {
    const targets = buildCatalogImportTargets(
      useCaseSet() as unknown as CatalogImportUseCaseSet,
    );
    await expect(
      targets['conductor-cables'].validate({ code: 'C1', createdBy: 'x' }),
    ).resolves.toEqual([]);
  });
});
