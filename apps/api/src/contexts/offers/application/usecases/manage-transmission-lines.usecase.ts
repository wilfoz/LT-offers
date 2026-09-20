import { TransmissionLineItem } from '@lt-offers/domain';
import { Offer } from '../../domain/entities/offer.entity';
import { TransmissionLine } from '../../domain/entities/transmission-line.entity';
import {
  OfferNotFoundException,
  RevisionNotFoundException,
  LineNotFoundException,
} from '../../domain/exceptions/offer-domain.exceptions';
import { OffersUnitOfWork } from '../../domain/ports/offers-unit-of-work';

export class AddTransmissionLineUseCase {
  constructor(private readonly uow: OffersUnitOfWork) {}

  async execute(
    offerId: number,
    revisionId: number,
    lineDto: TransmissionLineItem,
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

      revision.assertIsDraft('adicionar linha de transmissão');

      const code = lineDto.code.trim();
      const codeExists = revision.transmissionLines.some(
        (l) => l.code.toUpperCase() === code.toUpperCase(),
      );
      if (codeExists) {
        throw new Error(`Código de linha duplicado na oferta: "${code}"`);
      }

      const line = TransmissionLine.create({
        revisionId,
        code,
        name: lineDto.name.trim(),
        nominalVoltageKv: lineDto.nominalVoltageKv,
        refinedLengthKm: lineDto.refinedLengthKm,
        reportLengthKm: lineDto.reportLengthKm,
        circuitCount: lineDto.circuitCount,
        bundleConductorCount: lineDto.bundleConductorCount,
        destinationStatePrimary: lineDto.destinationStatePrimary
          .trim()
          .toUpperCase(),
        destinationPercentagePrimary: lineDto.destinationPercentagePrimary,
        destinationStateSecondary:
          lineDto.destinationStateSecondary?.trim().toUpperCase() || null,
        destinationPercentageSecondary:
          lineDto.destinationPercentageSecondary ?? '0',
      });

      await revisions.addTransmissionLine(revisionId, line);

      const updatedOffer = await offers.findById(offerId);
      if (!updatedOffer) {
        throw new OfferNotFoundException(offerId);
      }
      return updatedOffer;
    });
  }
}

export class UpdateTransmissionLineUseCase {
  constructor(private readonly uow: OffersUnitOfWork) {}

  async execute(
    offerId: number,
    revisionId: number,
    lineId: number,
    lineDto: TransmissionLineItem,
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

      revision.assertIsDraft('atualizar linha de transmissão');

      const existingLine = revision.transmissionLines.find(
        (l) => l.id === lineId,
      );
      if (!existingLine) {
        throw new LineNotFoundException(lineId);
      }

      const code = lineDto.code.trim();
      const codeExists = revision.transmissionLines.some(
        (l) => l.id !== lineId && l.code.toUpperCase() === code.toUpperCase(),
      );
      if (codeExists) {
        throw new Error(`Código de linha duplicado na oferta: "${code}"`);
      }

      const line = TransmissionLine.reconstitute({
        id: lineId,
        revisionId,
        code,
        name: lineDto.name.trim(),
        nominalVoltageKv: lineDto.nominalVoltageKv,
        refinedLengthKm: lineDto.refinedLengthKm,
        reportLengthKm: lineDto.reportLengthKm,
        circuitCount: lineDto.circuitCount,
        bundleConductorCount: lineDto.bundleConductorCount,
        destinationStatePrimary: lineDto.destinationStatePrimary
          .trim()
          .toUpperCase(),
        destinationPercentagePrimary: lineDto.destinationPercentagePrimary,
        destinationStateSecondary:
          lineDto.destinationStateSecondary?.trim().toUpperCase() || null,
        destinationPercentageSecondary:
          lineDto.destinationPercentageSecondary ?? '0',
      });

      await revisions.updateTransmissionLine(revisionId, lineId, line);

      const updatedOffer = await offers.findById(offerId);
      if (!updatedOffer) {
        throw new OfferNotFoundException(offerId);
      }
      return updatedOffer;
    });
  }
}

export class DeleteTransmissionLineUseCase {
  constructor(private readonly uow: OffersUnitOfWork) {}

  async execute(
    offerId: number,
    revisionId: number,
    lineId: number,
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

      revision.assertIsDraft('excluir linha de transmissão');

      const existingLine = revision.transmissionLines.find(
        (l) => l.id === lineId,
      );
      if (!existingLine) {
        throw new LineNotFoundException(lineId);
      }

      await revisions.deleteTransmissionLine(revisionId, lineId);

      const updatedOffer = await offers.findById(offerId);
      if (!updatedOffer) {
        throw new OfferNotFoundException(offerId);
      }
      return updatedOffer;
    });
  }
}
