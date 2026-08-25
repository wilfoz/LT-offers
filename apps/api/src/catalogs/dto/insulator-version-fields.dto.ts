import { IsOptional, IsString, MaxLength, Validate } from 'class-validator';
import { DecimalWithScale } from './decimal-scale.validators';
import { decimalWithScaleMessage } from './validation-messages';

// Zero permitido (o spec só rejeita negativo/não numérico); o racional da
// escala limitada está em decimal-scale.validators.ts.

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
