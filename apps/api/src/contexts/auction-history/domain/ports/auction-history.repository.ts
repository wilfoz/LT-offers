import { AuctionResultImportItem, AuctionResultItem } from '@lt-offers/domain';

export interface AuctionResultsFilter {
  search?: string;
  auctionNumber?: string;
  uf?: string;
  year?: number;
}

/**
 * Repositório do snapshot do histórico de leilões: o snapshot é substituído
 * atomicamente a cada importação e o log de importações é imutável
 * (somente inserção — design D1).
 */
export interface AuctionHistoryRepository {
  replaceSnapshot(
    items: AuctionResultItem[],
    meta: { source: string; importedBy: string },
  ): Promise<AuctionResultImportItem>;
  findResults(filter: AuctionResultsFilter): Promise<AuctionResultItem[]>;
  findLotResult(
    auctionNumber: string,
    lotNumber: number,
  ): Promise<AuctionResultItem | null>;
  findByAuction(auctionNumber: string): Promise<AuctionResultItem[]>;
  findDiscountRows(): Promise<
    Pick<AuctionResultItem, 'discountPercent' | 'winnerName'>[]
  >;
  findLastImport(): Promise<AuctionResultImportItem | null>;
}
