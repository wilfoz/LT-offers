import { test, expect } from '@playwright/test';
import { CatalogPage } from '../pages/catalog.page';

test.describe('Jornada 1: Catálogos e Vigência Temporal de Versões (RNF-05, RNF-14)', () => {
  let catalogPage: CatalogPage;

  test.beforeEach(async ({ page }) => {
    catalogPage = new CatalogPage(page);
  });

  test('deve listar catálogo de cabos condutores com cabeçalho e estrutura de dados vigentes', async ({
    page,
  }) => {
    // Mock da API para listagem rápida e determinística
    await catalogPage.mockJson('/api/catalogs/conductor-cables*', [
      {
        id: 1,
        code: 'GROSBEAK',
        status: 'ACTIVE',
        effectiveVersion: {
          id: 101,
          description: 'Cabo Condutor ACSR Grosbeak 636 kcmil',
          weightTonPerKm: '1.304',
          reelLengthM: '2000',
          diameterMm: '25.15',
          utsKn: '112.5',
          effectiveFrom: '2026-01-01',
          effectiveTo: null,
          createdBy: 'engenharia@epc.com',
          createdAt: new Date().toISOString(),
        },
        pendingFields: [],
      },
      {
        id: 2,
        code: 'RAIL-INCOMPLETO',
        status: 'ACTIVE',
        effectiveVersion: {
          id: 102,
          description: 'Cabo Condutor ACSR Rail 954 kcmil',
          weightTonPerKm: null,
          reelLengthM: null,
          diameterMm: '29.59',
          utsKn: null,
          effectiveFrom: '2026-01-01',
          effectiveTo: null,
          createdBy: 'engenharia@epc.com',
          createdAt: new Date().toISOString(),
        },
        pendingFields: ['weightTonPerKm', 'utsKn'],
      },
    ]);

    await catalogPage.gotoConductorCables();

    // Valida título da seção
    await expect(
      page.getByRole('heading', { name: /catálogo de cabos condutores/i }),
    ).toBeVisible();

    // Valida exibição do item completo
    const rowGrosbeak = catalogPage.getTableRowByCode('GROSBEAK');
    await expect(rowGrosbeak).toBeVisible();
    await expect(rowGrosbeak).toContainText('1.304');
    await expect(rowGrosbeak).toContainText('Completo');

    // Valida sinalização de pendência sem converter para zero (RNF-09)
    const rowRail = catalogPage.getTableRowByCode('RAIL-INCOMPLETO');
    await expect(rowRail).toBeVisible();
    await expect(rowRail).toContainText('Pendente:');
    await expect(rowRail).toContainText('weightTonPerKm');
  });

  test('deve criar novo cabo condutor com parâmetros técnicos completos', async ({
    page,
  }) => {
    await catalogPage.mockJson('/api/catalogs/conductor-cables*', []);
    await catalogPage.mockJson('/api/catalogs/conductor-cables', {
      id: 3,
      code: 'DRAKE',
      status: 'ACTIVE',
    });

    await catalogPage.gotoConductorCables();
    await catalogPage.clickNewConductorCable();

    // Preenche formulário
    await catalogPage.fillConductorCableForm({
      code: 'DRAKE',
      description: 'Cabo ACSR Drake 795 kcmil',
      weightTonPerKm: '1.628',
      reelLengthM: '1800',
      diameterMm: '28.14',
      utsKn: '140.0',
      effectiveFrom: '2026-06-01',
    });

    // Mock para retorno à listagem após salvar
    await catalogPage.mockJson('/api/catalogs/conductor-cables*', [
      {
        id: 3,
        code: 'DRAKE',
        status: 'ACTIVE',
        effectiveVersion: {
          id: 103,
          description: 'Cabo ACSR Drake 795 kcmil',
          weightTonPerKm: '1.628',
          reelLengthM: '1800',
          diameterMm: '28.14',
          utsKn: '140.0',
          effectiveFrom: '2026-06-01',
          effectiveTo: null,
          createdBy: 'admin@epc.com',
          createdAt: new Date().toISOString(),
        },
        pendingFields: [],
      },
    ]);

    await catalogPage.submitForm();
    await catalogPage.expectSnackbar(/salvo|sucesso/i);
  });

  test('deve consultar histórico de versões e assegurar imutabilidade temporal (RNF-05)', async ({
    page,
  }) => {
    // Mock do histórico com 2 versões temporais distintas
    await catalogPage.mockJson('/api/catalogs/conductor-cables/1/history', {
      id: 1,
      code: 'GROSBEAK',
      versions: [
        {
          id: 102,
          description: 'Cabo Grosbeak - Revisão de Fornecedor 2026-Q4',
          weightTonPerKm: '1.310',
          reelLengthM: '2200',
          diameterMm: '25.15',
          utsKn: '115.0',
          effectiveFrom: '2026-10-01T00:00:00.000Z',
          effectiveTo: null,
          createdBy: 'orçamentista@epc.com',
          createdAt: '2026-09-01T10:00:00.000Z',
        },
        {
          id: 101,
          description: 'Cabo Grosbeak - Versão Base Original',
          weightTonPerKm: '1.304',
          reelLengthM: '2000',
          diameterMm: '25.15',
          utsKn: '112.5',
          effectiveFrom: '2026-01-01T00:00:00.000Z',
          effectiveTo: '2026-09-30T23:59:59.999Z',
          createdBy: 'engenharia@epc.com',
          createdAt: '2026-01-01T08:00:00.000Z',
        },
      ],
    });

    await catalogPage.goto('/catalogs/conductor-cables/1/history');

    // Valida título do histórico
    await expect(
      page.getByRole('heading', { name: /histórico de versões — grosbeak/i }),
    ).toBeVisible();

    // Valida que as duas versões estão presentes na tabela de histórico
    const rows = catalogPage.getHistoryRows();
    await expect(rows).toHaveCount(2);

    // Versão mais recente primeiro
    await expect(rows.nth(0)).toContainText('1.310');
    await expect(rows.nth(0)).toContainText('2200');

    // Versão original intacta (sem sobrescrita)
    await expect(rows.nth(1)).toContainText('1.304');
    await expect(rows.nth(1)).toContainText('2000');
  });
});
