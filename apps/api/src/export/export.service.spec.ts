import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import { ExcelGeneratorService } from './excel-generator.service';
import { PrismaService } from '../app/prisma.service';
import { EconomicResultService } from '../economic-result/economic-result.service';
import { CashflowService } from '../cashflow/cashflow.service';

describe('ExportService (RF-47, RF-48, RF-49, RF-50, RF-60, RNF-18)', () => {
  let service: ExportService;
  let excelGenerator: ExcelGeneratorService;

  const mockPrismaService = {
    offer: {
      findUnique: jest.fn().mockResolvedValue({
        id: 1,
        name: 'Oferta LT 500kV Teste',
        revisions: [
          {
            id: 1,
            revisionNumber: 0,
            transmissionLines: [
              {
                id: 1,
                name: 'Linha Principal 500kV',
                refinedLengthKm: 150,
                voltageKv: 500,
              },
            ],
          },
        ],
      }),
    },
  };

  const mockEconomicResultService = {
    getLineEconomicResult: jest.fn().mockResolvedValue({
      totalNetCost: '100000000.00',
      totalCostWithTaxes: '120000000.00',
      totalSalePrice: '150000000.00',
      bdi: {
        effectiveBdiRate: '25.00',
      },
    }),
    getConsolidatedEconomicResult: jest.fn().mockResolvedValue({
      totalNetCost: '100000000.00',
      totalCostWithTaxes: '120000000.00',
      totalSalePrice: '150000000.00',
      bdi: {
        effectiveBdiRate: '25.00',
      },
      coefficients: {
        targetMarginRate: '8.00',
      },
    }),
  };

  const mockCashflowService = {
    getConsolidatedCashflow: jest.fn().mockResolvedValue({
      offerId: '1',
      totalMonths: 18,
      totalOutflow: '120000000.00',
      totalInflow: '150000000.00',
      finalAccumulatedBalance: '30000000.00',
      financialExposure: {
        peakMonth: 6,
        maxNegativeExposure: '25000000.00',
      },
      monthlyPoints: [
        {
          month: 1,
          materialsOutflow: '0.00',
          servicesOutflow: '1000000.00',
          indirectsOutflow: '500000.00',
          totalOutflow: '1500000.00',
          accumulatedOutflow: '1500000.00',
          totalInflow: '0.00',
          accumulatedInflow: '0.00',
          netMonthlyCashflow: '-1500000.00',
          accumulatedCashflow: '-1500000.00',
        },
      ],
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        ExcelGeneratorService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EconomicResultService, useValue: mockEconomicResultService },
        { provide: CashflowService, useValue: mockCashflowService },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
    excelGenerator = module.get<ExcelGeneratorService>(ExcelGeneratorService);
  });

  it('should calculate performance indicators summary for the offer (RF-49)', async () => {
    const indicators = await service.getPerformanceIndicators(1);
    expect(indicators.offerId).toBe('1');
    expect(indicators.consolidated.lengthKm).toBe('150.00');
    expect(Number(indicators.consolidated.costPerKm)).toBeGreaterThan(0);
    expect(indicators.byLine).toHaveLength(1);
  });

  it('should get tender sheet data structured with CIP codes (RF-47, RF-50)', async () => {
    const data = await service.getTenderSheetData(1, 'ANEEL_STANDARD');
    expect(data.offerId).toBe('1');
    expect(data.layout).toBe('ANEEL_STANDARD');
    expect(data.rows.length).toBeGreaterThan(5);
    expect(data.rows.some((r) => r.cipCode.includes('CIP-02'))).toBe(true);
  });

  it('should get measurement sheet data structured with criteria (RF-48)', async () => {
    const data = await service.getMeasurementSheetData(1);
    expect(data.offerId).toBe('1');
    expect(data.items.length).toBe(10);
    expect(data.items[0].itemCode).toContain('M1');
  });

  it('should get cashflow export data with peak exposure identified (RF-60)', async () => {
    const data = await service.getCashflowExportData(1);
    expect(data.offerId).toBe('1');
    expect(data.peakExposureMonth).toBe(6);
    expect(data.months.length).toBe(1);
  });

  it('should build full offer package JSON without vendor lock-in (RNF-18)', async () => {
    const pkg = await service.getFullOfferPackage(1);
    expect(pkg.metadata.schemaVersion).toBe('open-lt-offer-v1');
    expect(pkg.offer.name).toBe('Oferta LT 500kV Teste');
    expect(pkg.performanceIndicators).toBeDefined();
    expect(pkg.pricingSummary).toBeDefined();
  });

  it('should generate binary XLSX buffers for exports', async () => {
    const tenderBuffer = await service.exportTenderSheet(1, 'ANEEL_STANDARD');
    expect(tenderBuffer).toBeInstanceOf(Buffer);

    const measurementBuffer = await service.exportMeasurementSheet(1);
    expect(measurementBuffer).toBeInstanceOf(Buffer);

    const cashflowBuffer = await service.exportCashflowSheet(1);
    expect(cashflowBuffer).toBeInstanceOf(Buffer);
  });
});
