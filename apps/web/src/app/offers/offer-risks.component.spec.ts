import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { OfferRisksComponent } from './offer-risks.component';
import { RisksApiService } from './risks-api.service';
import { RiskAssessmentSummary } from '@lt-offers/domain';

describe('OfferRisksComponent', () => {
  let component: OfferRisksComponent;
  let fixture: ComponentFixture<OfferRisksComponent>;
  let mockRisksApi: any;

  const mockAssessment: RiskAssessmentSummary = {
    offerId: '1',
    items: [
      {
        id: 'r1',
        offerId: '1',
        lineId: '10',
        category: 'LAND_EASEMENT',
        description: 'Faixa de servidão complexa',
        situation: 'Área urbana',
        mitigationAction: 'Contato prévio',
        estimatedImpact: '1000000.00',
        probabilityPercent: '30.00',
        weightedSeverity: '300000.00',
        treatment: 'CONTINGENCY_BDI',
      },
    ],
    totalEstimatedImpact: '1000000.00',
    totalWeightedSeverity: '300000.00',
    bdiContingencyAmount: '300000.00',
    commercialAssumptionAmount: '0.00',
    categoryBreakdown: [
      {
        category: 'LAND_EASEMENT',
        count: 1,
        totalImpact: '1000000.00',
        totalWeightedSeverity: '300000.00',
      },
    ],
  };

  beforeEach(async () => {
    mockRisksApi = {
      getRisks: vi.fn().mockReturnValue(of(mockAssessment)),
      saveRisk: vi.fn().mockReturnValue(of(mockAssessment)),
      deleteRisk: vi.fn().mockReturnValue(of(mockAssessment)),
    };

    await TestBed.configureTestingModule({
      imports: [OfferRisksComponent],
      providers: [
        provideHttpClient(),
        { provide: RisksApiService, useValue: mockRisksApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OfferRisksComponent);
    component = fixture.componentInstance;
    component.offerId = 1;
    component.lines = [{ id: 10, name: 'LT 500kV' }];
    fixture.detectChanges();
  });

  it('deve carregar e renderizar a Matriz de Riscos', () => {
    expect(component).toBeTruthy();
    expect(mockRisksApi.getRisks).toHaveBeenCalledWith(1, undefined);
    expect(component.assessment()?.totalEstimatedImpact).toBe('1000000.00');
  });

  it('deve abrir o modal para adicionar novo risco', () => {
    component.openAddModal();
    expect(component.showModal()).toBe(true);
    expect(component.editingId()).toBeNull();
  });

  it('deve formatar valores monetários para pt-BR', () => {
    const formatted = component.formatCurrency('300000.00');
    expect(formatted).toBe('300.000,00');
  });
});
