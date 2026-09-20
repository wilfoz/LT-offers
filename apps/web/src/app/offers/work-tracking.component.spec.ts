import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkTrackingComponent } from './work-tracking.component';
import { BaselineApiService } from './baseline-api.service';
import {
  WorkBaseline,
  CurveSData,
  CurrentWorkingEstimate,
} from '@lt-offers/domain';

describe('WorkTrackingComponent (Fase F7)', () => {
  let component: WorkTrackingComponent;
  let fixture: ComponentFixture<WorkTrackingComponent>;

  const mockBaseline: WorkBaseline = {
    id: 1,
    offerId: 1,
    revisionId: 1,
    baselineNumber: 0,
    name: 'Linha de Base Contratual Data 0',
    status: 'ACTIVE',
    totalContractValue: '124850000.00',
    totalBudgetCost: '102340000.00',
    targetMarginPercent: '8.00',
    scheduleMonths: 18,
    frozenAt: '2026-09-10T18:00:00.000Z',
    frozenBy: 'diretor.comercial@engevix.com.br',
    workPackages: [],
    createdAt: '2026-09-10T18:00:00.000Z',
    updatedAt: '2026-09-10T18:00:00.000Z',
  };

  const mockCurveS: CurveSData = {
    baselineId: 1,
    totalPlannedValue: '124850000.00',
    currentPhysicalProgressPercent: '19.80',
    currentSpi: '1.0500',
    currentCpi: '1.0200',
    statusSummary: 'ON_TRACK',
    monthlySeries: [
      {
        monthNumber: 1,
        periodDate: '2026-01',
        plannedValue: '6936111.11',
        earnedValue: '5618250.00',
        actualCost: '5400000.00',
        scheduleVariance: '-1317861.11',
        costVariance: '218250.00',
        schedulePerformanceIndex: '0.8100',
        costPerformanceIndex: '1.0404',
        physicalProgressPercent: '4.50',
      },
    ],
  };

  const mockCwe: CurrentWorkingEstimate = {
    baselineId: 1,
    baselineContractValue: '124850000.00',
    baselineBudgetCost: '102340000.00',
    baselineScheduleMonths: 18,
    totalApprovedAdditivesCost: '2530000.00',
    totalPendingAdditivesCost: '950000.00',
    approvedScheduleDeltaMonths: 1,
    currentWorkingEstimateValue: '127380000.00',
    currentWorkingScheduleMonths: 19,
    changeOrdersCount: 3,
    approvedChangeOrdersCount: 2,
  };

  const mockBaselineApi = {
    getBaseline: vi.fn().mockReturnValue(of(mockBaseline)),
    getCurveS: vi.fn().mockReturnValue(of(mockCurveS)),
    listProgressRecords: vi.fn().mockReturnValue(of([])),
    listChangeOrders: vi.fn().mockReturnValue(of([])),
    getCurrentWorkingEstimate: vi.fn().mockReturnValue(of(mockCwe)),
    freezeBaseline: vi.fn().mockReturnValue(of(mockBaseline)),
    recordMonthlyProgress: vi.fn().mockReturnValue(of({})),
    createChangeOrder: vi.fn().mockReturnValue(of({})),
    updateChangeOrder: vi.fn().mockReturnValue(of({})),
    generateErpPackageJson: vi.fn().mockReturnValue(of({})),
    exportErpPackageXlsx: vi.fn().mockReturnValue(of(new Blob())),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkTrackingComponent, HttpClientTestingModule],
      providers: [{ provide: BaselineApiService, useValue: mockBaselineApi }],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkTrackingComponent);
    component = fixture.componentInstance;
  });

  it('deve inicializar e carregar dados da Baseline, Curva S e CWE', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(mockBaselineApi.getBaseline).toHaveBeenCalled();
    expect(component.baseline()?.name).toBe('Linha de Base Contratual Data 0');
    expect(component.curveSData()?.currentSpi).toBe('1.0500');
    expect(component.cweData()?.currentWorkingEstimateValue).toBe(
      '127380000.00',
    );
  });

  it('deve formatar valores monetários e datas corretamente', () => {
    const formatted = component.formatCurrency('124850000.00');
    expect(formatted).toContain('124.850.000');
  });
});
