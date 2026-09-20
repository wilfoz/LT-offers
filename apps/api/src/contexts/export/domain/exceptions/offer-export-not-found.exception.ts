/**
 * Exceção de domínio lançada quando a oferta não é encontrada para exportação.
 */
export class OfferExportNotFoundException extends Error {
  constructor(public readonly offerId: string | number) {
    super(`Oferta ID ${offerId} não encontrada.`);
    this.name = 'OfferExportNotFoundException';
  }
}
