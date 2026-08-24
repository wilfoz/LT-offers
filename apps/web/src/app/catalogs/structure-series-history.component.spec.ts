import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { StructureSeriesApi } from './structure-series-api.service';
import { StructureSeriesHistoryComponent } from './structure-series-history.component';

describe('StructureSeriesHistoryComponent', () => {
  const apiMock = {
    history: vi.fn(),
  };

  async function mount(id = '1') {
    await TestBed.configureTestingModule({
      imports: [StructureSeriesHistoryComponent],
      providers: [
        provideRouter([]),
        { provide: StructureSeriesApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(StructureSeriesHistoryComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista as versões com vigência em UTC, autor e valores da época', async () => {
    apiMock.history.mockReturnValue(
      of({
        id: 1,
        name: 'Raptor 500',
        versions: [
          {
            id: 11,
            designer: 'Sediver',
            voltageKv: '500',
            circuitCount: 2,
            cablesPerPhase: 4,
            designWindSpeedMs: '25',
            insulatorType: 'vidro temperado',
            silMw: '1150.5',
            effectiveFrom: '2026-06-01T00:00:00.000Z',
            createdBy: 'bruno',
            createdAt: '2026-05-30T22:30:00.000Z',
          },
          {
            id: 10,
            designer: 'SAE Towers',
            voltageKv: '500',
            circuitCount: 2,
            cablesPerPhase: null,
            designWindSpeedMs: null,
            insulatorType: null,
            silMw: null,
            effectiveFrom: '2026-01-01T00:00:00.000Z',
            createdBy: 'ana',
            createdAt: '2026-01-01T12:00:00.000Z',
          },
        ],
      }),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Raptor 500');
    expect(text).toContain('01/06/2026');
    expect(text).toContain('bruno');
    expect(text).toContain('01/01/2026');
    expect(text).toContain('SAE Towers');
  });

  it('exibe erro quando a API falha', async () => {
    apiMock.history.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Não foi possível carregar o histórico');
  });

  it('rejeita identificador malformado na rota sem chamar a API', async () => {
    const fixture = await mount('abc');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Identificador inválido');
    expect(apiMock.history).not.toHaveBeenCalled();
  });
});
