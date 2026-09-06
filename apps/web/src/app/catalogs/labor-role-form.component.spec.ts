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
import { LaborRoleFormComponent } from './labor-role-form.component';
import { LaborRolesApi } from './labor-roles-api.service';

describe('LaborRoleFormComponent (novo cargo)', () => {
  const apiMock = {
    create: vi.fn().mockReturnValue(of({})),
    createVersion: vi.fn(),
    get: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [LaborRoleFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: LaborRolesApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(LaborRoleFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.create.mockReturnValue(of({}));
  });

  it('exige código e nome com mensagens em português', async () => {
    const fixture = await mount();
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('O código é obrigatório');
    expect(text).toContain('O nome do cargo é obrigatório');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('rejeita valor negativo ou malformado', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({
      code: 'ENC-01',
      name: 'Encarregado',
      baseSalary: '-100',
    });
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Informe um valor numérico maior ou igual a zero');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('rejeita casas decimais além do limite (2 para moeda, 4 para %)', async () => {
    const fixture = await mount();
    fixture.componentInstance.form.patchValue({
      code: 'ENC-01',
      name: 'Encarregado',
      baseSalary: '100.123',
    });
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Use no máximo 2 casas decimais');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('envia campos em branco como null (RNF-09) e salva com sucesso', async () => {
    const snackMock = { open: vi.fn() };
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LaborRoleFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: LaborRolesApi, useValue: apiMock },
        { provide: MatSnackBar, useValue: snackMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(LaborRoleFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      code: 'ENC-01',
      name: 'Encarregado Geral',
      baseSalary: '5500.00',
      hazardPayPercent: '30.00',
      overtimePercent: '',
      dsrOvertimePercent: '',
      socialChargesPercent: '68.50',
      foodAllowanceMonthly: '800.00',
      housingMonthly: '',
      homeLeaveTravelMonthly: '',
      healthInsuranceMonthly: '',
      lifeInsuranceMonthly: '',
    });

    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate');
    fixture.componentInstance.save();

    expect(apiMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'ENC-01',
        name: 'Encarregado Geral',
        baseSalary: '5500.00',
        hazardPayPercent: '30.00',
        overtimePercent: null,
        dsrOvertimePercent: null,
        socialChargesPercent: '68.50',
        foodAllowanceMonthly: '800.00',
        housingMonthly: null,
      }),
    );
    expect(snackMock.open).toHaveBeenCalledWith('Cargo criado com sucesso', 'OK', expect.any(Object));
    expect(navigateSpy).toHaveBeenCalledWith(['/catalogs/labor-roles']);
  });
});

describe('LaborRoleFormComponent (nova versão)', () => {
  const apiMock = {
    create: vi.fn(),
    createVersion: vi.fn().mockReturnValue(of({})),
    get: vi.fn(),
  };

  async function mountEdit(id = '1') {
    await TestBed.configureTestingModule({
      imports: [LaborRoleFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: LaborRolesApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(LaborRoleFormComponent);
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
        code: 'ENC-01',
        name: 'Encarregado Geral',
        effectiveVersion: {
          id: 10,
          baseSalary: '5500.00',
          hazardPayPercent: '30.0000',
          overtimePercent: '50.0000',
          dsrOvertimePercent: '20.0000',
          socialChargesPercent: '68.5000',
          foodAllowanceMonthly: '800.00',
          housingMonthly: '1200.00',
          homeLeaveTravelMonthly: '500.00',
          healthInsuranceMonthly: '350.00',
          lifeInsuranceMonthly: '50.00',
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
    expect(controls.name.value).toBe('Encarregado Geral');
    expect(controls.baseSalary.value).toBe('5500.00');
    expect(controls.socialChargesPercent.value).toBe('68.5000');
  });

  it('exige vigência ao salvar nova versão', async () => {
    apiMock.get.mockReturnValue(
      of({
        id: 1,
        code: 'ENC-01',
        name: 'Encarregado',
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
    expect(text).toContain('Não foi possível carregar os dados atuais do cargo');
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
