import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { EquipmentListComponent } from './equipment-list.component';
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

describe('EquipmentListComponent', () => {
  const apiMock = {
    list: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [EquipmentListComponent],
      providers: [
        provideRouter([]),
        { provide: EquipmentApi, useValue: apiMock },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EquipmentListComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe equipamento completo com custos e amortização', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 1,
          code: 'CAM-01',
          description: 'Caminhão Munck 15t',
          category: 'Caminhão',
          effectiveVersion: version(),
          pendingFields: [],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('CAM-01');
    expect(text).toContain('Caminhão Munck 15t');
    expect(text).toContain('Caminhão');
    expect(text).toContain('15000.00');
    expect(text).toContain('11000.00');
    expect(text).toContain('450000.00');
    expect(text).toContain('5');
    expect(text).toContain('Completo');
  });

  it('sinaliza equipamento com pendências', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 2,
          code: 'GUI-01',
          description: 'Guincho Hidráulico',
          category: 'Guincho',
          effectiveVersion: version({
            externalRentalMonthly: null,
            internalRentalMonthly: null,
            purchasePrice: null,
            depreciationYears: null,
          }),
          pendingFields: [
            'ao menos uma estratégia de custo (locação externa, interna ou aquisição + amortização)',
          ],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Pendente:');
    expect(text).toContain('estratégia de custo');
  });

  it('indica equipamento sem versão vigente', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 3,
          code: 'TRAT-01',
          description: 'Trator de esteira',
          category: null,
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
    fixture.componentInstance.term.set('munck');
    fixture.componentInstance.categoryFilter.set('caminhao');
    fixture.componentInstance.search(new Event('submit'));

    expect(apiMock.list).toHaveBeenLastCalledWith('munck', 'caminhao');
  });

  it('exibe erro quando a API falha, em vez de fingir catálogo vazio', async () => {
    apiMock.list.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Não foi possível carregar o catálogo');
    expect(text).not.toContain('Nenhum equipamento encontrado');
  });
});
