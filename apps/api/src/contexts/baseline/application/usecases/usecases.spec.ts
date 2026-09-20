import { EconomicsFacadeService } from '../../../economics';
import {
  AuditTrailPort,
  BaselineOfferQueryPort,
  ErpSpreadsheetPort,
} from '../../domain';
import { InMemoryBaselinesRepository } from '../../infrastructure/database/in-memory/in-memory-baselines.repository';
import { InMemoryChangeOrdersRepository } from '../../infrastructure/database/in-memory/in-memory-change-orders.repository';
import { InMemoryProgressRecordsRepository } from '../../infrastructure/database/in-memory/in-memory-progress-records.repository';
import { ExcelErpSpreadsheetAdapter } from '../../infrastructure/spreadsheet/excel-erp-spreadsheet.adapter';
import { FreezeBaselineUseCase } from './freeze-baseline.usecase';
import {
  GetActiveBaselineUseCase,
  GetBaselineByIdUseCase,
  ListBaselinesUseCase,
} from './get-baselines.usecases';
import {
  CreateChangeOrderUseCase,
  UpdateChangeOrderUseCase,
  GetCurrentWorkingEstimateUseCase,
} from './change-orders.usecases';
import {
  RecordMonthlyProgressUseCase,
  GetCurveSUseCase,
} from './progress-tracking.usecases';
import {
  GenerateErpJsonUseCase,
  GenerateErpXlsxUseCase,
} from './erp-integration.usecases';

// Os adaptadores in-memory são puros (sem I/O) e carregam os seeds oficiais:
// usá-los como dublês preserva as asserções do spec legado.
describe('Casos de uso do contexto baseline (Fase F7)', () => {
  const NOW = new Date('2026-09-20T12:00:00.000Z');

  let baselines: InMemoryBaselinesRepository;
  let changeOrders: InMemoryChangeOrdersRepository;
  let progressRecords: InMemoryProgressRecordsRepository;
  let auditTrail: { logEvent: jest.Mock };
  let offerQuery: { findOfferBasics: jest.Mock };
  let economicsFacade: { getConsolidatedEconomicResult: jest.Mock };

  let getBaselineById: GetBaselineByIdUseCase;
  let getActiveBaseline: GetActiveBaselineUseCase;

  beforeEach(() => {
    baselines = new InMemoryBaselinesRepository();
    changeOrders = new InMemoryChangeOrdersRepository();
    progressRecords = new InMemoryProgressRecordsRepository();
    auditTrail = { logEvent: jest.fn() };
    offerQuery = {
      findOfferBasics: jest.fn().mockResolvedValue({
        id: 1,
        code: 'OFR-2026-001',
        name: 'LT 500kV Curitiba-Joinville',
      }),
    };
    economicsFacade = {
      getConsolidatedEconomicResult: jest.fn().mockResolvedValue({
        totalSalePrice: '124850000.00',
        totalNetCost: '102340000.00',
        netMarginPercent: '8.00',
      }),
    };

    getBaselineById = new GetBaselineByIdUseCase(baselines);
    getActiveBaseline = new GetActiveBaselineUseCase(baselines);
  });

  const asAudit = (): AuditTrailPort => auditTrail as unknown as AuditTrailPort;
  const asOfferQuery = (): BaselineOfferQueryPort =>
    offerQuery as unknown as BaselineOfferQueryPort;

  describe('Linha de base contratual', () => {
    it('deve congelar a Baseline Contratual Data 0 a partir de proposta vencedora e emitir auditoria', async () => {
      const useCase = new FreezeBaselineUseCase(
        baselines,
        asOfferQuery(),
        asAudit(),
        economicsFacade as unknown as EconomicsFacadeService,
      );

      const baseline = await useCase.execute(
        {
          offerId: 1,
          revisionId: 1,
          name: 'Baseline Contratual Imutável Data 0',
          frozenBy: 'diretor.comercial@engevix.com.br',
        },
        'diretor.comercial@engevix.com.br',
        NOW,
      );

      expect(baseline).toBeDefined();
      expect(baseline.status).toBe('ACTIVE');
      expect(baseline.baselineNumber).toBe(0);
      expect(baseline.workPackages.length).toBeGreaterThanOrEqual(7);
      expect(baseline.totalContractValue).toBe('124850000.00');
      expect(baseline.frozenAt).toBe(NOW.toISOString());
      expect(auditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'FREEZE' }),
      );
    });

    it('deve recuperar a baseline ativa de uma oferta, adaptando o seed quando necessário', async () => {
      const active = await getActiveBaseline.execute(1);
      expect(active).toBeDefined();
      expect(active.offerId).toBe(1);

      // Oferta sem baseline própria recebe o seed adaptado (comportamento herdado)
      const adapted = await getActiveBaseline.execute(42);
      expect(adapted.offerId).toBe(42);
      expect(adapted.id).toBe(1);
    });

    it('deve lançar exceção de domínio para baseline inexistente', async () => {
      await expect(getBaselineById.execute(99)).rejects.toThrow(
        'Linha de Base ID 99 não encontrada.',
      );
    });

    it('deve listar as baselines da oferta com fallback para a ativa', async () => {
      const useCase = new ListBaselinesUseCase(baselines, getActiveBaseline);
      const list = await useCase.execute(42);
      expect(list.length).toBe(1);
      expect(list[0].offerId).toBe(42);
    });
  });

  describe('Aditivos e pleitos (Change Orders)', () => {
    it('deve cadastrar, atualizar e consolidar o Current Working Estimate (CWE)', async () => {
      const createUseCase = new CreateChangeOrderUseCase(
        changeOrders,
        asAudit(),
        getBaselineById,
      );
      const updateUseCase = new UpdateChangeOrderUseCase(
        changeOrders,
        asAudit(),
      );
      const cweUseCase = new GetCurrentWorkingEstimateUseCase(
        changeOrders,
        getBaselineById,
      );

      const newOrder = await createUseCase.execute(
        {
          baselineId: 1,
          code: 'AD-03',
          title: 'Aditivo para reforço de aterramento em travessia',
          type: 'ENVIRONMENTAL_REQUISITION',
          requestedCostDelta: '450000.00',
          scheduleDeltaMonths: 0,
          description: 'Melhoria de malha de aterramento',
          justification: 'Exigência de concessionária de ferrovia',
          createdBy: 'eng.eletrico@engevix.com.br',
        },
        'eng.eletrico@engevix.com.br',
        NOW,
      );

      expect(newOrder.id).toBeDefined();
      expect(newOrder.status).toBe('DRAFT');

      // Aprovação do aditivo
      const approved = await updateUseCase.execute(
        1,
        newOrder.id!,
        {
          status: 'APPROVED',
          approvedCostDelta: '420000.00',
        },
        'diretoria@cliente.com.br',
        NOW,
      );

      expect(approved.status).toBe('APPROVED');
      expect(approved.approvedCostDelta).toBe('420000.00');
      expect(approved.approvedAt).toBe(NOW.toISOString());

      const cwe = await cweUseCase.execute(1);
      expect(cwe.approvedChangeOrdersCount).toBeGreaterThanOrEqual(3);
      expect(parseFloat(cwe.currentWorkingEstimateValue)).toBeGreaterThan(
        parseFloat(cwe.baselineContractValue),
      );
    });

    it('deve lançar exceção de domínio para change order inexistente', async () => {
      const updateUseCase = new UpdateChangeOrderUseCase(
        changeOrders,
        asAudit(),
      );

      await expect(
        updateUseCase.execute(1, 999, { status: 'APPROVED' }, 'user', NOW),
      ).rejects.toThrow('Change Order ID 999 não encontrada na baseline 1.');
    });
  });

  describe('Acompanhamento de avanço e Curva S', () => {
    it('deve registrar boletim de medição mensal e calcular Curva S com EVM', async () => {
      const recordUseCase = new RecordMonthlyProgressUseCase(
        progressRecords,
        asAudit(),
        getBaselineById,
      );
      const curveUseCase = new GetCurveSUseCase(
        progressRecords,
        getBaselineById,
        getActiveBaseline,
      );

      const record = await recordUseCase.execute(
        {
          baselineId: 1,
          monthNumber: 4,
          periodDate: '2026-04',
          physicalProgressPercent: '28.50',
          monthlyMeasuredAmount: '11500000.00',
          notes: 'Lançamento de cabos no trecho A iniciado.',
          createdBy: 'eng.residente@engevix.com.br',
        },
        'eng.residente@engevix.com.br',
        NOW,
      );

      expect(record.monthNumber).toBe(4);
      expect(record.physicalProgressPercent).toBe('28.50');

      const curveS = await curveUseCase.execute(1, NOW, 1);
      expect(curveS.baselineId).toBe(1);
      expect(curveS.monthlySeries.length).toBe(18);
      expect(parseFloat(curveS.currentPhysicalProgressPercent)).toBe(28.5);
    });
  });

  describe('Integração ERP', () => {
    it('deve gerar o pacote JSON e o buffer XLSX para carga em ERP corporativo', async () => {
      const jsonUseCase = new GenerateErpJsonUseCase(
        asOfferQuery(),
        asAudit(),
        getBaselineById,
      );
      const xlsxUseCase = new GenerateErpXlsxUseCase(
        new ExcelErpSpreadsheetAdapter(),
        jsonUseCase,
      );

      const jsonPkg = await jsonUseCase.execute(
        {
          baselineId: 1,
          targetSystem: 'SAP',
          companyCode: '1000',
          generatedBy: 'controladoria@engevix.com.br',
        },
        'controladoria@engevix.com.br',
        NOW,
      );

      expect(jsonPkg.targetSystem).toBe('SAP');
      expect(jsonPkg.accounts.length).toBeGreaterThanOrEqual(7);
      expect(jsonPkg.monthlySchedule.length).toBeGreaterThanOrEqual(7 * 18);

      const xlsxBuffer = await xlsxUseCase.execute(
        {
          baselineId: 1,
          targetSystem: 'TOTVS_RM',
          companyCode: 'COLIG-01',
          generatedBy: 'controladoria@engevix.com.br',
        },
        'controladoria@engevix.com.br',
        NOW,
      );

      expect(xlsxBuffer).toBeDefined();
      expect(xlsxBuffer.length).toBeGreaterThan(1000);
    });

    it('deve usar um gerador dublê que recebe o pacote estruturado', async () => {
      const jsonUseCase = new GenerateErpJsonUseCase(
        asOfferQuery(),
        asAudit(),
        getBaselineById,
      );
      const spreadsheetMock: ErpSpreadsheetPort = {
        buildWorkbook: jest.fn().mockResolvedValue(Buffer.from('xlsx')),
      };
      const xlsxUseCase = new GenerateErpXlsxUseCase(
        spreadsheetMock,
        jsonUseCase,
      );

      await xlsxUseCase.execute(
        {
          baselineId: 1,
          targetSystem: 'SAP',
          generatedBy: 'controladoria@engevix.com.br',
        },
        'controladoria@engevix.com.br',
        NOW,
      );

      expect(spreadsheetMock.buildWorkbook).toHaveBeenCalledWith(
        expect.objectContaining({ targetSystem: 'SAP', currency: 'BRL' }),
      );
    });
  });
});
