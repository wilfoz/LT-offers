import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { FixedCostHistoryComponent } from './fixed-cost-history.component';
import { FixedCostsApi } from './fixed-costs-api.service';

const version = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  unitCost: '4500.00',
  effectiveFrom: '2026-03-01T00:00:00.000Z',
  createdBy: 'ana',
  createdAt: '2026-03-01T12:00:00.000Z',
  ...overrides,
});

describe('FixedCostHistoryComponent', () => {
  const apiMock = {
    history: vi.fn(),
  };

  async function mount(id = '1') {
    await TestBed.configureTestingModule({
      imports: [FixedCostHistoryComponent],
      providers: [
        provideRouter([]),
        { provide: FixedCostsApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FixedCostHistoryComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista as versões com vigência UTC, custo unitário e autor', async () => {
    apiMock.history.mockReturnValue(
      of({
        id: 1,
        code: 'CAN-01',
        description: 'Locação de contêiner',
        category: 'CANTEIRO',
        unit: 'mês',
        versions: [
          version({
            id: 11,
            effectiveFrom: '2026-06-01T00:00:00.000Z',
            unitCost: '4800.00',
            createdBy: 'bruno',
          }),
          version(),
        ],
      }),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('CAN-01');
    expect(text).toContain('Locação de contêiner');
    expect(text).toContain('Canteiro de Obras');
    expect(text).toContain('mês');
    expect(text).toContain('01/06/2026');
    expect(text).toContain('4800.00');
    expect(text).toContain('01/03/2026');
    expect(text).toContain('4500.00');
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
