import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter, Router } from '@angular/router';
import { OfferSummary } from '@lt-offers/domain';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { OfferListComponent } from './offer-list.component';
import { OffersApi } from './offers-api.service';

const mockOffer = (overrides: Partial<OfferSummary> = {}): OfferSummary => ({
  id: 1,
  code: 'OF-2026-L1',
  name: 'Lote 1 - Linhas Sul',
  clientName: 'Axia Energia',
  baseCurrency: 'BRL',
  clonedFromOfferId: null,
  currentRevisionNumber: 0,
  currentRevisionStatus: 'DRAFT',
  auctionName: 'Leilão 01/2026',
  lotName: 'Lote 1',
  lineCount: 2,
  totalLengthKm: '320.500',
  hasPendingIssues: false,
  createdBy: 'user1',
  createdAt: '2026-03-01T10:00:00.000Z',
  updatedAt: '2026-03-01T10:00:00.000Z',
  ...overrides,
});

describe('OfferListComponent', () => {
  const apiMock = {
    list: vi.fn(),
    clone: vi.fn(),
    delete: vi.fn(),
  };

  const snackBarMock = {
    open: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [OfferListComponent],
      providers: [
        provideRouter([]),
        { provide: OffersApi, useValue: apiMock },
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(OfferListComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe listagem de propostas com leilão, lote, linhas e badges', async () => {
    apiMock.list.mockReturnValue(of([mockOffer()]));

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('OF-2026-L1');
    expect(text).toContain('Lote 1 - Linhas Sul');
    expect(text).toContain('Axia Energia');
    expect(text).toContain('Leilão 01/2026');
    expect(text).toContain('Lote 1');
    expect(text).toContain('R0');
    expect(text).toContain('Rascunho');
    expect(text).toContain('2 LT (320.500 km)');
    expect(text).toContain('Válida');
  });

  it('sinaliza propostas com pendências', async () => {
    apiMock.list.mockReturnValue(
      of([
        mockOffer({
          id: 2,
          code: 'OF-INCOMPLETA',
          name: 'Proposta Sem Linhas',
          lineCount: 0,
          totalLengthKm: '0.000',
          hasPendingIssues: true,
        }),
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('OF-INCOMPLETA');
    expect(text).toContain('Incompleta');
    expect(text).toContain('0 LT (0.000 km)');
  });

  it('exibe empty state quando não há propostas', async () => {
    apiMock.list.mockReturnValue(of([]));

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Nenhuma oferta encontrada.');
    expect(text).toContain('Cadastrar primeira proposta');
  });

  it('exibe mensagem amigável em caso de erro na API', async () => {
    apiMock.list.mockReturnValue(throwError(() => new Error('Falha de rede')));

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Não foi possível carregar as propostas');
  });

  it('permite clonar uma proposta com prompt de código e nome', async () => {
    apiMock.list.mockReturnValue(of([mockOffer()]));
    apiMock.clone.mockReturnValue(
      of({
        id: 99,
        code: 'OF-2026-L1-CLONE',
        name: 'Lote 1 Clonado',
      }),
    );

    const promptSpy = vi.spyOn(window, 'prompt');
    promptSpy
      .mockReturnValueOnce('OF-2026-L1-CLONE')
      .mockReturnValueOnce('Lote 1 Clonado');

    const fixture = await mount();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    fixture.componentInstance.cloneOffer(mockOffer());

    expect(apiMock.clone).toHaveBeenCalledWith(1, {
      targetCode: 'OF-2026-L1-CLONE',
      targetName: 'Lote 1 Clonado',
    });
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Proposta OF-2026-L1-CLONE clonada com sucesso!',
      'OK',
      expect.anything(),
    );
    expect(navigateSpy).toHaveBeenCalledWith(['/offers', 99]);
  });

  it('permite excluir uma proposta confirmada', async () => {
    apiMock.list.mockReturnValue(of([mockOffer()]));
    apiMock.delete.mockReturnValue(of(void 0));
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const fixture = await mount();
    fixture.componentInstance.deleteOffer(mockOffer());

    expect(apiMock.delete).toHaveBeenCalledWith(1);
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Proposta OF-2026-L1 excluída com sucesso.',
      'OK',
      expect.anything(),
    );
  });
});
