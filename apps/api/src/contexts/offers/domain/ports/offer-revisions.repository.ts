import { OfferRevision } from '../entities/offer-revision.entity';
import { TransmissionLine } from '../entities/transmission-line.entity';
import { ScopeMatrixItem } from '../entities/scope-matrix-item.entity';

export const OFFER_REVISIONS_REPOSITORY = Symbol('OFFER_REVISIONS_REPOSITORY');

export interface OfferRevisionsRepository {
  findById(id: number): Promise<OfferRevision | null>;
  findByOfferIdAndNumber(
    offerId: number,
    revisionNumber: number,
  ): Promise<OfferRevision | null>;
  save(revision: OfferRevision): Promise<OfferRevision>;
  saveScopeMatrix(
    revisionId: number,
    items: ScopeMatrixItem[],
  ): Promise<ScopeMatrixItem[]>;
  saveTransmissionLines(
    revisionId: number,
    lines: TransmissionLine[],
  ): Promise<TransmissionLine[]>;
  addTransmissionLine(
    revisionId: number,
    line: TransmissionLine,
  ): Promise<TransmissionLine>;
  updateTransmissionLine(
    revisionId: number,
    lineId: number,
    line: TransmissionLine,
  ): Promise<TransmissionLine>;
  deleteTransmissionLine(revisionId: number, lineId: number): Promise<void>;
}
