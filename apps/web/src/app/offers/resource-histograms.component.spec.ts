import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ResourceHistogramsComponent } from './resource-histograms.component';
import { HistogramApiService } from './histogram-api.service';
import { ResourceHistogramSummary } from '@lt-offers/domain';

describe('ResourceHistogramsComponent', () => {
  let component: ResourceHistogramsComponent;
  let fixture: ComponentFixture<ResourceHistogramsComponent>;
  let apiSpy: {
    getLineHistogram: ReturnType<typeof vi.fn>;
    getOfferConsolidatedHistogram: ReturnType<typeof vi.fn>;
  };

  const mockHistogram: ResourceHistogramSummary = {
    lineId: 1,
    totalMonths: 18,
    totalDirectManMonths: '450.00',
    totalIndirectManMonths: '80.00',
    totalManMonths: '530.00',
    totalEquipmentRentalCost: '180000.00',
    peakManpower: {
      month: 6,
      direct: 45,
      indirect: 5,
      total: 50,
      drivingActivities: ['Montagem de Torres', 'Fundações'],
    },
    peakEquipment: {
      month: 6,
      total: 12,
      own: 8,
      rented: 4,
    },
    monthlyTimeline: [
      {
        month: 1,
        directManpower: 10,
        indirectManpower: 5,
        totalManpower: 15,
        totalEquipment: 4,
        ownEquipment: 4,
        rentedEquipment: 0,
        monthlyRentalCost: '0.00',
        cumulativeManMonths: '15.00',
        cumulativeEquipmentMonths: '4.00',
      },
    ],
    manpowerItems: [
      {
        laborRoleId: 1,
        laborRoleCode: 'PEDR',
        laborRoleName: 'Pedreiro',
        isDirect: true,
        monthlyHeadcount: [{ month: 1, count: 4 }],
        peakHeadcount: 4,
        peakMonth: 1,
        totalManMonths: '4.00',
      },
    ],
    equipmentItems: [
      {
        equipmentId: 101,
        equipmentCode: 'BETON',
        equipmentDescription: 'Betoneira',
        ownUnitsAvailable: 2,
        monthlyDemand: [{ month: 1, totalRequired: 2, ownUsed: 2, deficitToRent: 0, estimatedRentalCost: '0.00' }],
        peakDemand: 2,
        peakMonth: 1,
        totalMachineMonths: '2.00',
        totalRentalMachineMonths: '0.00',
        totalRentalCost: '0.00',
      },
    ],
  };

  beforeEach(async () => {
    apiSpy = {
      getLineHistogram: vi.fn().mockReturnValue(of(mockHistogram)),
      getOfferConsolidatedHistogram: vi.fn().mockReturnValue(of(mockHistogram)),
    };

    await TestBed.configureTestingModule({
      imports: [ResourceHistogramsComponent],
      providers: [{ provide: HistogramApiService, useValue: apiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceHistogramsComponent);
    component = fixture.componentInstance;
    component.lineId = 1;
    fixture.detectChanges();
  });

  it('deve inicializar e carregar o histograma de recursos', () => {
    expect(component).toBeTruthy();
    expect(apiSpy.getLineHistogram).toHaveBeenCalledWith(1);
    expect(component.histogram()).toEqual(mockHistogram);
    expect(component.loading()).toBe(false);
  });

  it('deve alternar entre visualização de pessoal e equipamentos', () => {
    expect(component.activeTab()).toBe('MANPOWER');
    component.activeTab.set('EQUIPMENT');
    expect(component.activeTab()).toBe('EQUIPMENT');
  });
});
