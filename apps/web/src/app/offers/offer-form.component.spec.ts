import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { OfferFormComponent } from './offer-form.component';
import { OffersApi } from './offers-api.service';

describe('OfferFormComponent', () => {
  const apiMock = {
    create: vi.fn(),
    getById: vi.fn(),
    updateGeneral: vi.fn(),
  };

  const snackBarMock = {
    open: vi.fn(),
  };

  async function mount(paramId?: string) {
    await TestBed.configureTestingModule({
      imports: [OfferFormComponent],
      providers: [
        provideRouter([]),
        { provide: OffersApi, useValue: apiMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? (paramId ?? null) : null),
              },
            },
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(OfferFormComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza formulário de criação com campos obrigatórios e cria oferta', async () => {
    apiMock.create.mockReturnValue(
      of({
        id: 10,
        code: 'OF-2026-01',
        name: 'Proposta Teste',
      }),
    );

    const fixture = await mount();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    const comp = fixture.componentInstance;
    comp.form.patchValue({
      code: 'OF-2026-01',
      name: 'Proposta Teste',
      clientName: 'Cliente Teste',
      baseCurrency: 'BRL',
      auctionName: 'Leilão 01/2026',
      lotName: 'Lote 1',
      offerDate: '2026-03-01',
      estimatedCapex: '100000.00',
    });

    comp.save();

    expect(apiMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'OF-2026-01',
        name: 'Proposta Teste',
        clientName: 'Cliente Teste',
        baseCurrency: 'BRL',
        auctionName: 'Leilão 01/2026',
        lotName: 'Lote 1',
        offerDate: '2026-03-01',
        estimatedCapex: '100000.00',
      }),
    );
    expect(navigateSpy).toHaveBeenCalledWith(['/offers', 10]);
  });

  it('detecta inconsistência de cronograma quando início é posterior ao término (RN-02)', async () => {
    const fixture = await mount();
    const comp = fixture.componentInstance;

    comp.form.patchValue({
      scheduleStartDate: '2027-01-01',
      commercialOperationDate: '2026-06-01',
    });

    expect(comp.hasScheduleInconsistency()).toBe(true);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Alerta de Cronograma (RN-02)');
  });

  it('carrega dados em modo edição e salva alterações gerais', async () => {
    apiMock.getById.mockReturnValue(
      of({
        id: 5,
        code: 'OF-EXISTENTE',
        name: 'Nome Existente',
        clientName: 'Cliente Existente',
        baseCurrency: 'USD',
      }),
    );
    apiMock.updateGeneral.mockReturnValue(
      of({
        id: 5,
        code: 'OF-EDITADA',
        name: 'Nome Editado',
      }),
    );

    const fixture = await mount('5');
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    const comp = fixture.componentInstance;
    expect(comp.form.controls.code.value).toBe('OF-EXISTENTE');

    comp.form.patchValue({
      code: 'OF-EDITADA',
      name: 'Nome Editado',
    });

    comp.save();

    expect(apiMock.updateGeneral).toHaveBeenCalledWith(5, {
      name: 'Nome Editado',
      clientName: 'Cliente Existente',
      baseCurrency: 'USD',
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/offers', 5]);
  });
});
