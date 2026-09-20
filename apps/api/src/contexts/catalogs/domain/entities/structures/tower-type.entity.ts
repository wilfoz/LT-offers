import {
  CivilDate,
  EffectivePeriod,
  PendingFieldDetector,
} from '../../value-objects';
import {
  HasEffectivePeriod,
  resolveEffectiveEntityVersion,
} from '../base-catalog.entity';

export type TowerFunction = 'SUSPENSION' | 'ANCHOR';

export const TOWER_TYPE_REQUIRED_LABELS = {
  guyCount: 'quantidade de estais',
} as const;

export const WEIGHT_TABLE_LABEL = 'tabela peso × altura';

export interface TowerTypeWeightItem {
  heightM: string;
  weightKg: string;
}

export interface TowerTypeVersionProps {
  id?: number;
  towerTypeId?: number;
  guyCount?: number | null;
  weights: TowerTypeWeightItem[];
  effectivePeriod: EffectivePeriod;
  createdBy: string;
  createdAt?: Date;
}

export class TowerTypeVersionEntity implements HasEffectivePeriod {
  public readonly id?: number;
  public readonly towerTypeId?: number;
  public readonly guyCount: number | null;
  public readonly weights: ReadonlyArray<TowerTypeWeightItem>;
  public readonly effectivePeriod: EffectivePeriod;
  public readonly createdBy: string;
  public readonly createdAt: Date;

  constructor(props: TowerTypeVersionProps) {
    this.id = props.id;
    this.towerTypeId = props.towerTypeId;
    this.guyCount = props.guyCount ?? null;
    this.weights = [...props.weights];
    this.effectivePeriod = props.effectivePeriod;
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt ?? new Date();
  }

  public getPendingFields(): string[] {
    const pending = PendingFieldDetector.detectMissing(
      {
        guyCount: this.guyCount,
      },
      TOWER_TYPE_REQUIRED_LABELS,
    );
    if (this.weights.length === 0) {
      pending.push(WEIGHT_TABLE_LABEL);
    }
    return pending;
  }
}

export interface TowerTypeProps {
  id: number;
  structureSeriesId: number;
  code: string;
  function: TowerFunction;
  versions?: TowerTypeVersionEntity[];
}

export class TowerTypeEntity {
  public readonly id: number;
  public readonly structureSeriesId: number;
  public readonly code: string;
  public readonly function: TowerFunction;
  private readonly _versions: TowerTypeVersionEntity[];

  constructor(props: TowerTypeProps) {
    this.id = props.id;
    this.structureSeriesId = props.structureSeriesId;
    this.code = props.code;
    this.function = props.function;
    this._versions = props.versions ? [...props.versions] : [];
  }

  public get versions(): ReadonlyArray<TowerTypeVersionEntity> {
    return this._versions;
  }

  public getEffectiveVersion(
    referenceDate: CivilDate | Date | string,
  ): TowerTypeVersionEntity | null {
    return resolveEffectiveEntityVersion(this._versions, referenceDate);
  }

  public addVersion(version: TowerTypeVersionEntity): void {
    this._versions.push(version);
  }
}
