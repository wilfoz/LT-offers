import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExportApiService } from './export-api.service';
import {
  PerformanceIndicatorsSummary,
  TenderSheetExportData,
  MeasurementSheetExportData,
  CashflowExportData,
  FullOfferPackage,
} from '@lt-offers/domain';

describe('ExportApiService', () => {
  let service: ExportApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExportApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ExportApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch performance indicators (RF-49)', () => {
    const mockSummary: PerformanceIndicatorsSummary = {
      offerId: '1',
      consolidated: {
        lengthKm: '150.00',
        towerCount: 375,
        costPerKm: '1200000.00',
        costPerTower: '480000.00',
        suppliesCostPerKm: '750000.00',
        suppliesCostPerTower: '300000.00',
        servicesCostPerKm: '450000.00',
        servicesCostPerTower: '180000.00',
        structuresDensityPerKm: '2.50',
        averageSpanMeters: '401.07',
        concretePerKm: '120.00',
        concretePerTower: '48.00',
        steelPerKm: '45.00',
        steelPerTower: '18.00',
      },
      byLine: [],
    };

    service.getPerformanceIndicators(1).subscribe((res) => {
      expect(res.offerId).toBe('1');
      expect(res.consolidated.costPerKm).toBe('1200000.00');
    });

    const req = httpMock.expectOne(
      '/api/offers/1/export/performance-indicators',
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockSummary);
  });

  it('should fetch tender sheet structured data (RF-47, RF-50)', () => {
    const mockTender: TenderSheetExportData = {
      offerId: '1',
      offerName: 'LT 500kV Teste',
      revisionNumber: 0,
      layout: 'ANEEL_STANDARD',
      generatedAt: new Date().toISOString(),
      rows: [],
      totalDirectCost: '100000000.00',
      totalSalePrice: '130000000.00',
      effectiveBdi: '30.00',
    };

    service.getTenderSheetData(1, 'ANEEL_STANDARD').subscribe((res) => {
      expect(res.offerId).toBe('1');
      expect(res.layout).toBe('ANEEL_STANDARD');
    });

    const req = httpMock.expectOne(
      '/api/offers/1/export/tender-sheet/data?layout=ANEEL_STANDARD',
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockTender);
  });

  it('should download tender sheet blob (RNF-11)', () => {
    const fakeBlob = new Blob(['fake xlsx data'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    service.downloadTenderSheet(1, 'ANEEL_STANDARD').subscribe((res) => {
      expect(res).toBeInstanceOf(Blob);
    });

    const req = httpMock.expectOne(
      '/api/offers/1/export/tender-sheet?layout=ANEEL_STANDARD',
    );
    expect(req.request.method).toBe('GET');
    req.flush(fakeBlob);
  });

  it('should download measurement sheet blob (RF-48)', () => {
    const fakeBlob = new Blob(['fake xlsx data'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    service.downloadMeasurementSheet(1).subscribe((res) => {
      expect(res).toBeInstanceOf(Blob);
    });

    const req = httpMock.expectOne('/api/offers/1/export/measurement-sheet');
    expect(req.request.method).toBe('GET');
    req.flush(fakeBlob);
  });

  it('should download cashflow schedule blob (RF-60)', () => {
    const fakeBlob = new Blob(['fake xlsx data'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    service.downloadCashflowSheet(1).subscribe((res) => {
      expect(res).toBeInstanceOf(Blob);
    });

    const req = httpMock.expectOne('/api/offers/1/export/cashflow-schedule');
    expect(req.request.method).toBe('GET');
    req.flush(fakeBlob);
  });

  it('should get full offer package JSON (RNF-18)', () => {
    const mockPackage: FullOfferPackage = {
      metadata: {
        exportTimestamp: new Date().toISOString(),
        version: '1.0.0',
        schemaVersion: 'open-lt-offer-v1',
      },
      offer: { id: 1, name: 'LT Test' },
      transmissionLines: [],
      staking: [],
      pricingSummary: {},
      bdiParameters: {},
      cashflow: {},
      risks: [],
      governance: {},
      performanceIndicators: {
        offerId: '1',
        consolidated: {} as any,
        byLine: [],
      },
    };

    service.getFullOfferPackage(1).subscribe((res) => {
      expect(res.metadata.schemaVersion).toBe('open-lt-offer-v1');
    });

    const req = httpMock.expectOne('/api/offers/1/export/full-package');
    expect(req.request.method).toBe('GET');
    req.flush(mockPackage);
  });
});
