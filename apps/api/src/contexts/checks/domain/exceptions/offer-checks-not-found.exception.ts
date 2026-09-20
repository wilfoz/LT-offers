/**
 * Exceção lançada quando a oferta não é encontrada para execução das verificações de consistência.
 */
export class OfferChecksNotFoundException extends Error {
  constructor(public readonly offerId: string | number) {
    super(`Oferta #${offerId} não encontrada.`);
    this.name = 'OfferChecksNotFoundException';
  }
}
