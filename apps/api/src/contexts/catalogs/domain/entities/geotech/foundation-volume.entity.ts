import {
  FOUNDATION_VOLUME_QUANTITY_FIELDS,
  FoundationVolumeCombination,
  FoundationVolumeQuantities,
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
  FOUNDATION_VOLUME_QUANTITY_FIELDS,
  FoundationVolumeCombination,
  FoundationVolumeQuantities,
};

export const QUANTITIES_PENDING_LABEL = 'quantidades';

export type FoundationVolumeVersionProps =
  Partial<FoundationVolumeQuantities> & {
    id?: number;
    foundationVolumeId?: number;
    effectivePeriod: EffectivePeriod;
    createdBy: string;
    createdAt?: Date;
  };

export class FoundationVolumeVersionEntity implements HasEffectivePeriod {
  public readonly id?: number;
  public readonly foundationVolumeId?: number;
  public readonly effectivePeriod: EffectivePeriod;
  public readonly createdBy: string;
  public readonly createdAt: Date;

  public readonly excavationHardFootingM3?: string | null;
  public readonly excavationNormalFootingM3?: string | null;
  public readonly excavationWaterFootingM3?: string | null;
  public readonly excavationHardPrecastM3?: string | null;
  public readonly excavationNormalPrecastM3?: string | null;
  public readonly excavationWaterPrecastM3?: string | null;
  public readonly excavationHardPileCapM3?: string | null;
  public readonly excavationNormalPileCapM3?: string | null;
  public readonly excavationWaterPileCapM3?: string | null;
  public readonly excavationPierM3?: string | null;
  public readonly anchorBoltDrillingM?: string | null;
  public readonly steelPiersKg?: string | null;
  public readonly steelFootingsKg?: string | null;
  public readonly steelPileCapsKg?: string | null;
  public readonly steelPrecastKg?: string | null;
  public readonly steelRockKg?: string | null;
  public readonly steelAnchorBoltsKg?: string | null;
  public readonly concretePiersM3?: string | null;
  public readonly concreteFootingsM3?: string | null;
  public readonly concretePileCapsM3?: string | null;
  public readonly concretePrecastM3?: string | null;
  public readonly concreteRockM3?: string | null;
  public readonly regenerationM3?: string | null;
  public readonly groutM3?: string | null;
  public readonly backfillSoilM3?: string | null;
  public readonly backfillSoilCementM3?: string | null;
  public readonly formworkM2?: string | null;
  public readonly helicalPileM?: string | null;
  public readonly steelPileM?: string | null;
  public readonly triconeM?: string | null;
  public readonly rootPileM?: string | null;
  public readonly continuousAugerPileM?: string | null;
  public readonly micropileM?: string | null;
  public readonly concretePileM?: string | null;

  constructor(props: FoundationVolumeVersionProps) {
    this.id = props.id;
    this.foundationVolumeId = props.foundationVolumeId;
    this.effectivePeriod = props.effectivePeriod;
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt ?? new Date();

    for (const field of FOUNDATION_VOLUME_QUANTITY_FIELDS) {
      (this as any)[field] = props[field] ?? null;
    }
  }

  public getPendingFields(): string[] {
    const allMissing = FOUNDATION_VOLUME_QUANTITY_FIELDS.every((field) =>
      PendingFieldDetector.isMissing((this as any)[field]),
    );
    return allMissing ? [QUANTITIES_PENDING_LABEL] : [];
  }

  public getQuantities(): FoundationVolumeQuantities {
    const res: any = {};
    for (const field of FOUNDATION_VOLUME_QUANTITY_FIELDS) {
      res[field] = (this as any)[field] ?? null;
    }
    return res as FoundationVolumeQuantities;
  }
}

export interface FoundationVolumeProps {
  id: number;
  towerTypeId: number;
  soilTypeId: number;
  foundationTypeId: number;
  combination?: FoundationVolumeCombination;
  versions?: FoundationVolumeVersionEntity[];
}

export class FoundationVolumeEntity {
  public readonly id: number;
  public readonly towerTypeId: number;
  public readonly soilTypeId: number;
  public readonly foundationTypeId: number;
  public readonly combination?: FoundationVolumeCombination;
  private readonly _versions: FoundationVolumeVersionEntity[];

  constructor(props: FoundationVolumeProps) {
    this.id = props.id;
    this.towerTypeId = props.towerTypeId;
    this.soilTypeId = props.soilTypeId;
    this.foundationTypeId = props.foundationTypeId;
    this.combination = props.combination;
    this._versions = props.versions ? [...props.versions] : [];
  }

  public get versions(): ReadonlyArray<FoundationVolumeVersionEntity> {
    return this._versions;
  }

  public getEffectiveVersion(
    referenceDate: CivilDate | Date | string,
  ): FoundationVolumeVersionEntity | null {
    return resolveEffectiveEntityVersion(this._versions, referenceDate);
  }

  public addVersion(version: FoundationVolumeVersionEntity): void {
    this._versions.push(version);
  }
}
