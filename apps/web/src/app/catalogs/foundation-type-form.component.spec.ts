import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
  Router,
} from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';
import { FOUNDATION_ELEMENT_COUNT_FIELDS } from '@lt-offers/domain';
import { FoundationTypeFormComponent } from './foundation-type-form.component';
import { FoundationTypesApi } from './foundation-types-api.service';

describe('FoundationTypeFormComponent (novo tipo de fundação)', () => {
  const apiMock = {
    create: vi.fn().mockReturnValue(of({})),
    createVersion: vi.fn(),
    history: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [FoundationTypeFormComponent],
      providers: [
        // catch-all: o save() navega para a listagem após sucesso
        provideRouter([{ path: '**', children: [] }]),
        { provide: FoundationTypesApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FoundationTypeFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.create.mockReturnValue(of({}));
  });

  it('exige sigla e aplicação com mensagem em português', async () => {
    const fixture = await mount();
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Campo obrigatório');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('rejeita contagem fracionária ou negativa apontando o formato', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({
      code: '4FZ',
      application: 'SELF_SUPPORTING',
    });
    fixture.componentInstance.form.controls.counts.controls.spreadFootingCount.setValue(
      '1.5',
    );
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Informe um número inteiro maior ou igual a zero');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('envia contagens em branco como null e zero como zero (RNF-09)', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({
      code: '4FZ',
      application: 'SELF_SUPPORTING',
      description: '4 x Fuste zapata',
    });
    const counts = fixture.componentInstance.form.controls.counts.controls;
    counts.spreadFootingCount.setValue('4');
    counts.precastMastCount.setValue('0');
    fixture.componentInstance.save();

    expect(apiMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        code: '4FZ',
        application: 'SELF_SUPPORTING',
        description: '4 x Fuste zapata',
        spreadFootingCount: 4,
        precastMastCount: 0,
        precastGuyCount: null,
        continuousAugerPileCount: null,
      }),
    );
  });

  it('renderiza um campo por elemento da lista da domain (paridade form ↔ contrato)', async () => {
    const fixture = await mount();
    const html = fixture.nativeElement as HTMLElement;

    for (const field of FOUNDATION_ELEMENT_COUNT_FIELDS) {
      expect(html.querySelector(`#${field}`)).not.toBeNull();
    }
  });
});

describe('FoundationTypeFormComponent (nova versão)', () => {
  const apiMock = {
    create: vi.fn(),
    createVersion: vi.fn().mockReturnValue(of({})),
    history: vi.fn(),
  };

  async function mountEdit(id = '1') {
    await TestBed.configureTestingModule({
      imports: [FoundationTypeFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: FoundationTypesApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FoundationTypeFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  const historyPayload = () => ({
    id: 1,
    code: '1PR - 4P',
    application: 'GUYED',
    versions: [
      {
        id: 5,
        description: '1 x Mastro preformado 4 x Tirantes pilas',
        ...Object.fromEntries(
          FOUNDATION_ELEMENT_COUNT_FIELDS.map((field) => [field, null]),
        ),
        precastMastCount: 1,
        straightPierGuyCount: 4,
        effectiveFrom: '2026-03-01T00:00:00.000Z',
        createdBy: 'ana',
        createdAt: '2026-03-01T12:00:00.000Z',
      },
    ],
  });

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.createVersion.mockReturnValue(of({}));
  });

  it('preenche o formulário com a última versão e trava a aplicação como texto', async () => {
    apiMock.history.mockReturnValue(of(historyPayload()));

    const fixture = await mountEdit();
    fixture.detectChanges();

    const counts = fixture.componentInstance.form.controls.counts.controls;
    expect(counts.precastMastCount.value).toBe('1');
    expect(counts.straightPierGuyCount.value).toBe('4');
    expect(counts.spreadFootingCount.value).toBe('');

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Estaiada');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('#application'),
    ).toBeNull();
  });

  it('bloqueia o salvar enquanto o prefill não conclui (evita versão toda nula)', async () => {
    apiMock.history.mockReturnValue(NEVER);

    const fixture = await mountEdit();
    fixture.componentInstance.save();

    expect(apiMock.createVersion).not.toHaveBeenCalled();
  });

  it('bloqueia o salvar e exibe erro quando o prefill falha', async () => {
    apiMock.history.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await mountEdit();
    fixture.detectChanges();
    fixture.componentInstance.save();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Não foi possível carregar os dados atuais');
    expect(apiMock.createVersion).not.toHaveBeenCalled();
  });

  it('não envia aplicação no payload da nova versão (combinação imutável)', async () => {
    apiMock.history.mockReturnValue(of(historyPayload()));

    const fixture = await mountEdit();
    fixture.detectChanges();
    fixture.componentInstance.form.controls.effectiveFrom.setValue(
      '2026-10-01',
    );
    fixture.componentInstance.save();

    const payload = apiMock.createVersion.mock.calls[0][1];
    expect(payload).not.toHaveProperty('application');
    expect(payload.precastMastCount).toBe(1);
  });

  it('rejeita identificador malformado na rota sem degradar para criação', async () => {
    const fixture = await mountEdit('abc');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Identificador inválido');

    fixture.componentInstance.save();
    expect(apiMock.create).not.toHaveBeenCalled();
    expect(apiMock.createVersion).not.toHaveBeenCalled();
  });
});

describe('FoundationTypeFormComponent (confirmação ao salvar)', () => {
  it('abre a confirmação transitória e grava ao salvar com sucesso', async () => {
    const apiMock = {
      create: vi.fn().mockReturnValue(of({})),
      createVersion: vi.fn(),
      history: vi.fn(),
    };
    const snackMock = { open: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [FoundationTypeFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: FoundationTypesApi, useValue: apiMock },
        { provide: MatSnackBar, useValue: snackMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FoundationTypeFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      code: '4FZ',
      application: 'SELF_SUPPORTING',
    });
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate');
    fixture.componentInstance.save();

    expect(snackMock.open).toHaveBeenCalledWith(
      'Tipo de fundação salvo',
      'Fechar',
      expect.objectContaining({ duration: 4000 }),
    );
    expect(apiMock.create).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/catalogs/foundation-types']);
  });
});
