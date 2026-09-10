import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MaterialPricingComponent } from './material-pricing.component';
import { PricingApiService } from './pricing-api.service';
import { LineMaterialPricingSummary } from '@lt-offers/domain';

describe('MaterialPricingComponent (M06, RF-28..RF-34)', () => {
  let component: MaterialPricingComponent;
  let fixture: ComponentFixture<MaterialPricingComponent>;
  let pricingApiMock: {
    getLinePricingSummary: ReturnType<typeof vi.fn>;
    simulateLinePricing: ReturnType<typeof vi.fn>;
    getQuotes: ReturnType<typeof vi.fn>;
  };

  const mockSummary: LineMaterialPricingSummary = {
    lineId: '1',
    lineName: 'LT 500 kV Poções III - Padre Paraíso C1',
    taxRegime: 'REIDI',
    totalNetAmount: 2500000,
    totalIpiAmount: 81250,
    totalIcmsOriginAmount: 175000,
    totalDifalAmount: 348125,
    totalFecoepAmount: 58125,
    totalPisAmount: 0,
    totalCofinsAmount: 0,
    totalTaxesAmount: 487500,
    totalGrossAmount: 2987500,
    directBillingAmount: 0,
    contractorBilledAmount: 2987500,
    totalReidiSavings: 231250,
    items: [
      {
        itemCode: 'MAT-TOR-EST',
        itemName: 'Aço Estrutural para Torres Treliçadas Galvanizadas',
        quantity: 250,
        netUnitPrice: 14500,
        netTotalAmount: 3625000,
        ipiRatePercent: 3.25,
        ipiAmount: 117812.5,
        originState: 'SP',
        destinationBreakdowns: [
          {
            destinationState: 'MG',
            sharePercent: 100,
            interstateRatePercent: 7.0,
            internalRatePercent: 18.0,
            fecoepRatePercent: 2.0,
            difalMethod: 'DOUBLE_BASE',
            allocatedNetBase: 3625000,
            icmsOriginAmount: 253750,
            reconstitutedDestinationBase: 4214062.5,
            difalAmount: 504781.25,
            fecoepAmount: 84281.25,
          },
        ],
        totalIcmsOriginAmount: 253750,
        totalDifalAmount: 504781.25,
        totalFecoepAmount: 84281.25,
        pisRatePercent: 0,
        pisAmount: 0,
        cofinsRatePercent: 0,
        cofinsAmount: 0,
        totalTaxesAmount: 706875,
        grossTotalAmount: 4331875,
        grossUnitPrice: 17327.5,
        isDirectBilling: false,
        reidiBenefitAmount: 335312.5,
      },
    ],
    missingPriceItemCodes: [],
  };

  beforeEach(async () => {
    pricingApiMock = {
      getLinePricingSummary: vi.fn().mockReturnValue(of(mockSummary)),
      simulateLinePricing: vi.fn().mockReturnValue(of(mockSummary)),
      getQuotes: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [MaterialPricingComponent],
      providers: [{ provide: PricingApiService, useValue: pricingApiMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(MaterialPricingComponent);
    component = fixture.componentInstance;
    component.lineId = 1;
    fixture.detectChanges();
  });

  it('deve criar o componente e carregar os dados de preços e tributos', () => {
    expect(component).toBeTruthy();
    expect(pricingApiMock.getLinePricingSummary).toHaveBeenCalledWith(1);
    expect(component.summary()).toEqual(mockSummary);
  });

  it('deve alternar a visibilidade do painel simulador', () => {
    expect(component.showSimulator()).toBe(false);
    component.toggleSimulator();
    expect(component.showSimulator()).toBe(true);
    component.toggleSimulator();
    expect(component.showSimulator()).toBe(false);
  });

  it('deve abrir e fechar a memória de cálculo de um item', () => {
    expect(component.selectedItem()).toBeNull();
    component.openItemDetail(mockSummary.items[0]);
    expect(component.selectedItem()).toBe(mockSummary.items[0]);
    component.closeItemDetail();
    expect(component.selectedItem()).toBeNull();
  });

  it('deve aplicar simulação de cenários fiscais', () => {
    component.simulationTaxRegime = 'STANDARD';
    component.simulationLmeUsd = 2600;
    component.applySimulation();

    expect(pricingApiMock.simulateLinePricing).toHaveBeenCalledWith(1, {
      taxRegime: 'STANDARD',
      spotLmeUsdPerTon: 2600,
      spotMidwestPremiumUsdPerTon: 450,
      spotExchangeRateBrl: 5.5,
    });
  });
});
