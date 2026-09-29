import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { OfferDetail } from '@lt-offers/domain';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { OfferDetailComponent } from './offer-detail.component';
import { OffersApi } from './offers-api.service';
import { AuctionHistoryApi } from '../auction-history/auction-history-api.service';
import { ViabilityApi } from '../catalogs/viability-api.service';

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

  const emptyBenchmark = {
    lotResult: null,
    auctionStats: null,
    overallStats: {
      lotCount: 0,
      desertedLotCount: 0,
      minDiscountPercent: null,
      avgDiscountPercent: null,
      maxDiscountPercent: null,
    },
    lastImport: null,
  };

  const auctionHistoryApiMock = {
    benchmark: vi.fn(),
  };

  // Parecer de viabilidade M13: resposta completa padrão (viável nos dois
  // vereditos), sobrescrita por teste quando o cenário exige.
  const viabilityResponse = {
    assessment: {
      investmentBase: '150000000.00',
      investmentSource: 'ANEEL_ESTIMATE',
      investmentAnnuity: '13324114.28',
      minimumGrossRap: '18127366.37',
      maxSupportableDiscountPercent: '27.49',
      estimatedDiscountPercent: '16.00',
      viableAtMaxRap: true,
      viableAtEstimatedRap: true,
      discountMarginPoints: '11.49',
      missingInputs: [],
    },
    parameters: {
      id: 1,
      effectiveFrom: '2026-03-01',
      waccRealAfterTaxPercent: '8.00',
      concessionYears: 30,
      pisCofinsPercent: '9.25',
      operationMaintenancePercent: '10.00',
      incomeTaxPercent: '10.00',
      createdBy: 'seed',
      createdAt: '2026-03-01T00:00:00.000Z',
    },
    auctionStats: {
      lotCount: 12,
      desertedLotCount: 0,
      minDiscountPercent: '5.00',
      avgDiscountPercent: '21.30',
      maxDiscountPercent: '43.00',
    },
    overallStats: {
      lotCount: 488,
      desertedLotCount: 0,
      minDiscountPercent: '0.00',
      avgDiscountPercent: '30.00',
      maxDiscountPercent: '70.00',
    },
  };

  const viabilityApiMock = {
    assessment: vi.fn(),
  };

  async function mount(detail = mockDetail()) {
    apiMock.getById.mockReturnValue(of(detail));

    await TestBed.configureTestingModule({
      imports: [OfferDetailComponent],
      providers: [
        provideRouter([]),
        { provide: OffersApi, useValue: apiMock },
        { provide: AuctionHistoryApi, useValue: auctionHistoryApiMock },
        { provide: ViabilityApi, useValue: viabilityApiMock },
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
    auctionHistoryApiMock.benchmark.mockReturnValue(of(emptyBenchmark));
    viabilityApiMock.assessment.mockReturnValue(of(viabilityResponse));
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
    // Regressão BUG-1 do QA: a API resolve por id da revisão (10), não pelo
    // número sequencial (0) — enviar o número resultava em 404.
    expect(apiMock.updateRevision).toHaveBeenCalledWith(
      1,
      10,
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

    expect(apiMock.updateRevision).toHaveBeenCalledWith(1, 10, {
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
      10,
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
    expect(apiMock.updateRevision).toHaveBeenCalledWith(1, 10, {
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
    expect(apiMock.updateRevision).toHaveBeenCalledWith(1, 10, {
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

  it('benchmark ANEEL: lote com resultado publicado exibido lado a lado com o deságio derivado', async () => {
    auctionHistoryApiMock.benchmark.mockReturnValue(
      of({
        lotResult: {
          id: 1,
          auctionYear: 2026,
          auctionDate: '2026-10-30',
          auctionNumber: '004/2026',
          lotNumber: 4,
          projectName: 'Lote 4',
          mainUf: 'PR/MS/GO',
          constructionDeadlineMonths: 60,
          lineLengthKm: null,
          substationMva: null,
          estimatedInvestment: null,
          maxRap: '762630000.00',
          winnerName: 'Transmissora Vencedora S.A.',
          winningRap: '381315000.00',
          discountPercent: '50.00',
        },
        auctionStats: {
          lotCount: 8,
          desertedLotCount: 1,
          minDiscountPercent: '37.89',
          avgDiscountPercent: '47.00',
          maxDiscountPercent: '56.20',
        },
        overallStats: {
          lotCount: 488,
          desertedLotCount: 20,
          minDiscountPercent: '0.00',
          avgDiscountPercent: '32.10',
          maxDiscountPercent: '73.50',
        },
        lastImport: null,
      }),
    );

    const fixture = await mount();
    expect(auctionHistoryApiMock.benchmark).toHaveBeenCalledWith('004/2026', 4);

    fixture.componentInstance.activeTabIndex.set(13);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Transmissora Vencedora S.A.');
    expect(text).toContain('381.315.000,00');
    expect(text).toContain('50,00%');
    expect(text).toContain('37,89%');
    expect(text).toContain('488 lote(s)');
    expect(text).toContain('deságio derivado desta oferta');
  });

  it('benchmark ANEEL: leilão sem resultado publicado exibe aviso e base completa', async () => {
    auctionHistoryApiMock.benchmark.mockReturnValue(
      of({
        ...emptyBenchmark,
        overallStats: {
          lotCount: 488,
          desertedLotCount: 20,
          minDiscountPercent: '0.00',
          avgDiscountPercent: '32.10',
          maxDiscountPercent: '73.50',
        },
      }),
    );

    const fixture = await mount();
    fixture.componentInstance.activeTabIndex.set(13);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Não há resultado publicado para o Leilão 004/2026');
    expect(text).toContain('Base histórica completa');
  });

  it('benchmark ANEEL: sem identidade normalizada exibe orientação e não consulta a API', async () => {
    const detail = mockDetail();
    detail.revisions[0].auctionNumber = null;
    detail.revisions[0].lotNumber = null;

    const fixture = await mount(detail);
    expect(auctionHistoryApiMock.benchmark).not.toHaveBeenCalled();

    fixture.componentInstance.activeTabIndex.set(13);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(
      'Informe o número do leilão e o número do lote para comparar com o histórico oficial da ANEEL.',
    );
  });

  it('benchmark ANEEL: erro de leitura vai para o snackbar sem quebrar a aba', async () => {
    auctionHistoryApiMock.benchmark.mockReturnValue(
      throwError(() => ({ error: { message: 'Falha no benchmark' } })),
    );

    const fixture = await mount();
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Falha no benchmark',
      'Fechar',
      expect.anything(),
    );
    expect(fixture.componentInstance.benchmarkLoading()).toBe(false);
    expect(fixture.componentInstance.auctionBenchmarkData()).toBeNull();
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

  it('viabilidade M13: painel completo com origem, vereditos e parâmetros vigentes', async () => {
    const fixture = await mount();
    expect(viabilityApiMock.assessment).toHaveBeenCalledWith(1, 10);

    fixture.componentInstance.activeTabIndex.set(13);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Viabilidade do Lote (M13)');
    expect(text).toContain('estimativa ANEEL');
    expect(text).toContain('RAP bruta mínima');
    expect(text).toContain('27,49%');
    expect(text).toContain('viável no teto do edital');
    expect(text).toContain('remunera o investimento com folga de 11,49 p.p.');
    expect(text).toContain('Deságios praticados no leilão 004/2026');
    expect(text).toContain('Base histórica completa (488');
    expect(text).toContain('Parâmetros vigentes desde 2026-03-01');
    expect(text).toContain('WACC real após impostos 8,00% a.a.');
  });

  it('viabilidade M13: deságio pretendido acima do suportado é destacado sem bloquear', async () => {
    viabilityApiMock.assessment.mockReturnValue(
      of({
        ...viabilityResponse,
        assessment: {
          ...viabilityResponse.assessment,
          estimatedDiscountPercent: '33.00',
          viableAtEstimatedRap: false,
          discountMarginPoints: '-5.51',
        },
      }),
    );

    const fixture = await mount();
    fixture.componentInstance.activeTabIndex.set(13);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const verdict = el.querySelector(
      '[data-testid="viability-estimated-verdict"]',
    ) as HTMLElement;
    expect(verdict.classList.contains('viability-bad')).toBe(true);
    expect(verdict.textContent).toContain(
      'não remunera o investimento nas premissas vigentes',
    );
    expect(verdict.textContent).toContain('excesso de 5,51 p.p.');
  });

  it('viabilidade M13: RAP mínima acima do teto sinaliza inviável e origem licitante é rotulada', async () => {
    viabilityApiMock.assessment.mockReturnValue(
      of({
        ...viabilityResponse,
        assessment: {
          ...viabilityResponse.assessment,
          investmentSource: 'BIDDER',
          maxSupportableDiscountPercent: '-4.90',
          viableAtMaxRap: false,
          estimatedDiscountPercent: null,
          viableAtEstimatedRap: null,
          discountMarginPoints: null,
        },
      }),
    );

    const fixture = await mount();
    fixture.componentInstance.activeTabIndex.set(13);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const verdict = el.querySelector(
      '[data-testid="viability-max-verdict"]',
    ) as HTMLElement;
    expect(verdict.classList.contains('viability-bad')).toBe(true);
    expect(verdict.textContent).toContain('-4,90%');
    expect(verdict.textContent).toContain('inviável nas condições do edital');
    expect(el.textContent).toContain('informado pelo licitante');
  });

  it('viabilidade M13: entradas faltantes orientadas sem inventar valores (RNF-09)', async () => {
    viabilityApiMock.assessment.mockReturnValue(
      of({
        ...viabilityResponse,
        assessment: {
          investmentBase: null,
          investmentSource: null,
          investmentAnnuity: null,
          minimumGrossRap: null,
          maxSupportableDiscountPercent: null,
          estimatedDiscountPercent: null,
          viableAtMaxRap: null,
          viableAtEstimatedRap: null,
          discountMarginPoints: null,
          missingInputs: ['INVESTMENT', 'MAX_RAP', 'ESTIMATED_WINNING_RAP'],
        },
        auctionStats: null,
      }),
    );

    const fixture = await mount();
    fixture.componentInstance.activeTabIndex.set(13);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Entradas faltantes para o parecer completo');
    expect(text).toContain(
      'Investimento (do licitante ou CAPEX estimado ANEEL)',
    );
    expect(text).toContain('RAP máxima do edital');
    expect(text).toContain('RAP vencedora estimada');
    expect(text).not.toContain('Deságio máximo suportado:');
  });

  it('viabilidade M13: erro de leitura vai para o snackbar sem quebrar a aba', async () => {
    viabilityApiMock.assessment.mockReturnValue(
      throwError(() => ({
        error: {
          message:
            'Nenhuma versão de parâmetros de viabilidade vigente em 2026-03-01.',
        },
      })),
    );

    const fixture = await mount();
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Nenhuma versão de parâmetros de viabilidade vigente em 2026-03-01.',
      'Fechar',
      expect.anything(),
    );
    expect(fixture.componentInstance.viabilityLoading()).toBe(false);
    expect(fixture.componentInstance.viabilityData()).toBeNull();

    // A orientação permanece visível no painel após o snackbar expirar.
    fixture.componentInstance.activeTabIndex.set(13);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(
      'Nenhuma versão de parâmetros de viabilidade vigente em 2026-03-01.',
    );
  });

  it('investimento do licitante é enviado ao salvar e vazio vira null', async () => {
    const fixture = await mount();
    const comp = fixture.componentInstance;
    apiMock.updateRevision.mockReturnValue(of(mockDetail()));

    comp.revParamsForm.patchValue({ bidderCapex: '4110000000.00' });
    comp.saveRevisionChanges();
    expect(apiMock.updateRevision).toHaveBeenCalledWith(
      1,
      10,
      expect.objectContaining({ bidderCapex: '4110000000.00' }),
    );

    comp.revParamsForm.patchValue({ bidderCapex: '' });
    comp.saveRevisionChanges();
    expect(apiMock.updateRevision).toHaveBeenLastCalledWith(
      1,
      10,
      expect.objectContaining({ bidderCapex: null }),
    );
  });

  it('investimento do licitante inválido bloqueia o salvamento com mensagem em português', async () => {
    const fixture = await mount();
    const comp = fixture.componentInstance;

    comp.revParamsForm.patchValue({ bidderCapex: '4110000000.005' });
    comp.saveRevisionChanges();
    fixture.detectChanges();

    expect(apiMock.updateRevision).not.toHaveBeenCalled();

    comp.activeTabIndex.set(13);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(
      'O investimento do licitante deve ser um número decimal não negativo com até 2 casas',
    );
  });
});
