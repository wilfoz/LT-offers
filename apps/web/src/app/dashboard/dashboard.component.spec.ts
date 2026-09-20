import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { OffersApi } from '../offers/offers-api.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  const mockOffersApi = {
    list: () => of([]),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: OffersApi, useValue: mockOffersApi },
      ],
    }).compileComponents();
  });

  it('renderiza o painel de controle e os 4 cartões de KPI', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.page-title')?.textContent).toContain(
      'Painel de Controle',
    );
    const kpiCards = el.querySelectorAll('.kpi-card');
    expect(kpiCards.length).toBe(4);
    expect(el.textContent).toContain('Torres Totais');
    expect(el.textContent).toContain('Pendências de Validação');
    expect(el.textContent).toContain('Torres Liberadas');
    expect(el.textContent).toContain('Alertas Críticos');
  });

  it('exibe a tabela de ações pendentes com as inconsistências', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('TR-042');
    expect(el.textContent).toContain('Afloramento fora do limite');
    expect(el.textContent).toContain('Crítico');
  });
});
