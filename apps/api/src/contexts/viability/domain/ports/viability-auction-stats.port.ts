import { AuctionResultItem } from '@lt-offers/domain';

/**
 * Porta de leitura do snapshot do histórico de leilões (RNF-04): o parecer
 * compara o deságio máximo suportado com os deságios praticados. Adapter
 * próprio lê a tabela `auction_result` sem acoplar o módulo auction-history.
 */
export interface ViabilityAuctionStatsPort {
  findByAuction(
    auctionNumber: string,
  ): Promise<Pick<AuctionResultItem, 'discountPercent' | 'winnerName'>[]>;
  findDiscountRows(): Promise<
    Pick<AuctionResultItem, 'discountPercent' | 'winnerName'>[]
  >;
}
