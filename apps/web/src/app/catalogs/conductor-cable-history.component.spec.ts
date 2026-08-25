import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ConductorCablesApi } from './conductor-cables-api.service';
import { ConductorCableHistoryComponent } from './conductor-cable-history.component';

describe('ConductorCableHistoryComponent', () => {
  async function mount(
    apiMock: { history: ReturnType<typeof vi.fn> },
    id = '1',
  ) {
    await TestBed.configureTestingModule({
      imports: [ConductorCableHistoryComponent],
      providers: [
        provideRouter([]),
        { provide: ConductorCablesApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ConductorCableHistoryComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('exibe erro quando o carregamento falha, sem "Carregando" eterno', async () => {
    const apiMock = {
      history: vi.fn().mockReturnValue(throwError(() => new Error('rede'))),
    };

    const fixture = await mount(apiMock);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Não foi possível carregar o histórico');
    expect(text).not.toContain('Carregando');
  });

  it('exibe as versões com vigência, autor e valores', async () => {
    const apiMock = {
      history: vi.fn().mockReturnValue(
        of({
          id: 1,
          code: 'CAA-636',
          versions: [
            {
              id: 11,
              description: 'v2',
              weightTonPerKm: '1.31',
              reelLengthM: '2500',
              diameterMm: '25.16',
              utsKn: '124.9',
              effectiveFrom: '2026-06-01T00:00:00.000Z',
              createdBy: 'bruno',
              createdAt: '2026-05-20T10:00:00.000Z',
            },
            {
              id: 10,
              description: 'v1',
              weightTonPerKm: '1.3026',
              reelLengthM: null,
              diameterMm: '25.16',
              utsKn: '124.9',
              effectiveFrom: '2026-01-01T00:00:00.000Z',
              createdBy: 'ana',
              createdAt: '2026-01-01T09:00:00.000Z',
            },
          ],
        }),
      ),
    };

    const fixture = await mount(apiMock);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(apiMock.history).toHaveBeenCalledWith(1);
    expect(text).toContain('CAA-636');
    expect(text).toContain('01/06/2026');
    expect(text).toContain('bruno');
    expect(text).toContain('ana');
    expect(text).toContain('1.3026');
  });

  it('rejeita identificador malformado sem consultar a API', async () => {
    const apiMock = { history: vi.fn() };

    const fixture = await mount(apiMock, 'abc');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Identificador inválido');
    expect(apiMock.history).not.toHaveBeenCalled();
  });
});
