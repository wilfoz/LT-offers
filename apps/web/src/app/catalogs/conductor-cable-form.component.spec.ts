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
import { ConductorCablesApi } from './conductor-cables-api.service';
import { ConductorCableFormComponent } from './conductor-cable-form.component';

describe('ConductorCableFormComponent (novo cabo)', () => {
  const apiMock = {
    create: vi.fn().mockReturnValue(of({})),
    createVersion: vi.fn(),
    history: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [ConductorCableFormComponent],
      providers: [
        // catch-all: o save() navega para a listagem após sucesso
        provideRouter([{ path: '**', children: [] }]),
        { provide: ConductorCablesApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ConductorCableFormComponent);
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

  it('rejeita valor numérico inválido apontando o formato esperado', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({
      code: 'CAA-636',
      weightTonPerKm: 'abc',
    });
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('número decimal positivo');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('envia campo em branco como null (não informado), nunca como zero', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({
      code: 'CAA-636',
      weightTonPerKm: '1.3026',
      utsKn: '',
    });
    fixture.componentInstance.save();

    expect(apiMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'CAA-636',
        weightTonPerKm: '1.3026',
        utsKn: null,
      }),
    );
  });
});

describe('ConductorCableFormComponent (nova versão)', () => {
  const apiMock = {
    create: vi.fn(),
    createVersion: vi.fn().mockReturnValue(of({})),
    history: vi.fn(),
  };

  async function mountEdit(id = '1') {
    await TestBed.configureTestingModule({
      imports: [ConductorCableFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ConductorCablesApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ConductorCableFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.createVersion.mockReturnValue(of({}));
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
    expect(apiMock.history).not.toHaveBeenCalled();

    fixture.componentInstance.save();
    expect(apiMock.create).not.toHaveBeenCalled();
    expect(apiMock.createVersion).not.toHaveBeenCalled();
  });
});

describe('ConductorCableFormComponent (confirmação ao salvar)', () => {
  it('abre a confirmação transitória e grava ao salvar com sucesso', async () => {
    const apiMock = {
      create: vi.fn().mockReturnValue(of({})),
      createVersion: vi.fn(),
      history: vi.fn(),
    };
    const snackMock = { open: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [ConductorCableFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ConductorCablesApi, useValue: apiMock },
        { provide: MatSnackBar, useValue: snackMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ConductorCableFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({ code: 'CA-1' });
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate');
    fixture.componentInstance.save();

    expect(snackMock.open).toHaveBeenCalledWith(
      'Cabo condutor salvo',
      'Fechar',
      expect.objectContaining({ duration: 4000 }),
    );
    expect(apiMock.create).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/catalogs/conductor-cables']);
  });
});
