import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OfferExportComponent } from './offer-export.component';
import { ExportApiService } from './export-api.service';
import {
  PerformanceIndicatorsSummary,
  TenderSheetExportData,
  MeasurementSheetExportData,
  CashflowExportData,
} from '@lt-offers/domain';

describe('OfferExportComponent (RF-47, RF-48, RF-49, RF-50, RF-60, RNF-11, RNF-18)', () => {
  let component: OfferExportComponent;
  let fixture: ComponentFixture<OfferExportComponent>;

  const mockIndicators: PerformanceIndicatorsSummary = {
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

  const mockTender: TenderSheetExportData = {
    offerId: '1',
    offerName: 'LT 500kV Teste',
    revisionNumber: 0,
    layout: 'ANEEL_STANDARD',
    generatedAt: new Date().toISOString(),
    rows: [
      {
        cipCode: 'CIP-01.01',
        description: 'Levantamento Topográfico',
        unit: 'km',
        quantity: '150.00',
        directUnitCost: '5000.00',
        directTotalCost: '750000.00',
        bdiRate: '28.50',
        unitPrice: '6425.00',
        totalPrice: '963750.00',
        group: 'ENGINEERING',
        level: 2,
      },
    ],
    totalDirectCost: '750000.00',
    totalSalePrice: '963750.00',
    effectiveBdi: '28.50',
  };

  const mockMeasurement: MeasurementSheetExportData = {
    offerId: '1',
    offerName: 'LT 500kV Teste',
    revisionNumber: 0,
    generatedAt: new Date().toISOString(),
    items: [
      {
        itemCode: 'M1 / PU1',
        discipline: 'TOPOGRAFIA',
        description: 'Levantamento e Estaqueamento',
        unit: 'km',
        contractQuantity: '150.00',
        measurementCriteria: 'Extensão de diretriz estaqueada',
        unitPriceWithTax: '6425.00',
        totalContractPrice: '963750.00',
      },
    ],
    totalContractAmount: '963750.00',
  };

  const mockCashflow: CashflowExportData = {
    offerId: '1',
    offerName: 'LT 500kV Teste',
    revisionNumber: 0,
    generatedAt: new Date().toISOString(),
    months: [
      {
        monthIndex: 1,
        monthLabel: 'Mês 01',
        suppliesDisbursement: '0.00',
        servicesDisbursement: '100000.00',
        indirectDisbursement: '50000.00',
        monthlyTotalDisbursement: '150000.00',
        accumulatedDisbursement: '150000.00',
        monthlyBilling: '0.00',
        accumulatedBilling: '0.00',
        netCashflow: '-150000.00',
        isPeakExposure: true,
      },
    ],
    peakExposureMonth: 1,
    peakExposureAmount: '150000.00',
    totalDisbursement: '150000.00',
    totalBilling: '0.00',
  };

  const mockExportApiService = {
    getPerformanceIndicators: vi.fn().mockReturnValue(of(mockIndicators)),
    getTenderSheetData: vi.fn().mockReturnValue(of(mockTender)),
    downloadTenderSheet: vi.fn().mockReturnValue(of(new Blob())),
    getMeasurementSheetData: vi.fn().mockReturnValue(of(mockMeasurement)),
    downloadMeasurementSheet: vi.fn().mockReturnValue(of(new Blob())),
    getCashflowExportData: vi.fn().mockReturnValue(of(mockCashflow)),
    downloadCashflowSheet: vi.fn().mockReturnValue(of(new Blob())),
    getFullOfferPackage: vi
      .fn()
      .mockReturnValue(of({ metadata: { schemaVersion: 'open-lt-offer-v1' } })),
    saveBlob: vi.fn(),
    saveJson: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfferExportComponent],
      providers: [
        { provide: ExportApiService, useValue: mockExportApiService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OfferExportComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('offerId', 1);
    fixture.componentRef.setInput('offerName', 'Oferta Teste LT');
    fixture.detectChanges();
  });

  it('should initialize and load all export and indicators data (RF-49)', () => {
    expect(component).toBeTruthy();
    expect(mockExportApiService.getPerformanceIndicators).toHaveBeenCalledWith(
      1,
    );
    expect(mockExportApiService.getTenderSheetData).toHaveBeenCalledWith(
      1,
      'ANEEL_STANDARD',
    );
    expect(mockExportApiService.getMeasurementSheetData).toHaveBeenCalledWith(
      1,
    );
    expect(mockExportApiService.getCashflowExportData).toHaveBeenCalledWith(1);

    expect(component.indicators()).toEqual(mockIndicators);
    expect(component.tenderData()).toEqual(mockTender);
  });

  it('should change layout and reload tender sheet (RF-50)', () => {
    component.onLayoutChange('CELEO_STANDARD');
    expect(component.selectedLayout()).toBe('CELEO_STANDARD');
    expect(mockExportApiService.getTenderSheetData).toHaveBeenCalledWith(
      1,
      'CELEO_STANDARD',
    );
  });

  it('should download tender sheet XLSX on button click', () => {
    component.downloadTenderSheet();
    expect(mockExportApiService.downloadTenderSheet).toHaveBeenCalledWith(
      1,
      'ANEEL_STANDARD',
    );
    expect(mockExportApiService.saveBlob).toHaveBeenCalled();
  });

  it('should download measurement sheet XLSX on button click (RF-48)', () => {
    component.downloadMeasurementSheet();
    expect(mockExportApiService.downloadMeasurementSheet).toHaveBeenCalledWith(
      1,
    );
    expect(mockExportApiService.saveBlob).toHaveBeenCalled();
  });

  it('should download cashflow sheet XLSX on button click (RF-60)', () => {
    component.downloadCashflowSheet();
    expect(mockExportApiService.downloadCashflowSheet).toHaveBeenCalledWith(1);
    expect(mockExportApiService.saveBlob).toHaveBeenCalled();
  });

  it('should export full offer package JSON (RNF-18)', () => {
    component.downloadFullPackageJson();
    expect(mockExportApiService.getFullOfferPackage).toHaveBeenCalledWith(1);
    expect(mockExportApiService.saveJson).toHaveBeenCalled();
  });

  it('should filter preview rows reactively when search query is typed', () => {
    component.filterText.set('Topográfico');
    expect(component.filteredTenderRows().length).toBe(1);

    component.filterText.set('Inexistente');
    expect(component.filteredTenderRows().length).toBe(0);
  });
});
