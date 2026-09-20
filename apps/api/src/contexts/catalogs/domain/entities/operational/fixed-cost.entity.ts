import { FixedCostCategory } from '@lt-offers/domain';
import {
  CivilDate,
  EffectivePeriod,
  PendingFieldDetector,
} from '../../value-objects';
import {
  HasEffectivePeriod,
  resolveEffectiveEntityVersion,
} from '../base-catalog.entity';

export { FixedCostCategory };

export const FIXED_COST_REQUIRED_LABELS = {
  unitCost: 'custo unitário (R$)',
  unit: 'unidade',
} as const;

export interface FixedCostVersionProps {
  id?: number;
  fixedCostId?: number;
  unitCost?: string | null;
  unit?: string | null;
  effectivePeriod: EffectivePeriod;
  createdBy: string;
  createdAt?: Date;
}

export class FixedCostVersionEntity implements HasEffectivePeriod {
  public readonly id?: number;
  public readonly fixedCostId?: number;
  public readonly unitCost: string | null;
  public readonly unit: string | null;
  public readonly effectivePeriod: EffectivePeriod;
  public readonly createdBy: string;
  public readonly createdAt: Date;

  constructor(props: FixedCostVersionProps) {
    this.id = props.id;
    this.fixedCostId = props.fixedCostId;
    this.unitCost = props.unitCost ?? null;
    this.unit = props.unit ?? null;
    this.effectivePeriod = props.effectivePeriod;
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt ?? new Date();
  }

  public getPendingFields(): string[] {
    return PendingFieldDetector.detectMissing(
      {
        unitCost: this.unitCost,
        unit: this.unit,
      },
      FIXED_COST_REQUIRED_LABELS,
    );
  }
}

export interface FixedCostProps {
  id: number;
  code: string;
  description: string;
  category: FixedCostCategory;
  versions?: FixedCostVersionEntity[];
}

export class FixedCostEntity {
  public readonly id: number;
  public readonly code: string;
  public readonly description: string;
  public readonly category: FixedCostCategory;
  private readonly _versions: FixedCostVersionEntity[];

  constructor(props: FixedCostProps) {
    this.id = props.id;
    this.code = props.code;
    this.description = props.description;
    this.category = props.category;
    this._versions = props.versions ? [...props.versions] : [];
  }

  public get versions(): ReadonlyArray<FixedCostVersionEntity> {
    return this._versions;
  }

  public getEffectiveVersion(
    referenceDate: CivilDate | Date | string,
  ): FixedCostVersionEntity | null {
    return resolveEffectiveEntityVersion(this._versions, referenceDate);
  }

  public addVersion(version: FixedCostVersionEntity): void {
    this._versions.push(version);
  }
}
