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
import { StructureSeriesApi } from './structure-series-api.service';
import { StructureSeriesFormComponent } from './structure-series-form.component';

describe('StructureSeriesFormComponent (nova série)', () => {
  const apiMock = {
    create: vi.fn().mockReturnValue(of({})),
    createVersion: vi.fn(),
    history: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [StructureSeriesFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: StructureSeriesApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(StructureSeriesFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.create.mockReturnValue(of({}));
  });

  it('exige nome e mostra mensagem em português', async () => {
    const fixture = await mount();
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Campo obrigatório');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('rejeita circuitos não inteiros apontando o formato esperado', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({
      name: 'Raptor 500',
      circuitCount: '1.5',
    });
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('número inteiro positivo');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('envia branco como null e contagens como número (RNF-09)', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({
      name: 'Raptor 500',
      voltageKv: '500',
      silMw: '',
      circuitCount: '2',
      insulatorType: 'vidro temperado',
    });
    fixture.componentInstance.save();

    expect(apiMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Raptor 500',
        voltageKv: '500',
        silMw: null,
        circuitCount: 2,
        cablesPerPhase: null,
        insulatorType: 'vidro temperado',
        designer: null,
      }),
    );
  });
});

describe('StructureSeriesFormComponent (nova versão)', () => {
  const apiMock = {
    create: vi.fn(),
    createVersion: vi.fn().mockReturnValue(of({})),
    history: vi.fn(),
  };

  async function mountEdit(id = '1') {
    await TestBed.configureTestingModule({
      imports: [StructureSeriesFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: StructureSeriesApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(StructureSeriesFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.createVersion.mockReturnValue(of({}));
  });

  it('preenche o formulário com a última versão, incluindo contagens', async () => {
    apiMock.history.mockReturnValue(
      of({
        id: 1,
        name: 'Raptor 500',
        versions: [
          {
            id: 5,
            designer: 'SAE Towers',
            voltageKv: '500',
            circuitCount: 2,
            cablesPerPhase: 4,
            designWindSpeedMs: null,
            insulatorType: null,
            silMw: '1150.5',
            effectiveFrom: '2026-03-01T00:00:00.000Z',
            createdBy: 'ana',
            createdAt: '2026-03-01T12:00:00.000Z',
          },
        ],
      }),
    );

    const fixture = await mountEdit();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.circuitCount.value).toBe(
      '2',
    );
    expect(fixture.componentInstance.form.controls.silMw.value).toBe('1150.5');
    expect(fixture.componentInstance.currentName()).toBe('Raptor 500');
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

describe('StructureSeriesFormComponent (confirmação ao salvar)', () => {
  it('abre a confirmação transitória e grava ao salvar com sucesso', async () => {
    const apiMock = {
      create: vi.fn().mockReturnValue(of({})),
      createVersion: vi.fn(),
      history: vi.fn(),
    };
    const snackMock = { open: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [StructureSeriesFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: StructureSeriesApi, useValue: apiMock },
        { provide: MatSnackBar, useValue: snackMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(StructureSeriesFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({ name: 'S1' });
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate');
    fixture.componentInstance.save();

    expect(snackMock.open).toHaveBeenCalledWith(
      'Série de estrutura salva',
      'Fechar',
      expect.objectContaining({ duration: 4000 }),
    );
    expect(apiMock.create).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/catalogs/structure-series']);
  });
});
