import { ProductionPeriod } from '@lt-offers/domain';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DecimalWithScale } from './decimal-scale.validators';
import { WorkCrewEquipmentItemDto } from './work-crew-equipment-item.dto';
import { WorkCrewLaborRoleItemDto } from './work-crew-labor-role-item.dto';

const PRODUCTION_PERIODS: ProductionPeriod[] = ['HOUR', 'DAY', 'WEEK', 'MONTH'];

@ValidatorConstraint({ name: 'uniqueWorkCrewLaborRoles' })
export class UniqueWorkCrewLaborRoles implements ValidatorConstraintInterface {
  validate(roles: unknown): boolean {
    if (!Array.isArray(roles)) {
      return true;
    }
    const ids = roles
      .map((item) =>
        item && typeof item === 'object'
          ? Number((item as { laborRoleId?: unknown }).laborRoleId)
          : NaN,
      )
      .filter((id) => Number.isFinite(id));
    return new Set(ids).size === ids.length;
  }
}

@ValidatorConstraint({ name: 'uniqueWorkCrewEquipments' })
export class UniqueWorkCrewEquipments implements ValidatorConstraintInterface {
  validate(equipments: unknown): boolean {
    if (!Array.isArray(equipments)) {
      return true;
    }
    const ids = equipments
      .map((item) =>
        item && typeof item === 'object'
          ? Number((item as { equipmentId?: unknown }).equipmentId)
          : NaN,
      )
      .filter((id) => Number.isFinite(id));
    return new Set(ids).size === ids.length;
  }
}

export class WorkCrewVersionFieldsDto {
  @IsOptional()
  @Validate(DecimalWithScale, [4], {
    message:
      'A taxa de produção padrão deve ser um número decimal não negativo com no máximo 4 casas decimais',
  })
  standardProductionRate?: string | null;

  @IsOptional()
  @IsString({ message: 'A unidade de produção deve ser um texto' })
  @MaxLength(50, {
    message: 'A unidade de produção deve ter no máximo 50 caracteres',
  })
  productionUnit?: string | null;

  @IsOptional()
  @IsIn(PRODUCTION_PERIODS, {
    message:
      'O período de produção deve ser HOUR (hora), DAY (dia), WEEK (semana) ou MONTH (mês)',
  })
  productionPeriod?: ProductionPeriod | null;

  @IsOptional()
  @IsArray({
    message: 'A composição de mão de obra deve ser uma lista de itens',
  })
  @ValidateNested({ each: true })
  @Type(() => WorkCrewLaborRoleItemDto)
  @Validate(UniqueWorkCrewLaborRoles, {
    message: 'Há cargos de mão de obra duplicados na composição da equipe',
  })
  laborRoles?: WorkCrewLaborRoleItemDto[];

  @IsOptional()
  @IsArray({
    message: 'A composição de equipamentos deve ser uma lista de itens',
  })
  @ValidateNested({ each: true })
  @Type(() => WorkCrewEquipmentItemDto)
  @Validate(UniqueWorkCrewEquipments, {
    message: 'Há equipamentos duplicados na composição da equipe',
  })
  equipments?: WorkCrewEquipmentItemDto[];
}
