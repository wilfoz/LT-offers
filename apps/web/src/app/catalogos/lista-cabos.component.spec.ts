import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CabosCondutoresApi } from './cabos-condutores-api.service';
import { ListaCabosComponent } from './lista-cabos.component';

describe('ListaCabosComponent', () => {
  const apiMock = {
    listar: vi.fn(),
  };

  async function montar() {
    await TestBed.configureTestingModule({
      imports: [ListaCabosComponent],
      providers: [
        provideRouter([]),
        { provide: CabosCondutoresApi, useValue: apiMock },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ListaCabosComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('sinaliza item com campos pendentes identificando o campo', async () => {
    apiMock.listar.mockReturnValue(
      of([
        {
          id: 1,
          codigo: 'CAA-636',
          versaoVigente: {
            id: 10,
            descricao: 'Grosbeak',
            pesoTonKm: '1.3026',
            bobinaM: null,
            diametroMm: '25.16',
            utsKn: null,
            vigenciaInicio: '2026-01-01T00:00:00.000Z',
            criadoPor: 'ana',
            criadoEm: '2026-01-01T12:00:00.000Z',
          },
          camposPendentes: ['bobina (m)', 'UTS (kN)'],
        },
      ]),
    );

    const fixture = await montar();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('CAA-636');
    expect(texto).toContain('Pendente: bobina (m), UTS (kN)');
  });

  it('exibe erro quando a API falha, em vez de fingir catálogo vazio', async () => {
    apiMock.listar.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await montar();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('Não foi possível carregar o catálogo');
    expect(texto).not.toContain('Nenhum cabo condutor encontrado');
  });

  it('indica item sem versão vigente', async () => {
    apiMock.listar.mockReturnValue(
      of([
        { id: 2, codigo: 'FUTURO', versaoVigente: null, camposPendentes: [] },
      ]),
    );

    const fixture = await montar();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('Sem versão vigente');
  });
});
