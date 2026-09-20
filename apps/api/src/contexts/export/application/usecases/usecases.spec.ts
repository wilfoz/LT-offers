import {
  ExportDataQueryPort,
  OfferExportData,
  OfferExportNotFoundException,
  SpreadsheetGeneratorPort,
} from '../../domain';
import {
  TenderSheetExportData,
  MeasurementSheetExportData,
  CashflowExportData,
  EconomicResultSummary,
  CashflowSummary,
} from '@lt-offers/domain';
import { EconomicsFacadeService } from '../../../economics';
import { GetPerformanceIndicatorsUseCase } from './get-performance-indicators.usecase';
import { GetTenderSheetDataUseCase } from './get-tender-sheet-data.usecase';
import { GetMeasurementSheetDataUseCase } from './get-measurement-sheet-data.usecase';
import { GetCashflowExportDataUseCase } from './get-cashflow-export-data.usecase';
import { GetFullOfferPackageUseCase } from './get-full-offer-package.usecase';
import { GenerateTenderSheetUseCase } from './generate-tender-sheet.usecase';
import { GenerateMeasurementSheetUseCase } from './generate-measurement-sheet.usecase';
import { GenerateCashflowSheetUseCase } from './generate-cashflow-sheet.usecase';

class InMemoryExportDataQueryAdapter implements ExportDataQueryPort {
  public offers = new Map<number, OfferExportData>();

  constructor() {
    this.offers.set(1, {
      id: 1,
      name: 'Oferta Lote 1 - Leilão 01/2026',
      code: 'PROP-001',
      client: 'Empresa Transmissora S.A.',
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      revisionNumber: 0,
      transmissionLines: [
        {
          id: 10,
          name: 'LT 500kV Trecho A',
          refinedLengthKm: '100.00',
          reportLengthKm: '100.00',
          voltageKv: 500,
        },
      ],
    });
  }

  async findOfferExportData(offerId: number): Promise<OfferExportData | null> {
    return this.offers.get(offerId) || null;
  }
}

class FakeSpreadsheetGenerator implements SpreadsheetGeneratorPort {
  public lastTenderData?: TenderSheetExportData;
  public lastMeasurementData?: MeasurementSheetExportData;
  public lastCashflowData?: CashflowExportData;

  async generateTenderSheet(data: TenderSheetExportData): Promise<Buffer> {
    this.lastTenderData = data;
    return Buffer.from('FAKE_TENDER_XLSX');
  }

  async generateMeasurementSheet(
    data: MeasurementSheetExportData,
  ): Promise<Buffer> {
    this.lastMeasurementData = data;
    return Buffer.from('FAKE_MEASUREMENT_XLSX');
  }

  async generateCashflowSheet(data: CashflowExportData): Promise<Buffer> {
    this.lastCashflowData = data;
    return Buffer.from('FAKE_CASHFLOW_XLSX');
  }
}

describe('Export Application Use Cases (M10, RF-47..RF-50, RF-60, RNF-11, RNF-18)', () => {
  let queryPort: InMemoryExportDataQueryAdapter;
  let fakeGenerator: FakeSpreadsheetGenerator;
  let mockEconomicsFacade: Partial<
    Record<keyof EconomicsFacadeService, jest.Mock>
  >;

  let getPerformanceIndicatorsUseCase: GetPerformanceIndicatorsUseCase;
  let getTenderSheetDataUseCase: GetTenderSheetDataUseCase;
  let getMeasurementSheetDataUseCase: GetMeasurementSheetDataUseCase;
  let getCashflowExportDataUseCase: GetCashflowExportDataUseCase;
  let getFullOfferPackageUseCase: GetFullOfferPackageUseCase;

  let generateTenderSheetUseCase: GenerateTenderSheetUseCase;
  let generateMeasurementSheetUseCase: GenerateMeasurementSheetUseCase;
  let generateCashflowSheetUseCase: GenerateCashflowSheetUseCase;

  beforeEach(() => {
    queryPort = new InMemoryExportDataQueryAdapter();
    fakeGenerator = new FakeSpreadsheetGenerator();

    const mockEconSummary = {
      offerId: '1',
      totalNetCost: '80000000.00',
      totalSalePrice: '100000000.00',
      bdi: {
        effectiveBdiRate: '25.00',
        margin: '10.00',
        centralAdministration: '4.00',
        contingency: '3.00',
        financialCost: '2.00',
        taxesGrossUp: '6.00',
      } as any,
      coefficients: {} as any,
    } as unknown as EconomicResultSummary;

    const mockCashflowSummary = {
      offerId: '1',
      totalOutflow: '80000000.00',
      totalInflow: '100000000.00',
      financialExposure: {
        peakMonth: 6,
        maxNegativeExposure: '-15000000.00',
        recommendedWorkingCapital: '15000000.00',
      },
      monthlyPoints: [
        {
          month: 1,
          materialsOutflow: '1000000.00',
          servicesOutflow: '500000.00',
          indirectsOutflow: '200000.00',
          totalOutflow: '1700000.00',
          accumulatedOutflow: '1700000.00',
          totalInflow: '0.00',
          accumulatedInflow: '0.00',
          netMonthlyCashflow: '-1700000.00',
          measurementBilling: '0.00',
          advanceBilling: '0.00',
          accumulatedCashflow: '-1700000.00',
        },
      ],
    } as unknown as CashflowSummary;

    const mockLineEconResult: Partial<EconomicResultSummary> = {
      lineId: '10',
      totalNetCost: '80000000.00',
      totalSalePrice: '100000000.00',
    };

    mockEconomicsFacade = {
      getConsolidatedEconomicResult: jest
        .fn()
        .mockResolvedValue(mockEconSummary),
      getConsolidatedCashflow: jest.fn().mockResolvedValue(mockCashflowSummary),
      getLineEconomicResult: jest.fn().mockResolvedValue(mockLineEconResult),
    };

    const econFacade = mockEconomicsFacade as unknown as EconomicsFacadeService;

    getPerformanceIndicatorsUseCase = new GetPerformanceIndicatorsUseCase(
      queryPort,
      econFacade,
    );
    getTenderSheetDataUseCase = new GetTenderSheetDataUseCase(
      queryPort,
      econFacade,
    );
    getMeasurementSheetDataUseCase = new GetMeasurementSheetDataUseCase(
      queryPort,
      econFacade,
    );
    getCashflowExportDataUseCase = new GetCashflowExportDataUseCase(
      queryPort,
      econFacade,
    );
    getFullOfferPackageUseCase = new GetFullOfferPackageUseCase(
      queryPort,
      econFacade,
      getPerformanceIndicatorsUseCase,
    );

    generateTenderSheetUseCase = new GenerateTenderSheetUseCase(
      getTenderSheetDataUseCase,
      fakeGenerator,
    );
    generateMeasurementSheetUseCase = new GenerateMeasurementSheetUseCase(
      getMeasurementSheetDataUseCase,
      fakeGenerator,
    );
    generateCashflowSheetUseCase = new GenerateCashflowSheetUseCase(
      getCashflowExportDataUseCase,
      fakeGenerator,
    );
  });

  describe('GetPerformanceIndicatorsUseCase', () => {
    it('deve retornar indicadores consolidados de desempenho e custo por km / torre', async () => {
      const result = await getPerformanceIndicatorsUseCase.execute(1);

      expect(result.offerId).toBe('1');
      expect(result.consolidated.lengthKm).toBe('100.00');
      expect(result.consolidated.towerCount).toBe(250);
      expect(result.consolidated.costPerKm).toBeDefined();
      expect(result.consolidated.costPerTower).toBeDefined();
    });

    it('deve lançar OfferExportNotFoundException quando oferta não existir', async () => {
      await expect(
        getPerformanceIndicatorsUseCase.execute(999),
      ).rejects.toThrow(OfferExportNotFoundException);
    });
  });

  describe('GetTenderSheetDataUseCase', () => {
    it('deve montar a planilha de preços do edital para o layout ANEEL_STANDARD com código CIP', async () => {
      const data = await getTenderSheetDataUseCase.execute(1, 'ANEEL_STANDARD');

      expect(data.offerId).toBe('1');
      expect(data.layout).toBe('ANEEL_STANDARD');
      expect(data.rows.length).toBeGreaterThan(0);
      expect(data.totalDirectCost).toBe('80000000.00');
      expect(data.totalSalePrice).toBe('100000000.00');
      expect(data.effectiveBdi).toBe('25.00');
      expect(data.rows.some((r) => r.cipCode?.startsWith('CIP-'))).toBe(true);
    });

    it('deve montar a planilha de preços do edital para o layout CELEO_STANDARD com prefixo CEL', async () => {
      const data = await getTenderSheetDataUseCase.execute(1, 'CELEO_STANDARD');

      expect(data.layout).toBe('CELEO_STANDARD');
      expect(data.rows.some((r) => r.cipCode?.startsWith('CEL-'))).toBe(true);
    });
  });

  describe('GetMeasurementSheetDataUseCase', () => {
    it('deve montar a folha de medição contratual com itens de PU', async () => {
      const data = await getMeasurementSheetDataUseCase.execute(1);

      expect(data.offerId).toBe('1');
      expect(data.items.length).toBe(10);
      expect(Number(data.totalContractAmount)).toBeGreaterThan(0);
    });
  });

  describe('GetCashflowExportDataUseCase', () => {
    it('deve montar o cronograma de desembolso e faturamento com pico financeiro', async () => {
      const data = await getCashflowExportDataUseCase.execute(1);

      expect(data.offerId).toBe('1');
      expect(data.peakExposureMonth).toBe(6);
      expect(data.months.length).toBe(1);
    });
  });

  describe('GetFullOfferPackageUseCase', () => {
    it('deve montar o pacote aberto integral em JSON sem vendor lock-in', async () => {
      const pkg = await getFullOfferPackageUseCase.execute(1);

      expect(pkg.metadata.schemaVersion).toBe('open-lt-offer-v1');
      expect(pkg.offer.id).toBe(1);
      expect(pkg.transmissionLines).toHaveLength(1);
      expect(pkg.pricingSummary).toBeDefined();
      expect(pkg.cashflow).toBeDefined();
      expect(pkg.performanceIndicators).toBeDefined();
    });
  });

  describe('Casos de uso de geração XLSX', () => {
    it('GenerateTenderSheetUseCase deve delegar à porta SpreadsheetGenerator e repassar os dados corretos', async () => {
      const buffer = await generateTenderSheetUseCase.execute(
        1,
        'ANEEL_STANDARD',
      );

      expect(buffer.toString()).toBe('FAKE_TENDER_XLSX');
      expect(fakeGenerator.lastTenderData?.offerId).toBe('1');
      expect(fakeGenerator.lastTenderData?.layout).toBe('ANEEL_STANDARD');
    });

    it('GenerateMeasurementSheetUseCase deve delegar à porta SpreadsheetGenerator', async () => {
      const buffer = await generateMeasurementSheetUseCase.execute(1);

      expect(buffer.toString()).toBe('FAKE_MEASUREMENT_XLSX');
      expect(fakeGenerator.lastMeasurementData?.offerId).toBe('1');
    });

    it('GenerateCashflowSheetUseCase deve delegar à porta SpreadsheetGenerator', async () => {
      const buffer = await generateCashflowSheetUseCase.execute(1);

      expect(buffer.toString()).toBe('FAKE_CASHFLOW_XLSX');
      expect(fakeGenerator.lastCashflowData?.offerId).toBe('1');
    });
  });
});
