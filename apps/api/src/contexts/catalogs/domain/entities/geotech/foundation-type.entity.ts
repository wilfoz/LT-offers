import {
  FOUNDATION_ELEMENT_COUNT_FIELDS,
  FoundationApplication,
  FoundationElementCounts,
} from '@lt-offers/domain';
import {
  CivilDate,
  EffectivePeriod,
  PendingFieldDetector,
} from '../../value-objects';
import {
  HasEffectivePeriod,
  resolveEffectiveEntityVersion,
} from '../base-catalog.entity';

export {
  FoundationApplication,
  FoundationElementCounts,
  FOUNDATION_ELEMENT_COUNT_FIELDS,
};

export const FOUNDATION_TYPE_REQUIRED_LABELS = {
  description: 'descrição',
} as const;

export const COMPOSITION_LABEL = 'composição por elemento';

export type FoundationTypeVersionProps = Partial<FoundationElementCounts> & {
  id?: number;
  foundationTypeId?: number;
  description?: string | null;
  effectivePeriod: EffectivePeriod;
  createdBy: string;
  createdAt?: Date;
};

export class FoundationTypeVersionEntity implements HasEffectivePeriod {
  public readonly id?: number;
  public readonly foundationTypeId?: number;
  public readonly description: string | null;
  public readonly effectivePeriod: EffectivePeriod;
  public readonly createdBy: string;
  public readonly createdAt: Date;

  public readonly spreadFootingCount: number | null;
  public readonly precastMastCount: number | null;
  public readonly precastGuyCount: number | null;
  public readonly straightPierCount: number | null;
  public readonly belledPierCount: number | null;
  public readonly slabPierCount: number | null;
  public readonly straightPierGuyCount: number | null;
  public readonly belledPierGuyCount: number | null;
  public readonly rockAnchorCount: number | null;
  public readonly concretePileCount: number | null;
  public readonly steelPileCount: number | null;
  public readonly helicalMastCount: number | null;
  public readonly helicalGuyCount: number | null;
  public readonly triconeCount: number | null;
  public readonly rootPileCount: number | null;
  public readonly micropileCount: number | null;
  public readonly continuousAugerPileCount: number | null;

  constructor(props: FoundationTypeVersionProps) {
    this.id = props.id;
    this.foundationTypeId = props.foundationTypeId;
    this.description = props.description ?? null;
    this.effectivePeriod = props.effectivePeriod;
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt ?? new Date();

    this.spreadFootingCount = props.spreadFootingCount ?? null;
    this.precastMastCount = props.precastMastCount ?? null;
    this.precastGuyCount = props.precastGuyCount ?? null;
    this.straightPierCount = props.straightPierCount ?? null;
    this.belledPierCount = props.belledPierCount ?? null;
    this.slabPierCount = props.slabPierCount ?? null;
    this.straightPierGuyCount = props.straightPierGuyCount ?? null;
    this.belledPierGuyCount = props.belledPierGuyCount ?? null;
    this.rockAnchorCount = props.rockAnchorCount ?? null;
    this.concretePileCount = props.concretePileCount ?? null;
    this.steelPileCount = props.steelPileCount ?? null;
    this.helicalMastCount = props.helicalMastCount ?? null;
    this.helicalGuyCount = props.helicalGuyCount ?? null;
    this.triconeCount = props.triconeCount ?? null;
    this.rootPileCount = props.rootPileCount ?? null;
    this.micropileCount = props.micropileCount ?? null;
    this.continuousAugerPileCount = props.continuousAugerPileCount ?? null;
  }

  public getPendingFields(): string[] {
    const pending = PendingFieldDetector.detectMissing(
      {
        description: this.description,
      },
      FOUNDATION_TYPE_REQUIRED_LABELS,
    );

    const hasAnyElement = FOUNDATION_ELEMENT_COUNT_FIELDS.some(
      (field) => !PendingFieldDetector.isMissing((this as any)[field]),
    );

    if (!hasAnyElement) {
      pending.push(COMPOSITION_LABEL);
    }

    return pending;
  }
}

export interface FoundationTypeProps {
  id: number;
  code: string;
  application: FoundationApplication;
  versions?: FoundationTypeVersionEntity[];
}

export class FoundationTypeEntity {
  public readonly id: number;
  public readonly code: string;
  public readonly application: FoundationApplication;
  private readonly _versions: FoundationTypeVersionEntity[];

  constructor(props: FoundationTypeProps) {
    this.id = props.id;
    this.code = props.code;
    this.application = props.application;
    this._versions = props.versions ? [...props.versions] : [];
  }

  public get versions(): ReadonlyArray<FoundationTypeVersionEntity> {
    return this._versions;
  }

  public getEffectiveVersion(
    referenceDate: CivilDate | Date | string,
  ): FoundationTypeVersionEntity | null {
    return resolveEffectiveEntityVersion(this._versions, referenceDate);
  }

  public addVersion(version: FoundationTypeVersionEntity): void {
    this._versions.push(version);
  }
}
