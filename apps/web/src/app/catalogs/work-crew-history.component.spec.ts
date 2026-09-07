import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { WorkCrewHistoryComponent } from './work-crew-history.component';
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

describe('WorkCrewHistoryComponent', () => {
  const apiMock = {
    history: vi.fn(),
  };

  async function mount(id = '1') {
    await TestBed.configureTestingModule({
      imports: [WorkCrewHistoryComponent],
      providers: [
        provideRouter([]),
        { provide: WorkCrewsApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkCrewHistoryComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista as versões com vigência UTC, produções, composições e autor', async () => {
    apiMock.history.mockReturnValue(
      of({
        id: 1,
        code: 'EQ-CIV-01',
        name: 'Equipe de Escavação',
        versions: [
          version({
            id: 11,
            effectiveFrom: '2026-06-01T00:00:00.000Z',
            standardProductionRate: '20.0000',
            createdBy: 'bruno',
          }),
          version(),
        ],
      }),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('EQ-CIV-01');
    expect(text).toContain('Equipe de Escavação');
    expect(text).toContain('01/06/2026');
    expect(text).toContain('20.0000 m3/dia');
    expect(text).toContain('01/03/2026');
    expect(text).toContain('15.0000 m3/dia');
    expect(text).toContain('ENC01');
    expect(text).toContain('Encarregado');
    expect(text).toContain('ESC01');
    expect(text).toContain('Escavadeira');
    expect(text).toContain('bruno');
    expect(text).toContain('ana');
  });

  it('exibe erro quando o histórico falha', async () => {
    apiMock.history.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Não foi possível carregar o histórico');
  });

  it('rejeita identificador inválido na rota sem consultar a API', async () => {
    const fixture = await mount('abc');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Identificador inválido');
    expect(apiMock.history).not.toHaveBeenCalled();
  });
});
