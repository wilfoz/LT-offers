/**
 * Exceção lançada quando a oferta não é encontrada para geração do histograma consolidado.
 */
export class OfferHistogramNotFoundException extends Error {
  constructor(public readonly offerId: number) {
    super(`Oferta ID ${offerId} não encontrada.`);
    this.name = 'OfferHistogramNotFoundException';
  }
}
