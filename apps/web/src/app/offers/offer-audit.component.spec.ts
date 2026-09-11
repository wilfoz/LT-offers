import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { OfferAuditComponent } from './offer-audit.component';
import { AuditApiService } from './audit-api.service';
import { AuditEvent } from '@lt-offers/domain';

describe('OfferAuditComponent', () => {
  let component: OfferAuditComponent;
  let fixture: ComponentFixture<OfferAuditComponent>;
  let mockAuditApi: any;

  const mockEvents: AuditEvent[] = [
    {
      id: 'evt-1',
      timestamp: '2026-09-10T14:30:00.000Z',
      userId: 'user-comm-01',
      userName: 'Marcos Comercial',
      userRole: 'COMMERCIAL',
      resource: 'ECONOMIC_RESULT',
      offerId: '1',
      action: 'UPDATE',
      description: 'Ajuste de margem líquida alvo para 8.00%',
      diffs: [
        { field: 'targetMarginRate', previousValue: '7.50', newValue: '8.00' },
      ],
    },
    {
      id: 'evt-2',
      timestamp: '2026-09-10T10:15:00.000Z',
      userId: 'user-eng-01',
      userName: 'Carlos Engenharia',
      userRole: 'ENGINEERING',
      resource: 'STAKING',
      offerId: '1',
      action: 'UPDATE',
      description: 'Alteração de 3 fundações para solo rochoso',
      diffs: [
        { field: 'soilType', previousValue: 'SOLO_1', newValue: 'SOLO_3' },
      ],
    },
  ];

  beforeEach(async () => {
    mockAuditApi = {
      getEvents: vi.fn().mockReturnValue(of(mockEvents)),
      logEvent: vi.fn().mockReturnValue(of(mockEvents[0])),
    };

    await TestBed.configureTestingModule({
      imports: [OfferAuditComponent],
      providers: [
        provideHttpClient(),
        { provide: AuditApiService, useValue: mockAuditApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OfferAuditComponent);
    component = fixture.componentInstance;
    component.offerId = '1';
    fixture.detectChanges();
  });

  it('inicializa e carrega eventos de auditoria da proposta', () => {
    expect(mockAuditApi.getEvents).toHaveBeenCalledWith({ offerId: '1' });
    expect(component.events()).toHaveLength(2);
    expect(component.filteredEvents()).toHaveLength(2);
  });

  it('filtra eventos por busca textual', () => {
    component.searchQuery.set('Carlos');
    expect(component.filteredEvents()).toHaveLength(1);
    expect(component.filteredEvents()[0].userId).toBe('user-eng-01');

    component.searchQuery.set('margem');
    expect(component.filteredEvents()).toHaveLength(1);
    expect(component.filteredEvents()[0].userRole).toBe('COMMERCIAL');
  });

  it('filtra eventos por recurso e perfil', () => {
    component.selectedResource.set('ECONOMIC_RESULT');
    expect(component.filteredEvents()).toHaveLength(1);

    component.selectedResource.set('ALL');
    component.selectedRole.set('ENGINEERING');
    expect(component.filteredEvents()).toHaveLength(1);
    expect(component.filteredEvents()[0].userRole).toBe('ENGINEERING');
  });
});
