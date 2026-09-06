import { IsOptional, IsString, MaxLength, Validate } from 'class-validator';
import { DecimalWithScale } from './decimal-scale.validators';
import { decimalWithScaleMessage } from './validation-messages';

/**
 * Campos versionáveis de custos fixos e indiretos (DB_FI).
 * Valores monetários trafegam como string formatada (RNF-08);
 * null = não informado (RNF-09).
 */
export class FixedCostVersionFieldsDto {
  @IsOptional()
  @Validate(DecimalWithScale, [2], {
    message: decimalWithScaleMessage('custo unitário (R$)', 2),
  })
  unitCost?: string | null;

  @IsOptional()
  @IsString({ message: 'A unidade deve ser um texto' })
  @MaxLength(50, { message: 'A unidade deve ter no máximo 50 caracteres' })
  unit?: string | null;
}
