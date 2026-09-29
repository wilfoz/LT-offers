import { AuctionBenchmarkResponse, auctionBenchmark } from '@lt-offers/domain';
import { AuctionHistoryRepository } from '../../domain/ports/auction-history.repository';

/**
 * Benchmark de deságio para a identidade normalizada de uma oferta: resultado
 * oficial do próprio lote (se publicado), estatísticas do leilão e da base
 * histórica completa — tudo derivado do snapshot local (RNF-04). Ausências
 * viram null, nunca valores inventados (RNF-09).
 */
export class GetAuctionBenchmarkUseCase {
  constructor(private readonly repository: AuctionHistoryRepository) {}

  async execute(
    auctionNumber: string,
    lotNumber: number,
  ): Promise<AuctionBenchmarkResponse> {
    const [lotResult, auctionRows, allRows, lastImport] = await Promise.all([
      this.repository.findLotResult(auctionNumber, lotNumber),
      this.repository.findByAuction(auctionNumber),
      this.repository.findDiscountRows(),
      this.repository.findLastImport(),
    ]);

    return {
      lotResult,
      auctionStats:
        auctionRows.length === 0 ? null : auctionBenchmark(auctionRows),
      overallStats: auctionBenchmark(allRows),
      lastImport,
    };
  }
}
