import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ConductorCablesApi } from './conductor-cables-api.service';
import { ConductorCableListComponent } from './conductor-cable-list.component';

describe('ConductorCableListComponent', () => {
  const apiMock = {
    list: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [ConductorCableListComponent],
      providers: [
        provideRouter([]),
        { provide: ConductorCablesApi, useValue: apiMock },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ConductorCableListComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('sinaliza item com campos pendentes identificando o campo', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 1,
          code: 'CAA-636',
          effectiveVersion: {
            id: 10,
            description: 'Grosbeak',
            weightTonPerKm: '1.3026',
            reelLengthM: null,
            diameterMm: '25.16',
            utsKn: null,
            effectiveFrom: '2026-01-01T00:00:00.000Z',
            createdBy: 'ana',
            createdAt: '2026-01-01T12:00:00.000Z',
          },
          pendingFields: ['bobina (m)', 'UTS (kN)'],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('CAA-636');
    expect(text).toContain('Pendente: bobina (m), UTS (kN)');
  });

  it('exibe erro quando a API falha, em vez de fingir catálogo vazio', async () => {
    apiMock.list.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Não foi possível carregar o catálogo');
    expect(text).not.toContain('Nenhum cabo condutor encontrado');
  });

  it('indica item sem versão vigente', async () => {
    apiMock.list.mockReturnValue(
      of([
        { id: 2, code: 'FUTURO', effectiveVersion: null, pendingFields: [] },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Sem versão vigente');
  });
});
