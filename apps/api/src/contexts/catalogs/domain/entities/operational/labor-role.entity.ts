import {
  CivilDate,
  EffectivePeriod,
  PendingFieldDetector,
} from '../../value-objects';
import {
  HasEffectivePeriod,
  resolveEffectiveEntityVersion,
} from '../base-catalog.entity';

export const LABOR_ROLE_REQUIRED_LABELS = {
  baseSalary: 'salário base (R$)',
  socialChargesPercent: 'encargos sociais (%)',
} as const;

export interface LaborRoleVersionProps {
  id?: number;
  laborRoleId?: number;
  baseSalary?: string | null;
  hazardPayPercent?: string | null;
  overtimePercent?: string | null;
  dsrOvertimePercent?: string | null;
  socialChargesPercent?: string | null;
  foodAllowanceMonthly?: string | null;
  housingMonthly?: string | null;
  homeLeaveTravelMonthly?: string | null;
  healthInsuranceMonthly?: string | null;
  lifeInsuranceMonthly?: string | null;
  effectivePeriod: EffectivePeriod;
  createdBy: string;
  createdAt?: Date;
}

export class LaborRoleVersionEntity implements HasEffectivePeriod {
  public readonly id?: number;
  public readonly laborRoleId?: number;
  public readonly baseSalary: string | null;
  public readonly hazardPayPercent: string | null;
  public readonly overtimePercent: string | null;
  public readonly dsrOvertimePercent: string | null;
  public readonly socialChargesPercent: string | null;
  public readonly foodAllowanceMonthly: string | null;
  public readonly housingMonthly: string | null;
  public readonly homeLeaveTravelMonthly: string | null;
  public readonly healthInsuranceMonthly: string | null;
  public readonly lifeInsuranceMonthly: string | null;
  public readonly effectivePeriod: EffectivePeriod;
  public readonly createdBy: string;
  public readonly createdAt: Date;

  constructor(props: LaborRoleVersionProps) {
    this.id = props.id;
    this.laborRoleId = props.laborRoleId;
    this.baseSalary = props.baseSalary ?? null;
    this.hazardPayPercent = props.hazardPayPercent ?? null;
    this.overtimePercent = props.overtimePercent ?? null;
    this.dsrOvertimePercent = props.dsrOvertimePercent ?? null;
    this.socialChargesPercent = props.socialChargesPercent ?? null;
    this.foodAllowanceMonthly = props.foodAllowanceMonthly ?? null;
    this.housingMonthly = props.housingMonthly ?? null;
    this.homeLeaveTravelMonthly = props.homeLeaveTravelMonthly ?? null;
    this.healthInsuranceMonthly = props.healthInsuranceMonthly ?? null;
    this.lifeInsuranceMonthly = props.lifeInsuranceMonthly ?? null;
    this.effectivePeriod = props.effectivePeriod;
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt ?? new Date();
  }

  public getPendingFields(): string[] {
    return PendingFieldDetector.detectMissing(
      {
        baseSalary: this.baseSalary,
        socialChargesPercent: this.socialChargesPercent,
      },
      LABOR_ROLE_REQUIRED_LABELS,
    );
  }
}

export interface LaborRoleProps {
  id: number;
  code: string;
  name: string;
  versions?: LaborRoleVersionEntity[];
}

export class LaborRoleEntity {
  public readonly id: number;
  public readonly code: string;
  public readonly name: string;
  private readonly _versions: LaborRoleVersionEntity[];

  constructor(props: LaborRoleProps) {
    this.id = props.id;
    this.code = props.code;
    this.name = props.name;
    this._versions = props.versions ? [...props.versions] : [];
  }

  public get versions(): ReadonlyArray<LaborRoleVersionEntity> {
    return this._versions;
  }

  public getEffectiveVersion(
    referenceDate: CivilDate | Date | string,
  ): LaborRoleVersionEntity | null {
    return resolveEffectiveEntityVersion(this._versions, referenceDate);
  }

  public addVersion(version: LaborRoleVersionEntity): void {
    this._versions.push(version);
  }
}
