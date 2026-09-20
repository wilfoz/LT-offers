import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DecimalWithScale } from './decimal-scale.validators';
import {
  decimalWithScaleMessage,
  nonNegativeCountMessage,
} from './validation-messages';

// Faixa invertida é rejeitada já no DTO (cenário do spec): mínimo inclusivo
// deve ser menor que máximo exclusivo. Só compara quando os dois limites
// estão informados — faixa ausente é pendência, não erro (RNF-09).
@ValidatorConstraint({ name: 'nsptRangeOrdered' })
export class NsptRangeOrdered implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const { nsptMin, nsptMax } = args.object as {
      nsptMin?: unknown;
      nsptMax?: unknown;
    };
    if (typeof nsptMin !== 'number' || typeof nsptMax !== 'number') {
      return true;
    }
    return nsptMin < nsptMax;
  }
}

// Meia-faixa (só mínimo ou só máximo) é rejeitada: ficaria invisível na
// listagem, já que NSPT está fora das pendências por causa de rocha (MIN-1
// da review dos grupos 2-3). O validador vai nos dois campos: dispara no que
// estiver informado quando o par estiver ausente.
@ValidatorConstraint({ name: 'nsptRangePaired' })
export class NsptRangePaired implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const { nsptMin, nsptMax } = args.object as {
      nsptMin?: unknown;
      nsptMax?: unknown;
    };
    return (typeof nsptMin === 'number') === (typeof nsptMax === 'number');
  }
}

const NSPT_PAIR_MESSAGE =
  'Informe a faixa de NSPT completa (mínimo e máximo) ou deixe ambos em branco';

/**
 * Campos versionáveis do tipo de solo. Valores decimais trafegam como string
 * (RNF-08); zero permitido (o spec só rejeita negativo/não numérico); null
 * significa "não informado", distinto de zero e de false (RNF-09).
 */
export class SoilTypeVersionFieldsDto {
  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto' })
  @MaxLength(200, { message: 'A descrição deve ter no máximo 200 caracteres' })
  description?: string | null;

  @IsOptional()
  @IsBoolean({ message: 'O campo submerso deve ser sim ou não (booleano)' })
  submerged?: boolean | null;

  // Escala 2 = Decimal(12,2) de allowable_compression_stress_kgf_cm2
  @IsOptional()
  @Validate(DecimalWithScale, [2], {
    message: decimalWithScaleMessage(
      'tensão admissível à compressão (kgf/cm²)',
      2,
    ),
  })
  allowableCompressionStressKgfCm2?: string | null;

  // Escala 2 = Decimal(12,2) de specific_weight_kgf_m3
  @IsOptional()
  @Validate(DecimalWithScale, [2], {
    message: decimalWithScaleMessage('peso específico (kgf/m³)', 2),
  })
  specificWeightKgfM3?: string | null;

  // Escala 3 = Decimal(10,3) de internal_friction_angle_deg
  @IsOptional()
  @Validate(DecimalWithScale, [3], {
    message: decimalWithScaleMessage('ângulo de atrito interno (°)', 3),
  })
  internalFrictionAngleDeg?: string | null;

  // Escala 3 = Decimal(10,3) de cohesion_kg_cm2
  @IsOptional()
  @Validate(DecimalWithScale, [3], {
    message: decimalWithScaleMessage('coesão (kg/cm²)', 3),
  })
  cohesionKgCm2?: string | null;

  @IsOptional()
  @IsInt({ message: nonNegativeCountMessage('NSPT mínimo') })
  @Min(0, { message: nonNegativeCountMessage('NSPT mínimo') })
  @Validate(NsptRangePaired, { message: NSPT_PAIR_MESSAGE })
  nsptMin?: number | null;

  @IsOptional()
  @IsInt({ message: nonNegativeCountMessage('NSPT máximo') })
  @Min(0, { message: nonNegativeCountMessage('NSPT máximo') })
  @Validate(NsptRangePaired, { message: NSPT_PAIR_MESSAGE })
  @Validate(NsptRangeOrdered, {
    message: 'O NSPT mínimo deve ser menor que o NSPT máximo',
  })
  nsptMax?: number | null;
}
