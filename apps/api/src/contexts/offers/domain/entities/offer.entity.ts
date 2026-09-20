import { OfferRevision, OfferRevisionRawProps } from './offer-revision.entity';

export interface OfferProps {
  id?: number;
  code: string;
  name: string;
  clientName: string;
  baseCurrency: string;
  clonedFromOfferId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  revisions: OfferRevision[];
}

export interface OfferRawProps {
  id?: number;
  code: string;
  name: string;
  clientName: string;
  baseCurrency: string;
  clonedFromOfferId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  revisions: OfferRevisionRawProps[];
}

export class Offer {
  private constructor(private readonly _props: OfferProps) {}

  static create(
    props: Omit<OfferProps, 'id' | 'createdAt' | 'updatedAt' | 'revisions'> & {
      revisions?: OfferRevision[];
    },
  ): Offer {
    return new Offer({
      ...props,
      clonedFromOfferId: props.clonedFromOfferId ?? null,
      baseCurrency: props.baseCurrency || 'BRL',
      createdAt: new Date(),
      updatedAt: new Date(),
      revisions: props.revisions ?? [],
    });
  }

  static reconstitute(props: OfferRawProps | OfferProps): Offer {
    const revisions = (props.revisions || []).map((r) =>
      r instanceof OfferRevision ? r : OfferRevision.reconstitute(r),
    );
    return new Offer({
      ...props,
      revisions,
    });
  }

  get id(): number | undefined {
    return this._props.id;
  }

  get code(): string {
    return this._props.code;
  }

  get name(): string {
    return this._props.name;
  }

  get clientName(): string {
    return this._props.clientName;
  }

  get baseCurrency(): string {
    return this._props.baseCurrency;
  }

  get clonedFromOfferId(): number | null | undefined {
    return this._props.clonedFromOfferId;
  }

  get createdAt(): Date | undefined {
    return this._props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._props.updatedAt;
  }

  get revisions(): OfferRevision[] {
    return [...this._props.revisions];
  }

  getCurrentRevision(): OfferRevision | undefined {
    if (this._props.revisions.length === 0) return undefined;
    return [...this._props.revisions].sort(
      (a, b) => b.revisionNumber - a.revisionNumber,
    )[0];
  }

  getRevisionByNumber(revisionNumber: number): OfferRevision | undefined {
    return this._props.revisions.find(
      (rev) => rev.revisionNumber === revisionNumber,
    );
  }

  getRevisionById(revisionId: number): OfferRevision | undefined {
    return this._props.revisions.find((rev) => rev.id === revisionId);
  }

  updateGeneralData(input: {
    name?: string;
    clientName?: string;
    baseCurrency?: string;
  }): void {
    if (input.name !== undefined) this._props.name = input.name;
    if (input.clientName !== undefined)
      this._props.clientName = input.clientName;
    if (input.baseCurrency !== undefined)
      this._props.baseCurrency = input.baseCurrency;
    this._props.updatedAt = new Date();
  }

  addRevision(revision: OfferRevision): void {
    const exists = this._props.revisions.some(
      (r) => r.revisionNumber === revision.revisionNumber,
    );
    if (exists) {
      throw new Error(
        `Revisão R${revision.revisionNumber} já existe na proposta '${this._props.code}'.`,
      );
    }
    this._props.revisions.push(revision);
    this._props.updatedAt = new Date();
  }

  toRawProps(): OfferRawProps {
    return {
      ...this._props,
      revisions: this._props.revisions.map((r) => r.toRawProps()),
    };
  }
}
