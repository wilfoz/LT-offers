import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { TowerTypeHistoryComponent } from './tower-type-history.component';
import { TowerTypesApi } from './tower-types-api.service';

describe('TowerTypeHistoryComponent', () => {
  const apiMock = {
    history: vi.fn(),
  };

  async function mount(params: Record<string, string> = {
    seriesId: '5',
    id: '7',
  }) {
    await TestBed.configureTestingModule({
      imports: [TowerTypeHistoryComponent],
      providers: [
        provideRouter([]),
        { provide: TowerTypesApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(params) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TowerTypeHistoryComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe a tabela peso × altura de cada versão, preservada por época', async () => {
    apiMock.history.mockReturnValue(
      of({
        id: 7,
        code: 'SA1',
        function: 'SUSPENSION',
        versions: [
          {
            id: 21,
            guyCount: 0,
            weights: [
              { heightM: '24', weightKg: '5300' },
              { heightM: '30', weightKg: '6400' },
            ],
            effectiveFrom: '2026-09-01T00:00:00.000Z',
            createdBy: 'bruno',
            createdAt: '2026-08-24T12:00:00.000Z',
          },
          {
            id: 20,
            guyCount: 0,
            weights: [{ heightM: '24', weightKg: '5200.5' }],
            effectiveFrom: '2026-03-01T00:00:00.000Z',
            createdBy: 'ana',
            createdAt: '2026-03-01T12:00:00.000Z',
          },
        ],
      }),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('SA1');
    expect(text).toContain('suspensão');
    expect(text).toContain('01/09/2026');
    expect(text).toContain('5300');
    expect(text).toContain('01/03/2026');
    expect(text).toContain('5200.5');
  });

  it('indica versão sem pontos na tabela', async () => {
    apiMock.history.mockReturnValue(
      of({
        id: 7,
        code: 'SA1',
        function: 'ANCHOR',
        versions: [
          {
            id: 20,
            guyCount: 4,
            weights: [],
            effectiveFrom: '2026-03-01T00:00:00.000Z',
            createdBy: 'ana',
            createdAt: '2026-03-01T12:00:00.000Z',
          },
        ],
      }),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Sem pontos na tabela peso × altura');
  });

  it('exibe erro quando a API falha', async () => {
    apiMock.history.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Não foi possível carregar o histórico');
  });

  it('rejeita identificadores malformados na rota sem chamar a API', async () => {
    const fixture = await mount({ seriesId: '5', id: 'abc' });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Identificador inválido');
    expect(apiMock.history).not.toHaveBeenCalled();
  });
});
