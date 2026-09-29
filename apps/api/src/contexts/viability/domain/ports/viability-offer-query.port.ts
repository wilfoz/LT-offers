/**
 * Consulta mínima da revisão para o parecer de viabilidade: campos
 * financeiros e identidade normalizada do leilão. A data da oferta ancora a
 * resolução dos parâmetros vigentes (RNF-05).
 */
export interface ViabilityRevisionFinancials {
  offerDate: string; // AAAA-MM-DD
  bidderCapex: string | null;
  estimatedCapex: string | null;
  maxRap: string | null;
  winningRap: string | null;
  auctionNumber: string | null;
}

export interface ViabilityOfferQueryPort {
  findRevisionFinancials(
    offerId: number,
    revisionId: number,
  ): Promise<ViabilityRevisionFinancials | null>;
}
