import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { FixedCostListComponent } from './fixed-cost-list.component';
import { FixedCostsApi } from './fixed-costs-api.service';

const version = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  unitCost: '4500.00',
  effectiveFrom: '2026-03-01T00:00:00.000Z',
  createdBy: 'ana',
  createdAt: '2026-03-01T12:00:00.000Z',
  ...overrides,
});

describe('FixedCostListComponent', () => {
  const apiMock = {
    list: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [FixedCostListComponent],
      providers: [
        provideRouter([]),
        { provide: FixedCostsApi, useValue: apiMock },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FixedCostListComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe custo fixo completo com categoria formatada e custo unitário', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 1,
          code: 'CAN-01',
          description: 'Locação de contêiner escritório',
          category: 'CANTEIRO',
          unit: 'mês',
          effectiveVersion: version(),
          pendingFields: [],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('CAN-01');
    expect(text).toContain('Locação de contêiner escritório');
    expect(text).toContain('Canteiro de Obras');
    expect(text).toContain('mês');
    expect(text).toContain('4500.00');
    expect(text).toContain('Completo');
  });

  it('sinaliza custo fixo com pendência', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 2,
          code: 'SEG-01',
          description: 'Seguro Garantia',
          category: 'SEGUROS_GARANTIAS',
          unit: 'vb',
          effectiveVersion: version({ unitCost: null }),
          pendingFields: ['custo unitário (R$)'],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Pendente: custo unitário (R$)');
  });

  it('indica custo fixo sem versão vigente', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 3,
          code: 'MOB-01',
          description: 'Mobilização de equipe',
          category: 'MOBILIZACAO_DESMOBILIZACAO',
          unit: 'vb',
          effectiveVersion: null,
          pendingFields: ['versão vigente'],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Sem versão vigente');
  });

  it('repassa o termo de busca e filtro de categoria à API', async () => {
    apiMock.list.mockReturnValue(of([]));

    const fixture = await mount();
    fixture.componentInstance.term.set('conteiner');
    fixture.componentInstance.categoryFilter.set('CANTEIRO');
    fixture.componentInstance.search(new Event('submit'));

    expect(apiMock.list).toHaveBeenLastCalledWith('conteiner', 'CANTEIRO');
  });

  it('exibe erro quando a API falha, em vez de fingir catálogo vazio', async () => {
    apiMock.list.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Não foi possível carregar o catálogo');
    expect(text).not.toContain('Nenhum custo fixo encontrado');
  });
});
