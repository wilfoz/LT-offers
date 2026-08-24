import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { StructureSeriesApi } from './structure-series-api.service';
import { StructureSeriesListComponent } from './structure-series-list.component';

const version = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  designer: 'SAE Towers',
  voltageKv: '500',
  circuitCount: 2,
  cablesPerPhase: 4,
  designWindSpeedMs: '25',
  insulatorType: 'vidro temperado',
  silMw: '1150.5',
  effectiveFrom: '2026-03-01T00:00:00.000Z',
  createdBy: 'ana',
  createdAt: '2026-03-01T12:00:00.000Z',
  ...overrides,
});

describe('StructureSeriesListComponent', () => {
  const apiMock = {
    list: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [StructureSeriesListComponent],
      providers: [
        provideRouter([]),
        { provide: StructureSeriesApi, useValue: apiMock },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(StructureSeriesListComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sinaliza série com campos pendentes identificando o campo (sem SIL)', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 1,
          name: 'Raptor 500',
          towerTypeCount: 3,
          effectiveVersion: version({ silMw: null }),
          pendingFields: ['SIL (MW)'],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Raptor 500');
    expect(text).toContain('Pendente: SIL (MW)');
  });

  it('exibe a quantidade de tipos de torre da série', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 1,
          name: 'Raptor 500',
          towerTypeCount: 7,
          effectiveVersion: version(),
          pendingFields: [],
        },
      ]),
    );

    const fixture = await mount();
    const cells = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('td'),
    ).map((td) => td.textContent?.trim());

    expect(cells).toContain('7');
  });

  it('repassa o termo de busca à API', async () => {
    apiMock.list.mockReturnValue(of([]));

    const fixture = await mount();
    fixture.componentInstance.term.set('Raptor');
    fixture.componentInstance.search(new Event('submit'));

    expect(apiMock.list).toHaveBeenLastCalledWith('Raptor');
  });

  it('exibe erro quando a API falha, em vez de fingir catálogo vazio', async () => {
    apiMock.list.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Não foi possível carregar o catálogo');
    expect(text).not.toContain('Nenhuma série de estrutura encontrada');
  });

  it('indica série sem versão vigente', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 2,
          name: 'FUTURA',
          towerTypeCount: 0,
          effectiveVersion: null,
          pendingFields: [],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Sem versão vigente');
  });
});
