import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
  Router,
} from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { EquipmentApi } from './equipment-api.service';
import { LaborRolesApi } from './labor-roles-api.service';
import { WorkCrewFormComponent } from './work-crew-form.component';
import { WorkCrewsApi } from './work-crews-api.service';

describe('WorkCrewFormComponent (nova equipe)', () => {
  const apiMock = {
    create: vi.fn().mockReturnValue(of({})),
    createVersion: vi.fn(),
    history: vi.fn(),
  };

  const laborRolesApiMock = {
    list: vi.fn().mockReturnValue(
      of([
        { id: 1, code: 'ENC01', name: 'Encarregado' },
        { id: 2, code: 'AJUD01', name: 'Ajudante' },
      ]),
    ),
  };

  const equipmentApiMock = {
    list: vi.fn().mockReturnValue(
      of([
        { id: 10, code: 'ESC01', description: 'Escavadeira' },
        { id: 11, code: 'CAM01', description: 'Caminhão' },
      ]),
    ),
  };

  async function mount(params: Record<string, string> = {}) {
    await TestBed.configureTestingModule({
      imports: [WorkCrewFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: WorkCrewsApi, useValue: apiMock },
        { provide: LaborRolesApi, useValue: laborRolesApiMock },
        { provide: EquipmentApi, useValue: equipmentApiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(params) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkCrewFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.create.mockReturnValue(of({}));
    laborRolesApiMock.list.mockReturnValue(
      of([
        { id: 1, code: 'ENC01', name: 'Encarregado' },
        { id: 2, code: 'AJUD01', name: 'Ajudante' },
      ]),
    );
    equipmentApiMock.list.mockReturnValue(
      of([
        { id: 10, code: 'ESC01', description: 'Escavadeira' },
        { id: 11, code: 'CAM01', description: 'Caminhão' },
      ]),
    );
  });

  it('exige código e nome com mensagem em português', async () => {
    const fixture = await mount();
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Campo obrigatório');
    expect(apiMock.create).not.toHaveBeenCalled();
  });

  it('adiciona e remove linhas de composição de mão de obra e equipamentos', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    component.addLaborRole();
    component.addLaborRole();
    expect(component.laborRoles.length).toBe(2);

    component.removeLaborRole(0);
    expect(component.laborRoles.length).toBe(1);

    component.addEquipment();
    expect(component.equipments.length).toBe(1);

    component.removeEquipment(0);
    expect(component.equipments.length).toBe(0);
  });

  it('envia payload completo ao salvar nova equipe com produção e composição', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    component.form.patchValue({
      code: 'EQ-CIV-01',
      name: 'Equipe de Escavação',
      standardProductionRate: '15.5',
      productionUnit: 'm3',
      productionPeriod: 'DAY',
    });
    component.addLaborRole({ laborRoleId: 1, quantity: '2.00' });
    component.addEquipment({ equipmentId: 10, quantity: '1.00' });

    component.save();

    expect(apiMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'EQ-CIV-01',
        name: 'Equipe de Escavação',
        standardProductionRate: '15.5',
        productionUnit: 'm3',
        productionPeriod: 'DAY',
        laborRoles: [{ laborRoleId: 1, quantity: '2.00' }],
        equipments: [{ equipmentId: 10, quantity: '1.00' }],
      }),
    );
  });
});

describe('WorkCrewFormComponent (nova versão)', () => {
  const apiMock = {
    create: vi.fn(),
    createVersion: vi.fn().mockReturnValue(of({})),
    history: vi.fn(),
  };

  const laborRolesApiMock = {
    list: vi.fn().mockReturnValue(of([])),
  };

  const equipmentApiMock = {
    list: vi.fn().mockReturnValue(of([])),
  };

  async function mountEdit(params: Record<string, string> = { id: '7' }) {
    await TestBed.configureTestingModule({
      imports: [WorkCrewFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: WorkCrewsApi, useValue: apiMock },
        { provide: LaborRolesApi, useValue: laborRolesApiMock },
        { provide: EquipmentApi, useValue: equipmentApiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(params) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkCrewFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.createVersion.mockReturnValue(of({}));
    laborRolesApiMock.list.mockReturnValue(of([]));
    equipmentApiMock.list.mockReturnValue(of([]));
  });

  it('preenche produção e composições vigentes no FormArray na edição', async () => {
    apiMock.history.mockReturnValue(
      of({
        id: 7,
        code: 'EQ-CIV-01',
        name: 'Equipe de Escavação',
        versions: [
          {
            id: 20,
            standardProductionRate: '15.0000',
            productionUnit: 'm3',
            productionPeriod: 'DAY',
            laborRoles: [
              {
                laborRoleId: 1,
                laborRoleCode: 'ENC01',
                laborRoleName: 'Encarregado',
                quantity: '1.00',
              },
            ],
            equipments: [
              {
                equipmentId: 10,
                equipmentCode: 'ESC01',
                equipmentDescription: 'Escavadeira',
                quantity: '1.00',
              },
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

    expect(component.currentCode()).toBe('EQ-CIV-01');
    expect(component.currentName()).toBe('Equipe de Escavação');
    expect(component.form.controls.standardProductionRate.value).toBe('15.0000');
    expect(component.laborRoles.length).toBe(1);
    expect(component.equipments.length).toBe(1);
  });

  it('bloqueia o salvar enquanto o prefill não conclui', async () => {
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
});

describe('WorkCrewFormComponent (confirmação ao salvar)', () => {
  it('abre snackbar e navega ao salvar com sucesso', async () => {
    const apiMock = {
      create: vi.fn().mockReturnValue(of({})),
      createVersion: vi.fn(),
      history: vi.fn(),
    };
    const snackMock = { open: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [WorkCrewFormComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: WorkCrewsApi, useValue: apiMock },
        { provide: LaborRolesApi, useValue: { list: () => of([]) } },
        { provide: EquipmentApi, useValue: { list: () => of([]) } },
        { provide: MatSnackBar, useValue: snackMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkCrewFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({
      code: 'EQ-CIV-01',
      name: 'Equipe de Escavação',
    });
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate');
    fixture.componentInstance.save();

    expect(snackMock.open).toHaveBeenCalledWith(
      'Equipe de trabalho salva',
      'Fechar',
      expect.objectContaining({ duration: 4000 }),
    );
    expect(apiMock.create).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/catalogs/work-crews']);
  });
});
