import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { CampsManagementComponent } from './camps-management.component';
import { ScheduleApiService } from './schedule-api.service';
import { CampCostSummary } from '@lt-offers/domain';

describe('CampsManagementComponent', () => {
  let component: CampsManagementComponent;
  let fixture: ComponentFixture<CampsManagementComponent>;
  let apiSpy: {
    getLineSchedule: ReturnType<typeof vi.fn>;
    getLineCamps: ReturnType<typeof vi.fn>;
  };

  const mockCampsSummary: CampCostSummary = {
    lineId: 1,
    totalImplementationCost: '350000.00',
    totalOperatingCost: '1200000.00',
    totalDemobilizationCost: '110000.00',
    totalCampsCost: '1660000.00',
    monthlyDistribution: [
      { month: 1, cost: '416666.67' },
    ],
    camps: [
      {
        id: 'camp-1',
        lineId: 1,
        code: 'CP-01',
        name: 'Canteiro Central',
        type: 'CENTRAL',
        startMonth: 1,
        durationMonths: 18,
        endMonth: 18,
        implementationCost: '350000.00',
        fixedMonthlyCost: '50000.00',
        demobilizationCost: '110000.00',
        personnel: [
          {
            laborRoleId: 1,
            laborRoleCode: 'ENG',
            laborRoleName: 'Engenheiro',
            quantity: 1,
            monthlyUnitCost: '20000.00',
            totalMonthlyCost: '20000.00',
          },
        ],
        totalPersonnelMonthlyCost: '20000.00',
        totalMonthlyCost: '70000.00',
        totalCampCost: '1720000.00',
      },
    ],
  };

  beforeEach(async () => {
    apiSpy = {
      getLineSchedule: vi.fn().mockReturnValue(of(null)),
      getLineCamps: vi.fn().mockReturnValue(of(mockCampsSummary)),
    };

    await TestBed.configureTestingModule({
      imports: [CampsManagementComponent],
      providers: [{ provide: ScheduleApiService, useValue: apiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(CampsManagementComponent);
    component = fixture.componentInstance;
    component.lineId = 1;
    fixture.detectChanges();
  });

  it('deve inicializar e carregar os canteiros da linha', () => {
    expect(component).toBeTruthy();
    expect(apiSpy.getLineCamps).toHaveBeenCalledWith(1);
    expect(component.campsSummary()).toEqual(mockCampsSummary);
    expect(component.loading()).toBe(false);
  });
});
