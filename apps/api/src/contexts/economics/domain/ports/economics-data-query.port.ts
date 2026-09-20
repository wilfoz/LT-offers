import { EconomicsLineData } from '../entities/economics-line-data';

/**
 * Porta de consulta dos dados de oferta e linha consumidos pelos três
 * agregados. A lista de linhas devolve os IDs da última revisão da
 * oferta, na ordem persistida (comportamento herdado do legado).
 */
export interface EconomicsDataQueryPort {
  findLineEconomicsData(lineId: number): Promise<EconomicsLineData | null>;
  findOfferLineIds(offerId: number): Promise<number[] | null>;
}
