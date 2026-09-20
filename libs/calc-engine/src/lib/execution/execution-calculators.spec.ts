import {
  ChangeOrderType,
  ContractChangeOrder,
  WorkBaseline,
} from '@lt-offers/domain';
import { EarnedValueCalculator } from './earned-value-calculator';
import { ChangeOrderCalculator } from './change-order-calculator';
import { WbsGenerator } from './wbs-generator';

describe('Execution Calculators (Fase F7)', () => {
  const mockBaseline: WorkBaseline = {
    id: 1,
    offerId: 10,
    revisionId: 20,
    baselineNumber: 0,
    name: 'Linha de Base Contratual Data 0 - LT 500kV Curitiba-Joinville',
    status: 'ACTIVE',
    totalContractValue: '120000000.00',
    totalBudgetCost: '100000000.00',
    targetMarginPercent: '16.67',
    scheduleMonths: 12,
    frozenAt: '2026-09-10T18:00:00.000Z',
    frozenBy: 'diretor.comercial@engevix.com.br',
    workPackages: [],
    createdAt: '2026-09-10T18:00:00.000Z',
    updatedAt: '2026-09-10T18:00:00.000Z',
  };

  describe('EarnedValueCalculator', () => {
    it('deve calcular métricas de período com atraso físico (SPI < 1.0) e sobrecusto (CPI < 1.0)', () => {
      // Cenário de spec: PV = 40M, EV = 36M, AC = 38M
      const metrics = EarnedValueCalculator.calculatePeriodMetrics({
        monthNumber: 8,
        periodDate: '2026-08',
        plannedValue: '40000000.00',
        earnedValue: '36000000.00',
        actualCost: '38000000.00',
        physicalProgressPercent: '30.00',
        monthlyMeasuredAmount: '4500000.00',
      });

      expect(metrics.plannedValue).toBe('40000000.00');
      expect(metrics.earnedValue).toBe('36000000.00');
      expect(metrics.actualCost).toBe('38000000.00');
      expect(metrics.scheduleVariance).toBe('-4000000.00'); // SV = 36M - 40M = -4M
      expect(metrics.costVariance).toBe('-2000000.00'); // CV = 36M - 38M = -2M
      expect(metrics.schedulePerformanceIndex).toBe('0.9000'); // SPI = 36/40 = 0.90
      expect(metrics.costPerformanceIndex).toBe('0.9474'); // CPI = 36/38 = 0.9474
      expect(metrics.physicalProgressPercent).toBe('30.00');
    });

    it('deve determinar status executivo corretamente para diferentes combinações de SPI e CPI', () => {
      expect(
        EarnedValueCalculator.determineStatusSummary('1.0000', '1.0000'),
      ).toBe('ON_TRACK');
      expect(
        EarnedValueCalculator.determineStatusSummary('1.0800', '1.0200'),
      ).toBe('AHEAD_OF_SCHEDULE');
      expect(
        EarnedValueCalculator.determineStatusSummary('0.9200', '1.0000'),
      ).toBe('BEHIND_SCHEDULE');
      expect(
        EarnedValueCalculator.determineStatusSummary('0.9800', '0.9100'),
      ).toBe('COST_OVERRUN');
      expect(
        EarnedValueCalculator.determineStatusSummary('0.8500', '0.8800'),
      ).toBe('CRITICAL_DEVIATION');
    });

    it('deve gerar a série temporal completa da Curva S a partir de registros mensais', () => {
      const plannedSchedule = [
        {
          monthNumber: 1,
          periodDate: '2026-01',
          plannedMonthlyAmount: '10000000.00',
          plannedCumulativeAmount: '10000000.00',
          plannedCumulativeProgressPercent: '8.33',
        },
        {
          monthNumber: 2,
          periodDate: '2026-02',
          plannedMonthlyAmount: '15000000.00',
          plannedCumulativeAmount: '25000000.00',
          plannedCumulativeProgressPercent: '20.83',
        },
        {
          monthNumber: 3,
          periodDate: '2026-03',
          plannedMonthlyAmount: '20000000.00',
          plannedCumulativeAmount: '45000000.00',
          plannedCumulativeProgressPercent: '37.50',
        },
      ];

      const progressRecords = [
        {
          baselineId: 1,
          monthNumber: 1,
          periodDate: '2026-01',
          physicalProgressPercent: '8.33',
          plannedValueCumulative: '10000000.00',
          earnedValueCumulative: '10000000.00',
          actualCostCumulative: '9500000.00',
          monthlyMeasuredAmount: '9500000.00',
          createdBy: 'engenheiro.obra@engevix.com.br',
          createdAt: '2026-02-01T10:00:00.000Z',
        },
        {
          baselineId: 1,
          monthNumber: 2,
          periodDate: '2026-02',
          physicalProgressPercent: '18.00',
          plannedValueCumulative: '25000000.00',
          earnedValueCumulative: '21600000.00',
          actualCostCumulative: '23000000.00',
          monthlyMeasuredAmount: '13500000.00',
          createdBy: 'engenheiro.obra@engevix.com.br',
          createdAt: '2026-03-01T10:00:00.000Z',
        },
      ];

      const curveData = EarnedValueCalculator.generateCurveSData({
        baseline: mockBaseline,
        plannedSchedule,
        progressRecords,
      });

      expect(curveData.baselineId).toBe(1);
      expect(curveData.monthlySeries.length).toBe(3);
      // Mês 1: no prazo, custo menor
      expect(curveData.monthlySeries[0].schedulePerformanceIndex).toBe(
        '1.0000',
      );
      // Mês 2: atraso leve
      expect(curveData.monthlySeries[1].schedulePerformanceIndex).toBe(
        '0.8640',
      ); // 21.6M / 25M = 0.864
      // Mês 3: ainda sem medição (futuro)
      expect(curveData.monthlySeries[2].plannedValue).toBe('45000000.00');
      expect(curveData.monthlySeries[2].earnedValue).toBe('0.00');
    });
  });

  describe('ChangeOrderCalculator', () => {
    it('deve calcular o Current Working Estimate (CWE) consolidando aditivos aprovados e pendentes', () => {
      const changeOrders: ContractChangeOrder[] = [
        {
          id: 1,
          baselineId: 1,
          code: 'AD-01',
          title: 'Solo rochoso imprevisto e alteração para estacas raiz',
          type: 'GEOTECHNICAL_SOIL' as ChangeOrderType,
          status: 'APPROVED',
          requestedCostDelta: '1800000.00',
          approvedCostDelta: '1800000.00',
          scheduleDeltaMonths: 1,
          description: 'Ajuste de fundação em 15 estruturas',
          justification: 'Sondagens adicionais em campo',
          createdBy: 'eng.geotecnico@engevix.com.br',
          createdAt: '2026-04-10T10:00:00.000Z',
          updatedAt: '2026-04-12T10:00:00.000Z',
        },
        {
          id: 2,
          baselineId: 1,
          code: 'AD-02',
          title:
            'Aditivo de escopo - torre adicional para travessia de rodovia',
          type: 'SCOPE_ADDITION' as ChangeOrderType,
          status: 'APPROVED',
          requestedCostDelta: '600000.00',
          approvedCostDelta: '550000.00',
          scheduleDeltaMonths: 0,
          description:
            'Nova torre de ancoragem solicitada pela concessionária da rodovia',
          justification: 'Exigência da concessionária CCR',
          createdBy: 'eng.geral@engevix.com.br',
          createdAt: '2026-05-10T10:00:00.000Z',
          updatedAt: '2026-05-15T10:00:00.000Z',
        },
        {
          id: 3,
          baselineId: 1,
          code: 'PL-01',
          title: 'Pleito de chuvas extraordinárias e paralisação de canteiro',
          type: 'OTHER' as ChangeOrderType,
          status: 'SUBMITTED',
          requestedCostDelta: '900000.00',
          scheduleDeltaMonths: 1,
          description:
            'Pleito de ressarcimento de custos indiretos por excesso pluviométrico',
          justification:
            'Índices pluviométricos 3x acima da média histórica de 30 anos',
          createdBy: 'juridico@engevix.com.br',
          createdAt: '2026-06-01T10:00:00.000Z',
          updatedAt: '2026-06-01T10:00:00.000Z',
        },
      ];

      const cwe = ChangeOrderCalculator.calculateCwe({
        baseline: mockBaseline,
        changeOrders,
      });

      expect(cwe.baselineContractValue).toBe('120000000.00');
      expect(cwe.totalApprovedAdditivesCost).toBe('2350000.00'); // 1.8M + 550k = 2.35M
      expect(cwe.totalPendingAdditivesCost).toBe('900000.00');
      expect(cwe.approvedScheduleDeltaMonths).toBe(1);
      expect(cwe.currentWorkingEstimateValue).toBe('122350000.00'); // 120M + 2.35M
      expect(cwe.currentWorkingScheduleMonths).toBe(13); // 12 + 1
      expect(cwe.changeOrdersCount).toBe(3);
      expect(cwe.approvedChangeOrdersCount).toBe(2);
    });
  });

  describe('WbsGenerator', () => {
    it('deve gerar os pacotes de trabalho da EAP da Baseline com distribuição de pesos', () => {
      const workPackages = WbsGenerator.generateDefaultWorkPackages({
        totalContractValue: '120000000.00',
        totalBudgetCost: '100000000.00',
        civilCost: '27000000.00',
        electromechanicalCost: '30000000.00',
      });

      expect(workPackages.length).toBe(7);
      expect(workPackages[0].wbsCode).toBe('01.01');
      expect(workPackages[2].category).toBe('CIVIL_FOUNDATIONS');
      expect(workPackages[2].budgetedCost).toBe('27000000.00');

      const totalWeight = workPackages.reduce(
        (sum, wp) => sum + parseFloat(wp.weightPercent),
        0,
      );
      expect(Math.round(totalWeight)).toBe(100);
    });

    it('deve gerar o pacote de integração ERP canônico (SAP/TOTVS/Mega)', () => {
      const workPackages = WbsGenerator.generateDefaultWorkPackages({
        totalContractValue: '120000000.00',
        totalBudgetCost: '100000000.00',
      });

      const baselineWithPackages: WorkBaseline = {
        ...mockBaseline,
        workPackages,
      };

      const erpPackage = WbsGenerator.generateErpPackage({
        baseline: baselineWithPackages,
        offerCode: 'OFR-2026-001',
        offerName: 'LT 500kV Curitiba-Joinville',
        revisionNumber: 2,
        targetSystem: 'SAP',
        companyCode: '1000',
        generatedBy: 'controladoria@engevix.com.br',
        generatedAt: new Date('2026-01-15T12:00:00Z'),
      });

      expect(erpPackage.targetSystem).toBe('SAP');
      expect(erpPackage.companyCode).toBe('1000');
      expect(erpPackage.accounts.length).toBe(7);
      expect(erpPackage.monthlySchedule.length).toBe(7 * 12); // 7 contas x 12 meses
      expect(erpPackage.accounts[0].costCenterCode).toContain(
        'CC-OFR-2026-001-0101',
      );
    });
  });
});
