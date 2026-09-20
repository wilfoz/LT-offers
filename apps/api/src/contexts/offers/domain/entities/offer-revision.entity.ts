import { OfferRevisionStatus } from '@lt-offers/domain';
import { RevisionFrozenException } from '../exceptions/offer-domain.exceptions';
import {
  ScopeMatrixItem,
  ScopeMatrixItemProps,
} from './scope-matrix-item.entity';
import {
  TransmissionLine,
  TransmissionLineProps,
} from './transmission-line.entity';

export interface OfferRevisionProps {
  id?: number;
  offerId?: number;
  revisionNumber: number;
  status: OfferRevisionStatus;
  auctionName: string;
  lotName: string;
  offerDate: string;
  auctionDate?: string | null;
  scheduleStartDate?: string | null;
  commercialOperationDate?: string | null;
  estimatedCapex?: string | null;
  maxRap?: string | null;
  winningRap?: string | null;
  notes?: string | null;
  closedAt?: Date | null;
  deliveredAt?: Date | null;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
  transmissionLines: TransmissionLine[];
  scopeMatrixItems: ScopeMatrixItem[];
}

export interface OfferRevisionRawProps {
  id?: number;
  offerId?: number;
  revisionNumber: number;
  status: OfferRevisionStatus;
  auctionName: string;
  lotName: string;
  offerDate: string;
  auctionDate?: string | null;
  scheduleStartDate?: string | null;
  commercialOperationDate?: string | null;
  estimatedCapex?: string | null;
  maxRap?: string | null;
  winningRap?: string | null;
  notes?: string | null;
  closedAt?: Date | null;
  deliveredAt?: Date | null;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
  transmissionLines: TransmissionLineProps[];
  scopeMatrixItems: ScopeMatrixItemProps[];
}

export class OfferRevision {
  private constructor(private readonly _props: OfferRevisionProps) {}

  static create(
    props: Omit<
      OfferRevisionProps,
      'id' | 'createdAt' | 'updatedAt' | 'closedAt' | 'deliveredAt'
    >,
  ): OfferRevision {
    return new OfferRevision({
      ...props,
      closedAt: null,
      deliveredAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      transmissionLines: props.transmissionLines ?? [],
      scopeMatrixItems: props.scopeMatrixItems ?? [],
    });
  }

  static reconstitute(
    props: OfferRevisionRawProps | OfferRevisionProps,
  ): OfferRevision {
    const transmissionLines = (props.transmissionLines || []).map((l) =>
      l instanceof TransmissionLine ? l : TransmissionLine.reconstitute(l),
    );
    const scopeMatrixItems = (props.scopeMatrixItems || []).map((s) =>
      s instanceof ScopeMatrixItem ? s : ScopeMatrixItem.reconstitute(s),
    );
    return new OfferRevision({
      ...props,
      transmissionLines,
      scopeMatrixItems,
    });
  }

  get id(): number | undefined {
    return this._props.id;
  }

  get offerId(): number | undefined {
    return this._props.offerId;
  }

  get revisionNumber(): number {
    return this._props.revisionNumber;
  }

  get status(): OfferRevisionStatus {
    return this._props.status;
  }

  get auctionName(): string {
    return this._props.auctionName;
  }

  get lotName(): string {
    return this._props.lotName;
  }

  get offerDate(): string {
    return this._props.offerDate;
  }

  get auctionDate(): string | null | undefined {
    return this._props.auctionDate;
  }

  get scheduleStartDate(): string | null | undefined {
    return this._props.scheduleStartDate;
  }

  get commercialOperationDate(): string | null | undefined {
    return this._props.commercialOperationDate;
  }

  get estimatedCapex(): string | null | undefined {
    return this._props.estimatedCapex;
  }

  get maxRap(): string | null | undefined {
    return this._props.maxRap;
  }

  get winningRap(): string | null | undefined {
    return this._props.winningRap;
  }

  get notes(): string | null | undefined {
    return this._props.notes;
  }

  get closedAt(): Date | null | undefined {
    return this._props.closedAt;
  }

  get deliveredAt(): Date | null | undefined {
    return this._props.deliveredAt;
  }

  get createdBy(): string {
    return this._props.createdBy;
  }

  get createdAt(): Date | undefined {
    return this._props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._props.updatedAt;
  }

  get transmissionLines(): TransmissionLine[] {
    return [...this._props.transmissionLines];
  }

  get scopeMatrixItems(): ScopeMatrixItem[] {
    return [...this._props.scopeMatrixItems];
  }

  isDraft(): boolean {
    return this._props.status === 'DRAFT';
  }

  isFrozen(): boolean {
    return this._props.status === 'FROZEN';
  }

  isDelivered(): boolean {
    return this._props.status === 'DELIVERED';
  }

  assertIsDraft(action = 'modificar'): void {
    if (this._props.status !== 'DRAFT') {
      throw new RevisionFrozenException(this._props.revisionNumber, action);
    }
  }

  freeze(closedAt = new Date()): void {
    this.assertIsDraft('fechar/congelar');
    this._props.status = 'FROZEN';
    this._props.closedAt = closedAt;
    this._props.updatedAt = new Date();
  }

  markDelivered(deliveredAt = new Date()): void {
    if (this._props.status !== 'FROZEN') {
      throw new Error(
        `Apenas revisões congeladas podem ser marcadas como entregues (atual: ${this._props.status}).`,
      );
    }
    this._props.status = 'DELIVERED';
    this._props.deliveredAt = deliveredAt;
    this._props.updatedAt = new Date();
  }

  updateParameters(params: Partial<OfferRevisionProps>): void {
    this.assertIsDraft('atualizar parâmetros');
    if (params.auctionName !== undefined)
      this._props.auctionName = params.auctionName;
    if (params.lotName !== undefined) this._props.lotName = params.lotName;
    if (params.offerDate !== undefined)
      this._props.offerDate = params.offerDate;
    if (params.auctionDate !== undefined)
      this._props.auctionDate = params.auctionDate;
    if (params.scheduleStartDate !== undefined)
      this._props.scheduleStartDate = params.scheduleStartDate;
    if (params.commercialOperationDate !== undefined)
      this._props.commercialOperationDate = params.commercialOperationDate;
    if (params.estimatedCapex !== undefined)
      this._props.estimatedCapex = params.estimatedCapex;
    if (params.maxRap !== undefined) this._props.maxRap = params.maxRap;
    if (params.winningRap !== undefined)
      this._props.winningRap = params.winningRap;
    if (params.notes !== undefined) this._props.notes = params.notes;
    this._props.updatedAt = new Date();
  }

  setScopeMatrixItems(items: ScopeMatrixItem[]): void {
    this.assertIsDraft('atualizar matriz de escopo');
    this._props.scopeMatrixItems = [...items];
    this._props.updatedAt = new Date();
  }

  setTransmissionLines(lines: TransmissionLine[]): void {
    this.assertIsDraft('atualizar linhas de transmissão');
    this._props.transmissionLines = [...lines];
    this._props.updatedAt = new Date();
  }

  toRawProps(): OfferRevisionRawProps {
    return {
      ...this._props,
      transmissionLines: this._props.transmissionLines.map((l) =>
        l.toRawProps(),
      ),
      scopeMatrixItems: this._props.scopeMatrixItems.map((s) => s.toRawProps()),
    };
  }
}
