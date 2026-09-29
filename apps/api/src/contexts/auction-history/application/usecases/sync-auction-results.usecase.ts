import {
  AuctionResultImportItem,
  AuctionResultItem,
  normalizeAuctionResult,
} from '@lt-offers/domain';
import { AneelDatasetInvalidException } from '../../domain/exceptions/auction-history.exceptions';
import { AneelAuctionResultsPort } from '../../domain/ports/aneel-auction-results.port';
import { AuctionHistoryRepository } from '../../domain/ports/auction-history.repository';
import { AuctionHistoryAuditTrailPort } from '../../domain/ports/audit-trail.port';

/**
 * Sincroniza o snapshot local com o dataset oficial: busca na porta,
 * normaliza na domain e substitui o snapshot em transação. Qualquer registro
 * fora do esquema aborta a sincronização inteira — nunca descartamos linhas
 * em silêncio (RNF-09) nem deixamos o snapshot pela metade.
 */
export class SyncAuctionResultsUseCase {
  constructor(
    private readonly sourcePort: AneelAuctionResultsPort,
    private readonly repository: AuctionHistoryRepository,
    private readonly auditTrail?: AuctionHistoryAuditTrailPort,
  ) {}

  async execute(importedBy: string): Promise<AuctionResultImportItem> {
    const { source, records } = await this.sourcePort.fetchAll();
    if (records.length === 0) {
      throw new AneelDatasetInvalidException('o dataset retornou vazio');
    }

    const normalized = records.map(normalizeAuctionResult);
    const items = normalized.filter(
      (item): item is AuctionResultItem => item !== null,
    );
    const invalidCount = normalized.length - items.length;
    if (invalidCount > 0) {
      throw new AneelDatasetInvalidException(
        `${invalidCount} registro(s) sem identidade mínima (ano, número do leilão, lote e empreendimento)`,
      );
    }
    // Guarda da coluna DECIMAL(5,2): deságio fora de 0–100% indica fonte
    // publicada em percentual (não fração) — abortar com mensagem clara em
    // vez de estourar na inserção. Comparação numérica apenas (nada persiste).
    const outOfRange = items.filter(
      (item) =>
        item.discountPercent !== null &&
        (Number(item.discountPercent) < 0 ||
          Number(item.discountPercent) > 100),
    ).length;
    if (outOfRange > 0) {
      throw new AneelDatasetInvalidException(
        `${outOfRange} registro(s) com deságio fora do intervalo de 0 a 100%`,
      );
    }

    const importItem = await this.repository.replaceSnapshot(items, {
      source,
      importedBy,
    });

    this.auditTrail?.logEvent({
      userId: importedBy,
      userName: importedBy,
      userRole: 'ADMIN',
      resource: 'AUCTION_HISTORY',
      resourceId: String(importItem.id),
      action: 'CREATE',
      description: `Sincronização do histórico de leilões da ANEEL: ${importItem.rowCount} lotes importados`,
      diffs: [
        {
          field: 'rowCount',
          previousValue: null,
          newValue: importItem.rowCount,
        },
        { field: 'source', previousValue: null, newValue: importItem.source },
      ],
    });

    return importItem;
  }
}
