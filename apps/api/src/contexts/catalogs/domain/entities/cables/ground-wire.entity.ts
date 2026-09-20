import {
  CivilDate,
  EffectivePeriod,
  PendingFieldDetector,
} from '../../value-objects';
import {
  HasEffectivePeriod,
  resolveEffectiveEntityVersion,
} from '../base-catalog.entity';
import { InvalidCatalogDataException } from '../../exceptions/catalog-domain.exceptions';

export type GroundWireType = 'STEEL' | 'OPGW';

export const GROUND_WIRE_TYPE_LABELS: Record<GroundWireType, string> = {
  STEEL: 'aço (cabo de guarda padrão)',
  OPGW: 'OPGW (cabo de guarda com fibra óptica)',
};

export const COMMON_REQUIRED_LABELS = {
  weightTonPerKm: 'peso (ton/km)',
  reelLengthM: 'bobina (m)',
  diameterMm: 'diâmetro (mm)',
  utsKn: 'UTS (kN)',
} as const;

export const STEEL_ONLY_LABELS = {
  galvanizationClass: 'classe de galvanização',
  strengthGrade: 'grau de resistência',
  wireCount: 'número de fios',
} as const;

export const OPGW_ONLY_LABELS = {
  manufacturer: 'fabricante',
  i2tKa2s: 'I²t (kA²·s)',
  fiberCount: 'número de fibras',
} as const;

export const REQUIRED_BY_GROUND_WIRE_TYPE: Record<
  GroundWireType,
  Record<string, string>
> = {
  STEEL: { ...COMMON_REQUIRED_LABELS, ...STEEL_ONLY_LABELS },
  OPGW: {
    ...COMMON_REQUIRED_LABELS,
    i2tKa2s: OPGW_ONLY_LABELS.i2tKa2s,
    fiberCount: OPGW_ONLY_LABELS.fiberCount,
  },
};

export interface GroundWireVersionProps {
  id?: number;
  groundWireId?: number;
  description?: string | null;
  weightTonPerKm?: string | null;
  reelLengthM?: string | null;
  diameterMm?: string | null;
  utsKn?: string | null;
  galvanizationClass?: string | null;
  strengthGrade?: string | null;
  wireCount?: number | null;
  manufacturer?: string | null;
  i2tKa2s?: string | null;
  fiberCount?: number | null;
  effectivePeriod: EffectivePeriod;
  createdBy: string;
  createdAt?: Date;
}

export class GroundWireVersionEntity implements HasEffectivePeriod {
  public readonly id?: number;
  public readonly groundWireId?: number;
  public readonly description: string | null;
  public readonly weightTonPerKm: string | null;
  public readonly reelLengthM: string | null;
  public readonly diameterMm: string | null;
  public readonly utsKn: string | null;
  public readonly galvanizationClass: string | null;
  public readonly strengthGrade: string | null;
  public readonly wireCount: number | null;
  public readonly manufacturer: string | null;
  public readonly i2tKa2s: string | null;
  public readonly fiberCount: number | null;
  public readonly effectivePeriod: EffectivePeriod;
  public readonly createdBy: string;
  public readonly createdAt: Date;

  constructor(props: GroundWireVersionProps) {
    this.id = props.id;
    this.groundWireId = props.groundWireId;
    this.description = props.description ?? null;
    this.weightTonPerKm = props.weightTonPerKm ?? null;
    this.reelLengthM = props.reelLengthM ?? null;
    this.diameterMm = props.diameterMm ?? null;
    this.utsKn = props.utsKn ?? null;
    this.galvanizationClass = props.galvanizationClass ?? null;
    this.strengthGrade = props.strengthGrade ?? null;
    this.wireCount = props.wireCount ?? null;
    this.manufacturer = props.manufacturer ?? null;
    this.i2tKa2s = props.i2tKa2s ?? null;
    this.fiberCount = props.fiberCount ?? null;
    this.effectivePeriod = props.effectivePeriod;
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt ?? new Date();
  }

  public validateTypeApplicability(type: GroundWireType): void {
    const foreign = (
      type === 'STEEL' ? OPGW_ONLY_LABELS : STEEL_ONLY_LABELS
    ) as Record<string, string>;
    const offending = Object.keys(foreign)
      .filter((field) => !PendingFieldDetector.isMissing((this as any)[field]))
      .map((field) => foreign[field]);

    if (offending.length > 0) {
      throw new InvalidCatalogDataException(
        `Os campos a seguir não se aplicam ao tipo ${GROUND_WIRE_TYPE_LABELS[type]}: ${offending.join(', ')}`,
      );
    }
  }

  public getPendingFields(type: GroundWireType): string[] {
    return PendingFieldDetector.detectMissing(
      {
        weightTonPerKm: this.weightTonPerKm,
        reelLengthM: this.reelLengthM,
        diameterMm: this.diameterMm,
        utsKn: this.utsKn,
        galvanizationClass: this.galvanizationClass,
        strengthGrade: this.strengthGrade,
        wireCount: this.wireCount,
        manufacturer: this.manufacturer,
        i2tKa2s: this.i2tKa2s,
        fiberCount: this.fiberCount,
      },
      REQUIRED_BY_GROUND_WIRE_TYPE[type],
    );
  }
}

export interface GroundWireProps {
  id: number;
  code: string;
  type: GroundWireType;
  versions?: GroundWireVersionEntity[];
}

export class GroundWireEntity {
  public readonly id: number;
  public readonly code: string;
  public readonly type: GroundWireType;
  private readonly _versions: GroundWireVersionEntity[];

  constructor(props: GroundWireProps) {
    this.id = props.id;
    this.code = props.code;
    this.type = props.type;
    this._versions = props.versions ? [...props.versions] : [];
  }

  public get versions(): ReadonlyArray<GroundWireVersionEntity> {
    return this._versions;
  }

  public getEffectiveVersion(
    referenceDate: CivilDate | Date | string,
  ): GroundWireVersionEntity | null {
    return resolveEffectiveEntityVersion(this._versions, referenceDate);
  }

  public addVersion(version: GroundWireVersionEntity): void {
    version.validateTypeApplicability(this.type);
    this._versions.push(version);
  }
}
