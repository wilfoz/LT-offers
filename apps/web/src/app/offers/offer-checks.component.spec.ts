import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { OfferChecksComponent } from './offer-checks.component';
import { ChecksApiService } from './checks-api.service';
import { OfferHealthSummary } from '@lt-offers/domain';

describe('OfferChecksComponent', () => {
  let component: OfferChecksComponent;
  let fixture: ComponentFixture<OfferChecksComponent>;
  let mockChecksApi: any;

  const mockHealthSummary: OfferHealthSummary = {
    offerId: '1',
    status: 'CRITICAL_ERRORS',
    criticalCount: 1,
    warningCount: 1,
    infoCount: 0,
    canCloseRevision: false,
    requiresJustification: false,
    findings: [
      {
        id: 'f1',
        ruleId: 'STK-001',
        module: 'STAKING',
        severity: 'CRITICAL',
        title: 'Divergência na contagem de torres',
        message: '148 estruturas encontradas, 150 declaradas',
        navigationTarget: { tab: 'staking', field: 'declaredTowersCount' },
      },
      {
        id: 'f2',
        ruleId: 'SCH-001',
        module: 'SCHEDULE_RESOURCES',
        severity: 'WARNING',
        title: 'Sobrecarga de equipe',
        message: 'Produção requerida excede máxima',
        navigationTarget: { tab: 'schedule' },
      },
    ],
  };

  beforeEach(async () => {
    mockChecksApi = {
      getHealthChecks: vi.fn().mockReturnValue(of(mockHealthSummary)),
    };

    await TestBed.configureTestingModule({
      imports: [OfferChecksComponent],
      providers: [
        provideHttpClient(),
        { provide: ChecksApiService, useValue: mockChecksApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OfferChecksComponent);
    component = fixture.componentInstance;
    component.offerId = 1;
    fixture.detectChanges();
  });

  it('deve carregar diagnósticos e exibir sumário de saúde', () => {
    expect(component).toBeTruthy();
    expect(mockChecksApi.getHealthChecks).toHaveBeenCalledWith(1);
    expect(component.healthSummary()?.status).toBe('CRITICAL_ERRORS');
    expect(component.healthSummary()?.criticalCount).toBe(1);
  });

  it('deve filtrar diagnósticos por severidade', () => {
    component.setSeverityFilter('CRITICAL');
    const filtered = component.filteredFindings();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].ruleId).toBe('STK-001');
  });

  it('deve emitir evento de navegação ao clicar no botão de ir para pendência', () => {
    const spy = vi.spyOn(component.navigateTo, 'emit');
    component.onNavigate({ tab: 'staking', field: 'declaredTowersCount' });
    expect(spy).toHaveBeenCalledWith({ tab: 'staking', field: 'declaredTowersCount' });
  });
});
