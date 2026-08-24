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
import { GroundWireFormComponent } from './ground-wire-form.component';
import { GroundWiresApi } from './ground-wires-api.service';

describe('GroundWireFormComponent (novo cabo)', () => {
  const apiMock = {
    create: vi.fn().mockReturnValue(of({})),
    createVersion: vi.fn(),
    history: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [GroundWireFormComponent],
      providers: [
        // catch-all: o save() navega para a listagem após sucesso
        provideRouter([{ path: '**', children: [] }]),
        { provide: GroundWiresApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(GroundWireFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.create.mockReturnValue(of({}));
  });

  it('exige código e tipo com mensagens em português', async () => {
    const fixture = await mount();
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Campo obrigatório');
    expect(text).toContain('Selecione o tipo');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('mostra os campos específicos conforme o tipo selecionado', async () => {
    const fixture = await mount();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).not.toContain('Classe de galvanização');
    expect(element.textContent).not.toContain('Fabricante');

    fixture.componentInstance.form.controls.type.setValue('STEEL');
    fixture.detectChanges();
    expect(element.textContent).toContain('Classe de galvanização');
    expect(element.textContent).not.toContain('Fabricante');

    fixture.componentInstance.form.controls.type.setValue('OPGW');
    fixture.detectChanges();
    expect(element.textContent).toContain('Fabricante');
    expect(element.textContent).not.toContain('Classe de galvanização');
  });

  it('rejeita contagem fracionária ou não positiva apontando o formato', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({
      code: 'OPGW-48FO',
      type: 'OPGW',
      fiberCount: '2.5',
    });
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('número inteiro positivo');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('não trava o salvar quando valor inválido ficou oculto pela troca de tipo', async () => {
    const fixture = await mount();
    // Digitação inválida no tipo aço…
    fixture.componentInstance.form.patchValue({
      code: 'OPGW-48FO',
      type: 'STEEL',
      wireCount: 'abc',
    });
    // …seguida da troca para OPGW: o campo inválido some da tela e não pode
    // impedir o salvar em silêncio (review grupo-4, M1)
    fixture.componentInstance.form.patchValue({
      type: 'OPGW',
      fiberCount: '48',
    });
    fixture.componentInstance.save();

    expect(apiMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'OPGW',
        wireCount: null,
        fiberCount: 48,
      }),
    );
  });

  it('envia branco como null e anula os campos do outro tipo (RNF-09)', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({
      code: 'CG-EHS-3/8',
      type: 'STEEL',
      weightTonPerKm: '0.406',
      utsKn: '',
      strengthGrade: 'EHS',
      wireCount: '7',
      // valores digitados antes de trocar o tipo para aço não podem vazar
      manufacturer: 'Prysmian',
      fiberCount: '48',
    });
    fixture.componentInstance.save();

    expect(apiMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'CG-EHS-3/8',
        type: 'STEEL',
        weightTonPerKm: '0.406',
        utsKn: null,
        strengthGrade: 'EHS',
        wireCount: 7,
        manufacturer: null,
        i2tKa2s: null,
        fiberCount: null,
      }),
    );
  });
});

describe('GroundWireFormComponent (nova versão)', () => {
  const apiMock = {
    create: vi.fn(),
    createVersion: vi.fn().mockReturnValue(of({})),
    history: vi.fn(),
  };

  async function mountEdit() {
    await TestBed.configureTestingModule({
      imports: [GroundWireFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: GroundWiresApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(GroundWireFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.createVersion.mockReturnValue(of({}));
  });

  it('trava o tipo do item e mostra os campos específicos dele', async () => {
    apiMock.history.mockReturnValue(
      of({
        id: 1,
        code: 'OPGW-48FO',
        type: 'OPGW',
        versions: [
          {
            id: 5,
            description: null,
            weightTonPerKm: '0.55',
            reelLengthM: null,
            diameterMm: null,
            utsKn: null,
            galvanizationClass: null,
            strengthGrade: null,
            wireCount: null,
            manufacturer: 'Prysmian',
            i2tKa2s: '95.5',
            fiberCount: 48,
            effectiveFrom: '2026-02-01T00:00:00.000Z',
            createdBy: 'bruno',
            createdAt: '2026-02-01T12:00:00.000Z',
          },
        ],
      }),
    );

    const fixture = await mountEdit();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('select#type')).toBeNull();
    expect(element.textContent).toContain('OPGW');
    expect(element.textContent).toContain('fixo desde a criação');
    expect(element.textContent).toContain('Fabricante');
    expect(fixture.componentInstance.form.controls.manufacturer.value).toBe(
      'Prysmian',
    );
  });

  it('não envia tipo no payload da nova versão', async () => {
    apiMock.history.mockReturnValue(
      of({
        id: 1,
        code: 'CG-EHS-3/8',
        type: 'STEEL',
        versions: [],
      }),
    );

    const fixture = await mountEdit();
    fixture.componentInstance.form.patchValue({ effectiveFrom: '2026-09-01' });
    fixture.componentInstance.save();

    expect(apiMock.createVersion).toHaveBeenCalledTimes(1);
    const payload = apiMock.createVersion.mock.calls[0][1];
    expect(payload.effectiveFrom).toBe('2026-09-01');
    expect('type' in payload).toBe(false);
  });

  it('bloqueia o salvar enquanto o prefill não conclui (evita versão toda nula)', async () => {
    apiMock.history.mockReturnValue(NEVER);

    const fixture = await mountEdit();
    fixture.componentInstance.save();

    expect(apiMock.createVersion).not.toHaveBeenCalled();
  });

  it('rejeita identificador malformado na rota sem degradar para criação', async () => {
    await TestBed.configureTestingModule({
      imports: [GroundWireFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: GroundWiresApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: 'abc' }) },
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(GroundWireFormComponent);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Identificador inválido');

    fixture.componentInstance.save();
    expect(apiMock.create).not.toHaveBeenCalled();
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
});

describe('GroundWireFormComponent (confirmação ao salvar)', () => {
  it('abre a confirmação transitória e grava ao salvar com sucesso', async () => {
    const apiMock = {
      create: vi.fn().mockReturnValue(of({})),
      createVersion: vi.fn(),
      history: vi.fn(),
    };
    const snackMock = { open: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [GroundWireFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: GroundWiresApi, useValue: apiMock },
        { provide: MatSnackBar, useValue: snackMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(GroundWireFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      code: 'CG-1',
      type: 'STEEL',
    });
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate');
    fixture.componentInstance.save();

    expect(snackMock.open).toHaveBeenCalledWith(
      'Cabo de guarda salvo',
      'Fechar',
      expect.objectContaining({ duration: 4000 }),
    );
    expect(apiMock.create).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/catalogs/ground-wires']);
  });
});
