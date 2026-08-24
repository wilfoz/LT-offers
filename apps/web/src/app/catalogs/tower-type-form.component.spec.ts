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
import { TowerTypeFormComponent } from './tower-type-form.component';
import { TowerTypesApi } from './tower-types-api.service';

describe('TowerTypeFormComponent (novo tipo)', () => {
  const apiMock = {
    create: vi.fn().mockReturnValue(of({})),
    createVersion: vi.fn(),
    history: vi.fn(),
  };

  async function mount(params: Record<string, string> = { seriesId: '5' }) {
    await TestBed.configureTestingModule({
      imports: [TowerTypeFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: TowerTypesApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(params) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TowerTypeFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.create.mockReturnValue(of({}));
  });

  it('exige sigla e função com mensagem em português', async () => {
    const fixture = await mount();
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Campo obrigatório');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('adiciona e remove linhas da tabela peso × altura', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    component.addWeight();
    component.addWeight();
    expect(component.weights.length).toBe(2);

    component.removeWeight(0);
    expect(component.weights.length).toBe(1);
  });

  it('remover a linha inválida desbloqueia o Salvar (lição do FormArray)', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;
    component.form.patchValue({ code: 'SA1', function: 'SUSPENSION' });
    component.addWeight({ heightM: 'abc', weightKg: '5200' });

    component.save();
    expect(apiMock.create).not.toHaveBeenCalled();

    component.removeWeight(0);
    component.save();
    expect(apiMock.create).toHaveBeenCalledTimes(1);
  });

  it('rejeita ponto com valor zero ou fora da escala apontando a linha', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;
    component.form.patchValue({ code: 'SA1', function: 'SUSPENSION' });
    component.addWeight({ heightM: '0', weightKg: '5200.125' });
    component.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('número decimal positivo');
    expect(text).toContain('no máximo 2 casas decimais');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('aponta alturas duplicadas antes do submit, inclusive com zeros à direita', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;
    component.form.patchValue({ code: 'SA1', function: 'SUSPENSION' });
    component.addWeight({ heightM: '24', weightKg: '5200' });
    component.addWeight({ heightM: '24.000', weightKg: '5300' });
    component.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('alturas duplicadas');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('envia zero estais como número, branco como null e a tabela completa (RNF-09)', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;
    component.form.patchValue({
      code: 'SA1',
      function: 'SUSPENSION',
      guyCount: '0',
    });
    component.addWeight({ heightM: '24', weightKg: '5200.5' });
    component.addWeight({ heightM: '30', weightKg: '6400' });
    component.save();

    expect(apiMock.create).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        code: 'SA1',
        function: 'SUSPENSION',
        guyCount: 0,
        weights: [
          { heightM: '24', weightKg: '5200.5' },
          { heightM: '30', weightKg: '6400' },
        ],
      }),
    );
  });

  it('envia estais em branco como null, distinto de zero', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;
    component.form.patchValue({ code: 'SA1', function: 'ANCHOR' });
    component.save();

    expect(apiMock.create).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ guyCount: null, weights: [] }),
    );
  });

  it('rejeita seriesId malformado na rota sem chamar a API', async () => {
    const fixture = await mount({ seriesId: 'abc' });
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Identificador inválido');

    fixture.componentInstance.save();
    expect(apiMock.create).not.toHaveBeenCalled();
  });
});

describe('TowerTypeFormComponent (nova versão)', () => {
  const apiMock = {
    create: vi.fn(),
    createVersion: vi.fn().mockReturnValue(of({})),
    history: vi.fn(),
  };

  async function mountEdit(
    params: Record<string, string> = {
      seriesId: '5',
      id: '7',
    },
  ) {
    await TestBed.configureTestingModule({
      imports: [TowerTypeFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: TowerTypesApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(params) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TowerTypeFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.createVersion.mockReturnValue(of({}));
  });

  it('preenche estais e a tabela vigente no FormArray, com função fixa', async () => {
    apiMock.history.mockReturnValue(
      of({
        id: 7,
        code: 'SA1',
        function: 'SUSPENSION',
        versions: [
          {
            id: 20,
            guyCount: 4,
            weights: [
              { heightM: '24', weightKg: '5200.5' },
              { heightM: '30', weightKg: '6400' },
            ],
            effectiveFrom: '2026-03-01T00:00:00.000Z',
            createdBy: 'ana',
            createdAt: '2026-03-01T12:00:00.000Z',
          },
        ],
      }),
    );

    const fixture = await mountEdit();
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.form.controls.guyCount.value).toBe('4');
    expect(component.weights.length).toBe(2);
    expect(component.weights.at(0).controls.heightM.value).toBe('24');

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('suspensão');
    expect(text).toContain('fixa desde a criação');
  });

  it('envia a nova versão com os dois ids e a tabela editada', async () => {
    apiMock.history.mockReturnValue(
      of({
        id: 7,
        code: 'SA1',
        function: 'SUSPENSION',
        versions: [
          {
            id: 20,
            guyCount: 4,
            weights: [{ heightM: '24', weightKg: '5200.5' }],
            effectiveFrom: '2026-03-01T00:00:00.000Z',
            createdBy: 'ana',
            createdAt: '2026-03-01T12:00:00.000Z',
          },
        ],
      }),
    );

    const fixture = await mountEdit();
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.weights.at(0).controls.weightKg.setValue('5300');
    component.form.controls.effectiveFrom.setValue('2026-10-01');
    component.save();

    expect(apiMock.createVersion).toHaveBeenCalledWith(
      5,
      7,
      expect.objectContaining({
        effectiveFrom: '2026-10-01',
        weights: [{ heightM: '24', weightKg: '5300' }],
      }),
    );
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

  it('rejeita id do tipo malformado sem degradar para criação', async () => {
    const fixture = await mountEdit({ seriesId: '5', id: 'abc' });
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Identificador inválido');

    fixture.componentInstance.save();
    expect(apiMock.create).not.toHaveBeenCalled();
    expect(apiMock.createVersion).not.toHaveBeenCalled();
  });
});

describe('TowerTypeFormComponent (confirmação ao salvar)', () => {
  it('abre a confirmação transitória e grava ao salvar com sucesso', async () => {
    const apiMock = {
      create: vi.fn().mockReturnValue(of({})),
      createVersion: vi.fn(),
      history: vi.fn(),
    };
    const snackMock = { open: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [TowerTypeFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: TowerTypesApi, useValue: apiMock },
        { provide: MatSnackBar, useValue: snackMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ seriesId: '5' }) },
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TowerTypeFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      code: 'SA1',
      function: 'SUSPENSION',
    });
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate');
    fixture.componentInstance.save();

    expect(snackMock.open).toHaveBeenCalledWith(
      'Tipo de torre salvo',
      'Fechar',
      expect.objectContaining({ duration: 4000 }),
    );
    expect(apiMock.create).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/catalogs/structure-series', 5]);
  });
});
