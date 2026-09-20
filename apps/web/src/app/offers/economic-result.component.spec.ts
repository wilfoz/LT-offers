import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { EconomicResultComponent } from './economic-result.component';
import { EconomicResultApiService } from './economic-result-api.service';
import { EconomicResultSummary } from '@lt-offers/domain';

describe('EconomicResultComponent', () => {
  let component: EconomicResultComponent;
  let fixture: ComponentFixture<EconomicResultComponent>;
  let apiSpy: {
    getLineEconomicResult: ReturnType<typeof vi.fn>;
    calculateLineWithCoefficients: ReturnType<typeof vi.fn>;
    getConsolidatedEconomicResult: ReturnType<typeof vi.fn>;
    simulateMarginOrPrice: ReturnType<typeof vi.fn>;
    compareRevisions: ReturnType<typeof vi.fn>;
  };

  const mockResult: EconomicResultSummary = {
    offerId: '10',
    totalNetCost: '8000000.00',
    totalPisCofins: '452000.00',
    totalIpi: '100000.00',
    totalIcmsOrigin: '800000.00',
    totalDifal: '200000.00',
    totalFecoep: '0.00',
    totalCostWithTaxes: '9552000.00',
    totalDirectBilling: '0.00',
    totalOwnCost: '9552000.00',
    totalSalePrice: '13000000.00',
    grossProfit: '3448000.00',
    grossMarginPercent: '26.52',
    netMarginPercent: '8.00',
    ipcaTotalDegradationCost: '350000.00',
    bdi: {
      totalIndirectRate: '12.80',
      grossMarginRate: '26.52',
      effectiveBdiRate: '36.10',
      bdiMultiplier: '1.3610',
    },
    coefficients: {
      centralStructureRate: '4.50',
      guaranteesRate: '1.50',
      insurancesRate: '1.00',
      financialCostRate: '1.80',
      contingencyRate: '2.50',
      iddeRate: '0.50',
      countryRiskRate: '1.00',
      productionTaxRate: '5.65',
      targetMarginRate: '8.00',
    },
    lines: [
      {
        category: 'MATERIALS',
        description: 'Fornecimento Total de Materiais',
        netCost: '5000000.00',
        pisCofins: '282500.00',
        ipi: '100000.00',
        icmsOrigin: '600000.00',
        difal: '150000.00',
        fecoep: '0.00',
        costWithTaxes: '6132500.00',
        directBilling: '0.00',
        ownCost: '6132500.00',
        salePrice: '7500000.00',
      },
      {
        category: 'SERVICES',
        description: 'Prestação Total de Serviços',
        netCost: '3000000.00',
        pisCofins: '169500.00',
        ipi: '0.00',
        icmsOrigin: '200000.00',
        difal: '50000.00',
        fecoep: '0.00',
        costWithTaxes: '3419500.00',
        directBilling: '0.00',
        ownCost: '3419500.00',
        salePrice: '5500000.00',
      },
    ],
  };

  beforeEach(async () => {
    apiSpy = {
      getLineEconomicResult: vi.fn().mockReturnValue(of(mockResult)),
      calculateLineWithCoefficients: vi.fn().mockReturnValue(of(mockResult)),
      getConsolidatedEconomicResult: vi.fn().mockReturnValue(of(mockResult)),
      simulateMarginOrPrice: vi.fn().mockReturnValue(
        of({
          mode: 'MARGIN_TARGET',
          targetMarginPercentage: '10.00',
          requiredSalePrice: '13500000.00',
          resultingBdiPercentage: '35.00',
          resultingCoefficients: {
            materialK: '1.22',
            serviceK: '1.45',
            compositeK: '1.35',
          },
        }),
      ),
      compareRevisions: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [EconomicResultComponent],
      providers: [{ provide: EconomicResultApiService, useValue: apiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(EconomicResultComponent);
    component = fixture.componentInstance;
    component.offerId = 10;
    component.lines = [
      { id: 1, name: 'LT 500kV Curitiba' },
      { id: 2, name: 'LT 500kV Blumenau' },
    ];
    fixture.detectChanges();
  });

  it('deve inicializar e carregar o resultado econômico consolidado da oferta', () => {
    expect(component).toBeTruthy();
    expect(apiSpy.getConsolidatedEconomicResult).toHaveBeenCalledWith(10);
    expect(component.result()).toEqual(mockResult);
    expect(component.loading()).toBe(false);
  });

  it('deve alternar escopo para linha e recalcular com coeficientes', () => {
    component.setLine(2);
    expect(component.viewScope()).toBe('LINE');
    expect(component.selectedLineId()).toBe(2);
    expect(apiSpy.calculateLineWithCoefficients).toHaveBeenCalledWith(
      2,
      expect.any(Object),
    );
  });

  it('deve alternar escopo para consolidado', () => {
    component.setScope('CONSOLIDATED');
    expect(component.viewScope()).toBe('CONSOLIDATED');
    expect(apiSpy.getConsolidatedEconomicResult).toHaveBeenCalledWith(10);
  });

  it('deve executar simulação de margem alvo', () => {
    component.simMode = 'MARGIN';
    component.simTargetMargin = 10.0;
    component.runSimulation();
    expect(apiSpy.simulateMarginOrPrice).toHaveBeenCalledWith(
      10,
      { targetMarginRate: '10.00' },
      undefined,
    );
    expect(component.simulationResult()?.targetMarginPercentage).toBe('10.00');
  });

  it('deve formatar moeda corretamente', () => {
    expect(component.formatCurrency('1500000.00')).toContain('1.500.000,00');
    expect(component.formatCurrency(undefined)).toBe('R$ 0,00');
  });
});
