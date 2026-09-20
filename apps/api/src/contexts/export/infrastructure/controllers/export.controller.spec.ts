import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { ExportController } from './export.controller';
import { AuthService } from '../../../../auth/auth.service';
import {
  GetPerformanceIndicatorsUseCase,
  GetTenderSheetDataUseCase,
  GetMeasurementSheetDataUseCase,
  GetCashflowExportDataUseCase,
  GetFullOfferPackageUseCase,
  GenerateTenderSheetUseCase,
  GenerateMeasurementSheetUseCase,
  GenerateCashflowSheetUseCase,
} from '../../application/usecases';
import { OfferExportNotFoundException } from '../../domain';
import {
  PerformanceIndicatorsSummary,
  TenderSheetExportData,
  MeasurementSheetExportData,
  CashflowExportData,
  FullOfferPackage,
} from '@lt-offers/domain';

describe('ExportController (RF-47, RF-48, RF-49, RF-50, RF-60, RNF-18)', () => {
  let controller: ExportController;

  let mockGetPerformanceIndicatorsUseCase: { execute: jest.Mock };
  let mockGetTenderSheetDataUseCase: { execute: jest.Mock };
  let mockGetMeasurementSheetDataUseCase: { execute: jest.Mock };
  let mockGetCashflowExportDataUseCase: { execute: jest.Mock };
  let mockGetFullOfferPackageUseCase: { execute: jest.Mock };
  let mockGenerateTenderSheetUseCase: { execute: jest.Mock };
  let mockGenerateMeasurementSheetUseCase: { execute: jest.Mock };
  let mockGenerateCashflowSheetUseCase: { execute: jest.Mock };

  const mockIndicators: PerformanceIndicatorsSummary = {
    offerId: '1',
    consolidated: {
      lengthKm: '100.00',
      towerCount: 250,
      costPerKm: '1000000.00',
      costPerTower: '400000.00',
      suppliesCostPerKm: '620000.00',
      suppliesCostPerTower: '248000.00',
      servicesCostPerKm: '380000.00',
      servicesCostPerTower: '152000.00',
      structuresDensityPerKm: '2.50',
      averageSpanMeters: '400.00',
      concretePerKm: '120.00',
      concretePerTower: '48.00',
      steelPerKm: '45.00',
      steelPerTower: '18.00',
    },
    byLine: [],
  };

  const mockTenderData: TenderSheetExportData = {
    offerId: '1',
    offerName: 'Oferta 1',
    revisionNumber: 0,
    layout: 'ANEEL_STANDARD',
    generatedAt: '2026-03-01T00:00:00.000Z',
    rows: [],
    totalDirectCost: '80000000.00',
    totalSalePrice: '100000000.00',
    effectiveBdi: '25.00',
  };

  const mockMeasurementData: MeasurementSheetExportData = {
    offerId: '1',
    offerName: 'Oferta 1',
    revisionNumber: 0,
    generatedAt: '2026-03-01T00:00:00.000Z',
    items: [],
    totalContractAmount: '100000000.00',
  };

  const mockCashflowData: CashflowExportData = {
    offerId: '1',
    offerName: 'Oferta 1',
    revisionNumber: 0,
    generatedAt: '2026-03-01T00:00:00.000Z',
    months: [],
    peakExposureMonth: 6,
    peakExposureAmount: '-15000000.00',
    totalDisbursement: '80000000.00',
    totalBilling: '100000000.00',
  };

  const mockFullPackage: FullOfferPackage = {
    metadata: {
      exportTimestamp: '2026-03-01T00:00:00.000Z',
      version: '1.0.0',
      schemaVersion: 'open-lt-offer-v1',
    },
    offer: { id: 1 },
    transmissionLines: [],
    staking: [],
    pricingSummary: {},
    bdiParameters: {},
    cashflow: {},
    risks: [],
    governance: {},
    performanceIndicators: mockIndicators,
  };

  beforeEach(async () => {
    mockGetPerformanceIndicatorsUseCase = {
      execute: jest.fn().mockResolvedValue(mockIndicators),
    };
    mockGetTenderSheetDataUseCase = {
      execute: jest.fn().mockResolvedValue(mockTenderData),
    };
    mockGetMeasurementSheetDataUseCase = {
      execute: jest.fn().mockResolvedValue(mockMeasurementData),
    };
    mockGetCashflowExportDataUseCase = {
      execute: jest.fn().mockResolvedValue(mockCashflowData),
    };
    mockGetFullOfferPackageUseCase = {
      execute: jest.fn().mockResolvedValue(mockFullPackage),
    };
    mockGenerateTenderSheetUseCase = {
      execute: jest.fn().mockResolvedValue(Buffer.from('fake-tender-xlsx')),
    };
    mockGenerateMeasurementSheetUseCase = {
      execute: jest
        .fn()
        .mockResolvedValue(Buffer.from('fake-measurement-xlsx')),
    };
    mockGenerateCashflowSheetUseCase = {
      execute: jest.fn().mockResolvedValue(Buffer.from('fake-cashflow-xlsx')),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportController],
      providers: [
        {
          provide: GetPerformanceIndicatorsUseCase,
          useValue: mockGetPerformanceIndicatorsUseCase,
        },
        {
          provide: GetTenderSheetDataUseCase,
          useValue: mockGetTenderSheetDataUseCase,
        },
        {
          provide: GetMeasurementSheetDataUseCase,
          useValue: mockGetMeasurementSheetDataUseCase,
        },
        {
          provide: GetCashflowExportDataUseCase,
          useValue: mockGetCashflowExportDataUseCase,
        },
        {
          provide: GetFullOfferPackageUseCase,
          useValue: mockGetFullOfferPackageUseCase,
        },
        {
          provide: GenerateTenderSheetUseCase,
          useValue: mockGenerateTenderSheetUseCase,
        },
        {
          provide: GenerateMeasurementSheetUseCase,
          useValue: mockGenerateMeasurementSheetUseCase,
        },
        {
          provide: GenerateCashflowSheetUseCase,
          useValue: mockGenerateCashflowSheetUseCase,
        },
        AuthService,
      ],
    }).compile();

    controller = module.get<ExportController>(ExportController);
  });

  it('should return performance indicators', async () => {
    const res = await controller.getPerformanceIndicators(1);
    expect(res).toEqual(mockIndicators);
    expect(mockGetPerformanceIndicatorsUseCase.execute).toHaveBeenCalledWith(1);
  });

  it('should return tender sheet structured data', async () => {
    const res = await controller.getTenderSheetData(1, 'ANEEL_STANDARD');
    expect(res).toEqual(mockTenderData);
    expect(mockGetTenderSheetDataUseCase.execute).toHaveBeenCalledWith(
      1,
      'ANEEL_STANDARD',
    );
  });

  it('should download tender sheet XLSX binary file with exact headers and filename', async () => {
    const mockRes = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    await controller.downloadTenderSheet(1, 'ANEEL_STANDARD', mockRes);

    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="Planilha_Precos_Edital_Oferta_1_ANEEL_STANDARD.xlsx"',
    );
    expect(mockRes.send).toHaveBeenCalledWith(Buffer.from('fake-tender-xlsx'));
  });

  it('should return measurement sheet data and download XLSX with exact headers', async () => {
    const mockRes = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    const data = await controller.getMeasurementSheetData(1);
    expect(data).toEqual(mockMeasurementData);

    await controller.downloadMeasurementSheet(1, mockRes);
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="Folha_Medicao_Contratual_Oferta_1.xlsx"',
    );
    expect(mockRes.send).toHaveBeenCalledWith(
      Buffer.from('fake-measurement-xlsx'),
    );
  });

  it('should return cashflow data and download XLSX with exact headers', async () => {
    const mockRes = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    const data = await controller.getCashflowExportData(1);
    expect(data).toEqual(mockCashflowData);

    await controller.downloadCashflowSheet(1, mockRes);
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="Cronograma_Faturamento_Desembolso_Oferta_1.xlsx"',
    );
    expect(mockRes.send).toHaveBeenCalledWith(
      Buffer.from('fake-cashflow-xlsx'),
    );
  });

  it('should return full offer package in open JSON (RNF-18)', async () => {
    const pkg = await controller.getFullOfferPackage(1);
    expect(pkg).toEqual(mockFullPackage);
    expect(mockGetFullOfferPackageUseCase.execute).toHaveBeenCalledWith(1);
  });

  it('should translate OfferExportNotFoundException to NestJS NotFoundException', async () => {
    mockGetPerformanceIndicatorsUseCase.execute.mockRejectedValueOnce(
      new OfferExportNotFoundException(999),
    );

    await expect(controller.getPerformanceIndicators(999)).rejects.toThrow(
      NotFoundException,
    );
  });
});
