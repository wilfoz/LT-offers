import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { EquipmentHistoryComponent } from './equipment-history.component';
import { EquipmentApi } from './equipment-api.service';

const version = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  externalRentalMonthly: '15000.00',
  internalRentalMonthly: '11000.00',
  purchasePrice: '450000.00',
  depreciationYears: 5,
  effectiveFrom: '2026-03-01T00:00:00.000Z',
  createdBy: 'ana',
  createdAt: '2026-03-01T12:00:00.000Z',
  ...overrides,
});

describe('EquipmentHistoryComponent', () => {
  const apiMock = {
    history: vi.fn(),
  };

  async function mount(id = '1') {
    await TestBed.configureTestingModule({
      imports: [EquipmentHistoryComponent],
      providers: [
        provideRouter([]),
        { provide: EquipmentApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EquipmentHistoryComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista as versões com vigência UTC, valores de locação, aquisição, amortização e autor', async () => {
    apiMock.history.mockReturnValue(
      of({
        id: 1,
        code: 'CAM-01',
        description: 'Caminhão Munck 15t',
        versions: [
          version({
            id: 11,
            effectiveFrom: '2026-06-01T00:00:00.000Z',
            externalRentalMonthly: '16000.00',
            createdBy: 'bruno',
          }),
          version(),
        ],
      }),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('CAM-01');
    expect(text).toContain('Caminhão Munck 15t');
    expect(text).toContain('01/06/2026');
    expect(text).toContain('16000.00');
    expect(text).toContain('01/03/2026');
    expect(text).toContain('15000.00');
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
