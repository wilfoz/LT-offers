import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { InsulatorHistoryComponent } from './insulator-history.component';
import { InsulatorsApi } from './insulators-api.service';

describe('InsulatorHistoryComponent', () => {
  const apiMock = {
    history: vi.fn(),
  };

  async function mount(id = '1') {
    await TestBed.configureTestingModule({
      imports: [InsulatorHistoryComponent],
      providers: [
        provideRouter([]),
        { provide: InsulatorsApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(InsulatorHistoryComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe as versões com atributos do isolador e a vigência como data civil', async () => {
    apiMock.history.mockReturnValue(
      of({
        id: 1,
        code: 'ISO-V-120',
        versions: [
          {
            id: 5,
            description: null,
            type: 'vidro',
            manufacturer: 'Sediver',
            profile: 'antipoluição',
            ruptureStrengthKn: '120.5',
            diameterMm: '255',
            spacingMm: '146',
            creepageDistanceMm: '320.125',
            effectiveFrom: '2026-07-01T00:00:00.000Z',
            createdBy: 'bruno',
            createdAt: '2026-07-01T12:00:00.000Z',
          },
        ],
      }),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('ISO-V-120');
    expect(text).toContain('Linha de fuga (mm)');
    expect(text).toContain('320.125');
    expect(text).toContain('antipoluição');
    // Data civil (meia-noite UTC) não pode regredir um dia no fuso local
    expect(text).toContain('01/07/2026');
    expect(text).toContain('bruno');
  });

  it('rejeita identificador malformado sem consultar a API', async () => {
    const fixture = await mount('abc');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Identificador inválido');
    expect(apiMock.history).not.toHaveBeenCalled();
  });

  it('exibe erro quando o histórico não carrega', async () => {
    apiMock.history.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Não foi possível carregar o histórico');
  });
});
