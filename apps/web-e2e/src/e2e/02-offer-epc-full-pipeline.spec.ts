import { test, expect } from '@playwright/test';
import { OfferDetailPage } from '../pages/offer-detail.page';
import { ExportPage } from '../pages/export.page';

test.describe('Jornada 2: Pipeline Completo de Orçamentação EPC (RF-01..RF-65, RNF-11, RNF-18)', () => {
  let offerPage: OfferDetailPage;
  let exportPage: ExportPage;

  const mockOfferData = {
    id: 10,
    code: 'PROP-2026-XINGU-01',
    name: 'LT 500 kV Xingu / Pará - Lote 1 Leilão 01/2026',
    clientName: 'ANEEL / Transmissora Nacional EPC',
    baseCurrency: 'BRL',
    clonedFromOfferId: null,
    currentRevisionId: 100,
    revisions: [
      {
        id: 100,
        revisionNumber: 0,
        status: 'DRAFT',
        auctionName: 'Leilão de Transmissão 01/2026',
        lotName: 'Lote 1 - Linhas Norte',
        offerDate: '2026-06-15',
        auctionDate: '2026-09-30',
        scheduleStartDate: '2027-01-01',
        commercialOperationDate: '2030-01-01',
        estimatedCapex: '850000000.00',
        maxRap: '120000000.00',
        winningRap: '105000000.00',
        notes:
          'Premissa de 4 feixes de condutor Grosbeak e 2 canteiros principais.',
        transmissionLines: [
          {
            id: 201,
            code: 'LT-500-XINGU',
            name: 'LT 500 kV Xingu - Tapajós C1',
            nominalVoltageKv: '500',
            refinedLengthKm: '345.50',
            reportLengthKm: '350.00',
            circuitCount: 'SINGLE',
            bundleConductorsPerPhase: 4,
            terrainDifficultyFactor: '1.15',
            accessDifficultyFactor: '1.20',
            towerCount: 780,
          },
        ],
        scopeMatrixItems: [
          {
            id: 301,
            itemCode: 'ESC-01',
            itemName: 'Fornecimento de Cabos Condutores',
            category: 'SUPPLIES',
            responsibleParty: 'CONTRACTOR',
            acceptsDirectBilling: true,
            currencyRiskParty: 'CONTRACTOR',
            commodityRiskParty: 'CONTRACTOR',
          },
          {
            id: 302,
            itemCode: 'ESC-02',
            itemName: 'Licenciamento Ambiental Prévio',
            category: 'ENGINEERING',
            responsibleParty: 'CLIENT',
            acceptsDirectBilling: false,
            currencyRiskParty: 'CLIENT',
            commodityRiskParty: 'CLIENT',
          },
        ],
      },
    ],
  };

  test.beforeEach(async ({ page }) => {
    offerPage = new OfferDetailPage(page);
    exportPage = new ExportPage(page);

    // Mock global da proposta e saúde da engenharia
    await offerPage.mockJson('/api/offers/10', mockOfferData);
    await offerPage.mockJson('/api/offers/10/health', {
      status: 'HEALTHY',
      criticalCount: 0,
      warningCount: 0,
      checks: [],
    });
  });

  test('deve navegar pelos dados gerais da oferta e verificar sumário de linhas de transmissão', async ({
    page,
  }) => {
    await offerPage.gotoOffer(10);

    // Valida títulos do cabeçalho
    await expect(
      page.getByRole('heading', { name: /lt 500 kv xingu/i }),
    ).toBeVisible();
    await expect(page.locator('.offer-code')).toContainText(
      'PROP-2026-XINGU-01',
    );
    await expect(offerPage.getStatusChip()).toContainText('Rascunho');

    // Valida KPIs da aba de Linhas de Transmissão
    await expect(page.locator('.lines-summary-cards')).toContainText(
      '345.500 km',
    );
    await expect(page.locator('.lines-summary-cards')).toContainText(
      '350.000 km',
    );
  });

  test('deve validar a matriz de escopo e separação de responsabilidade de 4 eixos (RN-03, RN-04, RN-08)', async ({
    page,
  }) => {
    await offerPage.gotoOffer(10);
    await offerPage.selectTab(/matriz de escopo/i);

    // Valida itens da matriz de escopo
    const table = page.locator('.scope-matrix-table');
    await expect(table).toBeVisible();
    await expect(table).toContainText('Fornecimento de Cabos Condutores');
    await expect(table).toContainText('REIDI Ativo');
    await expect(table).toContainText('Licenciamento Ambiental Prévio');
    await expect(table).toContainText('(Cliente)');
  });

  test('deve acessar a central de exportação e verificar cards de download XLSX (M12, RF-47..RF-50)', async ({
    page,
  }) => {
    // Mock dos indicadores de benchmarking da central de exportação
    await exportPage.mockJson('/api/offers/10/export/performance-indicators', {
      consolidated: {
        lengthKm: 345.5,
        towerCount: 780,
        costPerKm: 2460202.6,
        costPerTower: 1089743.58,
        suppliesCostPerKm: 1450000.0,
        servicesCostPerKm: 1010202.6,
        steelPerKm: 28.5,
        steelPerTower: 12.6,
        concretePerKm: 95.4,
        concretePerTower: 42.2,
        structuresDensityPerKm: 2.26,
        averageSpanMeters: 442.9,
      },
    });
    await exportPage.mockJson('/api/offers/10/export/tender-sheet/data*', {
      rows: [],
    });
    await exportPage.mockJson('/api/offers/10/export/measurement-sheet/data*', {
      items: [],
    });
    await exportPage.mockJson('/api/offers/10/export/cashflow-schedule/data*', {
      months: [],
    });

    await offerPage.gotoOffer(10);
    await offerPage.selectTab(/central de exportação/i);

    // Valida presença dos cards de exportação de 1-clique
    await expect(
      page.getByRole('heading', {
        name: /central de emissão e exportações contratuais/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByText('Planilha de Preços do Edital (XLSX)'),
    ).toBeVisible();
    await expect(page.getByText('Folha de Medição & PUs (XLSX)')).toBeVisible();
    await expect(page.getByText('Cronograma Financeiro (XLSX)')).toBeVisible();

    // Valida indicadores de benchmarking sintetizados
    await expect(page.locator('.benchmarking-card')).toContainText('345.5 km');
    await expect(page.locator('.benchmarking-card')).toContainText(
      '780 Torres',
    );
  });
});
