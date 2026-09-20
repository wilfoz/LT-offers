import {
  LaborRoleEntity,
  LaborRoleVersionEntity,
  LaborRolesRepository,
  CivilDate,
  EffectivePeriod,
  DuplicateCatalogCodeException,
  DuplicateVersionDateException,
  CatalogItemNotFoundException,
  NoEffectiveVersionFoundException,
} from '../../../domain';

export interface CreateLaborRoleInput {
  code: string;
  name: string;
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
  effectiveFrom?: string | null;
}

export interface CreateLaborRoleVersionInput {
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
  effectiveFrom: string;
}

export class LaborRolesUseCases {
  constructor(private readonly repository: LaborRolesRepository) {}

  async create(
    input: CreateLaborRoleInput,
    createdBy: string,
    today: CivilDate = CivilDate.today(),
  ): Promise<LaborRoleEntity> {
    const existing = await this.repository.findByCode(input.code);
    if (existing) {
      throw new DuplicateCatalogCodeException(input.code);
    }

    const effectiveFrom = input.effectiveFrom
      ? CivilDate.fromString(input.effectiveFrom)
      : today;

    const version = new LaborRoleVersionEntity({
      baseSalary: input.baseSalary,
      hazardPayPercent: input.hazardPayPercent,
      overtimePercent: input.overtimePercent,
      dsrOvertimePercent: input.dsrOvertimePercent,
      socialChargesPercent: input.socialChargesPercent,
      foodAllowanceMonthly: input.foodAllowanceMonthly,
      housingMonthly: input.housingMonthly,
      homeLeaveTravelMonthly: input.homeLeaveTravelMonthly,
      healthInsuranceMonthly: input.healthInsuranceMonthly,
      lifeInsuranceMonthly: input.lifeInsuranceMonthly,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    const entity = new LaborRoleEntity({
      id: 0,
      code: input.code,
      name: input.name,
      versions: [version],
    });

    return this.repository.save(entity);
  }

  async list(
    search?: string,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<LaborRoleEntity[]> {
    return this.repository.list({ search });
  }

  async get(
    id: number,
    referenceDate: CivilDate = CivilDate.today(),
  ): Promise<{
    entity: LaborRoleEntity;
    effectiveVersion: LaborRoleVersionEntity;
  }> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Cargo de mão de obra', id);
    }

    const effective = item.getEffectiveVersion(referenceDate);
    if (!effective) {
      throw new NoEffectiveVersionFoundException('Cargo de mão de obra');
    }

    return { entity: item, effectiveVersion: effective };
  }

  async listHistory(id: number): Promise<LaborRoleEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Cargo de mão de obra', id);
    }
    return item;
  }

  async createVersion(
    id: number,
    input: CreateLaborRoleVersionInput,
    createdBy: string,
  ): Promise<LaborRoleVersionEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new CatalogItemNotFoundException('Cargo de mão de obra', id);
    }

    const effectiveFrom = CivilDate.fromString(input.effectiveFrom);
    const dateAlreadyUsed = item.versions.some((v) =>
      v.effectivePeriod.effectiveFrom.equals(effectiveFrom),
    );
    if (dateAlreadyUsed) {
      throw new DuplicateVersionDateException();
    }

    const version = new LaborRoleVersionEntity({
      laborRoleId: id,
      baseSalary: input.baseSalary,
      hazardPayPercent: input.hazardPayPercent,
      overtimePercent: input.overtimePercent,
      dsrOvertimePercent: input.dsrOvertimePercent,
      socialChargesPercent: input.socialChargesPercent,
      foodAllowanceMonthly: input.foodAllowanceMonthly,
      housingMonthly: input.housingMonthly,
      homeLeaveTravelMonthly: input.homeLeaveTravelMonthly,
      healthInsuranceMonthly: input.healthInsuranceMonthly,
      lifeInsuranceMonthly: input.lifeInsuranceMonthly,
      effectivePeriod: new EffectivePeriod(effectiveFrom),
      createdBy,
    });

    return this.repository.createVersion(id, version);
  }
}
