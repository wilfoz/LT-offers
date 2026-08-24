import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { StructureSeriesApi } from './structure-series-api.service';
import { StructureSeriesDetailComponent } from './structure-series-detail.component';
import { TowerTypesApi } from './tower-types-api.service';

const seriesSummary = () => ({
  id: 1,
  name: 'Raptor 500',
  towerTypeCount: 1,
  effectiveVersion: {
    id: 10,
    designer: 'SAE Towers',
    voltageKv: '500',
    circuitCount: 2,
    cablesPerPhase: 4,
    designWindSpeedMs: '25',
    insulatorType: 'vidro temperado',
    silMw: null,
    effectiveFrom: '2026-03-01T00:00:00.000Z',
    createdBy: 'ana',
    createdAt: '2026-03-01T12:00:00.000Z',
  },
  pendingFields: ['SIL (MW)'],
});

const towerType = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  code: 'SA1',
  function: 'SUSPENSION',
  effectiveVersion: {
    id: 20,
    guyCount: 0,
    weights: [
      { heightM: '24', weightKg: '5200.5' },
      { heightM: '30', weightKg: '6400' },
    ],
    effectiveFrom: '2026-03-01T00:00:00.000Z',
    createdBy: 'ana',
    createdAt: '2026-03-01T12:00:00.000Z',
  },
  pendingFields: [],
  ...overrides,
});

describe('StructureSeriesDetailComponent', () => {
  const seriesApiMock = { get: vi.fn(), list: vi.fn() };
  const towerTypesApiMock = { list: vi.fn() };

  async function mount(id = '1') {
    await TestBed.configureTestingModule({
      imports: [StructureSeriesDetailComponent],
      providers: [
        provideRouter([]),
        { provide: StructureSeriesApi, useValue: seriesApiMock },
        { provide: TowerTypesApi, useValue: towerTypesApiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(StructureSeriesDetailComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    seriesApiMock.get.mockReturnValue(of(seriesSummary()));
    towerTypesApiMock.list.mockReturnValue(of([towerType()]));
  });

  it('exibe os dados vigentes da série com pendência sinalizada', async () => {
    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Raptor 500');
    expect(text).toContain('SAE Towers');
    expect(text).toContain('Pendente: SIL (MW)');
  });

  it('lista os tipos de torre com função em pt-BR e resumo da tabela', async () => {
    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('SA1');
    expect(text).toContain('suspensão');
    expect(text).toContain('2 alturas (24–30 m)');
  });

  it('não sinaliza pendência para tipo com zero estais e tabela preenchida', async () => {
    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Completo');
  });

  it('sinaliza tipo sem pontos na tabela peso × altura', async () => {
    towerTypesApiMock.list.mockReturnValue(
      of([
        towerType({
          effectiveVersion: {
            id: 20,
            guyCount: 4,
            weights: [],
            effectiveFrom: '2026-03-01T00:00:00.000Z',
            createdBy: 'ana',
            createdAt: '2026-03-01T12:00:00.000Z',
          },
          pendingFields: ['tabela peso × altura'],
        }),
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Pendente: tabela peso × altura');
  });

  it('exibe erro da série sem esconder os tipos quando só a série falha', async () => {
    seriesApiMock.get.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Não foi possível carregar os dados da série');
    expect(text).toContain('SA1');
  });

  it('exibe erro dos tipos quando a listagem falha, em vez de fingir série vazia', async () => {
    towerTypesApiMock.list.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Não foi possível carregar os tipos de torre');
    expect(text).not.toContain('Nenhum tipo de torre cadastrado');
  });

  it('rejeita identificador malformado na rota sem chamar a API', async () => {
    const fixture = await mount('abc');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Identificador inválido');
    expect(seriesApiMock.get).not.toHaveBeenCalled();
    expect(towerTypesApiMock.list).not.toHaveBeenCalled();
  });
});
