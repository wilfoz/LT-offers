import {
  CivilDate,
  EffectivePeriod,
  PendingFieldDetector,
} from '../../value-objects';
import {
  HasEffectivePeriod,
  resolveEffectiveEntityVersion,
} from '../base-catalog.entity';

export const GUY_WIRE_REQUIRED_LABELS = {
  weightTonPerKm: 'peso (ton/km)',
  reelLengthM: 'bobina (m)',
  diameterMm: 'diâmetro (mm)',
  utsKn: 'UTS (kN)',
  galvanizationClass: 'classe de galvanização',
  strengthGrade: 'grau de resistência',
  wireCount: 'número de fios',
} as const;

export interface GuyWireVersionProps {
  id?: number;
  guyWireId?: number;
  description?: string | null;
  weightTonPerKm?: string | null;
  reelLengthM?: string | null;
  diameterMm?: string | null;
  utsKn?: string | null;
  galvanizationClass?: string | null;
  strengthGrade?: string | null;
  wireCount?: number | null;
  effectivePeriod: EffectivePeriod;
  createdBy: string;
  createdAt?: Date;
}

export class GuyWireVersionEntity implements HasEffectivePeriod {
  public readonly id?: number;
  public readonly guyWireId?: number;
  public readonly description: string | null;
  public readonly weightTonPerKm: string | null;
  public readonly reelLengthM: string | null;
  public readonly diameterMm: string | null;
  public readonly utsKn: string | null;
  public readonly galvanizationClass: string | null;
  public readonly strengthGrade: string | null;
  public readonly wireCount: number | null;
  public readonly effectivePeriod: EffectivePeriod;
  public readonly createdBy: string;
  public readonly createdAt: Date;

  constructor(props: GuyWireVersionProps) {
    this.id = props.id;
    this.guyWireId = props.guyWireId;
    this.description = props.description ?? null;
    this.weightTonPerKm = props.weightTonPerKm ?? null;
    this.reelLengthM = props.reelLengthM ?? null;
    this.diameterMm = props.diameterMm ?? null;
    this.utsKn = props.utsKn ?? null;
    this.galvanizationClass = props.galvanizationClass ?? null;
    this.strengthGrade = props.strengthGrade ?? null;
    this.wireCount = props.wireCount ?? null;
    this.effectivePeriod = props.effectivePeriod;
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt ?? new Date();
  }

  public getPendingFields(): string[] {
    return PendingFieldDetector.detectMissing(
      {
        weightTonPerKm: this.weightTonPerKm,
        reelLengthM: this.reelLengthM,
        diameterMm: this.diameterMm,
        utsKn: this.utsKn,
        galvanizationClass: this.galvanizationClass,
        strengthGrade: this.strengthGrade,
        wireCount: this.wireCount,
      },
      GUY_WIRE_REQUIRED_LABELS,
    );
  }
}

export interface GuyWireProps {
  id: number;
  code: string;
  versions?: GuyWireVersionEntity[];
}

export class GuyWireEntity {
  public readonly id: number;
  public readonly code: string;
  private readonly _versions: GuyWireVersionEntity[];

  constructor(props: GuyWireProps) {
    this.id = props.id;
    this.code = props.code;
    this._versions = props.versions ? [...props.versions] : [];
  }

  public get versions(): ReadonlyArray<GuyWireVersionEntity> {
    return this._versions;
  }

  public getEffectiveVersion(
    referenceDate: CivilDate | Date | string,
  ): GuyWireVersionEntity | null {
    return resolveEffectiveEntityVersion(this._versions, referenceDate);
  }

  public addVersion(version: GuyWireVersionEntity): void {
    this._versions.push(version);
  }
}
