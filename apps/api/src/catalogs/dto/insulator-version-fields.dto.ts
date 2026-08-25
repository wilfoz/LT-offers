import { POSITIVE_DECIMAL_PATTERN } from '@lt-offers/domain';
import {
  IsOptional,
  IsString,
  MaxLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { decimalWithScaleMessage } from './validation-messages';

// Decimal positivo (zero permitido — o spec só rejeita negativo/não numérico)
// com escala limitada à precisão da coluna do banco: sem o limite, o Postgres
// arredondaria casas excedentes em silêncio (lição da review grupo 2-3-4 de
// catalogo-series-torres).
@ValidatorConstraint({ name: 'decimalWithScale' })
export class DecimalWithScale implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (typeof value !== 'string' || !POSITIVE_DECIMAL_PATTERN.test(value)) {
      return false;
    }
    const maxScale = args.constraints[0] as number;
    const decimals = value.split('.')[1] ?? '';
    return decimals.length <= maxScale;
  }
}

/**
 * Campos versionáveis do isolador. Valores decimais trafegam como string
 * (RNF-08); tipo, fabricante e perfil são texto livre (design D1); null
 * significa "não informado", distinto de "0" (RNF-09).
 */
export class InsulatorVersionFieldsDto {
  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto' })
  @MaxLength(200, { message: 'A descrição deve ter no máximo 200 caracteres' })
  description?: string | null;

  @IsOptional()
  @IsString({ message: 'O tipo deve ser um texto' })
  @MaxLength(100, { message: 'O tipo deve ter no máximo 100 caracteres' })
  type?: string | null;

  @IsOptional()
  @IsString({ message: 'O fabricante deve ser um texto' })
  @MaxLength(100, {
    message: 'O fabricante deve ter no máximo 100 caracteres',
  })
  manufacturer?: string | null;

  @IsOptional()
  @IsString({ message: 'O perfil deve ser um texto' })
  @MaxLength(100, { message: 'O perfil deve ter no máximo 100 caracteres' })
  profile?: string | null;

  // Escala 2 = Decimal(12,2) de rupture_strength_kn no schema
  @IsOptional()
  @Validate(DecimalWithScale, [2], {
    message: decimalWithScaleMessage('carga de ruptura (kN)', 2),
  })
  ruptureStrengthKn?: string | null;

  // Escala 3 = Decimal(10,3) de diameter_mm no schema
  @IsOptional()
  @Validate(DecimalWithScale, [3], {
    message: decimalWithScaleMessage('diâmetro (mm)', 3),
  })
  diameterMm?: string | null;

  // Escala 3 = Decimal(10,3) de spacing_mm no schema
  @IsOptional()
  @Validate(DecimalWithScale, [3], {
    message: decimalWithScaleMessage('passo (mm)', 3),
  })
  spacingMm?: string | null;

  // Escala 3 = Decimal(10,3) de creepage_distance_mm no schema
  @IsOptional()
  @Validate(DecimalWithScale, [3], {
    message: decimalWithScaleMessage('linha de fuga (mm)', 3),
  })
  creepageDistanceMm?: string | null;
}
