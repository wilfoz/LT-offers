import { test, expect } from '@playwright/test';
import { OfferDetailPage } from '../pages/offer-detail.page';

test.describe('Jornada 3: Governança, Congelamento de Revisão e Trilha de Auditoria (RF-64, RF-65, RNF-05)', () => {
  let offerPage: OfferDetailPage;

  const mockDraftOffer = {
    id: 20,
    code: 'PROP-2026-GOV-01',
    name: 'LT 230 kV Governador Valadares - Lote 2',
    clientName: 'Taesa Concessões',
    baseCurrency: 'BRL',
    clonedFromOfferId: null,
    currentRevisionId: 201,
    revisions: [
      {
        id: 201,
        revisionNumber: 0,
        status: 'DRAFT',
        auctionName: 'Leilão 02/2026',
        lotName: 'Lote 2',
        offerDate: '2026-07-01',
        auctionDate: '2026-10-15',
        scheduleStartDate: '2027-02-01',
        commercialOperationDate: '2029-12-31',
        estimatedCapex: '210000000.00',
        maxRap: '32000000.00',
        winningRap: '28000000.00',
        notes: 'Revisão inicial de estudo preliminar.',
        transmissionLines: [
          {
            id: 401,
            code: 'LT-230-GV',
            name: 'LT 230 kV GV - Ipatinga',
            nominalVoltageKv: '230',
            refinedLengthKm: '88.00',
            reportLengthKm: '90.00',
            circuitCount: 'SINGLE',
            bundleConductorsPerPhase: 2,
            terrainDifficultyFactor: '1.05',
            accessDifficultyFactor: '1.10',
            towerCount: 210,
          },
        ],
        scopeMatrixItems: [],
      },
    ],
  };

  const mockFrozenOffer = {
    ...mockDraftOffer,
    revisions: [
      {
        ...mockDraftOffer.revisions[0],
        status: 'FROZEN',
      },
    ],
  };

  test.beforeEach(async ({ page }) => {
    offerPage = new OfferDetailPage(page);
    await offerPage.mockJson('/api/offers/20/health', {
      status: 'HEALTHY',
      criticalCount: 0,
      warningCount: 0,
      checks: [],
    });
  });

  test('deve congelar revisão em rascunho e exibir banner de imutabilidade (RNF-05)', async ({
    page,
  }) => {
    // Aceita o diálogo confirm() do navegador
    page.on('dialog', (dialog) => dialog.accept());

    // Inicialmente em DRAFT
    await offerPage.mockJson('/api/offers/20', mockDraftOffer);
    await offerPage.gotoOffer(20);

    // Valida que revisão está em rascunho com botão de Fechar revisão visível
    await expect(offerPage.getStatusChip()).toContainText('Rascunho');
    await expect(
      page.getByRole('button', { name: /fechar revisão/i }),
    ).toBeVisible();

    // Mock do PUT de atualização de revisão (status: FROZEN)
    await offerPage.mockJson('/api/offers/20/revisions/0', mockFrozenOffer);

    // Aciona o congelamento
    await offerPage.freezeRevision();

    // Valida transição visual para status Fechada/Congelada e exibição do banner de imutabilidade
    await expect(offerPage.getStatusChip()).toContainText('Fechada');
    await expect(offerPage.getImmutableBanner()).toBeVisible();
    await expect(offerPage.getImmutableBanner()).toContainText(
      'Revisão imutável',
    );

    // Valida que o botão de fechar sumiu e o botão de Nova revisão apareceu
    await expect(
      page.getByRole('button', { name: /fechar revisão/i }),
    ).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: /nova revisão/i }),
    ).toBeVisible();
  });

  test('deve consultar a trilha de auditoria e validar o registro de eventos (RF-65)', async ({
    page,
  }) => {
    await offerPage.mockJson('/api/offers/20', mockFrozenOffer);

    // Mock da trilha de auditoria com eventos de criação e congelamento
    await offerPage.mockJson('/api/audit*', [
      {
        id: 'aud-1',
        action: 'FREEZE',
        resource: 'REVISION',
        resourceId: '201',
        description:
          'Revisão R0 congelada formalmente para emissão da proposta técnica.',
        userId: 'eng-chefe@epc.com',
        userName: 'Engenheiro Chefe',
        userRole: 'ADMIN',
        timestamp: '2026-09-12T14:30:00.000Z',
      },
      {
        id: 'aud-2',
        action: 'CREATE',
        resource: 'OFFER',
        resourceId: '20',
        description: 'Criação da proposta PROP-2026-GOV-01 com lote 2.',
        userId: 'orçamentista@epc.com',
        userName: 'Orçamentista Sênior',
        userRole: 'COMMERCIAL',
        timestamp: '2026-09-12T09:00:00.000Z',
      },
    ]);

    await offerPage.gotoOffer(20);
    await offerPage.selectTab(/trilha de auditoria/i);

    // Valida exibição dos eventos na aba de auditoria
    const auditContainer = page.locator('app-offer-audit');
    await expect(auditContainer).toBeVisible();
    await expect(auditContainer).toContainText('FREEZE');
    await expect(auditContainer).toContainText('Engenheiro Chefe');
    await expect(auditContainer).toContainText('CREATE');
  });
});
