import { UpdateOfferRevisionPayload } from '@lt-offers/domain';
import { Offer } from '../../domain/entities/offer.entity';
import { TransmissionLine } from '../../domain/entities/transmission-line.entity';
import { ScopeMatrixItem } from '../../domain/entities/scope-matrix-item.entity';
import {
  OfferNotFoundException,
  RevisionNotFoundException,
  RevisionFrozenException,
} from '../../domain/exceptions/offer-domain.exceptions';
import { OffersUnitOfWork } from '../../domain/ports/offers-unit-of-work';

export class UpdateRevisionUseCase {
  constructor(private readonly uow: OffersUnitOfWork) {}

  async execute(
    offerId: number,
    revisionId: number,
    payload: UpdateOfferRevisionPayload,
  ): Promise<Offer> {
    return this.uow.runInTransaction(async ({ offers, revisions }) => {
      const offer = await offers.findById(offerId);
      if (!offer) {
        throw new OfferNotFoundException(offerId);
      }

      const revision = offer.getRevisionById(revisionId);
      if (!revision) {
        throw new RevisionNotFoundException(revisionId);
      }

      const isClosed = revision.isFrozen() || revision.isDelivered();
      const hasOnlyStatus =
        payload.status !== undefined &&
        Object.keys(payload).filter((k) => (payload as any)[k] !== undefined)
          .length === 1;

      if (isClosed && !hasOnlyStatus) {
        throw new RevisionFrozenException(
          revision.revisionNumber,
          'modificar revisões fechadas ou entregues. Crie uma nova revisão para realizar alterações',
        );
      }

      // Se for transição para FROZEN ou DELIVERED, verifica se há linhas (RF-63)
      if (payload.status === 'FROZEN' || payload.status === 'DELIVERED') {
        const effectiveLines = payload.transmissionLines
          ? payload.transmissionLines
          : revision.transmissionLines;
        if (!effectiveLines || effectiveLines.length === 0) {
          throw new Error(
            'Não é possível fechar ou congelar uma revisão sem linhas de transmissão cadastradas (RF-63).',
          );
        }
      }

      // Atualiza parâmetros da revisão
      revision.updateParameters({
        auctionName: payload.auctionName?.trim(),
        lotName: payload.lotName?.trim(),
        offerDate: payload.offerDate,
        auctionDate: payload.auctionDate ?? undefined,
        scheduleStartDate: payload.scheduleStartDate ?? undefined,
        commercialOperationDate: payload.commercialOperationDate ?? undefined,
        estimatedCapex: payload.estimatedCapex ?? undefined,
        maxRap: payload.maxRap ?? undefined,
        winningRap: payload.winningRap ?? undefined,
        notes: payload.notes?.trim() || undefined,
      });

      // Se informou status:
      if (payload.status === 'FROZEN' && !revision.isFrozen()) {
        revision.freeze();
      } else if (payload.status === 'DELIVERED' && !revision.isDelivered()) {
        if (!revision.isFrozen()) {
          revision.freeze();
        }
        revision.markDelivered();
      }

      // Salva revisão atualizada
      await revisions.save(revision);

      // Atualiza linhas se informadas
      if (payload.transmissionLines !== undefined) {
        const lineCodes = new Set<string>();
        const lines = payload.transmissionLines.map((l) => {
          const code = l.code.trim();
          if (lineCodes.has(code)) {
            throw new Error(`Código de linha duplicado na oferta: "${code}"`);
          }
          lineCodes.add(code);

          return TransmissionLine.create({
            code,
            name: l.name.trim(),
            nominalVoltageKv: l.nominalVoltageKv,
            refinedLengthKm: l.refinedLengthKm,
            reportLengthKm: l.reportLengthKm,
            circuitCount: l.circuitCount,
            bundleConductorCount: l.bundleConductorCount,
            destinationStatePrimary: l.destinationStatePrimary
              .trim()
              .toUpperCase(),
            destinationPercentagePrimary: l.destinationPercentagePrimary,
            destinationStateSecondary:
              l.destinationStateSecondary?.trim().toUpperCase() || null,
            destinationPercentageSecondary:
              l.destinationPercentageSecondary ?? '0',
          });
        });

        await revisions.saveTransmissionLines(revisionId, lines);
      }

      // Atualiza matriz de escopo se informada
      if (payload.scopeMatrixItems !== undefined) {
        const scopeItems = payload.scopeMatrixItems.map((s) =>
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
        );

        await revisions.saveScopeMatrix(revisionId, scopeItems);
      }

      const updatedOffer = await offers.findById(offerId);
      if (!updatedOffer) {
        throw new OfferNotFoundException(offerId);
      }
      return updatedOffer;
    });
  }
}
