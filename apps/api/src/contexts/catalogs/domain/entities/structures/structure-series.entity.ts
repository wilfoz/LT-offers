import {
  CivilDate,
  EffectivePeriod,
  PendingFieldDetector,
} from '../../value-objects';
import {
  HasEffectivePeriod,
  resolveEffectiveEntityVersion,
} from '../base-catalog.entity';

export const STRUCTURE_SERIES_REQUIRED_LABELS = {
  designer: 'projetista',
  voltageKv: 'tensão (kV)',
  circuitCount: 'circuitos',
  cablesPerPhase: 'cabos por fase',
  designWindSpeedMs: 'vento de projeto (m/s)',
  insulatorType: 'tipo de isolador',
  silMw: 'SIL (MW)',
} as const;

export interface StructureSeriesVersionProps {
  id?: number;
  structureSeriesId?: number;
  designer?: string | null;
  voltageKv?: string | null;
  circuitCount?: number | null;
  cablesPerPhase?: number | null;
  designWindSpeedMs?: string | null;
  insulatorType?: string | null;
  silMw?: string | null;
  effectivePeriod: EffectivePeriod;
  createdBy: string;
  createdAt?: Date;
}

export class StructureSeriesVersionEntity implements HasEffectivePeriod {
  public readonly id?: number;
  public readonly structureSeriesId?: number;
  public readonly designer: string | null;
  public readonly voltageKv: string | null;
  public readonly circuitCount: number | null;
  public readonly cablesPerPhase: number | null;
  public readonly designWindSpeedMs: string | null;
  public readonly insulatorType: string | null;
  public readonly silMw: string | null;
  public readonly effectivePeriod: EffectivePeriod;
  public readonly createdBy: string;
  public readonly createdAt: Date;

  constructor(props: StructureSeriesVersionProps) {
    this.id = props.id;
    this.structureSeriesId = props.structureSeriesId;
    this.designer = props.designer ?? null;
    this.voltageKv = props.voltageKv ?? null;
    this.circuitCount = props.circuitCount ?? null;
    this.cablesPerPhase = props.cablesPerPhase ?? null;
    this.designWindSpeedMs = props.designWindSpeedMs ?? null;
    this.insulatorType = props.insulatorType ?? null;
    this.silMw = props.silMw ?? null;
    this.effectivePeriod = props.effectivePeriod;
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt ?? new Date();
  }

  public getPendingFields(): string[] {
    return PendingFieldDetector.detectMissing(
      {
        designer: this.designer,
        voltageKv: this.voltageKv,
        circuitCount: this.circuitCount,
        cablesPerPhase: this.cablesPerPhase,
        designWindSpeedMs: this.designWindSpeedMs,
        insulatorType: this.insulatorType,
        silMw: this.silMw,
      },
      STRUCTURE_SERIES_REQUIRED_LABELS,
    );
  }
}

export interface StructureSeriesProps {
  id: number;
  name: string;
  towerTypeCount?: number;
  versions?: StructureSeriesVersionEntity[];
}

export class StructureSeriesEntity {
  public readonly id: number;
  public readonly name: string;
  public readonly towerTypeCount: number;
  private readonly _versions: StructureSeriesVersionEntity[];

  constructor(props: StructureSeriesProps) {
    this.id = props.id;
    this.name = props.name;
    this.towerTypeCount = props.towerTypeCount ?? 0;
    this._versions = props.versions ? [...props.versions] : [];
  }

  public get versions(): ReadonlyArray<StructureSeriesVersionEntity> {
    return this._versions;
  }

  public getEffectiveVersion(
    referenceDate: CivilDate | Date | string,
  ): StructureSeriesVersionEntity | null {
    return resolveEffectiveEntityVersion(this._versions, referenceDate);
  }

  public addVersion(version: StructureSeriesVersionEntity): void {
    this._versions.push(version);
  }
}
