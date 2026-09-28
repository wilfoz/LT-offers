import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { OfferDetail } from '@lt-offers/domain';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { OfferDetailComponent } from './offer-detail.component';
import { OffersApi } from './offers-api.service';

import { provideHttpClient } from '@angular/common/http';
import { FoundationTypesApi } from '../catalogs/foundation-types-api.service';
import { SoilTypesApi } from '../catalogs/soil-types-api.service';
import { TowerTypesApi } from '../catalogs/tower-types-api.service';
import { StakingApi } from './staking-api.service';
import { FoundationsApi } from './foundations-api.service';
import { ChecksApiService } from './checks-api.service';
import { RisksApiService } from './risks-api.service';

const mockDetail = (overrides: Partial<OfferDetail> = {}): OfferDetail => ({
  id: 1,
  code: 'OF-2026-L1',
  name: 'Lote 1 - Linhas Sul',
  clientName: 'Axia Energia',
  baseCurrency: 'BRL',
  clonedFromOfferId: null,
  createdBy: 'user1',
  createdAt: '2026-03-01T10:00:00.000Z',
  updatedAt: '2026-03-01T10:00:00.000Z',
  revisions: [
    {
      id: 10,
      offerId: 1,
      revisionNumber: 0,
      status: 'DRAFT',
      auctionName: 'Leilão 01/2026',
      lotName: 'Lote 1',
      auctionNumber: '004/2026',
      lotNumber: 4,
      subLotCode: '4A',
      offerDate: '2026-03-01',
      auctionDate: '2026-04-15',
      scheduleStartDate: '2026-06-01',
      commercialOperationDate: '2029-06-01',
      contractSigningDate: null,
      constructionDeadlineMonths: null,
      contractualDeadlineDate: null,
      discountPercent: '16.00',
      scheduleWarnings: [],
      estimatedCapex: '150000000.00',
      maxRap: '25000000.00',
      winningRap: '21000000.00',
      notes: 'Premissas iniciais',
      closedAt: null,
      deliveredAt: null,
      createdBy: 'user1',
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
      transmissionLines: [
        {
          id: 101,
          code: 'LT-01',
          name: 'LT 500 kV Curitiba - Blumenau',
          nominalVoltageKv: '500.00',
          refinedLengthKm: '154.230',
          reportLengthKm: '155.000',
          circuitCount: 2,
          bundleConductorCount: 4,
          destinationStatePrimary: 'PR',
          destinationPercentagePrimary: '60.00',
          destinationStateSecondary: 'SC',
          destinationPercentageSecondary: '40.00',
        },
      ],
      scopeMatrixItems: [
        {
          id: 201,
          itemCode: 'MAT-CAB',
          itemName: 'Fornecimento de Cabos Condutores',
          category: 'Materiais Principais',
          responsibleParty: 'CONTRACTOR',
          acceptsDirectBilling: true,
          currencyRiskParty: 'CONTRACTOR',
          commodityRiskParty: 'CONTRACTOR',
          notes: null,
        },
        {
          id: 202,
          itemCode: 'LIC-AMB',
          itemName: 'Licenciamento Ambiental',
          category: 'Engenharia e Gestão',
          responsibleParty: 'CLIENT',
          acceptsDirectBilling: false,
          currencyRiskParty: 'CLIENT',
          commodityRiskParty: 'CLIENT',
          notes: 'Sob responsabilidade do cliente',
        },
      ],
    },
  ],
  ...overrides,
});

describe('OfferDetailComponent', { timeout: 15000 }, () => {
  const apiMock = {
    getById: vi.fn(),
    updateRevision: vi.fn(),
    createNewRevision: vi.fn(),
    clone: vi.fn(),
  };

  const snackBarMock = {
    open: vi.fn(),
  };

  async function mount(detail = mockDetail()) {
    apiMock.getById.mockReturnValue(of(detail));

    await TestBed.configureTestingModule({
      imports: [OfferDetailComponent],
      providers: [
        provideRouter([]),
        { provide: OffersApi, useValue: apiMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        {
          provide: StakingApi,
          useValue: {
            getPaginated: vi.fn().mockReturnValue(
              of({
                items: [],
                totalCount: 0,
                page: 1,
                pageSize: 50,
                totalPages: 1,
                summary: {
                  totalTowers: 0,
                  minStationMeters: '0.00',
                  maxStationMeters: '0.00',
                  unassignedSoilCount: 0,
                  unassignedFoundationCount: 0,
                  invalidCombinationsCount: 0,
                },
              }),
            ),
            getIntegritySummary: vi.fn().mockReturnValue(
              of({
                hasErrors: false,
                totalTowers: 0,
                unassignedSoilCount: 0,
                unassignedFoundationCount: 0,
                invalidCombinationsCount: 0,
                invalidCombinations: [],
                totalStationLengthKm: '0.000',
                lineRefinedLengthKm: '0.000',
                lengthDiscrepancyKm: null,
              }),
            ),
            getPreliminaryDistribution: vi.fn().mockReturnValue(of(null)),
          },
        },
        {
          provide: SoilTypesApi,
          useValue: { list: vi.fn().mockReturnValue(of([])) },
        },
        {
          provide: FoundationTypesApi,
          useValue: { list: vi.fn().mockReturnValue(of([])) },
        },
        {
          provide: TowerTypesApi,
          useValue: { list: vi.fn().mockReturnValue(of([])) },
        },
        {
          provide: FoundationsApi,
          useValue: {
            getQuantities: vi.fn().mockReturnValue(
              of({
                transmissionLineId: 101,
                calculationMode: 'STAKING_DETAILED',
                totalTowers: 0,
                calculatedTowers: 0,
                pendingTowers: 0,
                kpis: {
                  totalExcavationM3: '0.000',
                  totalConcreteM3: '0.000',
                  totalSteelKg: '0.00',
                  totalBackfillM3: '0.000',
                  totalSpecialPilesM: '0.000',
                },
                materials: [],
                materialsByFamily: {
                  EXCAVATION: [],
                  CONCRETE: [],
                  STEEL: [],
                  BACKFILL_FORMWORK: [],
                  SPECIAL_FOUNDATIONS: [],
                },
                missingCombinations: [],
              }),
            ),
            getTraceability: vi.fn().mockReturnValue(of({})),
            getValidation: vi.fn().mockReturnValue(
              of({
                transmissionLineId: 101,
                totalTowers: 0,
                calculatedTowers: 0,
                pendingTowers: 0,
                hasErrors: false,
                missingCombinations: [],
              }),
            ),
          },
        },
        provideHttpClient(),
        {
          provide: ChecksApiService,
          useValue: {
            getHealthChecks: vi.fn().mockReturnValue(
              of({
                offerId: '1',
                status: 'HEALTHY',
                criticalCount: 0,
                warningCount: 0,
                infoCount: 0,
                findings: [],
                canCloseRevision: true,
                requiresJustification: false,
              }),
            ),
          },
        },
        {
          provide: RisksApiService,
          useValue: {
            getRisks: vi.fn().mockReturnValue(
              of({
                offerId: '1',
                items: [],
                totalEstimatedImpact: '0.00',
                totalWeightedSeverity: '0.00',
                bdiContingencyAmount: '0.00',
                commercialAssumptionAmount: '0.00',
                categoryBreakdown: [],
              }),
            ),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1',
              },
            },
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(OfferDetailComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe dados da proposta, cabeçalho, revisão ativa e totais de linha', async () => {
    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('OF-2026-L1');
    expect(text).toContain('Lote 1 - Linhas Sul');
    expect(text).toContain('Axia Energia');
    expect(text).toContain('BRL');
    expect(text).toContain('R0');
    expect(text).toContain('Rascunho');
    expect(text).toContain('154.230 km');
    expect(text).toContain('LT-01');
    expect(text).toContain('LT 500 kV Curitiba - Blumenau');
    expect(text).toContain('PR: 60.00%');
    expect(text).toContain('SC: 40.00%');
  });

  it('valida que rateio de UFs deve somar 100% ao cadastrar linha', async () => {
    const fixture = await mount();
    const comp = fixture.componentInstance;

    comp.openAddLineForm();
    comp.lineForm.patchValue({
      code: 'LT-02',
      name: 'Linha Invalida',
      nominalVoltageKv: '230.00',
      refinedLengthKm: '50.000',
      reportLengthKm: '50.000',
      circuitCount: 1,
      bundleConductorCount: 1,
      destinationStatePrimary: 'PR',
      destinationPercentagePrimary: '60.00',
      destinationStateSecondary: 'SC',
      destinationPercentageSecondary: '30.00', // Soma = 90%
    });

    comp.saveLine();

    expect(comp.lineUfError()).toContain('deve ser exatamente 100,00%');
    expect(apiMock.updateRevision).not.toHaveBeenCalled();
  });

  it('salva linha com sucesso quando rateio de UFs soma 100%', async () => {
    const fixture = await mount();
    const comp = fixture.componentInstance;

    apiMock.updateRevision.mockReturnValue(of(mockDetail()));

    comp.openAddLineForm();
    comp.lineForm.patchValue({
      code: 'LT-02',
      name: 'Linha Valida',
      nominalVoltageKv: '230.00',
      refinedLengthKm: '50.000',
      reportLengthKm: '50.000',
      circuitCount: 1,
      bundleConductorCount: 1,
      destinationStatePrimary: 'PR',
      destinationPercentagePrimary: '70.00',
      destinationStateSecondary: 'SC',
      destinationPercentageSecondary: '30.00', // Soma = 100%
    });

    comp.saveLine();

    expect(comp.lineUfError()).toBeNull();
    expect(apiMock.updateRevision).toHaveBeenCalledWith(
      1,
      0,
      expect.objectContaining({
        transmissionLines: expect.arrayContaining([
          expect.objectContaining({
            code: 'LT-02',
            destinationPercentagePrimary: '70.00',
            destinationPercentageSecondary: '30.00',
          }),
        ]),
      }),
    );
  });

  it('exibe itens da matriz de escopo e sinaliza itens sob responsabilidade do cliente', async () => {
    const fixture = await mount();
    fixture.componentInstance.activeTabIndex.set(1);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('MAT-CAB');
    expect(text).toContain('Fornecimento de Cabos Condutores');
    expect(text).toContain('LIC-AMB');
    expect(text).toContain('Licenciamento Ambiental');
    expect(text).toContain('(Cliente)');
  });

  it('bloqueia edição e exibe banner quando revisão está fechada (FROZEN)', async () => {
    const frozenDetail = mockDetail();
    frozenDetail.revisions[0].status = 'FROZEN';

    const fixture = await mount(frozenDetail);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Revisão imutável:');
    expect(text).toContain('fechada');
    expect(fixture.componentInstance.isDraft()).toBe(false);
  });

  it('permite fechar uma revisão rascunho', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    apiMock.updateRevision.mockReturnValue(of(mockDetail()));

    const fixture = await mount();
    fixture.componentInstance.freezeRevision();

    expect(apiMock.updateRevision).toHaveBeenCalledWith(1, 0, {
      status: 'FROZEN',
    });
  });

  it('permite criar nova revisão a partir de uma revisão fechada', async () => {
    const frozenDetail = mockDetail();
    frozenDetail.revisions[0].status = 'FROZEN';

    vi.spyOn(window, 'prompt').mockReturnValue('Notas da R1');
    apiMock.createNewRevision.mockReturnValue(
      of(
        mockDetail({
          revisions: [
            frozenDetail.revisions[0],
            {
              ...frozenDetail.revisions[0],
              id: 11,
              revisionNumber: 1,
              status: 'DRAFT',
              notes: 'Notas da R1',
            },
          ],
        }),
      ),
    );

    const fixture = await mount(frozenDetail);
    fixture.componentInstance.createNewRevision();

    expect(apiMock.createNewRevision).toHaveBeenCalledWith(1, {
      notes: 'Notas da R1',
    });
    expect(fixture.componentInstance.selectedRevisionNumber()).toBe(1);
  });

  it('permite navegar diretamente para a aba de estaqueamento da linha', async () => {
    const fixture = await mount();
    fixture.componentInstance.openStakingForLine(101);
    fixture.detectChanges();

    expect(fixture.componentInstance.activeTabIndex()).toBe(2);
    expect(fixture.componentInstance.selectedStakingLineId()).toBe(101);
  });

  it('preenche identidade do leilão no formulário e envia os campos novos ao salvar', async () => {
    const fixture = await mount();
    const comp = fixture.componentInstance;
    apiMock.updateRevision.mockReturnValue(of(mockDetail()));

    expect(comp.revParamsForm.controls.auctionNumber.value).toBe('004/2026');
    expect(comp.revParamsForm.controls.lotNumber.value).toBe('4');
    expect(comp.revParamsForm.controls.subLotCode.value).toBe('4A');

    comp.revParamsForm.patchValue({
      contractSigningDate: '2027-02-26',
      constructionDeadlineMonths: '60',
    });
    comp.saveRevisionChanges();

    expect(apiMock.updateRevision).toHaveBeenCalledWith(
      1,
      0,
      expect.objectContaining({
        auctionNumber: '004/2026',
        lotNumber: 4,
        subLotCode: '4A',
        contractSigningDate: '2027-02-26',
        constructionDeadlineMonths: 60,
      }),
    );
  });

  it('número do leilão inválido bloqueia o salvamento com mensagem em português', async () => {
    const fixture = await mount();
    const comp = fixture.componentInstance;

    comp.revParamsForm.patchValue({ auctionNumber: '4/2026' });
    comp.saveRevisionChanges();

    expect(comp.revParamsForm.invalid).toBe(true);
    expect(apiMock.updateRevision).not.toHaveBeenCalled();

    fixture.detectChanges();
    comp.activeTabIndex.set(13);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(
      'O número do leilão deve estar no formato NNN/AAAA (ex.: 004/2026)',
    );
  });

  it('deriva a data-limite contratual e exibe deságio em formato pt-BR', async () => {
    const fixture = await mount();
    const comp = fixture.componentInstance;

    comp.revParamsForm.patchValue({
      contractSigningDate: '2027-02-26',
      constructionDeadlineMonths: '60',
    });

    expect(comp.revContractualDeadline()).toBe('2032-02-26');
    // maxRap 25000000, winningRap 21000000 → (1 − 21/25) × 100 = 16,00%.
    expect(comp.discountDisplay()).toBe('16,00%');

    comp.revParamsForm.patchValue({ winningRap: '' });
    expect(comp.discountDisplay()).toBe('não informado');

    comp.revParamsForm.patchValue({ winningRap: '26000000.00' });
    expect(comp.discountDisplay()).toBe('-4,00%');
    expect(comp.isDiscountNegative()).toBe(true);
  });

  it('renderiza um alerta RN-02 por código com mensagens em português', async () => {
    const fixture = await mount();
    const comp = fixture.componentInstance;

    comp.revParamsForm.patchValue({
      scheduleStartDate: '2029-07-01',
      commercialOperationDate: '2029-06-30',
      contractSigningDate: '2029-08-01',
      constructionDeadlineMonths: '60',
    });

    const warnings = comp.revScheduleWarnings();
    expect(warnings.map((w) => w.code)).toEqual([
      'START_AFTER_COD',
      'DEADLINE_AFTER_COD',
      'START_BEFORE_SIGNING',
    ]);

    comp.activeTabIndex.set(13);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(
      'Data de início do cronograma posterior à data prevista de entrada em operação do edital.',
    );
    expect(text).toContain(
      'Data-limite contratual (2034-08-01) posterior à entrada em operação do edital.',
    );
    expect(text).toContain(
      'Data de início do cronograma anterior à assinatura do contrato de concessão.',
    );
  });

  it('exibe "Marcar vencedora" em DELIVERED e persiste a transição para WON', async () => {
    const deliveredDetail = mockDetail();
    deliveredDetail.revisions[0].status = 'DELIVERED';
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    apiMock.updateRevision.mockReturnValue(of(deliveredDetail));

    const fixture = await mount(deliveredDetail);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Marcar vencedora');

    fixture.componentInstance.markWon();
    expect(apiMock.updateRevision).toHaveBeenCalledWith(1, 0, {
      status: 'WON',
    });
  });

  it('exibe "Iniciar execução" em WON e persiste a transição para IN_EXECUTION', async () => {
    const wonDetail = mockDetail();
    wonDetail.revisions[0].status = 'WON';
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    apiMock.updateRevision.mockReturnValue(of(wonDetail));

    const fixture = await mount(wonDetail);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Iniciar execução');
    expect(text).toContain('Vencedora (Ganha)');

    fixture.componentInstance.markInExecution();
    expect(apiMock.updateRevision).toHaveBeenCalledWith(1, 0, {
      status: 'IN_EXECUTION',
    });
  });

  it('erro 409 de transição fora de ordem é exibido em snackbar', async () => {
    const deliveredDetail = mockDetail();
    deliveredDetail.revisions[0].status = 'DELIVERED';
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    apiMock.updateRevision.mockReturnValue(
      throwError(() => ({
        error: {
          message:
            'Transição de status não permitida: a revisão está em DELIVERED e não pode ir para IN_EXECUTION.',
        },
      })),
    );

    const fixture = await mount(deliveredDetail);
    fixture.componentInstance.markInExecution();

    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Transição de status não permitida: a revisão está em DELIVERED e não pode ir para IN_EXECUTION.',
      'Fechar',
      expect.anything(),
    );
  });

  it('clonagem pré-preenche a identidade da origem e envia os campos target*', async () => {
    const promptSpy = vi
      .spyOn(window, 'prompt')
      .mockReturnValueOnce('OF-2026-L1-COPIA')
      .mockReturnValueOnce('Lote 1 - Linhas Sul (Cópia)')
      .mockReturnValueOnce('002/2027')
      .mockReturnValueOnce('3')
      .mockReturnValueOnce('3b');
    apiMock.clone.mockReturnValue(of(mockDetail({ id: 2 })));

    const fixture = await mount();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.cloneCurrentOffer();

    // Prompts de identidade pré-preenchidos com os valores da origem.
    expect(promptSpy).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('Número do leilão de destino'),
      '004/2026',
    );
    expect(promptSpy).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('Número do lote de destino'),
      '4',
    );
    expect(promptSpy).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('Sublote de destino'),
      '4A',
    );
    expect(apiMock.clone).toHaveBeenCalledWith(1, {
      targetCode: 'OF-2026-L1-COPIA',
      targetName: 'Lote 1 - Linhas Sul (Cópia)',
      targetAuctionNumber: '002/2027',
      targetLotNumber: 3,
      targetSubLotCode: '3B',
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/offers', 2]);
  });

  it('clonagem com lote de destino não numérico é bloqueada com mensagem, sem chamar a API', async () => {
    vi.spyOn(window, 'prompt')
      .mockReturnValueOnce('OF-2026-L1-COPIA')
      .mockReturnValueOnce('Lote 1 - Linhas Sul (Cópia)')
      .mockReturnValueOnce('004/2026')
      .mockReturnValueOnce('abc');

    const fixture = await mount();
    fixture.componentInstance.cloneCurrentOffer();

    expect(snackBarMock.open).toHaveBeenCalledWith(
      'O número do lote de destino deve ser um número inteiro.',
      'Fechar',
      expect.anything(),
    );
    expect(apiMock.clone).not.toHaveBeenCalled();
  });

  it('botão de salvar parâmetros reflete o estado desabilitado do formulário', async () => {
    const fixture = await mount();
    const comp = fixture.componentInstance;
    comp.activeTabIndex.set(13);
    comp.revParamsForm.disable();
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'form[class*="params-grid"] button[type="submit"]',
    ) as HTMLButtonElement | null;
    expect(button?.disabled).toBe(true);
  });
});
