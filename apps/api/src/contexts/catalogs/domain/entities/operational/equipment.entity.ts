import {
  CivilDate,
  EffectivePeriod,
  PendingFieldDetector,
} from '../../value-objects';
import {
  HasEffectivePeriod,
  resolveEffectiveEntityVersion,
} from '../base-catalog.entity';

export interface EquipmentVersionProps {
  id?: number;
  equipmentId?: number;
  externalRentalMonthly?: string | null;
  internalRentalMonthly?: string | null;
  purchasePrice?: string | null;
  depreciationYears?: number | null;
  ownedAvailabilityCount?: number | null;
  fuelMaintenanceMonthly?: string | null;
  effectivePeriod: EffectivePeriod;
  createdBy: string;
  createdAt?: Date;
}

export class EquipmentVersionEntity implements HasEffectivePeriod {
  public readonly id?: number;
  public readonly equipmentId?: number;
  public readonly externalRentalMonthly: string | null;
  public readonly internalRentalMonthly: string | null;
  public readonly purchasePrice: string | null;
  public readonly depreciationYears: number | null;
  public readonly ownedAvailabilityCount: number | null;
  public readonly fuelMaintenanceMonthly: string | null;
  public readonly effectivePeriod: EffectivePeriod;
  public readonly createdBy: string;
  public readonly createdAt: Date;

  constructor(props: EquipmentVersionProps) {
    this.id = props.id;
    this.equipmentId = props.equipmentId;
    this.externalRentalMonthly = props.externalRentalMonthly ?? null;
    this.internalRentalMonthly = props.internalRentalMonthly ?? null;
    this.purchasePrice = props.purchasePrice ?? null;
    this.depreciationYears = props.depreciationYears ?? null;
    this.ownedAvailabilityCount = props.ownedAvailabilityCount ?? null;
    this.fuelMaintenanceMonthly = props.fuelMaintenanceMonthly ?? null;
    this.effectivePeriod = props.effectivePeriod;
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt ?? new Date();
  }

  public hasValidCostStrategy(): boolean {
    const hasExternal = !PendingFieldDetector.isMissing(
      this.externalRentalMonthly,
    );
    const hasInternal = !PendingFieldDetector.isMissing(
      this.internalRentalMonthly,
    );
    const hasPurchase =
      !PendingFieldDetector.isMissing(this.purchasePrice) &&
      !PendingFieldDetector.isMissing(this.depreciationYears);

    return hasExternal || hasInternal || hasPurchase;
  }
}

export interface EquipmentProps {
  id: number;
  code: string;
  description: string;
  category?: string | null;
  versions?: EquipmentVersionEntity[];
}

export class EquipmentEntity {
  public readonly id: number;
  public readonly code: string;
  public readonly description: string;
  public readonly category: string | null;
  private readonly _versions: EquipmentVersionEntity[];

  constructor(props: EquipmentProps) {
    this.id = props.id;
    this.code = props.code;
    this.description = props.description;
    this.category = props.category ?? null;
    this._versions = props.versions ? [...props.versions] : [];
  }

  public get versions(): ReadonlyArray<EquipmentVersionEntity> {
    return this._versions;
  }

  public getEffectiveVersion(
    referenceDate: CivilDate | Date | string,
  ): EquipmentVersionEntity | null {
    return resolveEffectiveEntityVersion(this._versions, referenceDate);
  }

  public addVersion(version: EquipmentVersionEntity): void {
    this._versions.push(version);
  }

  public getPendingFields(
    effectiveVersion: EquipmentVersionEntity | null,
  ): string[] {
    const pending: string[] = [];
    if (!this.description?.trim()) {
      pending.push('descrição');
    }
    if (effectiveVersion && !effectiveVersion.hasValidCostStrategy()) {
      pending.push('nenhuma estratégia de custo informada');
    }
    return pending;
  }
}
