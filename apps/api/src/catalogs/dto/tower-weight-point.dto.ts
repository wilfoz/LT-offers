import { POSITIVE_DECIMAL_PATTERN } from '@lt-offers/domain';
import {
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { decimalWithScaleMessage } from './validation-messages';

// Nos pontos da tabela peso × altura o zero também é inválido (spec
// catalogos/series-torres) e a escala é limitada à precisão da coluna do
// banco: sem o limite, "24.0001" e "24.0004" passariam como alturas
// distintas no DTO e colidiriam no @@unique após o arredondamento do
// Postgres, disparando um 409 com a mensagem errada (review grupo 2-3-4).
@ValidatorConstraint({ name: 'positiveNonZeroDecimal' })
export class PositiveNonZeroDecimal implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (
      typeof value !== 'string' ||
      !POSITIVE_DECIMAL_PATTERN.test(value) ||
      Number(value) <= 0
    ) {
      return false;
    }
    const maxScale = args.constraints[0] as number;
    const decimals = value.split('.')[1] ?? '';
    return decimals.length <= maxScale;
  }
}

/** Ponto da tabela peso × altura. Decimais trafegam como string (RNF-08). */
export class TowerWeightPointDto {
  // Escala 3 = Decimal(10,3) de height_m no schema
  @Validate(PositiveNonZeroDecimal, [3], {
    message: decimalWithScaleMessage('altura (m)', 3),
  })
  heightM!: string;

  // Escala 2 = Decimal(12,2) de weight_kg no schema
  @Validate(PositiveNonZeroDecimal, [2], {
    message: decimalWithScaleMessage('peso (kg)', 2),
  })
  weightKg!: string;
}
