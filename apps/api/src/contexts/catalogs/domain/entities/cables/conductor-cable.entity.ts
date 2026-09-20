import {
  CivilDate,
  EffectivePeriod,
  PendingFieldDetector,
} from '../../value-objects';
import {
  HasEffectivePeriod,
  resolveEffectiveEntityVersion,
} from '../base-catalog.entity';

export const CONDUCTOR_CABLE_REQUIRED_LABELS = {
  description: 'descrição',
  weightTonPerKm: 'peso (ton/km)',
  reelLengthM: 'bobina (m)',
  diameterMm: 'diâmetro (mm)',
  utsKn: 'UTS (kN)',
} as const;

export interface ConductorCableVersionProps {
  id?: number;
  conductorCableId?: number;
  description?: string | null;
  weightTonPerKm?: string | null;
  reelLengthM?: string | null;
  diameterMm?: string | null;
  utsKn?: string | null;
  effectivePeriod: EffectivePeriod;
  createdBy: string;
  createdAt?: Date;
}

export class ConductorCableVersionEntity implements HasEffectivePeriod {
  public readonly id?: number;
  public readonly conductorCableId?: number;
  public readonly description: string | null;
  public readonly weightTonPerKm: string | null;
  public readonly reelLengthM: string | null;
  public readonly diameterMm: string | null;
  public readonly utsKn: string | null;
  public readonly effectivePeriod: EffectivePeriod;
  public readonly createdBy: string;
  public readonly createdAt: Date;

  constructor(props: ConductorCableVersionProps) {
    this.id = props.id;
    this.conductorCableId = props.conductorCableId;
    this.description = props.description ?? null;
    this.weightTonPerKm = props.weightTonPerKm ?? null;
    this.reelLengthM = props.reelLengthM ?? null;
    this.diameterMm = props.diameterMm ?? null;
    this.utsKn = props.utsKn ?? null;
    this.effectivePeriod = props.effectivePeriod;
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt ?? new Date();
  }

  public getPendingFields(): string[] {
    return PendingFieldDetector.detectMissing(
      {
        description: this.description,
        weightTonPerKm: this.weightTonPerKm,
        reelLengthM: this.reelLengthM,
        diameterMm: this.diameterMm,
        utsKn: this.utsKn,
      },
      CONDUCTOR_CABLE_REQUIRED_LABELS,
    );
  }
}

export interface ConductorCableProps {
  id: number;
  code: string;
  versions?: ConductorCableVersionEntity[];
}

export class ConductorCableEntity {
  public readonly id: number;
  public readonly code: string;
  private readonly _versions: ConductorCableVersionEntity[];

  constructor(props: ConductorCableProps) {
    this.id = props.id;
    this.code = props.code;
    this._versions = props.versions ? [...props.versions] : [];
  }

  public get versions(): ReadonlyArray<ConductorCableVersionEntity> {
    return this._versions;
  }

  public getEffectiveVersion(
    referenceDate: CivilDate | Date | string,
  ): ConductorCableVersionEntity | null {
    return resolveEffectiveEntityVersion(this._versions, referenceDate);
  }

  public addVersion(version: ConductorCableVersionEntity): void {
    this._versions.push(version);
  }
}
