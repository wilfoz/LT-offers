import {
  CivilDate,
  EffectivePeriod,
  PendingFieldDetector,
} from '../../value-objects';
import {
  HasEffectivePeriod,
  resolveEffectiveEntityVersion,
} from '../base-catalog.entity';

export const INSULATOR_REQUIRED_LABELS = {
  type: 'tipo',
  profile: 'perfil',
  ruptureStrengthKn: 'carga de ruptura (kN)',
  diameterMm: 'diâmetro (mm)',
  spacingMm: 'passo (mm)',
  creepageDistanceMm: 'linha de fuga (mm)',
} as const;

export interface InsulatorVersionProps {
  id?: number;
  insulatorId?: number;
  description?: string | null;
  type?: string | null;
  manufacturer?: string | null;
  profile?: string | null;
  ruptureStrengthKn?: string | null;
  diameterMm?: string | null;
  spacingMm?: string | null;
  creepageDistanceMm?: string | null;
  effectivePeriod: EffectivePeriod;
  createdBy: string;
  createdAt?: Date;
}

export class InsulatorVersionEntity implements HasEffectivePeriod {
  public readonly id?: number;
  public readonly insulatorId?: number;
  public readonly description: string | null;
  public readonly type: string | null;
  public readonly manufacturer: string | null;
  public readonly profile: string | null;
  public readonly ruptureStrengthKn: string | null;
  public readonly diameterMm: string | null;
  public readonly spacingMm: string | null;
  public readonly creepageDistanceMm: string | null;
  public readonly effectivePeriod: EffectivePeriod;
  public readonly createdBy: string;
  public readonly createdAt: Date;

  constructor(props: InsulatorVersionProps) {
    this.id = props.id;
    this.insulatorId = props.insulatorId;
    this.description = props.description ?? null;
    this.type = props.type ?? null;
    this.manufacturer = props.manufacturer ?? null;
    this.profile = props.profile ?? null;
    this.ruptureStrengthKn = props.ruptureStrengthKn ?? null;
    this.diameterMm = props.diameterMm ?? null;
    this.spacingMm = props.spacingMm ?? null;
    this.creepageDistanceMm = props.creepageDistanceMm ?? null;
    this.effectivePeriod = props.effectivePeriod;
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt ?? new Date();
  }

  public getPendingFields(): string[] {
    return PendingFieldDetector.detectMissing(
      {
        type: this.type,
        profile: this.profile,
        ruptureStrengthKn: this.ruptureStrengthKn,
        diameterMm: this.diameterMm,
        spacingMm: this.spacingMm,
        creepageDistanceMm: this.creepageDistanceMm,
      },
      INSULATOR_REQUIRED_LABELS,
    );
  }
}

export interface InsulatorProps {
  id: number;
  code: string;
  versions?: InsulatorVersionEntity[];
}

export class InsulatorEntity {
  public readonly id: number;
  public readonly code: string;
  private readonly _versions: InsulatorVersionEntity[];

  constructor(props: InsulatorProps) {
    this.id = props.id;
    this.code = props.code;
    this._versions = props.versions ? [...props.versions] : [];
  }

  public get versions(): ReadonlyArray<InsulatorVersionEntity> {
    return this._versions;
  }

  public getEffectiveVersion(
    referenceDate: CivilDate | Date | string,
  ): InsulatorVersionEntity | null {
    return resolveEffectiveEntityVersion(this._versions, referenceDate);
  }

  public addVersion(version: InsulatorVersionEntity): void {
    this._versions.push(version);
  }
}
