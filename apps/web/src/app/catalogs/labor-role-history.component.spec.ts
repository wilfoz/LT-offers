import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { LaborRoleHistoryComponent } from './labor-role-history.component';
import { LaborRolesApi } from './labor-roles-api.service';

const version = (overrides: Record<string, unknown> = {}) => ({
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
  ...overrides,
});

describe('LaborRoleHistoryComponent', () => {
  const apiMock = {
    history: vi.fn(),
  };

  async function mount(id = '1') {
    await TestBed.configureTestingModule({
      imports: [LaborRoleHistoryComponent],
      providers: [
        provideRouter([]),
        { provide: LaborRolesApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(LaborRoleHistoryComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista as versões com vigência UTC, valores e autor', async () => {
    apiMock.history.mockReturnValue(
      of({
        id: 1,
        code: 'ENC-01',
        name: 'Encarregado Geral',
        versions: [
          version({
            id: 11,
            effectiveFrom: '2026-06-01T00:00:00.000Z',
            baseSalary: '6000.00',
            createdBy: 'bruno',
          }),
          version(),
        ],
      }),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('ENC-01');
    expect(text).toContain('Encarregado Geral');
    expect(text).toContain('01/06/2026');
    expect(text).toContain('6000.00');
    expect(text).toContain('01/03/2026');
    expect(text).toContain('5500.00');
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
