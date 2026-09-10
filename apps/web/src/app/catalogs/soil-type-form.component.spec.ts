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
import { SoilTypeFormComponent } from './soil-type-form.component';
import { SoilTypesApi } from './soil-types-api.service';

describe('SoilTypeFormComponent (novo tipo de solo)', () => {
  const apiMock = {
    create: vi.fn().mockReturnValue(of({})),
    createVersion: vi.fn(),
    history: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [SoilTypeFormComponent],
      providers: [
        // catch-all: o save() navega para a listagem após sucesso
        provideRouter([{ path: '**', children: [] }]),
        { provide: SoilTypesApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SoilTypeFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.create.mockReturnValue(of({}));
  });

  it('exige código e mostra mensagem em português', async () => {
    const fixture = await mount();
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Campo obrigatório');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('rejeita decimal malformado apontando o formato esperado', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({
      code: 'I',
      specificWeightKgfM3: 'abc',
    });
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('número decimal positivo com ponto');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('rejeita casas decimais além da precisão da coluna apontando o limite', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({
      code: 'I',
      allowableCompressionStressKgfCm2: '3.005',
    });
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Use no máximo 2 casas decimais');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('rejeita faixa de NSPT informada pela metade com mensagem visível', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({ code: 'I', nsptMin: '12' });
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('faixa de NSPT completa');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('rejeita faixa de NSPT invertida com mensagem visível', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({
      code: 'I',
      nsptMin: '16',
      nsptMax: '12',
    });
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('O NSPT mínimo deve ser menor que o NSPT máximo');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('envia branco como null, submerso "Não" como false e NSPT como número (RNF-09)', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({
      code: 'I',
      description: 'Duro',
      submerged: 'false',
      allowableCompressionStressKgfCm2: '3',
      specificWeightKgfM3: '',
      nsptMin: '12',
      nsptMax: '16',
    });
    fixture.componentInstance.save();

    expect(apiMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'I',
        description: 'Duro',
        submerged: false,
        allowableCompressionStressKgfCm2: '3',
        specificWeightKgfM3: null,
        internalFrictionAngleDeg: null,
        cohesionKgCm2: null,
        nsptMin: 12,
        nsptMax: 16,
      }),
    );
  });

  it('envia submerso não informado como null, distinto de "Não"', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({ code: 'R' });
    fixture.componentInstance.save();

    expect(apiMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'R', submerged: null }),
    );
  });
});

describe('SoilTypeFormComponent (nova versão)', () => {
  const apiMock = {
    create: vi.fn(),
    createVersion: vi.fn().mockReturnValue(of({})),
    history: vi.fn(),
  };

  async function mountEdit(id = '1') {
    await TestBed.configureTestingModule({
      imports: [SoilTypeFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: SoilTypesApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SoilTypeFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.createVersion.mockReturnValue(of({}));
  });

  it('preenche o formulário com a última versão, incluindo submerso e a faixa de NSPT', async () => {
    apiMock.history.mockReturnValue(
      of({
        id: 1,
        code: 'IVS',
        versions: [
          {
            id: 5,
            description: 'Malo con agua',
            submerged: true,
            allowableCompressionStressKgfCm2: '1',
            specificWeightKgfM3: '1000',
            internalFrictionAngleDeg: '14',
            cohesionKgCm2: null,
            nsptMin: 4,
            nsptMax: 6,
            effectiveFrom: '2026-03-01T00:00:00.000Z',
            createdBy: 'ana',
            createdAt: '2026-03-01T12:00:00.000Z',
          },
        ],
      }),
    );

    const fixture = await mountEdit();
    fixture.detectChanges();

    const controls = fixture.componentInstance.form.controls;
    expect(controls.submerged.value).toBe('true');
    expect(controls.nsptMin.value).toBe('4');
    expect(controls.nsptMax.value).toBe('6');
    expect(controls.cohesionKgCm2.value).toBe('');
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

describe('SoilTypeFormComponent (confirmação ao salvar)', () => {
  it('abre a confirmação transitória e grava ao salvar com sucesso', async () => {
    const apiMock = {
      create: vi.fn().mockReturnValue(of({})),
      createVersion: vi.fn(),
      history: vi.fn(),
    };
    const snackMock = { open: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [SoilTypeFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: SoilTypesApi, useValue: apiMock },
        { provide: MatSnackBar, useValue: snackMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SoilTypeFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({ code: 'I' });
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate');
    fixture.componentInstance.save();

    expect(snackMock.open).toHaveBeenCalledWith(
      'Tipo de solo salvo',
      'Fechar',
      expect.objectContaining({ duration: 4000 }),
    );
    expect(apiMock.create).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/catalogs/soil-types']);
  });
});
