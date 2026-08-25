import { Validate } from 'class-validator';
import { PositiveNonZeroDecimal } from './decimal-scale.validators';
import { decimalWithScaleMessage } from './validation-messages';

// Zero também é inválido nos pontos (spec catalogos/series-torres); o
// racional da escala limitada está em decimal-scale.validators.ts.

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
