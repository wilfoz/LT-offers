import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { FOUNDATION_ELEMENT_COUNT_FIELDS } from '@lt-offers/domain';
import { FoundationTypeListComponent } from './foundation-type-list.component';
import { FoundationTypesApi } from './foundation-types-api.service';

const version = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  description: '4 x Fuste zapata',
  ...Object.fromEntries(
    FOUNDATION_ELEMENT_COUNT_FIELDS.map((field) => [field, null]),
  ),
  spreadFootingCount: 4,
  effectiveFrom: '2026-03-01T00:00:00.000Z',
  createdBy: 'ana',
  createdAt: '2026-03-01T12:00:00.000Z',
  ...overrides,
});

describe('FoundationTypeListComponent', () => {
  const apiMock = {
    list: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [FoundationTypeListComponent],
      providers: [
        provideRouter([]),
        { provide: FoundationTypesApi, useValue: apiMock },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FoundationTypeListComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe aplicação em pt-BR e o resumo da composição', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 1,
          code: '4FZ',
          application: 'SELF_SUPPORTING',
          effectiveVersion: version(),
          pendingFields: [],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('4FZ');
    expect(text).toContain('Autoportante');
    expect(text).toContain('4 × fuste sapata');
    expect(text).toContain('Completo');
  });

  it('exibe contagem zero informada, distinta de não informada (RNF-09)', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 1,
          code: '4FZ',
          application: 'SELF_SUPPORTING',
          effectiveVersion: version({ spreadFootingCount: 0 }),
          pendingFields: [],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('0 × fuste sapata');
  });

  it('sinaliza composição ausente identificando a pendência', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 1,
          code: '4FZ',
          application: 'SELF_SUPPORTING',
          effectiveVersion: version({ spreadFootingCount: null }),
          pendingFields: ['composição por elemento'],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Pendente: composição por elemento');
  });

  it('repassa busca e filtro de aplicação juntos à API', async () => {
    apiMock.list.mockReturnValue(of([]));

    const fixture = await mount();
    fixture.componentInstance.term.set('pila');
    fixture.componentInstance.filterByApplication('GUYED');

    expect(apiMock.list).toHaveBeenLastCalledWith('pila', 'GUYED');

    fixture.componentInstance.search(new Event('submit'));
    expect(apiMock.list).toHaveBeenLastCalledWith('pila', 'GUYED');
  });

  it('trata filtro "Todas" como ausência de filtro', async () => {
    apiMock.list.mockReturnValue(of([]));

    const fixture = await mount();
    fixture.componentInstance.filterByApplication('');

    expect(apiMock.list).toHaveBeenLastCalledWith(undefined, undefined);
  });

  it('exibe erro quando a API falha, em vez de fingir catálogo vazio', async () => {
    apiMock.list.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Não foi possível carregar o catálogo');
    expect(text).not.toContain('Nenhum tipo de fundação encontrado');
  });

  it('indica item sem versão vigente', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 2,
          code: 'FUTURO',
          application: 'GUYED',
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
