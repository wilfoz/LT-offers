import {
  ServiceBudgetItem,
  ServiceBudgetSummary,
  SaleCoefficients,
  EconomicResultSummary,
  CashflowSummary,
} from '../../index';

describe('Phase F5 Domain Contracts (M09, M10, M11)', () => {
  it('should instantiate a valid ServiceBudgetItem and ServiceBudgetSummary', () => {
    const item: ServiceBudgetItem = {
      id: 'srv-1',
      lineId: 'line-1',
      code: 'SRV_CIVIL_01',
      name: 'Escavação e Concreto de Fundações',
      group: 'CIVIL_WORKS',
      cipCode: 'GR01.02.01',
      costSource: 'SCHEDULE_DIRECT',
      quantity: '120.00',
      unit: 'fundação',
      unitDirectCost: '15000.00',
      totalDirectCost: '1800000.00',
      bdiPercentage: '24.50',
      unitSalePrice: '18675.00',
      totalSalePrice: '2241000.00',
    };

    const summary: ServiceBudgetSummary = {
      lineId: 'line-1',
      lineName: 'LT 500 kV Exemplo',
      lineLengthKm: '100.00',
      totalTowers: 250,
      items: [item],
      totalDirectCost: '1800000.00',
      totalSalePrice: '2241000.00',
      ratios: {
        costPerKm: '18000.00',
        costPerTower: '7200.00',
        salePricePerKm: '22410.00',
        salePricePerTower: '8964.00',
      },
      byGroup: {
        CIVIL_WORKS: {
          totalDirectCost: '1800000.00',
          totalSalePrice: '2241000.00',
          costPerKm: '18000.00',
          costPerTower: '7200.00',
        },
        PRELIMINARY_WORKS: {
          totalDirectCost: '0.00',
          totalSalePrice: '0.00',
          costPerKm: '0.00',
          costPerTower: '0.00',
        },
        ASSEMBLY_WORKS: {
          totalDirectCost: '0.00',
          totalSalePrice: '0.00',
          costPerKm: '0.00',
          costPerTower: '0.00',
        },
        STRINGING_WORKS: {
          totalDirectCost: '0.00',
          totalSalePrice: '0.00',
          costPerKm: '0.00',
          costPerTower: '0.00',
        },
        COMMISSIONING: {
          totalDirectCost: '0.00',
          totalSalePrice: '0.00',
          costPerKm: '0.00',
          costPerTower: '0.00',
        },
        INDIRECTS_SUPPORT: {
          totalDirectCost: '0.00',
          totalSalePrice: '0.00',
          costPerKm: '0.00',
          costPerTower: '0.00',
        },
      },
    };

    expect(summary.items.length).toBe(1);
    expect(summary.ratios.costPerKm).toBe('18000.00');
  });

  it('should instantiate EconomicResultSummary and SaleCoefficients', () => {
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

    const ecoSummary: EconomicResultSummary = {
      offerId: 'offer-1',
      lines: [
        {
          category: 'SERVICES',
          description: 'Serviços de Campo',
          netCost: '1800000.00',
          pisCofins: '166500.00',
          ipi: '0.00',
          icmsOrigin: '0.00',
          difal: '0.00',
          fecoep: '0.00',
          costWithTaxes: '1966500.00',
          directBilling: '0.00',
          ownCost: '1966500.00',
          salePrice: '2526952.50',
        },
      ],
      totalNetCost: '1800000.00',
      totalPisCofins: '166500.00',
      totalIpi: '0.00',
      totalIcmsOrigin: '0.00',
      totalDifal: '0.00',
      totalFecoep: '0.00',
      totalCostWithTaxes: '1966500.00',
      totalDirectBilling: '0.00',
      totalOwnCost: '1966500.00',
      totalSalePrice: '2526952.50',
      grossProfit: '560452.50',
      grossMarginPercent: '22.18',
      netMarginPercent: '8.00',
      coefficients: coeffs,
      bdi: {
        totalIndirectRate: '12.80',
        grossMarginRate: '22.18',
        effectiveBdiRate: '28.50',
        bdiMultiplier: '1.2850',
      },
    };

    expect(ecoSummary.lines.length).toBe(1);
    expect(ecoSummary.coefficients.targetMarginRate).toBe('8.00');
  });

  it('should instantiate CashflowSummary with peak exposure', () => {
    const cashflow: CashflowSummary = {
      offerId: 'offer-1',
      totalMonths: 12,
      monthlyPoints: [
        {
          month: 1,
          materialsOutflow: '50000.00',
          servicesOutflow: '100000.00',
          indirectsOutflow: '20000.00',
          totalOutflow: '170000.00',
          accumulatedOutflow: '170000.00',
          measurementBilling: '0.00',
          advanceBilling: '50000.00',
          totalInflow: '50000.00',
          accumulatedInflow: '50000.00',
          netMonthlyCashflow: '-120000.00',
          accumulatedCashflow: '-120000.00',
        },
      ],
      totalOutflow: '170000.00',
      totalInflow: '50000.00',
      finalAccumulatedBalance: '-120000.00',
      financialExposure: {
        peakMonth: 1,
        maxNegativeExposure: '120000.00',
        recommendedWorkingCapital: '150000.00',
      },
    };

    expect(cashflow.financialExposure.peakMonth).toBe(1);
    expect(cashflow.financialExposure.maxNegativeExposure).toBe('120000.00');
  });
});
