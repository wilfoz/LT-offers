import { PricingService } from './pricing.service';
import { PrismaService } from '../app/prisma.service';
import { FoundationsService } from '../foundations/foundations.service';
import { TaxTablesService } from '../taxation/tax-tables.service';

describe('PricingService (RF-28..RF-34)', () => {
  let pricingService: PricingService;
  let prismaMock: {
    transmissionLine: {
      findUnique: jest.Mock;
    };
  };
  let foundationsServiceMock: {
    getLineFoundationSummary: jest.Mock;
  };
  let taxTablesService: TaxTablesService;

  beforeEach(() => {
    prismaMock = {
      transmissionLine: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          name: 'LT 500 kV Poções III - Padre Paraíso C1',
          code: 'LT-500-01',
          refinedLengthKm: '100.0',
          reportLengthKm: '100.0',
          nominalVoltageKv: '500',
          destinationStatePrimary: 'MG',
          destinationPercentagePrimary: '100.0',
          offerRevision: {
            offer: {
              code: 'OFR-001',
            },
          },
        }),
      },
    };

    foundationsServiceMock = {
      getLineFoundationSummary: jest.fn().mockResolvedValue({
        lineId: 1,
        materials: [
          {
            field: 'concreteFootingsM3',
            name: 'Concreto Estrutural de Sapata',
            family: 'CONCRETE',
            unit: 'm³',
            totalQuantity: '500.000',
          },
        ],
      }),
    };

    taxTablesService = new TaxTablesService();

    pricingService = new PricingService(
      prismaMock as unknown as PrismaService,
      foundationsServiceMock as unknown as FoundationsService,
      taxTablesService,
    );
  });

  it('deve calcular o resumo financeiro e tributário da linha com sucesso', async () => {
    const summary = await pricingService.calculateLinePricing(1, { taxRegime: 'REIDI' });

    expect(summary.lineId).toBe('1');
    expect(summary.taxRegime).toBe('REIDI');
    expect(summary.items.length).toBeGreaterThan(0);
    expect(summary.totalNetAmount).toBeGreaterThan(0);
    expect(summary.totalGrossAmount).toBeGreaterThan(summary.totalNetAmount);
    expect(summary.totalReidiSavings).toBeGreaterThan(0);
    expect(summary.missingPriceItemCodes.length).toBe(0);
  });

  it('deve suportar simulação alterando regime e cotações de commodities', async () => {
    const summary = await pricingService.calculateLinePricing(1, {
      taxRegime: 'STANDARD',
      spotLmeUsdPerTon: 2800,
      spotExchangeRateBrl: 6.0,
    });

    expect(summary.taxRegime).toBe('STANDARD');
    expect(summary.totalPisAmount).toBeGreaterThan(0);
    expect(summary.totalCofinsAmount).toBeGreaterThan(0);
    expect(summary.totalReidiSavings).toBe(0);
  });
});
