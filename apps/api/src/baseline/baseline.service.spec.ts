import { Test, TestingModule } from '@nestjs/testing';
import { BaselineService } from './baseline.service';
import { ProgressTrackingService } from './progress-tracking.service';
import { ChangeOrderService } from './change-order.service';
import { ErpIntegrationService } from './erp-integration.service';
import { PrismaService } from '../app/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EconomicResultService } from '../economic-result/economic-result.service';
import { CashflowService } from '../cashflow/cashflow.service';

describe('Baseline & Execution Services (Fase F7)', () => {
  let baselineService: BaselineService;
  let progressTrackingService: ProgressTrackingService;
  let changeOrderService: ChangeOrderService;
  let erpIntegrationService: ErpIntegrationService;

  const mockPrismaService = {
    offer: {
      findUnique: jest.fn().mockResolvedValue({
        id: 1,
        code: 'OFR-2026-001',
        name: 'LT 500kV Curitiba-Joinville',
        revisions: [{ id: 1, revisionNumber: 0 }],
      }),
    },
  };

  const mockEconomicResultService = {
    getConsolidatedEconomicResult: jest.fn().mockResolvedValue({
      totalSalePrice: '124850000.00',
      totalNetCost: '102340000.00',
      netMarginPercent: '8.00',
    }),
  };

  const mockCashflowService = {
    getCashflowSummary: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BaselineService,
        ProgressTrackingService,
        ChangeOrderService,
        ErpIntegrationService,
        AuditService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EconomicResultService, useValue: mockEconomicResultService },
        { provide: CashflowService, useValue: mockCashflowService },
      ],
    }).compile();

    baselineService = module.get<BaselineService>(BaselineService);
    progressTrackingService = module.get<ProgressTrackingService>(
      ProgressTrackingService,
    );
    changeOrderService = module.get<ChangeOrderService>(ChangeOrderService);
    erpIntegrationService = module.get<ErpIntegrationService>(
      ErpIntegrationService,
    );
  });

  describe('BaselineService', () => {
    it('deve congelar a Baseline Contratual Data 0 a partir de proposta vencedora e emitir auditoria', async () => {
      const baseline = await baselineService.freezeBaseline(
        {
          offerId: 1,
          revisionId: 1,
          name: 'Baseline Contratual Imutável Data 0',
          frozenBy: 'diretor.comercial@engevix.com.br',
        },
        'diretor.comercial@engevix.com.br',
      );

      expect(baseline).toBeDefined();
      expect(baseline.status).toBe('ACTIVE');
      expect(baseline.baselineNumber).toBe(0);
      expect(baseline.workPackages.length).toBeGreaterThanOrEqual(7);
      expect(baseline.totalContractValue).toBe('124850000.00');
    });

    it('deve recuperar a baseline ativa de uma oferta', async () => {
      const active = await baselineService.getActiveBaseline(1);
      expect(active).toBeDefined();
      expect(active.offerId).toBe(1);
    });
  });

  describe('ProgressTrackingService', () => {
    it('deve registrar boletim de medição mensal e calcular Curva S com EVM', async () => {
      const record = await progressTrackingService.recordMonthlyProgress(
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
      );

      expect(record.monthNumber).toBe(4);
      expect(record.physicalProgressPercent).toBe('28.50');

      const curveS = await progressTrackingService.getCurveS(1, 1);
      expect(curveS.baselineId).toBe(1);
      expect(curveS.monthlySeries.length).toBe(18);
      expect(parseFloat(curveS.currentPhysicalProgressPercent)).toBe(28.5);
    });
  });

  describe('ChangeOrderService', () => {
    it('deve cadastrar, atualizar e consolidar o Current Working Estimate (CWE)', async () => {
      const newOrder = await changeOrderService.createChangeOrder(
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
      );

      expect(newOrder.id).toBeDefined();
      expect(newOrder.status).toBe('DRAFT');

      // Aprovação do aditivo
      const approved = await changeOrderService.updateChangeOrder(
        1,
        newOrder.id!,
        {
          status: 'APPROVED',
          approvedCostDelta: '420000.00',
        },
        'diretoria@cliente.com.br',
      );

      expect(approved.status).toBe('APPROVED');
      expect(approved.approvedCostDelta).toBe('420000.00');

      const cwe = await changeOrderService.getCurrentWorkingEstimate(1);
      expect(cwe.approvedChangeOrdersCount).toBeGreaterThanOrEqual(3);
      expect(parseFloat(cwe.currentWorkingEstimateValue)).toBeGreaterThan(
        parseFloat(cwe.baselineContractValue),
      );
    });
  });

  describe('ErpIntegrationService', () => {
    it('deve gerar o pacote JSON e o buffer XLSX para carga em ERP corporativo', async () => {
      const jsonPkg = await erpIntegrationService.generateErpJson(
        {
          baselineId: 1,
          targetSystem: 'SAP',
          companyCode: '1000',
          generatedBy: 'controladoria@engevix.com.br',
        },
        'controladoria@engevix.com.br',
      );

      expect(jsonPkg.targetSystem).toBe('SAP');
      expect(jsonPkg.accounts.length).toBeGreaterThanOrEqual(7);
      expect(jsonPkg.monthlySchedule.length).toBeGreaterThanOrEqual(7 * 18);

      const xlsxBuffer = await erpIntegrationService.generateErpXlsx(
        {
          baselineId: 1,
          targetSystem: 'TOTVS_RM',
          companyCode: 'COLIG-01',
          generatedBy: 'controladoria@engevix.com.br',
        },
        'controladoria@engevix.com.br',
      );

      expect(xlsxBuffer).toBeDefined();
      expect(xlsxBuffer.length).toBeGreaterThan(1000);
    });
  });
});
