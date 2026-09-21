import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { CashflowComponent } from './cashflow.component';
import { CashflowApiService } from './cashflow-api.service';
import { CashflowSummary } from '@lt-offers/domain';

describe('CashflowComponent', () => {
  let component: CashflowComponent;
  let fixture: ComponentFixture<CashflowComponent>;
  let apiSpy: {
    getLineCashflow: ReturnType<typeof vi.fn>;
    getConsolidatedCashflow: ReturnType<typeof vi.fn>;
  };

  const mockCashflow: CashflowSummary = {
    offerId: '10',
    totalMonths: 12,
    totalOutflow: '10000000.00',
    totalInflow: '12500000.00',
    finalAccumulatedBalance: '2500000.00',
    financialExposure: {
      peakMonth: 4,
      maxNegativeExposure: '2000000.00',
      recommendedWorkingCapital: '2500000.00',
    },
    monthlyPoints: [
      {
        month: 1,
        materialsOutflow: '200000.00',
        servicesOutflow: '300000.00',
        indirectsOutflow: '0.00',
        totalOutflow: '500000.00',
        accumulatedOutflow: '500000.00',
        advanceBilling: '1250000.00',
        measurementBilling: '0.00',
        totalInflow: '1250000.00',
        accumulatedInflow: '1250000.00',
        netMonthlyCashflow: '750000.00',
        accumulatedCashflow: '750000.00',
      },
    ],
    supplyDeliverySchedule: [
      {
        materialGroup: 'CONDUCTORS',
        month: 3,
        tonsOrUnits: '150.00',
        percentage: '25.00',
        estimatedCost: '3000000.00',
      },
    ],
  };

  beforeEach(async () => {
    apiSpy = {
      getLineCashflow: vi.fn().mockReturnValue(of(mockCashflow)),
      getConsolidatedCashflow: vi.fn().mockReturnValue(of(mockCashflow)),
    };

    await TestBed.configureTestingModule({
      imports: [CashflowComponent],
      providers: [{ provide: CashflowApiService, useValue: apiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(CashflowComponent);
    component = fixture.componentInstance;
    component.offerId = 10;
    component.lines = [
      { id: 1, name: 'LT 500kV Curitiba' },
      { id: 2, name: 'LT 500kV Blumenau' },
    ];
    fixture.detectChanges();
  });

  it('deve inicializar e carregar o fluxo de caixa consolidado da oferta', () => {
    expect(component).toBeTruthy();
    expect(apiSpy.getConsolidatedCashflow).toHaveBeenCalledWith(10);
    expect(component.cashflow()).toEqual(mockCashflow);
    expect(component.loading()).toBe(false);
  });

  it('deve alternar escopo para linha', () => {
    component.setLine(2);
    expect(component.viewScope()).toBe('LINE');
    expect(component.selectedLineId()).toBe(2);
    expect(apiSpy.getLineCashflow).toHaveBeenCalledWith(2);
  });

  it('deve alternar escopo para consolidado', () => {
    component.setScope('CONSOLIDATED');
    expect(component.viewScope()).toBe('CONSOLIDATED');
    expect(apiSpy.getConsolidatedCashflow).toHaveBeenCalledWith(10);
  });

  it('deve calcular altura das barras de histograma e formatar moedas', () => {
    const barH = component.getBarHeight('2500000');
    expect(barH).toBeGreaterThan(0);

    expect(component.formatCurrency('1250000.00')).toContain('1.250.000,00');
    expect(component.formatShortCurrency('2500000')).toBe('+2.5M');
    expect(component.formatShortCurrency('-50000')).toBe('-50k');
  });

  it('deve suportar alternância de visualização entre Matriz DT e Cronologia', () => {
    expect(component.activeDtView()).toBe('MATRIX_DT');
    component.activeDtView.set('CHRONOLOGY');
    expect(component.activeDtView()).toBe('CHRONOLOGY');
  });

  it('deve calcular corretamente os totais por disciplina para a grade DT', () => {
    const cf = mockCashflow;
    expect(component.getTotalMaterialsOutflow(cf)).toBe(200000);
    expect(component.getTotalServicesOutflow(cf)).toBe(300000);
    expect(component.getTotalIndirectsOutflow(cf)).toBe(0);
    expect(component.getTotalAdvanceBilling(cf)).toBe(1250000);
    expect(component.getTotalMeasurementBilling(cf)).toBe(0);
  });
});
