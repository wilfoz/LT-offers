import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { GroundWireListComponent } from './ground-wire-list.component';
import { GroundWiresApi } from './ground-wires-api.service';

const steelVersion = {
  id: 10,
  description: 'Cordoalha EHS 3/8"',
  weightTonPerKm: '0.406',
  reelLengthM: '2000',
  diameterMm: '9.52',
  utsKn: '68.4',
  galvanizationClass: null,
  strengthGrade: 'EHS',
  wireCount: 7,
  manufacturer: null,
  i2tKa2s: null,
  fiberCount: null,
  effectiveFrom: '2026-01-01T00:00:00.000Z',
  createdBy: 'ana',
  createdAt: '2026-01-01T12:00:00.000Z',
};

describe('GroundWireListComponent', () => {
  const apiMock = {
    list: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [GroundWireListComponent],
      providers: [
        provideRouter([]),
        { provide: GroundWiresApi, useValue: apiMock },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(GroundWireListComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe o tipo e sinaliza pendências identificando o campo', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 1,
          code: 'CG-EHS-3/8',
          type: 'STEEL',
          effectiveVersion: steelVersion,
          pendingFields: ['classe de galvanização'],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('CG-EHS-3/8');
    expect(text).toContain('Aço');
    expect(text).toContain('Pendente: classe de galvanização');
  });

  it('repassa o filtro por tipo à API mantendo o termo de busca', async () => {
    apiMock.list.mockReturnValue(of([]));

    const fixture = await mount();
    fixture.componentInstance.term.set('CG');
    fixture.componentInstance.filterByType('OPGW');

    expect(apiMock.list).toHaveBeenLastCalledWith('CG', 'OPGW');
  });

  it('lista todos os tipos quando o filtro está em "Todos"', async () => {
    apiMock.list.mockReturnValue(of([]));

    const fixture = await mount();
    fixture.componentInstance.filterByType('');

    expect(apiMock.list).toHaveBeenLastCalledWith(undefined, undefined);
  });

  it('exibe erro quando a API falha, em vez de fingir catálogo vazio', async () => {
    apiMock.list.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Não foi possível carregar o catálogo');
    expect(text).not.toContain('Nenhum cabo de guarda encontrado');
  });

  it('indica item sem versão vigente', async () => {
    apiMock.list.mockReturnValue(
      of([
        {
          id: 2,
          code: 'FUTURO',
          type: 'OPGW',
          effectiveVersion: null,
          pendingFields: [],
        },
      ]),
    );

    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Sem versão vigente');
  });
});
