import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
  Router,
} from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { FixedCostFormComponent } from './fixed-cost-form.component';
import { FixedCostsApi } from './fixed-costs-api.service';

describe('FixedCostFormComponent (novo custo fixo)', () => {
  const apiMock = {
    create: vi.fn().mockReturnValue(of({})),
    createVersion: vi.fn(),
    get: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [FixedCostFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: FixedCostsApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FixedCostFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.create.mockReturnValue(of({}));
  });

  it('exige código, descrição, categoria e unidade com mensagens em português', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.controls.code.setValue('');
    fixture.componentInstance.form.controls.description.setValue('');
    fixture.componentInstance.form.controls.unit.setValue('');
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('O código é obrigatório');
    expect(text).toContain('A descrição é obrigatória');
    expect(text).toContain('A unidade de medida é obrigatória');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('rejeita valor negativo ou malformado', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({
      code: 'CAN-01',
      description: 'Contêiner',
      category: 'CANTEIRO',
      unit: 'mês',
      unitCost: '-500',
    });
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Informe um valor numérico maior ou igual a zero');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('rejeita casas decimais além de 2', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({
      code: 'CAN-01',
      description: 'Contêiner',
      category: 'CANTEIRO',
      unit: 'mês',
      unitCost: '1000.123',
    });
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Use no máximo 2 casas decimais');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('envia campos em branco como null/undefined e salva com sucesso', async () => {
    const snackMock = { open: vi.fn() };
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [FixedCostFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: FixedCostsApi, useValue: apiMock },
        { provide: MatSnackBar, useValue: snackMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FixedCostFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      code: 'CAN-01',
      description: 'Locação de contêiner',
      category: 'CANTEIRO',
      unit: 'mês',
      unitCost: '4500.00',
    });

    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate');
    fixture.componentInstance.save();

    expect(apiMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'CAN-01',
        description: 'Locação de contêiner',
        category: 'CANTEIRO',
        unit: 'mês',
        unitCost: '4500.00',
      }),
    );
    expect(snackMock.open).toHaveBeenCalledWith('Custo fixo criado com sucesso', 'OK', expect.any(Object));
    expect(navigateSpy).toHaveBeenCalledWith(['/catalogs/fixed-costs']);
  });
});

describe('FixedCostFormComponent (nova versão)', () => {
  const apiMock = {
    create: vi.fn(),
    createVersion: vi.fn().mockReturnValue(of({})),
    get: vi.fn(),
  };

  async function mountEdit(id = '1') {
    await TestBed.configureTestingModule({
      imports: [FixedCostFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: FixedCostsApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FixedCostFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.createVersion.mockReturnValue(of({}));
  });

  it('preenche o formulário com a versão vigente atual e desabilita código', async () => {
    apiMock.get.mockReturnValue(
      of({
        id: 1,
        code: 'CAN-01',
        description: 'Locação de contêiner',
        category: 'CANTEIRO',
        unit: 'mês',
        effectiveVersion: {
          id: 10,
          unitCost: '4500.00',
          effectiveFrom: '2026-03-01T00:00:00.000Z',
          createdBy: 'ana',
          createdAt: '2026-03-01T12:00:00.000Z',
        },
        pendingFields: [],
      }),
    );

    const fixture = await mountEdit();
    fixture.detectChanges();

    const controls = fixture.componentInstance.form.controls;
    expect(controls.code.disabled).toBe(true);
    expect(controls.description.value).toBe('Locação de contêiner');
    expect(controls.category.value).toBe('CANTEIRO');
    expect(controls.unit.value).toBe('mês');
    expect(controls.unitCost.value).toBe('4500.00');
  });

  it('exige vigência ao salvar nova versão', async () => {
    apiMock.get.mockReturnValue(
      of({
        id: 1,
        code: 'CAN-01',
        description: 'Locação de contêiner',
        category: 'CANTEIRO',
        unit: 'mês',
        effectiveVersion: null,
        pendingFields: [],
      }),
    );

    const fixture = await mountEdit();
    fixture.detectChanges();

    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('A data de início de vigência é obrigatória');
    expect(apiMock.createVersion).not.toHaveBeenCalled();
  });

  it('bloqueia o salvar e exibe erro quando o prefill falha', async () => {
    apiMock.get.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await mountEdit();
    fixture.detectChanges();
    fixture.componentInstance.save();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Não foi possível carregar os dados atuais do custo fixo');
    expect(apiMock.createVersion).not.toHaveBeenCalled();
  });

  it('rejeita identificador inválido na rota sem degradar para criação', async () => {
    const fixture = await mountEdit('abc');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Identificador inválido');

    fixture.componentInstance.save();
    expect(apiMock.create).not.toHaveBeenCalled();
    expect(apiMock.createVersion).not.toHaveBeenCalled();
  });
});
