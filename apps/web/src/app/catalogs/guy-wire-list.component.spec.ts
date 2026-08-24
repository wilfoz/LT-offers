import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { GuyWireListComponent } from './guy-wire-list.component';
import { GuyWiresApi } from './guy-wires-api.service';

describe('GuyWireListComponent', () => {
  const apiMock = {
    list: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [GuyWireListComponent],
      providers: [
        provideRouter([]),
        { provide: GuyWiresApi, useValue: apiMock },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(GuyWireListComponent);
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
          code: 'CT-HS-5/16',
          effectiveVersion: {
            id: 10,
            description: 'Cordoalha HS',
            weightTonPerKm: '0.31',
            reelLengthM: '1500',
            diameterMm: '7.9',
            utsKn: '48.2',
            galvanizationClass: 'B',
            strengthGrade: null,
            wireCount: 7,
            effectiveFrom: '2026-03-01T00:00:00.000Z',
            createdBy: 'ana',
            createdAt: '2026-03-01T12:00:00.000Z',
          },
          pendingFields: ['grau de resistência'],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('CT-HS-5/16');
    expect(text).toContain('Pendente: grau de resistência');
  });

  it('repassa o termo de busca à API', async () => {
    apiMock.list.mockReturnValue(of([]));

    const fixture = await mount();
    fixture.componentInstance.term.set('CT-HS');
    fixture.componentInstance.search(new Event('submit'));

    expect(apiMock.list).toHaveBeenLastCalledWith('CT-HS');
  });

  it('exibe erro quando a API falha, em vez de fingir catálogo vazio', async () => {
    apiMock.list.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Não foi possível carregar o catálogo');
    expect(text).not.toContain('Nenhum cabo de tirante encontrado');
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
