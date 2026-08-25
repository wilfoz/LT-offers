import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { GroundWireHistoryComponent } from './ground-wire-history.component';
import { GroundWiresApi } from './ground-wires-api.service';

describe('GroundWireHistoryComponent', () => {
  const apiMock = {
    history: vi.fn(),
  };

  async function mount(id = '1') {
    await TestBed.configureTestingModule({
      imports: [GroundWireHistoryComponent],
      providers: [
        provideRouter([]),
        { provide: GroundWiresApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(GroundWireHistoryComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe as colunas específicas do tipo OPGW e a vigência como data civil', async () => {
    apiMock.history.mockReturnValue(
      of({
        id: 1,
        code: 'OPGW-48FO',
        type: 'OPGW',
        versions: [
          {
            id: 5,
            description: null,
            weightTonPerKm: '0.55',
            reelLengthM: '4000',
            diameterMm: '12.1',
            utsKn: '75',
            galvanizationClass: null,
            strengthGrade: null,
            wireCount: null,
            manufacturer: 'Prysmian',
            i2tKa2s: '95.5',
            fiberCount: 48,
            effectiveFrom: '2026-02-01T00:00:00.000Z',
            createdBy: 'bruno',
            createdAt: '2026-02-01T12:00:00.000Z',
          },
        ],
      }),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('OPGW-48FO');
    expect(text).toContain('Fabricante');
    expect(text).toContain('Prysmian');
    expect(text).toContain('48');
    expect(text).not.toContain('Classe de galvanização');
    // Data civil (meia-noite UTC) não pode regredir um dia no fuso local
    expect(text).toContain('01/02/2026');
    expect(text).toContain('bruno');
  });

  it('exibe as colunas específicas do tipo aço', async () => {
    apiMock.history.mockReturnValue(
      of({
        id: 2,
        code: 'CG-EHS-3/8',
        type: 'STEEL',
        versions: [
          {
            id: 6,
            description: null,
            weightTonPerKm: '0.406',
            reelLengthM: null,
            diameterMm: null,
            utsKn: null,
            galvanizationClass: 'B',
            strengthGrade: 'EHS',
            wireCount: 7,
            manufacturer: null,
            i2tKa2s: null,
            fiberCount: null,
            effectiveFrom: '2026-01-01T00:00:00.000Z',
            createdBy: 'ana',
            createdAt: '2026-01-01T12:00:00.000Z',
          },
        ],
      }),
    );

    const fixture = await mount('2');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Classe de galvanização');
    expect(text).toContain('EHS');
    expect(text).not.toContain('Fabricante');
  });

  it('exibe erro quando o histórico não carrega', async () => {
    apiMock.history.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Não foi possível carregar o histórico');
  });

  it('rejeita identificador malformado sem consultar a API', async () => {
    const fixture = await mount('abc');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Identificador inválido');
    expect(apiMock.history).not.toHaveBeenCalled();
  });
});
