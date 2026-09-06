import { IsOptional, Validate } from 'class-validator';
import { DecimalWithScale } from './decimal-scale.validators';
import { decimalWithScaleMessage } from './validation-messages';

/**
 * Campos versionáveis do cargo de mão de obra (DB_MO, RF-12, RN-14).
 * Valores monetários e percentuais trafegam como string formatada (RNF-08);
 * null significa "não informado", distinto de "0" (RNF-09).
 */
export class LaborRoleVersionFieldsDto {
  @IsOptional()
  @Validate(DecimalWithScale, [2], {
    message: decimalWithScaleMessage('salário base (R$)', 2),
  })
  baseSalary?: string | null;

  @IsOptional()
  @Validate(DecimalWithScale, [4], {
    message: decimalWithScaleMessage('adicional de periculosidade (%)', 4),
  })
  hazardPayPercent?: string | null;

  @IsOptional()
  @Validate(DecimalWithScale, [4], {
    message: decimalWithScaleMessage('hora extra (%)', 4),
  })
  overtimePercent?: string | null;

  @IsOptional()
  @Validate(DecimalWithScale, [4], {
    message: decimalWithScaleMessage('DSR sobre hora extra (%)', 4),
  })
  dsrOvertimePercent?: string | null;

  @IsOptional()
  @Validate(DecimalWithScale, [4], {
    message: decimalWithScaleMessage('encargos sociais (%)', 4),
  })
  socialChargesPercent?: string | null;

  @IsOptional()
  @Validate(DecimalWithScale, [2], {
    message: decimalWithScaleMessage('benefício de alimentação (R$/mês)', 2),
  })
  foodAllowanceMonthly?: string | null;

  @IsOptional()
  @Validate(DecimalWithScale, [2], {
    message: decimalWithScaleMessage('alojamento (R$/mês)', 2),
  })
  housingMonthly?: string | null;

  @IsOptional()
  @Validate(DecimalWithScale, [2], {
    message: decimalWithScaleMessage('folgas de campo com viagem (R$/mês)', 2),
  })
  homeLeaveTravelMonthly?: string | null;

  @IsOptional()
  @Validate(DecimalWithScale, [2], {
    message: decimalWithScaleMessage('plano de saúde (R$/mês)', 2),
  })
  healthInsuranceMonthly?: string | null;

  @IsOptional()
  @Validate(DecimalWithScale, [2], {
    message: decimalWithScaleMessage('seguro de vida (R$/mês)', 2),
  })
  lifeInsuranceMonthly?: string | null;
}
