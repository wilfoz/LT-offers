import { test, expect } from '@playwright/test';
import { OfferDetailPage } from '../pages/offer-detail.page';

test.describe('Jornada 4: Painel de Consistência de Engenharia e Matriz de Riscos (M12, RN-13, RF-53..RF-55)', () => {
  let offerPage: OfferDetailPage;

  const mockOfferWithIssues = {
    id: 30,
    code: 'PROP-2026-RISK-01',
    name: 'LT 500 kV Marimbondo - Lote 3',
    clientName: 'Furnas Centrais Elétricas',
    baseCurrency: 'BRL',
    clonedFromOfferId: null,
    currentRevisionId: 301,
    revisions: [
      {
        id: 301,
        revisionNumber: 0,
        status: 'DRAFT',
        auctionName: 'Leilão 01/2026',
        lotName: 'Lote 3',
        offerDate: '2026-08-01',
        auctionDate: '2026-11-20',
        scheduleStartDate: '2027-03-01',
        commercialOperationDate: '2030-03-01',
        estimatedCapex: '450000000.00',
        maxRap: '65000000.00',
        winningRap: '58000000.00',
        notes: 'Análise de risco geotécnico em trecho de travessia.',
        transmissionLines: [
          {
            id: 501,
            code: 'LT-500-MB',
            name: 'LT 500 kV Marimbondo - Assis',
            nominalVoltageKv: '500',
            refinedLengthKm: '120.00',
            reportLengthKm: '120.00',
            circuitCount: 'DOUBLE',
            bundleConductorsPerPhase: 4,
            terrainDifficultyFactor: '1.20',
            accessDifficultyFactor: '1.25',
            towerCount: 280,
          },
        ],
        scopeMatrixItems: [],
      },
    ],
  };

  test.beforeEach(async ({ page }) => {
    offerPage = new OfferDetailPage(page);
    await offerPage.mockJson('/api/offers/30', mockOfferWithIssues);
  });

  test('deve detectar inconsistências impeditivas e navegar para aba de verificações via badge de saúde', async ({
    page,
  }) => {
    // Mock com 1 erro crítico de consistência (ex.: torres sem fundação)
    await offerPage.mockJson('/api/offers/30/checks', {
      offerId: '30',
      status: 'CRITICAL_ERRORS',
      criticalCount: 1,
      warningCount: 2,
      infoCount: 0,
      canCloseRevision: false,
      requiresJustification: true,
      findings: [
        {
          id: 'fnd-1',
          ruleId: 'CHK-STK-01',
          module: 'STAKING',
          severity: 'CRITICAL',
          title: 'Atribuição Completa de Fundações',
          message: 'Existem 12 torres sem fundação associada.',
          navigationTarget: { tab: 'staking' },
        },
        {
          id: 'fnd-2',
          ruleId: 'CHK-GEO-02',
          module: 'STAKING',
          severity: 'WARNING',
          title: 'Divergência de Traçado',
          message: 'Extensão de estacas difere em 0.5 km do traçado nominal.',
          navigationTarget: { tab: 'lines' },
        },
      ],
    });

    await offerPage.gotoOffer(30);

    // Valida badge com contagem de erros críticos no cabeçalho
    const healthBadge = offerPage.getHealthBadge();
    await expect(healthBadge).toBeVisible();
    await expect(healthBadge).toContainText('1 Erro(s) Crítico(s)');

    // Clica no badge de saúde para ir à aba de Verificações & Integridade
    await healthBadge.click();

    // Valida exibição dos cards de verificação
    const checksContainer = page.locator('app-offer-checks');
    await expect(checksContainer).toBeVisible();
    await expect(checksContainer).toContainText(
      'Atribuição Completa de Fundações',
    );
    await expect(checksContainer).toContainText(
      '12 torres sem fundação associada',
    );
  });

  test('deve navegar para a Matriz de Riscos e validar categorias de contingência e mitigação', async ({
    page,
  }) => {
    await offerPage.mockJson('/api/offers/30/checks', {
      offerId: '30',
      status: 'HEALTHY',
      criticalCount: 0,
      warningCount: 0,
      infoCount: 0,
      canCloseRevision: true,
      requiresJustification: false,
      findings: [],
    });

    // Mock dos itens da matriz de riscos (M12)
    await offerPage.mockJson('/api/offers/30/risks', {
      offerId: '30',
      items: [
        {
          id: 'rsk-1',
          offerId: '30',
          category: 'GEOTECHNICAL_SOIL',
          description:
            'Presença de rocha sã ou lençol freático elevado no trecho da serra.',
          situation: 'Sondagens preliminares com espaçamento elevado',
          mitigationAction:
            'Sondagem prévia SPT a cada 3 km e previsão de tubulão a ar comprimido.',
          estimatedImpact: '1500000.00',
          probabilityPercent: '30',
          weightedSeverity: '450000.00',
          treatment: 'CONTINGENCY_BDI',
        },
        {
          id: 'rsk-2',
          offerId: '30',
          category: 'ENVIRONMENTAL',
          description:
            'Atraso na liberação da Licença de Instalação (LI) pelo órgão estadual.',
          situation: 'Processo no órgão estadual',
          mitigationAction:
            'Contratação de assessoria especializada para audiências públicas.',
          estimatedImpact: '3200000.00',
          probabilityPercent: '20',
          weightedSeverity: '640000.00',
          treatment: 'CONTINGENCY_BDI',
        },
      ],
      totalEstimatedImpact: '4700000.00',
      totalWeightedSeverity: '1090000.00',
      bdiContingencyAmount: '1090000.00',
      commercialAssumptionAmount: '0.00',
      categoryBreakdown: [
        {
          category: 'GEOTECHNICAL_SOIL',
          count: 1,
          totalImpact: '1500000.00',
          totalWeightedSeverity: '450000.00',
        },
        {
          category: 'ENVIRONMENTAL',
          count: 1,
          totalImpact: '3200000.00',
          totalWeightedSeverity: '640000.00',
        },
      ],
    });

    await offerPage.gotoOffer(30);
    await offerPage.selectTab(/matriz de riscos/i);

    // Valida exibição dos riscos cadastrados e valores de contingência
    const risksContainer = page.locator('app-offer-risks');
    await expect(risksContainer).toBeVisible();
    await expect(risksContainer).toContainText(
      'Presença de rocha sã ou lençol freático',
    );
    await expect(risksContainer).toContainText(
      'Atraso na liberação da Licença de Instalação',
    );
  });
});
