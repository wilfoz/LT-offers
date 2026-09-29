import { RawAuctionResultRecord } from '@lt-offers/domain';

/**
 * Porta para a fonte externa do histórico de leilões (datastore CKAN da
 * ANEEL). O adapter devolve os registros crus e a descrição da fonte; a
 * normalização é da domain e a persistência do repositório (RNF-04: o
 * snapshot local é a única fonte das consultas).
 */
export interface AneelAuctionResultsPort {
  fetchAll(): Promise<{ source: string; records: RawAuctionResultRecord[] }>;
}
