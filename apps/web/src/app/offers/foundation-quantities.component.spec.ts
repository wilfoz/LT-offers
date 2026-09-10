import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { FoundationQuantitiesComponent } from './foundation-quantities.component';
import { FoundationsApi } from './foundations-api.service';
import { LineFoundationSummary } from '@lt-offers/domain';

describe('FoundationQuantitiesComponent', () => {
  let component: FoundationQuantitiesComponent;
  let fixture: ComponentFixture<FoundationQuantitiesComponent>;
  let apiSpy: {
    getQuantities: ReturnType<typeof vi.fn>;
    getTraceability: ReturnType<typeof vi.fn>;
  };

  const mockSummary: LineFoundationSummary = {
    transmissionLineId: 1,
    calculationMode: 'STAKING_DETAILED',
    totalTowers: 2,
    calculatedTowers: 2,
    pendingTowers: 0,
    kpis: {
      totalExcavationM3: '22.000',
      totalConcreteM3: '52.500',
      totalSteelKg: '2640.00',
      totalBackfillM3: '18.000',
      totalSpecialPilesM: '0.000',
    },
    materials: [
      {
        field: 'excavationHardFootingM3',
        code: 'ESC-SAP-DURO',
        name: 'Escavação em Terreno Duro (Sapata)',
        family: 'EXCAVATION',
        unit: 'm³',
        theoreticalQuantity: '20.000',
        wasteFactorPercent: '10.00',
        wasteQuantity: '2.000',
        totalQuantity: '22.000',
      },
    ],
    materialsByFamily: {
      EXCAVATION: [
        {
          field: 'excavationHardFootingM3',
          code: 'ESC-SAP-DURO',
          name: 'Escavação em Terreno Duro (Sapata)',
          family: 'EXCAVATION',
          unit: 'm³',
          theoreticalQuantity: '20.000',
          wasteFactorPercent: '10.00',
          wasteQuantity: '2.000',
          totalQuantity: '22.000',
        },
      ],
      CONCRETE: [],
      STEEL: [],
      BACKFILL_FORMWORK: [],
      SPECIAL_FOUNDATIONS: [],
    },
    missingCombinations: [],
  };

  beforeEach(async () => {
    apiSpy = {
      getQuantities: vi.fn().mockReturnValue(of(mockSummary)),
      getTraceability: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [FoundationQuantitiesComponent],
      providers: [{ provide: FoundationsApi, useValue: apiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(FoundationQuantitiesComponent);
    component = fixture.componentInstance;
    component.lineId = 1;
    fixture.detectChanges();
  });

  it('deve criar o componente e carregar os dados', () => {
    expect(component).toBeTruthy();
    expect(apiSpy.getQuantities).toHaveBeenCalledWith(1);
    expect(component.summary()).toEqual(mockSummary);
    expect(component.loading()).toBe(false);
  });

  it('deve exibir os KPIs consolidados', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('22.000');
    expect(compiled.textContent).toContain('52.500');
    expect(compiled.textContent).toContain('2640.00');
  });
});
