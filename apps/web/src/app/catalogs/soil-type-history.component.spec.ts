import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { SoilTypeHistoryComponent } from './soil-type-history.component';
import { SoilTypesApi } from './soil-types-api.service';

const version = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  description: 'Duro',
  submerged: false,
  allowableCompressionStressKgfCm2: '3',
  specificWeightKgfM3: '1600',
  internalFrictionAngleDeg: '25',
  cohesionKgCm2: '0.3',
  nsptMin: 12,
  nsptMax: 16,
  effectiveFrom: '2026-03-01T00:00:00.000Z',
  createdBy: 'ana',
  createdAt: '2026-03-01T12:00:00.000Z',
  ...overrides,
});

describe('SoilTypeHistoryComponent', () => {
  const apiMock = {
    history: vi.fn(),
  };

  async function mount(id = '1') {
    await TestBed.configureTestingModule({
      imports: [SoilTypeHistoryComponent],
      providers: [
        provideRouter([]),
        { provide: SoilTypesApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SoilTypeHistoryComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista as versões com vigência em data civil UTC, autor e faixa de NSPT', async () => {
    apiMock.history.mockReturnValue(
      of({
        id: 1,
        code: 'I',
        versions: [
          version({
            id: 11,
            effectiveFrom: '2026-06-01T00:00:00.000Z',
            createdBy: 'bruno',
            nsptMin: 8,
            nsptMax: 12,
          }),
          version(),
        ],
      }),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('01/06/2026');
    expect(text).toContain('01/03/2026');
    expect(text).toContain('bruno');
    expect(text).toContain('8 ≤ N < 12');
    expect(text).toContain('12 ≤ N < 16');
  });

  it('exibe erro quando o histórico falha', async () => {
    apiMock.history.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Não foi possível carregar o histórico');
  });

  it('rejeita identificador malformado na rota sem consultar a API', async () => {
    const fixture = await mount('abc');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Identificador inválido');
    expect(apiMock.history).not.toHaveBeenCalled();
  });
});
