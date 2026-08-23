import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CabosCondutoresApi } from './cabos-condutores-api.service';
import { HistoricoCaboComponent } from './historico-cabo.component';

describe('HistoricoCaboComponent', () => {
  it('exibe erro quando o carregamento falha, sem "Carregando" eterno', async () => {
    const apiMock = {
      historico: vi.fn().mockReturnValue(throwError(() => new Error('rede'))),
    };

    await TestBed.configureTestingModule({
      imports: [HistoricoCaboComponent],
      providers: [
        provideRouter([]),
        { provide: CabosCondutoresApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HistoricoCaboComponent);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Não foi possível carregar o histórico');
    expect(texto).not.toContain('Carregando');
  });

  it('exibe as versões com vigência, autor e valores', async () => {
    const apiMock = {
      historico: vi.fn().mockReturnValue(
        of({
          id: 1,
          codigo: 'CAA-636',
          versoes: [
            {
              id: 11,
              descricao: 'v2',
              pesoTonKm: '1.31',
              bobinaM: '2500',
              diametroMm: '25.16',
              utsKn: '124.9',
              vigenciaInicio: '2026-06-01T00:00:00.000Z',
              criadoPor: 'bruno',
              criadoEm: '2026-05-20T10:00:00.000Z',
            },
            {
              id: 10,
              descricao: 'v1',
              pesoTonKm: '1.3026',
              bobinaM: null,
              diametroMm: '25.16',
              utsKn: '124.9',
              vigenciaInicio: '2026-01-01T00:00:00.000Z',
              criadoPor: 'ana',
              criadoEm: '2026-01-01T09:00:00.000Z',
            },
          ],
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [HistoricoCaboComponent],
      providers: [
        provideRouter([]),
        { provide: CabosCondutoresApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HistoricoCaboComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(apiMock.historico).toHaveBeenCalledWith(1);
    expect(texto).toContain('CAA-636');
    expect(texto).toContain('01/06/2026');
    expect(texto).toContain('bruno');
    expect(texto).toContain('ana');
    expect(texto).toContain('1.3026');
  });
});
