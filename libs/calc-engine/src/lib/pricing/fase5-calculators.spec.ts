import {
  ServiceBudgetCalculator,
  ServiceBudgetCalculationInput,
} from '../services/service-budget-calculator';
import {
  EconomicResultCalculator,
  EconomicResultInput,
} from './economic-result-calculator';
import {
  CashflowCalculator,
  CashflowCalculationInput,
} from '../cashflow/cashflow-calculator';
import { SaleCoefficients } from '@lt-offers/domain';

describe('Fase F5 Calculation Engines (M09, M10, M11)', () => {
  describe('ServiceBudgetCalculator (M09 / RF-46..RF-50)', () => {
    it('should consolidate service items, calculate CIP BDI, and compute ratios', () => {
      const input: ServiceBudgetCalculationInput = {
        lineId: 'line-1',
        lineName: 'LT 500 kV Bacabeira - Miranda',
        lineLengthKm: '100.00',
        totalTowers: 200,
        defaultBdiPercentage: '24.50',
        items: [
          {
            id: 'srv-1',
            code: 'SRV_CIV_01',
            name: 'Escavação e Concreto de Fundações',
            group: 'CIVIL_WORKS',
            cipCode: 'GR01.02.01',
            costSource: 'SCHEDULE_DIRECT',
            quantity: '200',
            unit: 'fundação',
            unitDirectCost: '10000.00', // Total: 2.000.000
          },
          {
            id: 'srv-2',
            code: 'SRV_MONT_01',
            name: 'Montagem Eletromecânica de Torres',
            group: 'ASSEMBLY_WORKS',
            cipCode: 'GR02.01.01',
            costSource: 'SCHEDULE_DIRECT',
            quantity: '200',
            unit: 'torre',
            unitDirectCost: '15000.00', // Total: 3.000.000
          },
          {
            id: 'srv-3',
            code: 'SRV_SUP_01',
            name: 'Supressão e Limpeza de Faixa',
            group: 'PRELIMINARY_WORKS',
            cipCode: 'GR01.01.01',
            costSource: 'SUBCONTRACT_QUOTED',
            quantity: '100',
            unit: 'km',
            unitDirectCost: '5000.00', // Total: 500.000
          },
        ],
      };

      const result = ServiceBudgetCalculator.calculateServiceBudget(input);

      expect(result.totalDirectCost).toBe('5500000.00');
      // 5.500.000 * 1.245 = 6.847.500
      expect(result.totalSalePrice).toBe('6847500.00');

      // Ratios
      // Custo por km = 5.500.000 / 100 = 55.000
      expect(result.ratios.costPerKm).toBe('55000.00');
      // Custo por torre = 5.500.000 / 200 = 27.500
      expect(result.ratios.costPerTower).toBe('27500.00');
      // Preço de venda por km = 6.847.500 / 100 = 68.475
      expect(result.ratios.salePricePerKm).toBe('68475.00');
      // Preço de venda por torre = 6.847.500 / 200 = 34.237,50
      expect(result.ratios.salePricePerTower).toBe('34237.50');

      // Group totals
      expect(result.byGroup.CIVIL_WORKS.totalDirectCost).toBe('2000000.00');
      expect(result.byGroup.CIVIL_WORKS.totalSalePrice).toBe('2490000.00');
    });
  });

  describe('EconomicResultCalculator (M10 / RF-51..RF-56)', () => {
    const coeffs: SaleCoefficients = {
      guaranteesRate: '1.50',
      insurancesRate: '1.00',
      productionTaxRate: '5.65',
      iddeRate: '0.50',
      countryRiskRate: '1.00',
      financialCostRate: '1.80',
      contingencyRate: '2.50',
      centralStructureRate: '4.50',
      targetMarginRate: '8.00',
    };

    it('should calculate BDI decomposition correctly according to standard formula', () => {
      // Total indirect = 1.5 + 1.0 + 0.5 + 1.0 + 1.8 + 2.5 + 4.5 = 12.80%
      // Deductions = 5.65 + 8.00 = 13.65%
      // Numerator = 1 + 0.1280 = 1.1280
      // Denominator = 1 - 0.1365 = 0.8635
      // BDI Multiplier = 1.1280 / 0.8635 = 1.3063115... => 1.3063
      // Effective BDI Rate = 30.63%
      const bdi = EconomicResultCalculator.calculateBdi(coeffs);

      expect(bdi.totalIndirectRate).toBe('12.80');
      expect(bdi.bdiMultiplier).toBe('1.3063');
      expect(bdi.effectiveBdiRate).toBe('30.63');
    });

    it('should generate Quadro R with detailed tax columns and calculate degradation', () => {
      const input: EconomicResultInput = {
        offerId: 'offer-1',
        lineId: 'line-1',
        lineName: 'Linha 1',
        materials: {
          netCost: '10000000.00',
          pisCofins: '925000.00',
          ipi: '500000.00',
          icmsOrigin: '1200000.00',
          difal: '600000.00',
          fecoep: '200000.00',
          costWithTaxes: '13425000.00',
          directBilling: '2000000.00', // 2M faturado direto
        },
        services: {
          netCost: '5500000.00',
          pisCofins: '508750.00',
          costWithTaxes: '6008750.00',
          directBilling: '0.00',
        },
        indirectsCamps: {
          netCost: '1500000.00',
          costWithTaxes: '1500000.00',
        },
        coefficients: coeffs,
        ipcaAnnualRate: '4.50',
        projectDurationMonths: 18,
      };

      const result = EconomicResultCalculator.calculateEconomicResult(input);

      expect(result.lines.length).toBe(3);
      expect(result.totalCostWithTaxes).toBe('20933750.00');
      expect(result.totalDirectBilling).toBe('2000000.00');
      // Total Own Cost = 20.933.750 - 2.000.000 = 18.933.750
      expect(result.totalOwnCost).toBe('18933750.00');

      // Total Sale Price = (18.933.750 * 1.3063) + 2.000.000
      expect(Number(result.totalSalePrice)).toBeGreaterThan(26000000);
      expect(result.ipcaTotalDegradationCost).toBeDefined();
    });

    it('should execute bidirectional margin and price simulations (RF-53)', () => {
      const input: EconomicResultInput = {
        offerId: 'offer-1',
        materials: {
          netCost: '10000000.00',
          pisCofins: '0.00',
          ipi: '0.00',
          icmsOrigin: '0.00',
          difal: '0.00',
          fecoep: '0.00',
          costWithTaxes: '10000000.00',
        },
        services: {
          netCost: '5000000.00',
          costWithTaxes: '5000000.00',
        },
        indirectsCamps: {
          netCost: '1000000.00',
          costWithTaxes: '1000000.00',
        },
        coefficients: coeffs,
      };

      const baseSummary = EconomicResultCalculator.calculateEconomicResult(input);

      // Simulação 1: Forçar margem de 12%
      const sim1 = EconomicResultCalculator.simulateMarginOrPrice(baseSummary, {
        targetMarginRate: '12.00',
      });
      expect(sim1.resultingNetMarginRate).toBe('12.00');
      expect(Number(sim1.simulatedSalePrice)).toBeGreaterThan(Number(baseSummary.totalSalePrice));

      // Simulação 2: Forçar preço fixo menor (desconto)
      const forcedPrice = '20000000.00';
      const sim2 = EconomicResultCalculator.simulateMarginOrPrice(baseSummary, {
        forcedSalePrice: forcedPrice,
      });
      expect(sim2.simulatedSalePrice).toBe('20000000.00');
      expect(Number(sim2.resultingNetMarginRate)).toBeLessThan(8.0);
    });

    it('should compare two revisions and decompose variations by cause (RF-56)', () => {
      const input1: EconomicResultInput = {
        offerId: 'offer-1',
        materials: { netCost: '10000000', pisCofins: '0', ipi: '0', icmsOrigin: '0', difal: '0', fecoep: '0', costWithTaxes: '10000000' },
        services: { netCost: '5000000', costWithTaxes: '5000000' },
        indirectsCamps: { netCost: '1000000', costWithTaxes: '1000000' },
        coefficients: coeffs,
      };

      const input2: EconomicResultInput = {
        offerId: 'offer-1',
        materials: { netCost: '12000000', pisCofins: '0', ipi: '0', icmsOrigin: '0', difal: '0', fecoep: '0', costWithTaxes: '12000000' },
        services: { netCost: '6000000', costWithTaxes: '6000000' },
        indirectsCamps: { netCost: '1000000', costWithTaxes: '1000000' },
        coefficients: coeffs,
      };

      const rev0 = EconomicResultCalculator.calculateEconomicResult(input1);
      const rev1 = EconomicResultCalculator.calculateEconomicResult(input2);

      const comparison = EconomicResultCalculator.compareRevisions(rev0, rev1, 0, 1);

      expect(comparison.baseRevisionNumber).toBe(0);
      expect(comparison.targetRevisionNumber).toBe(1);
      expect(Number(comparison.deltaSalePrice)).toBeGreaterThan(0);
      expect(comparison.breakdownByCause.servicesDelta).toBe('1000000.00');
    });
  });

  describe('CashflowCalculator (M11 / RF-57..RF-60)', () => {
    it('should distribute outflows, calculate billing, and identify peak financial exposure', () => {
      const input: CashflowCalculationInput = {
        offerId: 'offer-1',
        totalMonths: 6,
        totalSalePrice: '30000000.00',
        advancePaymentRate: '10.00', // 3.000.000 no Mês 1
        retentionRate: '5.00',
        billingLagMonths: 1,
        disbursements: [
          {
            itemId: 'mat-1',
            type: 'MATERIALS',
            totalCost: '12000000.00',
            monthlyCostPercentages: {
              1: '10', // 1.2M
              2: '30', // 3.6M
              3: '30', // 3.6M
              4: '20', // 2.4M
              5: '10', // 1.2M
              6: '0',
            },
          },
          {
            itemId: 'srv-1',
            type: 'SERVICES',
            totalCost: '6000000.00',
            monthlyCostPercentages: {
              1: '10', // 600k
              2: '20', // 1.2M
              3: '30', // 1.8M
              4: '20', // 1.2M
              5: '10', // 600k
              6: '10', // 600k
            },
          },
        ],
        monthlyPhysicalProgressPercentages: {
          1: '10', // 10% medido em M1 -> faturado em M2
          2: '20', // faturado em M3
          3: '30', // faturado em M4
          4: '20', // faturado em M5
          5: '10', // faturado em M6
          6: '10', // liberado em M6
        },
      };

      const result = CashflowCalculator.calculateCashflow(input);

      expect(result.monthlyPoints.length).toBe(6);
      expect(result.totalOutflow).toBe('18000000.00');
      expect(result.totalInflow).toBe('30000000.00');
      // Lucro final = 30M - 18M = 12M
      expect(result.finalAccumulatedBalance).toBe('12000000.00');

      // Mês 1 deve ter entrada do adiantamento de 3M
      expect(result.monthlyPoints[0].advanceBilling).toBe('3000000.00');
      expect(result.monthlyPoints[0].totalInflow).toBe('3000000.00');

      // Verificação do pico de exposição
      expect(result.financialExposure).toBeDefined();
      expect(result.financialExposure.recommendedWorkingCapital).toBeDefined();
    });
  });
});
