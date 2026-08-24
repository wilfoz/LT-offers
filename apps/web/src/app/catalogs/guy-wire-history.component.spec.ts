import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { GuyWireHistoryComponent } from './guy-wire-history.component';
import { GuyWiresApi } from './guy-wires-api.service';

describe('GuyWireHistoryComponent', () => {
  const apiMock = {
    history: vi.fn(),
  };

  async function mount(id = '1') {
    await TestBed.configureTestingModule({
      imports: [GuyWireHistoryComponent],
      providers: [
        provideRouter([]),
        { provide: GuyWiresApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(GuyWireHistoryComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe as versões com atributos do tirante e a vigência como data civil', async () => {
    apiMock.history.mockReturnValue(
      of({
        id: 1,
        code: 'CT-HS-5/16',
        versions: [
          {
            id: 5,
            description: null,
            weightTonPerKm: '0.31',
            reelLengthM: '1500',
            diameterMm: '7.9',
            utsKn: '48.2',
            galvanizationClass: 'A',
            strengthGrade: 'HS',
            wireCount: 7,
            effectiveFrom: '2026-07-01T00:00:00.000Z',
            createdBy: 'bruno',
            createdAt: '2026-07-01T12:00:00.000Z',
          },
        ],
      }),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('CT-HS-5/16');
    expect(text).toContain('Grau de resistência');
    expect(text).toContain('HS');
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
