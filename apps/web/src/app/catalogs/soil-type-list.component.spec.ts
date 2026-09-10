import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { SoilTypeListComponent } from './soil-type-list.component';
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

describe('SoilTypeListComponent', () => {
  const apiMock = {
    list: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [SoilTypeListComponent],
      providers: [
        provideRouter([]),
        { provide: SoilTypesApi, useValue: apiMock },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SoilTypeListComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe a faixa de NSPT e o submerso "Não" (false é valor, RNF-09)', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 1,
          code: 'I',
          effectiveVersion: version(),
          pendingFields: [],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('12 ≤ N < 16');
    expect(text).toContain('Não');
    expect(text).toContain('Completo');
  });

  it('exibe travessão para rocha sem coesão nem NSPT, sem pendência', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 2,
          code: 'R',
          effectiveVersion: version({
            description: 'Rocha',
            cohesionKgCm2: null,
            nsptMin: null,
            nsptMax: null,
          }),
          pendingFields: [],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('—');
    expect(text).toContain('Completo');
    expect(text).not.toContain('Pendente');
  });

  it('sinaliza item com campos pendentes identificando o campo', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 1,
          code: 'IVS',
          effectiveVersion: version({ specificWeightKgfM3: null }),
          pendingFields: ['peso específico (kgf/m³)'],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Pendente: peso específico (kgf/m³)');
  });

  it('repassa o termo de busca à API', async () => {
    apiMock.list.mockReturnValue(of([]));

    const fixture = await mount();
    fixture.componentInstance.term.set('roc');
    fixture.componentInstance.search(new Event('submit'));

    expect(apiMock.list).toHaveBeenLastCalledWith('roc');
  });

  it('exibe erro quando a API falha, em vez de fingir catálogo vazio', async () => {
    apiMock.list.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Não foi possível carregar o catálogo');
    expect(text).not.toContain('Nenhum tipo de solo encontrado');
  });

  it('indica item sem versão vigente', async () => {
    apiMock.list.mockReturnValue(
      of([
        { id: 2, code: 'FUTURO', effectiveVersion: null, pendingFields: [] },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Sem versão vigente');
  });
});
