import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { WorkCrewListComponent } from './work-crew-list.component';
import { WorkCrewsApi } from './work-crews-api.service';

const version = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  standardProductionRate: '15.0000',
  productionUnit: 'm3',
  productionPeriod: 'DAY' as const,
  effectiveFrom: '2026-03-01T00:00:00.000Z',
  createdBy: 'ana',
  createdAt: '2026-03-01T12:00:00.000Z',
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
  ...overrides,
});

describe('WorkCrewListComponent', () => {
  const apiMock = {
    list: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [WorkCrewListComponent],
      providers: [
        provideRouter([]),
        { provide: WorkCrewsApi, useValue: apiMock },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkCrewListComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe equipe de trabalho completa com taxas e contagens', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 1,
          code: 'EQ-CIV-01',
          name: 'Equipe de Escavação',
          laborRoleCount: 2,
          equipmentCount: 1,
          effectiveVersion: version(),
          pendingFields: [],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('EQ-CIV-01');
    expect(text).toContain('Equipe de Escavação');
    expect(text).toContain('2 funções');
    expect(text).toContain('1 tipo');
    expect(text).toContain('15.0000 m3/dia');
    expect(text).toContain('Completo');
  });

  it('sinaliza equipe com pendências', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 2,
          code: 'EQ-MON-01',
          name: 'Equipe de Montagem',
          laborRoleCount: 0,
          equipmentCount: 0,
          effectiveVersion: version({
            standardProductionRate: null,
            laborRoles: [],
            equipments: [],
          }),
          pendingFields: ['composição de equipe', 'taxa de produção'],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Pendente:');
    expect(text).toContain('composição de equipe');
  });

  it('indica equipe sem versão vigente', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 3,
          code: 'EQ-CAB-01',
          name: 'Equipe de Lançamento',
          laborRoleCount: 0,
          equipmentCount: 0,
          effectiveVersion: null,
          pendingFields: ['versão vigente'],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Sem versão vigente');
  });

  it('repassa o termo de busca à API', async () => {
    apiMock.list.mockReturnValue(of([]));

    const fixture = await mount();
    fixture.componentInstance.term.set('CIV');
    fixture.componentInstance.search(new Event('submit'));

    expect(apiMock.list).toHaveBeenLastCalledWith('CIV');
  });

  it('exibe erro quando a API falha, em vez de fingir catálogo vazio', async () => {
    apiMock.list.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Não foi possível carregar o catálogo');
    expect(text).not.toContain('Nenhuma equipe de trabalho encontrada');
  });
});
