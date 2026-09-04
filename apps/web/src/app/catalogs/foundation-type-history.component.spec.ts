import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { FOUNDATION_ELEMENT_COUNT_FIELDS } from '@lt-offers/domain';
import { FoundationTypeHistoryComponent } from './foundation-type-history.component';
import { FoundationTypesApi } from './foundation-types-api.service';

const version = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  description: '1 x Mastro preformado 4 x Tirantes pilas',
  ...Object.fromEntries(
    FOUNDATION_ELEMENT_COUNT_FIELDS.map((field) => [field, null]),
  ),
  precastMastCount: 1,
  straightPierGuyCount: 4,
  effectiveFrom: '2026-03-01T00:00:00.000Z',
  createdBy: 'ana',
  createdAt: '2026-03-01T12:00:00.000Z',
  ...overrides,
});

describe('FoundationTypeHistoryComponent', () => {
  const apiMock = {
    history: vi.fn(),
  };

  async function mount(id = '1') {
    await TestBed.configureTestingModule({
      imports: [FoundationTypeHistoryComponent],
      providers: [
        provideRouter([]),
        { provide: FoundationTypesApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FoundationTypeHistoryComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista as versões com a composição de cada época e a aplicação no título', async () => {
    apiMock.history.mockReturnValue(
      of({
        id: 1,
        code: '1PR - 4P',
        application: 'GUYED',
        versions: [
          version({
            id: 11,
            effectiveFrom: '2026-06-01T00:00:00.000Z',
            createdBy: 'bruno',
            straightPierGuyCount: 2,
          }),
          version(),
        ],
      }),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Estaiada');
    expect(text).toContain('01/06/2026');
    expect(text).toContain('01/03/2026');
    expect(text).toContain('2 × pila reta tirante');
    expect(text).toContain('4 × pila reta tirante');
    expect(text).toContain('bruno');
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
