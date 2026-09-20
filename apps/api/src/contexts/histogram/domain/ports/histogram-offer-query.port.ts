export interface HistogramOfferLineData {
  id: number;
  name?: string;
}

export interface HistogramOfferData {
  offerId: number;
  lines: HistogramOfferLineData[];
}

/**
 * Porta de consulta de linhas de uma oferta para consolidação do histograma de recursos.
 */
export interface HistogramOfferQueryPort {
  findOfferLines(offerId: number): Promise<HistogramOfferData | null>;
}
