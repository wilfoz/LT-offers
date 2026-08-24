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
import { GuyWireFormComponent } from './guy-wire-form.component';
import { GuyWiresApi } from './guy-wires-api.service';

describe('GuyWireFormComponent (novo cabo)', () => {
  const apiMock = {
    create: vi.fn().mockReturnValue(of({})),
    createVersion: vi.fn(),
    history: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [GuyWireFormComponent],
      providers: [
        // catch-all: o save() navega para a listagem após sucesso
        provideRouter([{ path: '**', children: [] }]),
        { provide: GuyWiresApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(GuyWireFormComponent);
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

  it('rejeita número de fios não inteiro apontando o formato esperado', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({
      code: 'CT-HS-5/16',
      wireCount: '2.5',
    });
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('número inteiro positivo');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('envia branco como null e número de fios como número (RNF-09)', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({
      code: 'CT-HS-5/16',
      weightTonPerKm: '0.31',
      utsKn: '',
      strengthGrade: 'HS',
      wireCount: '7',
    });
    fixture.componentInstance.save();

    expect(apiMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'CT-HS-5/16',
        weightTonPerKm: '0.31',
        utsKn: null,
        strengthGrade: 'HS',
        wireCount: 7,
        galvanizationClass: null,
      }),
    );
  });
});

describe('GuyWireFormComponent (nova versão)', () => {
  const apiMock = {
    create: vi.fn(),
    createVersion: vi.fn().mockReturnValue(of({})),
    history: vi.fn(),
  };

  async function mountEdit(id = '1') {
    await TestBed.configureTestingModule({
      imports: [GuyWireFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: GuyWiresApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(GuyWireFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.createVersion.mockReturnValue(of({}));
  });

  it('preenche o formulário com a última versão, incluindo número de fios', async () => {
    apiMock.history.mockReturnValue(
      of({
        id: 1,
        code: 'CT-HS-5/16',
        versions: [
          {
            id: 5,
            description: null,
            weightTonPerKm: '0.31',
            reelLengthM: null,
            diameterMm: null,
            utsKn: null,
            galvanizationClass: 'B',
            strengthGrade: 'HS',
            wireCount: 7,
            effectiveFrom: '2026-03-01T00:00:00.000Z',
            createdBy: 'ana',
            createdAt: '2026-03-01T12:00:00.000Z',
          },
        ],
      }),
    );

    const fixture = await mountEdit();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.wireCount.value).toBe('7');
    expect(fixture.componentInstance.form.controls.strengthGrade.value).toBe(
      'HS',
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

describe('GuyWireFormComponent (confirmação ao salvar)', () => {
  it('abre a confirmação transitória e grava ao salvar com sucesso', async () => {
    const apiMock = {
      create: vi.fn().mockReturnValue(of({})),
      createVersion: vi.fn(),
      history: vi.fn(),
    };
    const snackMock = { open: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [GuyWireFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: GuyWiresApi, useValue: apiMock },
        { provide: MatSnackBar, useValue: snackMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(GuyWireFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({ code: 'CT-1' });
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate');
    fixture.componentInstance.save();

    expect(snackMock.open).toHaveBeenCalledWith(
      'Cabo de tirante salvo',
      'Fechar',
      expect.objectContaining({ duration: 4000 }),
    );
    expect(apiMock.create).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/catalogs/guy-wires']);
  });
});
