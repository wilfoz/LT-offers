import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuctionResultItem } from '@lt-offers/domain';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuctionHistoryApi } from './auction-history-api.service';
import { AuctionHistoryComponent } from './auction-history.component';

const winnerLot: AuctionResultItem = {
  id: 1,
  auctionYear: 2024,
  auctionDate: '2024-09-27',
  auctionNumber: '002/2024',
  lotNumber: 7,
  projectName: 'LT 500 kV Exemplo',
  mainUf: 'CE/PI',
  constructionDeadlineMonths: 60,
  lineLengthKm: '380.500',
  substationMva: null,
  estimatedInvestment: '2933612926.94',
  maxRap: '762630000.00',
  winnerName: 'Transmissora Exemplo S.A.',
  winningRap: '381315000.00',
  discountPercent: '48.00',
};

const desertedLot: AuctionResultItem = {
  ...winnerLot,
  id: 2,
  lotNumber: 8,
  projectName: 'LT 230 kV Deserta',
  winnerName: null,
  winningRap: null,
  discountPercent: null,
};

const lastImport = {
  id: 1,
  source: 'https://dadosabertos.aneel.gov.br/...',
  rowCount: 2,
  importedBy: 'qa@epc.com',
  importedAt: '2026-09-29T00:00:00.000Z',
};

describe('AuctionHistoryComponent', () => {
  const apiMock = {
    list: vi.fn(),
    sync: vi.fn(),
    benchmark: vi.fn(),
  };
  const snackBarMock = { open: vi.fn() };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [AuctionHistoryComponent],
      providers: [
        { provide: AuctionHistoryApi, useValue: apiMock },
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AuctionHistoryComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.list.mockReturnValue(
      of({ results: [winnerLot, desertedLot], lastImport }),
    );
  });

  it('exibe o snapshot com formatos pt-BR, lote deserto e metadados da importação', async () => {
    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('002/2024');
    expect(text).toContain('27/09/2024');
    expect(text).toContain('LT 500 kV Exemplo');
    expect(text).toContain('762.630.000,00');
    expect(text).toContain('48,00%');
    expect(text).toContain('deserto');
    expect(text).toContain('não informado');
    expect(text).toContain('2 lotes');
    expect(text).toContain('2 lote(s) no resultado');
  });

  it('estado vazio sem importação orienta a primeira sincronização', async () => {
    apiMock.list.mockReturnValue(of({ results: [], lastImport: null }));
    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Nenhuma importação registrada');
    expect(text).toContain('Sincronizar com a ANEEL');
  });

  it('estado vazio com importação indica que os filtros não encontraram lotes', async () => {
    apiMock.list.mockReturnValue(of({ results: [], lastImport }));
    const fixture = await mount();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Nenhum lote encontrado com os filtros informados');
  });

  it('repassa busca e filtros para a API ao filtrar', async () => {
    const fixture = await mount();
    const comp = fixture.componentInstance;

    comp.filterForm.patchValue({
      search: 'Exemplo',
      auctionNumber: '002/2024',
      uf: 'MG',
      year: '2024',
    });
    comp.reload();

    expect(apiMock.list).toHaveBeenLastCalledWith({
      search: 'Exemplo',
      auctionNumber: '002/2024',
      uf: 'MG',
      year: '2024',
    });
  });

  it('sincronização com sucesso exibe a contagem e recarrega a lista', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    apiMock.sync.mockReturnValue(of({ ...lastImport, rowCount: 488 }));

    const fixture = await mount();
    apiMock.list.mockClear();
    fixture.componentInstance.syncNow();

    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Histórico sincronizado: 488 lotes importados.',
      'OK',
      expect.anything(),
    );
    expect(apiMock.list).toHaveBeenCalledTimes(1);
  });

  it('falha da sincronização exibe a mensagem da API e preserva a tela', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    apiMock.sync.mockReturnValue(
      throwError(() => ({
        error: {
          message:
            'Fonte de dados da ANEEL indisponível: tempo limite de 15s excedido. O snapshot local permanece inalterado.',
        },
      })),
    );

    const fixture = await mount();
    fixture.componentInstance.syncNow();

    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Fonte de dados da ANEEL indisponível: tempo limite de 15s excedido. O snapshot local permanece inalterado.',
      'Fechar',
      expect.anything(),
    );
    expect(fixture.componentInstance.results()).toHaveLength(2);
    expect(fixture.componentInstance.syncing()).toBe(false);
  });

  it('cancelar a confirmação não dispara a sincronização', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const fixture = await mount();
    fixture.componentInstance.syncNow();

    expect(apiMock.sync).not.toHaveBeenCalled();
  });

  it('erro no carregamento exibe snackbar e encerra o estado de loading', async () => {
    apiMock.list.mockReturnValue(
      throwError(() => ({ error: { message: 'Falha ao consultar' } })),
    );
    const fixture = await mount();

    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Falha ao consultar',
      'Fechar',
      expect.anything(),
    );
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('botão de sincronizar reflete o estado em andamento', async () => {
    const fixture = await mount();
    fixture.componentInstance.syncing.set(true);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button[mat-flat-button]',
    ) as HTMLButtonElement | null;
    expect(button?.disabled).toBe(true);
  });
});
