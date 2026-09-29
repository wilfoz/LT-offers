import { DATE_PATTERN } from '@lt-offers/domain';
import {
  IsInt,
  Matches,
  Max,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import {
  DecimalWithScale,
  PositiveNonZeroDecimal,
} from '../../../catalogs/infrastructure/http/dto/decimal-scale.validators';

/** Percentual em string decimal limitado a 100 (comparação apenas). */
@ValidatorConstraint({ name: 'decimalUpTo100' })
export class DecimalUpTo100 implements ValidatorConstraintInterface {
  validate(value: unknown, _args: ValidationArguments): boolean {
    return typeof value === 'string' && Number(value) <= 100;
  }
}

export class CreateViabilityParametersVersionDto {
  @Matches(DATE_PATTERN, {
    message: 'A data de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom!: string;

  @Validate(PositiveNonZeroDecimal, [2], {
    message:
      'O WACC real após impostos deve ser um decimal maior que zero com até 2 casas',
  })
  waccRealAfterTaxPercent!: string;

  @IsInt({
    message: 'O prazo de recebimento da RAP deve ser um número inteiro de anos',
  })
  @Min(1, {
    message: 'O prazo de recebimento da RAP deve ser de ao menos 1 ano',
  })
  @Max(60, {
    message: 'O prazo de recebimento da RAP deve ser de no máximo 60 anos',
  })
  concessionYears!: number;

  @Validate(DecimalWithScale, [2], {
    message: 'O PIS/COFINS deve ser um decimal não negativo com até 2 casas',
  })
  @Validate(DecimalUpTo100, {
    message: 'O PIS/COFINS deve ser de no máximo 100%',
  })
  pisCofinsPercent!: string;

  @Validate(DecimalWithScale, [2], {
    message: 'O O&M deve ser um decimal não negativo com até 2 casas',
  })
  @Validate(DecimalUpTo100, { message: 'O O&M deve ser de no máximo 100%' })
  operationMaintenancePercent!: string;

  @Validate(DecimalWithScale, [2], {
    message: 'O IR/CSLL deve ser um decimal não negativo com até 2 casas',
  })
  @Validate(DecimalUpTo100, { message: 'O IR/CSLL deve ser de no máximo 100%' })
  incomeTaxPercent!: string;
}

/** Identificação da revisão para o parecer (query params chegam como texto). */
export class ViabilityAssessmentQueryDto {
  @Matches(/^[1-9]\d*$/, {
    message: 'O id da proposta deve ser um número inteiro maior ou igual a 1',
  })
  offerId!: string;

  @Matches(/^[1-9]\d*$/, {
    message: 'O id da revisão deve ser um número inteiro maior ou igual a 1',
  })
  revisionId!: string;
}
