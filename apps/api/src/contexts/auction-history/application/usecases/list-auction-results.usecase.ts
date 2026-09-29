import { AuctionResultImportItem, AuctionResultItem } from '@lt-offers/domain';
import {
  AuctionHistoryRepository,
  AuctionResultsFilter,
} from '../../domain/ports/auction-history.repository';

export interface AuctionResultsListing {
  results: AuctionResultItem[];
  lastImport: AuctionResultImportItem | null;
}

/** Consulta o snapshot vigente com busca e filtros (RF-11, RNF-04). */
export class ListAuctionResultsUseCase {
  constructor(private readonly repository: AuctionHistoryRepository) {}

  async execute(filter: AuctionResultsFilter): Promise<AuctionResultsListing> {
    const [results, lastImport] = await Promise.all([
      this.repository.findResults(filter),
      this.repository.findLastImport(),
    ]);
    return { results, lastImport };
  }
}
