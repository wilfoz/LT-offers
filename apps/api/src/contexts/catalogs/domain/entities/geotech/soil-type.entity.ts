import {
  CivilDate,
  EffectivePeriod,
  PendingFieldDetector,
} from '../../value-objects';
import {
  HasEffectivePeriod,
  resolveEffectiveEntityVersion,
} from '../base-catalog.entity';

export const SOIL_TYPE_REQUIRED_LABELS = {
  description: 'descrição',
  submerged: 'submerso',
  allowableCompressionStressKgfCm2: 'tensão admissível à compressão (kgf/cm²)',
  specificWeightKgfM3: 'peso específico (kgf/m³)',
  internalFrictionAngleDeg: 'ângulo de atrito interno (°)',
} as const;

export interface SoilTypeVersionProps {
  id?: number;
  soilTypeId?: number;
  description?: string | null;
  submerged?: boolean | null;
  allowableCompressionStressKgfCm2?: string | null;
  specificWeightKgfM3?: string | null;
  internalFrictionAngleDeg?: string | null;
  cohesionKgCm2?: string | null;
  nsptMin?: number | null;
  nsptMax?: number | null;
  effectivePeriod: EffectivePeriod;
  createdBy: string;
  createdAt?: Date;
}

export class SoilTypeVersionEntity implements HasEffectivePeriod {
  public readonly id?: number;
  public readonly soilTypeId?: number;
  public readonly description: string | null;
  public readonly submerged: boolean | null;
  public readonly allowableCompressionStressKgfCm2: string | null;
  public readonly specificWeightKgfM3: string | null;
  public readonly internalFrictionAngleDeg: string | null;
  public readonly cohesionKgCm2: string | null;
  public readonly nsptMin: number | null;
  public readonly nsptMax: number | null;
  public readonly effectivePeriod: EffectivePeriod;
  public readonly createdBy: string;
  public readonly createdAt: Date;

  constructor(props: SoilTypeVersionProps) {
    this.id = props.id;
    this.soilTypeId = props.soilTypeId;
    this.description = props.description ?? null;
    this.submerged = props.submerged ?? null;
    this.allowableCompressionStressKgfCm2 =
      props.allowableCompressionStressKgfCm2 ?? null;
    this.specificWeightKgfM3 = props.specificWeightKgfM3 ?? null;
    this.internalFrictionAngleDeg = props.internalFrictionAngleDeg ?? null;
    this.cohesionKgCm2 = props.cohesionKgCm2 ?? null;
    this.nsptMin = props.nsptMin ?? null;
    this.nsptMax = props.nsptMax ?? null;
    this.effectivePeriod = props.effectivePeriod;
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt ?? new Date();
  }

  public getPendingFields(): string[] {
    return PendingFieldDetector.detectMissing(
      {
        description: this.description,
        submerged: this.submerged,
        allowableCompressionStressKgfCm2: this.allowableCompressionStressKgfCm2,
        specificWeightKgfM3: this.specificWeightKgfM3,
        internalFrictionAngleDeg: this.internalFrictionAngleDeg,
      },
      SOIL_TYPE_REQUIRED_LABELS,
    );
  }
}

export interface SoilTypeProps {
  id: number;
  code: string;
  versions?: SoilTypeVersionEntity[];
}

export class SoilTypeEntity {
  public readonly id: number;
  public readonly code: string;
  private readonly _versions: SoilTypeVersionEntity[];

  constructor(props: SoilTypeProps) {
    this.id = props.id;
    this.code = props.code;
    this._versions = props.versions ? [...props.versions] : [];
  }

  public get versions(): ReadonlyArray<SoilTypeVersionEntity> {
    return this._versions;
  }

  public getEffectiveVersion(
    referenceDate: CivilDate | Date | string,
  ): SoilTypeVersionEntity | null {
    return resolveEffectiveEntityVersion(this._versions, referenceDate);
  }

  public addVersion(version: SoilTypeVersionEntity): void {
    this._versions.push(version);
  }
}
