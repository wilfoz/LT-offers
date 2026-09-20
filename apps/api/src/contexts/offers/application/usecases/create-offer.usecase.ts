import { CANONICAL_SCOPE_ITEMS, CreateOfferPayload } from '@lt-offers/domain';
import { Offer } from '../../domain/entities/offer.entity';
import { OfferRevision } from '../../domain/entities/offer-revision.entity';
import { TransmissionLine } from '../../domain/entities/transmission-line.entity';
import { ScopeMatrixItem } from '../../domain/entities/scope-matrix-item.entity';
import { DuplicateOfferCodeException } from '../../domain/exceptions/offer-domain.exceptions';
import { OffersUnitOfWork } from '../../domain/ports/offers-unit-of-work';

export class CreateOfferUseCase {
  constructor(private readonly uow: OffersUnitOfWork) {}

  async execute(
    payload: CreateOfferPayload,
    userEmail = 'system@epc.com',
  ): Promise<Offer> {
    const code = payload.code.trim();
    if (!code) {
      throw new Error('O código da oferta é obrigatório.');
    }

    return this.uow.runInTransaction(async ({ offers }) => {
      const existing = await offers.findByCode(code);
      if (existing) {
        throw new DuplicateOfferCodeException(code);
      }

      // Validação e criação das linhas de transmissão iniciais
      const lineCodes = new Set<string>();
      const lines = (payload.transmissionLines || []).map((line) => {
        const lineCode = line.code.trim();
        if (lineCodes.has(lineCode)) {
          throw new Error(`Código de linha duplicado na oferta: "${lineCode}"`);
        }
        lineCodes.add(lineCode);

        return TransmissionLine.create({
          code: lineCode,
          name: line.name.trim(),
          nominalVoltageKv: line.nominalVoltageKv,
          refinedLengthKm: line.refinedLengthKm,
          reportLengthKm: line.reportLengthKm,
          circuitCount: line.circuitCount,
          bundleConductorCount: line.bundleConductorCount,
          destinationStatePrimary: line.destinationStatePrimary
            .trim()
            .toUpperCase(),
          destinationPercentagePrimary: line.destinationPercentagePrimary,
          destinationStateSecondary:
            line.destinationStateSecondary?.trim().toUpperCase() || null,
          destinationPercentageSecondary:
            line.destinationPercentageSecondary ?? '0',
        });
      });

      // Itens da matriz de escopo (informados ou canônicos padrão)
      const scopeItems =
        payload.scopeMatrixItems && payload.scopeMatrixItems.length > 0
          ? payload.scopeMatrixItems.map((s) =>
              ScopeMatrixItem.create({
                itemCode: s.itemCode.trim(),
                itemName: s.itemName.trim(),
                category: s.category.trim(),
                responsibleParty: s.responsibleParty,
                acceptsDirectBilling: s.acceptsDirectBilling,
                currencyRiskParty: s.currencyRiskParty,
                commodityRiskParty: s.commodityRiskParty,
                notes: s.notes?.trim() || null,
              }),
            )
          : CANONICAL_SCOPE_ITEMS.map((canonical) =>
              ScopeMatrixItem.create({
                itemCode: canonical.itemCode,
                itemName: canonical.itemName,
                category: canonical.category,
                responsibleParty: canonical.responsibleParty,
                acceptsDirectBilling: canonical.acceptsDirectBilling,
                currencyRiskParty: canonical.currencyRiskParty,
                commodityRiskParty: canonical.commodityRiskParty,
                notes: null,
              }),
            );

      // Revisão inicial R0
      const initialRevision = OfferRevision.create({
        revisionNumber: 0,
        status: 'DRAFT',
        auctionName: payload.auctionName.trim(),
        lotName: payload.lotName.trim(),
        offerDate: payload.offerDate,
        auctionDate: payload.auctionDate ?? null,
        scheduleStartDate: payload.scheduleStartDate ?? null,
        commercialOperationDate: payload.commercialOperationDate ?? null,
        estimatedCapex: payload.estimatedCapex ?? null,
        maxRap: payload.maxRap ?? null,
        winningRap: payload.winningRap ?? null,
        notes: payload.notes?.trim() || null,
        createdBy: payload.createdBy?.trim() || userEmail,
        transmissionLines: lines,
        scopeMatrixItems: scopeItems,
      });

      // Criação da oferta com a revisão R0
      const offer = Offer.create({
        code,
        name: payload.name.trim(),
        clientName: payload.clientName.trim(),
        baseCurrency: payload.baseCurrency?.trim() || 'BRL',
        clonedFromOfferId: null,
        revisions: [initialRevision],
      });

      return offers.save(offer);
    });
  }
}
