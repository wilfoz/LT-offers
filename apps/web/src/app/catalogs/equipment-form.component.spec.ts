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
import { EquipmentFormComponent } from './equipment-form.component';
import { EquipmentApi } from './equipment-api.service';

describe('EquipmentFormComponent (novo equipamento)', () => {
  const apiMock = {
    create: vi.fn().mockReturnValue(of({})),
    createVersion: vi.fn(),
    get: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [EquipmentFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: EquipmentApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EquipmentFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.create.mockReturnValue(of({}));
  });

  it('exige código e descrição com mensagens em português', async () => {
    const fixture = await mount();
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('O código é obrigatório');
    expect(text).toContain('A descrição é obrigatória');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('rejeita valor monetário negativo ou malformado', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({
      code: 'CAM-01',
      description: 'Caminhão',
      externalRentalMonthly: '-500',
    });
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Informe um valor numérico maior ou igual a zero');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('rejeita casas decimais além de 2 nos campos monetários', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({
      code: 'CAM-01',
      description: 'Caminhão',
      purchasePrice: '1000.123',
    });
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Use no máximo 2 casas decimais');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('rejeita anos de amortização menor ou igual a zero ou decimal', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({
      code: 'CAM-01',
      description: 'Caminhão',
      depreciationYears: '0',
    });
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Informe um número inteiro maior que zero');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('envia campos em branco como null/undefined e salva com sucesso', async () => {
    const snackMock = { open: vi.fn() };
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EquipmentFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: EquipmentApi, useValue: apiMock },
        { provide: MatSnackBar, useValue: snackMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EquipmentFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      code: 'CAM-01',
      description: 'Caminhão Munck',
      category: 'Caminhão',
      externalRentalMonthly: '15000.00',
      internalRentalMonthly: '',
      purchasePrice: '450000.00',
      depreciationYears: '5',
    });

    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate');
    fixture.componentInstance.save();

    expect(apiMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'CAM-01',
        description: 'Caminhão Munck',
        category: 'Caminhão',
        externalRentalMonthly: '15000.00',
        internalRentalMonthly: null,
        purchasePrice: '450000.00',
        depreciationYears: 5,
      }),
    );
    expect(snackMock.open).toHaveBeenCalledWith(
      'Equipamento criado com sucesso',
      'OK',
      expect.any(Object),
    );
    expect(navigateSpy).toHaveBeenCalledWith(['/catalogs/equipment']);
  });
});

describe('EquipmentFormComponent (nova versão)', () => {
  const apiMock = {
    create: vi.fn(),
    createVersion: vi.fn().mockReturnValue(of({})),
    get: vi.fn(),
  };

  async function mountEdit(id = '1') {
    await TestBed.configureTestingModule({
      imports: [EquipmentFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: EquipmentApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EquipmentFormComponent);
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
        code: 'CAM-01',
        description: 'Caminhão Munck',
        category: 'Caminhão',
        effectiveVersion: {
          id: 10,
          externalRentalMonthly: '15000.00',
          internalRentalMonthly: '11000.00',
          purchasePrice: '450000.00',
          depreciationYears: 5,
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
    expect(controls.description.value).toBe('Caminhão Munck');
    expect(controls.category.value).toBe('Caminhão');
    expect(controls.externalRentalMonthly.value).toBe('15000.00');
    expect(controls.depreciationYears.value).toBe('5');
  });

  it('exige vigência ao salvar nova versão', async () => {
    apiMock.get.mockReturnValue(
      of({
        id: 1,
        code: 'CAM-01',
        description: 'Caminhão Munck',
        category: null,
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
    expect(text).toContain(
      'Não foi possível carregar os dados atuais do equipamento',
    );
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
