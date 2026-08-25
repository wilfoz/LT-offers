import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { InsulatorListComponent } from './insulator-list.component';
import { InsulatorsApi } from './insulators-api.service';

describe('InsulatorListComponent', () => {
  const apiMock = {
    list: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [InsulatorListComponent],
      providers: [
        provideRouter([]),
        { provide: InsulatorsApi, useValue: apiMock },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(InsulatorListComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sinaliza item com campos pendentes identificando o campo', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 1,
          code: 'ISO-V-120',
          effectiveVersion: {
            id: 10,
            description: 'Isolador de vidro 120 kN',
            type: 'vidro',
            manufacturer: 'Sediver',
            profile: 'standard',
            ruptureStrengthKn: '120',
            diameterMm: '255',
            spacingMm: '146',
            creepageDistanceMm: null,
            effectiveFrom: '2026-03-01T00:00:00.000Z',
            createdBy: 'ana',
            createdAt: '2026-03-01T12:00:00.000Z',
          },
          pendingFields: ['linha de fuga (mm)'],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('ISO-V-120');
    expect(text).toContain('Pendente: linha de fuga (mm)');
  });

  it('repassa o termo de busca à API', async () => {
    apiMock.list.mockReturnValue(of([]));

    const fixture = await mount();
    fixture.componentInstance.term.set('ISO-V');
    fixture.componentInstance.search(new Event('submit'));

    expect(apiMock.list).toHaveBeenLastCalledWith('ISO-V');
  });

  it('exibe erro quando a API falha, em vez de fingir catálogo vazio', async () => {
    apiMock.list.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Não foi possível carregar o catálogo');
    expect(text).not.toContain('Nenhum isolador encontrado');
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
