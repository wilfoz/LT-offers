import { ProductionPeriod } from '@lt-offers/domain';
import {
  CivilDate,
  EffectivePeriod,
  PendingFieldDetector,
} from '../../value-objects';
import {
  HasEffectivePeriod,
  resolveEffectiveEntityVersion,
} from '../base-catalog.entity';

export { ProductionPeriod };

export const WORK_CREW_REQUIRED_LABELS = {
  standardProductionRate: 'taxa de produção',
  productionUnit: 'unidade de produção',
  productionPeriod: 'período de produção',
} as const;

export const WORK_CREW_COMPOSITION_LABEL = 'composição de equipe';

export interface WorkCrewLaborRoleItem {
  laborRoleId: number;
  laborRoleCode?: string;
  laborRoleName?: string;
  quantity: string;
}

export interface WorkCrewEquipmentItem {
  equipmentId: number;
  equipmentCode?: string;
  equipmentDescription?: string;
  quantity: string;
}

export interface WorkCrewVersionProps {
  id?: number;
  workCrewId?: number;
  standardProductionRate?: string | null;
  productionUnit?: string | null;
  productionPeriod?: ProductionPeriod | null;
  laborRoles?: WorkCrewLaborRoleItem[];
  equipments?: WorkCrewEquipmentItem[];
  effectivePeriod: EffectivePeriod;
  createdBy: string;
  createdAt?: Date;
}

export class WorkCrewVersionEntity implements HasEffectivePeriod {
  public readonly id?: number;
  public readonly workCrewId?: number;
  public readonly standardProductionRate: string | null;
  public readonly productionUnit: string | null;
  public readonly productionPeriod: ProductionPeriod | null;
  public readonly laborRoles: ReadonlyArray<WorkCrewLaborRoleItem>;
  public readonly equipments: ReadonlyArray<WorkCrewEquipmentItem>;
  public readonly effectivePeriod: EffectivePeriod;
  public readonly createdBy: string;
  public readonly createdAt: Date;

  constructor(props: WorkCrewVersionProps) {
    this.id = props.id;
    this.workCrewId = props.workCrewId;
    this.standardProductionRate = props.standardProductionRate ?? null;
    this.productionUnit = props.productionUnit ?? null;
    this.productionPeriod = props.productionPeriod ?? null;
    this.laborRoles = props.laborRoles ? [...props.laborRoles] : [];
    this.equipments = props.equipments ? [...props.equipments] : [];
    this.effectivePeriod = props.effectivePeriod;
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt ?? new Date();
  }

  public getPendingFields(): string[] {
    const pending = PendingFieldDetector.detectMissing(
      {
        standardProductionRate: this.standardProductionRate,
        productionUnit: this.productionUnit,
        productionPeriod: this.productionPeriod,
      },
      WORK_CREW_REQUIRED_LABELS,
    );

    if (this.laborRoles.length === 0 && this.equipments.length === 0) {
      pending.push(WORK_CREW_COMPOSITION_LABEL);
    }

    return pending;
  }
}

export interface WorkCrewProps {
  id: number;
  code: string;
  name: string;
  versions?: WorkCrewVersionEntity[];
}

export class WorkCrewEntity {
  public readonly id: number;
  public readonly code: string;
  public readonly name: string;
  private readonly _versions: WorkCrewVersionEntity[];

  constructor(props: WorkCrewProps) {
    this.id = props.id;
    this.code = props.code;
    this.name = props.name;
    this._versions = props.versions ? [...props.versions] : [];
  }

  public get versions(): ReadonlyArray<WorkCrewVersionEntity> {
    return this._versions;
  }

  public getEffectiveVersion(
    referenceDate: CivilDate | Date | string,
  ): WorkCrewVersionEntity | null {
    return resolveEffectiveEntityVersion(this._versions, referenceDate);
  }

  public addVersion(version: WorkCrewVersionEntity): void {
    this._versions.push(version);
  }
}
