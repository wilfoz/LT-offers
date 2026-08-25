import { decimalScaleViolation } from '@lt-offers/domain';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// Cascas finas sobre o predicado único da domain (design D1/D2 da change
// reavaliacao-base-catalogos): a distinção zero-válido/zero-inválido é
// semântica de spec de cada catálogo e merece classe própria.

/** Decimal com escala limitada; zero também é inválido (ex.: peso × altura). */
@ValidatorConstraint({ name: 'positiveNonZeroDecimal' })
export class PositiveNonZeroDecimal implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const maxScale = args.constraints[0] as number;
    return (
      typeof value === 'string' &&
      decimalScaleViolation(value, maxScale, { nonZero: true }) === null
    );
  }
}

/** Decimal com escala limitada; zero permitido — valor informado ≠ null (RNF-09). */
@ValidatorConstraint({ name: 'decimalWithScale' })
export class DecimalWithScale implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const maxScale = args.constraints[0] as number;
    return (
      typeof value === 'string' &&
      decimalScaleViolation(value, maxScale) === null
    );
  }
}
