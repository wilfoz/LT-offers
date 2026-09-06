import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { LaborRoleListComponent } from './labor-role-list.component';
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

describe('LaborRoleListComponent', () => {
  const apiMock = {
    list: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [LaborRoleListComponent],
      providers: [
        provideRouter([]),
        { provide: LaborRolesApi, useValue: apiMock },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(LaborRoleListComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe cargo completo com salário e encargos', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 1,
          code: 'ENC-01',
          name: 'Encarregado Geral',
          effectiveVersion: version(),
          pendingFields: [],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('ENC-01');
    expect(text).toContain('Encarregado Geral');
    expect(text).toContain('5500.00');
    expect(text).toContain('68.5000');
    expect(text).toContain('Completo');
  });

  it('sinaliza cargo com campos pendentes identificando o campo', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 2,
          code: 'AJU-01',
          name: 'Ajudante',
          effectiveVersion: version({ socialChargesPercent: null }),
          pendingFields: ['encargos sociais (%)'],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Pendente: encargos sociais (%)');
  });

  it('indica cargo sem versão vigente', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 3,
          code: 'ENG-01',
          name: 'Engenheiro',
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
    fixture.componentInstance.term.set('enc');
    fixture.componentInstance.search(new Event('submit'));

    expect(apiMock.list).toHaveBeenLastCalledWith('enc');
  });

  it('exibe erro quando a API falha, em vez de fingir catálogo vazio', async () => {
    apiMock.list.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Não foi possível carregar o catálogo');
    expect(text).not.toContain('Nenhum cargo encontrado');
  });
});
