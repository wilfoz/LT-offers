import { POSITIVE_DECIMAL_PATTERN } from '@lt-offers/domain';
import {
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { decimalMessage } from './validation-messages';

// Nos pontos da tabela peso × altura o zero também é inválido (spec
// catalogos/series-torres): compõe o pattern da domain com a checagem > 0.
@ValidatorConstraint({ name: 'positiveNonZeroDecimal' })
export class PositiveNonZeroDecimal implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return (
      typeof value === 'string' &&
      POSITIVE_DECIMAL_PATTERN.test(value) &&
      Number(value) > 0
    );
  }
}

/** Ponto da tabela peso × altura. Decimais trafegam como string (RNF-08). */
export class TowerWeightPointDto {
  @Validate(PositiveNonZeroDecimal, { message: decimalMessage('altura (m)') })
  heightM!: string;

  @Validate(PositiveNonZeroDecimal, { message: decimalMessage('peso (kg)') })
  weightKg!: string;
}
