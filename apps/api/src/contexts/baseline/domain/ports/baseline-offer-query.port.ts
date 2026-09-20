/**
 * Dados básicos da oferta consumidos pelo congelamento e pelo pacote ERP —
 * a única consulta deste contexto que toca o banco.
 */
export interface BaselineOfferBasics {
  id: number;
  code: string;
  name: string;
}

export interface BaselineOfferQueryPort {
  findOfferBasics(offerId: number): Promise<BaselineOfferBasics | null>;
}
