import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { AuthService } from '../auth/auth.service';

describe('ExportController (RF-47, RF-48, RF-49, RF-50, RF-60, RNF-18)', () => {
  let controller: ExportController;
  let service: ExportService;

  const mockExportService = {
    getPerformanceIndicators: jest.fn().mockResolvedValue({
      offerId: '1',
      consolidated: { lengthKm: '100.00', costPerKm: '1000000.00' },
      byLine: [],
    }),
    getTenderSheetData: jest.fn().mockResolvedValue({
      offerId: '1',
      layout: 'ANEEL_STANDARD',
      rows: [],
    }),
    exportTenderSheet: jest
      .fn()
      .mockResolvedValue(Buffer.from('fake-xlsx-content')),
    getMeasurementSheetData: jest.fn().mockResolvedValue({
      offerId: '1',
      items: [],
    }),
    exportMeasurementSheet: jest
      .fn()
      .mockResolvedValue(Buffer.from('fake-xlsx-content')),
    getCashflowExportData: jest.fn().mockResolvedValue({
      offerId: '1',
      months: [],
    }),
    exportCashflowSheet: jest
      .fn()
      .mockResolvedValue(Buffer.from('fake-xlsx-content')),
    getFullOfferPackage: jest.fn().mockResolvedValue({
      metadata: { schemaVersion: 'open-lt-offer-v1' },
      offer: { id: 1 },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportController],
      providers: [
        { provide: ExportService, useValue: mockExportService },
        AuthService,
      ],
    }).compile();

    controller = module.get<ExportController>(ExportController);
    service = module.get<ExportService>(ExportService);
  });

  it('should return performance indicators', async () => {
    const res = await controller.getPerformanceIndicators(1);
    expect(res.offerId).toBe('1');
    expect(service.getPerformanceIndicators).toHaveBeenCalledWith(1);
  });

  it('should return tender sheet structured data', async () => {
    const res = await controller.getTenderSheetData(1, 'ANEEL_STANDARD');
    expect(res.offerId).toBe('1');
    expect(service.getTenderSheetData).toHaveBeenCalledWith(
      1,
      'ANEEL_STANDARD',
    );
  });

  it('should download tender sheet XLSX binary file', async () => {
    const mockRes = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    await controller.downloadTenderSheet(1, 'ANEEL_STANDARD', mockRes);
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(mockRes.send).toHaveBeenCalled();
  });

  it('should return measurement sheet data and download XLSX', async () => {
    const mockRes = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    const data = await controller.getMeasurementSheetData(1);
    expect(data.offerId).toBe('1');

    await controller.downloadMeasurementSheet(1, mockRes);
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(mockRes.send).toHaveBeenCalled();
  });

  it('should return cashflow data and download XLSX', async () => {
    const mockRes = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    const data = await controller.getCashflowExportData(1);
    expect(data.offerId).toBe('1');

    await controller.downloadCashflowSheet(1, mockRes);
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(mockRes.send).toHaveBeenCalled();
  });

  it('should return full offer package in open JSON (RNF-18)', async () => {
    const pkg = await controller.getFullOfferPackage(1);
    expect(pkg.metadata.schemaVersion).toBe('open-lt-offer-v1');
    expect(service.getFullOfferPackage).toHaveBeenCalledWith(1);
  });
});
