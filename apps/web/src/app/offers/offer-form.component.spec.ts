import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
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

  async function mount(paramId?: string, beforeCreate?: () => void) {
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
    beforeCreate?.();
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

  it('envia identidade do leilão e prazos do edital no payload de criação', async () => {
    apiMock.create.mockReturnValue(of({ id: 11, code: 'OF-2026-02' }));

    const fixture = await mount();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const comp = fixture.componentInstance;
    comp.form.patchValue({
      code: 'OF-2026-02',
      name: 'Proposta Leilão 4/2026',
      clientName: 'Cliente',
      auctionName: 'Leilão Aneel 004/2026',
      lotName: 'Lote 04',
      auctionNumber: '004/2026',
      lotNumber: '4',
      subLotCode: '4a',
      contractSigningDate: '2027-02-26',
      constructionDeadlineMonths: '60',
      offerDate: '2026-09-01',
    });

    comp.save();

    expect(apiMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        auctionNumber: '004/2026',
        lotNumber: 4,
        subLotCode: '4A',
        contractSigningDate: '2027-02-26',
        constructionDeadlineMonths: 60,
      }),
    );
  });

  it('valida os campos novos com mensagens em português espelhando a API', async () => {
    const fixture = await mount();
    const comp = fixture.componentInstance;

    comp.form.patchValue({
      auctionNumber: '4/2026',
      lotNumber: '0',
      subLotCode: '4ABC',
      contractSigningDate: '2027-02-30',
      constructionDeadlineMonths: '241',
    });
    comp.form.markAllAsTouched();

    expect(comp.errorFor('auctionNumber')).toBe(
      'O número do leilão deve estar no formato NNN/AAAA (ex.: 004/2026)',
    );
    expect(comp.errorFor('lotNumber')).toBe(
      'O número do lote deve ser maior ou igual a 1',
    );
    expect(comp.errorFor('subLotCode')).toBe(
      'O sublote deve ter no máximo 3 caracteres',
    );
    expect(comp.errorFor('contractSigningDate')).toBe(
      'A data de assinatura do contrato deve ser uma data de calendário válida no formato AAAA-MM-DD',
    );
    expect(comp.errorFor('constructionDeadlineMonths')).toBe(
      'O prazo de construção deve ser de no máximo 240 meses',
    );

    comp.save();
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('pré-visualiza data-limite contratual e deságio derivados ao digitar', async () => {
    const fixture = await mount();
    const comp = fixture.componentInstance;

    comp.form.patchValue({
      contractSigningDate: '2027-02-26',
      constructionDeadlineMonths: '60',
      maxRap: '762630000.00',
      winningRap: '381315000.00',
    });
    fixture.detectChanges();

    expect(comp.previewContractualDeadline()).toBe('2032-02-26');
    expect(comp.previewDiscountPercent()).toBe('50.00');

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('2032-02-26');
    expect(text).toContain('50,00%');
    expect(text).toContain('CAPEX estimado ANEEL (lote inteiro, conforme');
  });

  it('botão de criação reflete o estado desabilitado do formulário', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.disable();
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;
    expect(button?.disabled).toBe(true);
  });

  it('exibe erro em snackbar e retorna à listagem quando o carregamento falha', async () => {
    apiMock.getById.mockReturnValue(
      throwError(() => ({ error: { message: 'Falha' } })),
    );

    let navigateSpy: ReturnType<typeof vi.fn> | undefined;
    const fixture = await mount('7', () => {
      const router = TestBed.inject(Router);
      navigateSpy = vi
        .spyOn(router, 'navigate')
        .mockResolvedValue(true) as unknown as ReturnType<typeof vi.fn>;
    });

    expect(navigateSpy).toHaveBeenCalledWith(['/offers']);
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Não foi possível carregar a proposta para edição.',
      'Fechar',
      expect.anything(),
    );
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('permite alternar tipos de estrutura entre autoportante, estaiada e ambas', async () => {
    const fixture = await mount();
    const comp = fixture.componentInstance;

    // Inicialmente ambas habilitadas
    expect(comp.includeSelfSupporting()).toBe(true);
    expect(comp.includeGuyed()).toBe(true);

    // Selecionar preset apenas autoportante
    comp.setStructurePreset('SELF_SUPPORTING');
    expect(comp.includeSelfSupporting()).toBe(true);
    expect(comp.includeGuyed()).toBe(false);

    // Selecionar preset apenas estaiada
    comp.setStructurePreset('GUYED');
    expect(comp.includeSelfSupporting()).toBe(false);
    expect(comp.includeGuyed()).toBe(true);

    // Selecionar preset ambas
    comp.setStructurePreset('BOTH');
    expect(comp.includeSelfSupporting()).toBe(true);
    expect(comp.includeGuyed()).toBe(true);

    // Tentar desmarcar tudo bloqueia e exibe snackBar
    comp.setStructurePreset('SELF_SUPPORTING');
    comp.toggleSelfSupporting();
    expect(comp.includeSelfSupporting()).toBe(true); // Permanece true
    expect(snackBarMock.open).toHaveBeenCalledWith(
      expect.stringContaining('Selecione pelo menos um tipo de estrutura'),
      'OK',
      expect.anything(),
    );
  });
});
