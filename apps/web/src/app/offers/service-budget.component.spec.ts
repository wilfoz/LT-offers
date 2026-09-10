import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ServiceBudgetComponent } from './service-budget.component';
import { ServiceBudgetApiService } from './service-budget-api.service';
import { ServiceBudgetSummary } from '@lt-offers/domain';

describe('ServiceBudgetComponent', () => {
  let component: ServiceBudgetComponent;
  let fixture: ComponentFixture<ServiceBudgetComponent>;
  let apiSpy: {
    getLineServiceBudget: ReturnType<typeof vi.fn>;
    getLineMeasurementSheet: ReturnType<typeof vi.fn>;
  };

  const mockSummary: ServiceBudgetSummary = {
    lineId: '1',
    lineName: 'LT 500kV Curitiba',
    lineLengthKm: '100.000',
    totalTowers: 200,
    totalDirectCost: '1000000.00',
    totalSalePrice: '1250000.00',
    ratios: {
      costPerKm: '10000.00',
      costPerTower: '5000.00',
      salePricePerKm: '12500.00',
      salePricePerTower: '6250.00',
    },
    byGroup: {
      PRELIMINARY_WORKS: { totalDirectCost: '100000.00', totalSalePrice: '125000.00', costPerKm: '1000.00', costPerTower: '500.00' },
      CIVIL_WORKS: { totalDirectCost: '500000.00', totalSalePrice: '625000.00', costPerKm: '5000.00', costPerTower: '2500.00' },
      ASSEMBLY_WORKS: { totalDirectCost: '400000.00', totalSalePrice: '500000.00', costPerKm: '4000.00', costPerTower: '2000.00' },
      STRINGING_WORKS: { totalDirectCost: '0.00', totalSalePrice: '0.00', costPerKm: '0.00', costPerTower: '0.00' },
      COMMISSIONING: { totalDirectCost: '0.00', totalSalePrice: '0.00', costPerKm: '0.00', costPerTower: '0.00' },
      INDIRECTS_SUPPORT: { totalDirectCost: '0.00', totalSalePrice: '0.00', costPerKm: '0.00', costPerTower: '0.00' },
    },
    items: [
      {
        id: '1',
        lineId: '1',
        code: 'SERV-01',
        name: 'Escavação e Concretagem de Fundações',
        cipCode: '02.01',
        group: 'CIVIL_WORKS',
        unit: 'm³',
        quantity: '5000.000',
        unitDirectCost: '100.00',
        totalDirectCost: '500000.00',
        costSource: 'SCHEDULE_DIRECT',
        bdiPercentage: '25.00',
        unitSalePrice: '125.00',
        totalSalePrice: '625000.00',
      },
      {
        id: '2',
        lineId: '1',
        code: 'SERV-02',
        name: 'Montagem de Estruturas Metálicas',
        cipCode: '03.01',
        group: 'ASSEMBLY_WORKS',
        unit: 't',
        quantity: '1000.000',
        unitDirectCost: '400.00',
        totalDirectCost: '400000.00',
        costSource: 'PARAMETRIC_ADJUSTED',
        bdiPercentage: '25.00',
        unitSalePrice: '500.00',
        totalSalePrice: '500000.00',
      },
    ],
  };

  beforeEach(async () => {
    apiSpy = {
      getLineServiceBudget: vi.fn().mockReturnValue(of(mockSummary)),
      getLineMeasurementSheet: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [ServiceBudgetComponent],
      providers: [{ provide: ServiceBudgetApiService, useValue: apiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceBudgetComponent);
    component = fixture.componentInstance;
    component.offerId = 10;
    component.lines = [{ id: 1, name: 'LT 500kV Curitiba' }, { id: 2, name: 'LT 500kV Blumenau' }];
    fixture.detectChanges();
  });

  it('deve inicializar e carregar serviços da linha', () => {
    expect(component).toBeTruthy();
    expect(apiSpy.getLineServiceBudget).toHaveBeenCalledWith(1);
    expect(component.budget()).toEqual(mockSummary);
    expect(component.loading()).toBe(false);
  });

  it('deve alternar filtro de grupo de serviço', () => {
    expect(component.filteredItems().length).toBe(2);

    component.setGroup('CIVIL_WORKS');
    expect(component.filteredItems().length).toBe(1);
    expect(component.filteredItems()[0].cipCode).toBe('02.01');

    component.setGroup('ALL');
    expect(component.filteredItems().length).toBe(2);
  });

  it('deve alternar a linha selecionada', () => {
    component.onLineChange(2);
    expect(component.selectedLineId()).toBe(2);
    expect(apiSpy.getLineServiceBudget).toHaveBeenCalledWith(2);
  });

  it('deve retornar rótulos amigáveis de grupos e origens de custo', () => {
    expect(component.getGroupLabel('CIVIL_WORKS')).toBe('Obras Civis e Fundações');
    expect(component.getCostSourceLabel('SCHEDULE_DIRECT')).toBe('Cronograma Direto');
    expect(component.getCostSourceLabel('PARAMETRIC_ADJUSTED')).toBe('Paramétrico Ajustado');
    expect(component.formatCurrency('1000.50')).toContain('1.000,50');
  });
});
